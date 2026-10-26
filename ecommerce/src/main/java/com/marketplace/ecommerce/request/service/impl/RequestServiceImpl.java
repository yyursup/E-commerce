package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.Role;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.RoleRepository;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.request.constant.RequestConstant;
import com.marketplace.ecommerce.request.dto.request.CreateSendRequest;
import com.marketplace.ecommerce.request.dto.response.*;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.repository.SellerRepository;
import com.marketplace.ecommerce.request.service.RequestService;
import com.marketplace.ecommerce.request.policy.RequestPolicy;
import com.marketplace.ecommerce.request.valueObjects.ApproveSellerContext;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopService;
import com.marketplace.ecommerce.order.dto.response.OrderReturnResponse;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.service.OrderReturnService;
import com.marketplace.ecommerce.payment.dto.EscrowAdminResponse;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.request.valueObjects.DisputeSellerAction;
import com.marketplace.ecommerce.shop.service.ShopEscrowFundService;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.file.service.FileService;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.util.concurrent.atomic.AtomicBoolean;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RequestServiceImpl implements RequestService {

    private final RequestRepository requestRepository;
    private final ReportRepository reportRepository;
    private final SellerRepository sellerRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RequestPolicy requestValidation;
    private final ShopService shopService;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final EscrowRepository escrowRepository;
    private final OrderReturnService orderReturnService;
    private final ShopEscrowFundService shopEscrowFundService;
    private final FileService fileService;

    @Transactional
    public RequestResponse approveSellerRegistration(UUID requestId, UUID adminAccountId, String response) {

        Account acc = accountRepository.findById(adminAccountId)
                .orElseThrow(() -> new CustomException("Account not found"));

        Request req = requestRepository.findById(requestId)
                .orElseThrow(() -> new CustomException("Request not found: " + requestId));

        ApproveSellerContext ctx = requestValidation.validateApproveSellerRequest(req, requestId);

        Shop savedShop = shopService.createShop(ctx.ownerUser(), ctx.shopName(), req, ctx.sellerDetail());

        ctx.sellerDetail().setCreatedShopId(savedShop.getId());
        sellerRepository.save(ctx.sellerDetail());

        // Khởi tạo Quỹ ký quỹ cho gian hàng
        BigDecimal initialDeposit = Boolean.TRUE.equals(ctx.sellerDetail().getIsEscrowParticipated())
                ? ctx.sellerDetail().getInitialDepositAmount()
                : BigDecimal.ZERO;
        shopEscrowFundService.createInitialFund(savedShop, initialDeposit, "REG-" + req.getDisplayCode());

        // Update account role from CUSTOMER to BUSINESS
        Account ownerAccount = req.getAccount();
        Role businessRole = roleRepository.findByRoleName("BUSINESS")
                .orElseThrow(() -> new CustomException("BUSINESS role not found"));
        ownerAccount.setRole(businessRole);
        accountRepository.save(ownerAccount);

        markApprovedRequest(req, acc, response);

        return RequestResponse.from(req);
    }

    @Override
    @Transactional
    public RequestResponse approveRequest(UUID requestId, UUID adminAccountId, String response) {
        Request req = requestRepository.findById(requestId)
                .orElseThrow(() -> new CustomException("Request not found: " + requestId));

        if (req.getType() == RequestType.SELLER_REGISTRATION) {
            return approveSellerRegistration(requestId, adminAccountId, response);
        }

        if (req.getType() == RequestType.APPEAL) {
            return approveBanReview(requestId, adminAccountId, response);
        }

        throw new CustomException("Unsupported request type for approve: " + req.getType());
    }

    @Override
    @Transactional
    public RequestResponse approveBanReview(UUID requestId, UUID adminAccountId, String response) {
        Account admin = accountRepository.findById(adminAccountId)
                .orElseThrow(() -> new CustomException("Account not found"));

        Request req = requestRepository.findById(requestId)
                .orElseThrow(() -> new CustomException("Request not found: " + requestId));

        if (req.getType() != RequestType.APPEAL) {
            throw new CustomException("Yêu cầu này không phải là đơn xem xét kỷ luật.");
        }

        if (req.getStatus() != RequestStatus.PENDING) {
            throw new CustomException("Yêu cầu này đã được xử lý trước đó.");
        }

        Account target = accountRepository.findByIdForUpdate(req.getAccount().getId())
                .orElseThrow(() -> new CustomException("Tài khoản đối tượng không tồn tại."));

        if (!target.isBanned()) {
            throw new CustomException("Tài khoản này hiện không ở trạng thái BANNED.");
        }

        int oldViolations = target.getViolationCount();
        if (oldViolations < 7) {
            throw new CustomException("Dữ liệu tài khoản không hợp lệ: Tài khoản BANNED nhưng có số gậy vi phạm nhỏ hơn 7 (" + oldViolations + ").");
        }

        // Khi Admin phê duyệt đơn xem xét gỡ khóa vĩnh viễn:
        // Bất kể tài khoản có bao nhiêu gậy (>= 7), hệ thống ân xá đưa về mức trần diện Tạm Đình Chỉ là 6 gậy
        int newViolations = 6;
        LocalDateTime now = LocalDateTime.now();

        target.setViolationCount(newViolations);
        target.setStatus(AccountStatus.SUSPENDED);
        target.setDisciplineLevel(DisciplineLevel.SUSPENDED);
        target.setIsActive(true);
        target.setSuspendedUntil(now.plusDays(14));
        target.setBannedUntil(null);

        accountRepository.save(target);

        req.setStatus(RequestStatus.APPROVED);
        req.setReviewedBy(admin);
        req.setReviewedAt(now);
        req.setResponse(response);
        req.setOldViolationCount(oldViolations);
        req.setNewViolationCount(newViolations);
        req.setUpdatedAt(now);
        requestRepository.save(req);

        log.info("Admin {} approved ban review requestId={}, targetAccountId={}, oldStrikes={}, newStrikes={}, newStatus={}",
                adminAccountId, requestId, target.getId(), oldViolations, newViolations, target.getStatus());

        return RequestResponse.from(req);
    }

    public void markApprovedRequest(Request req, Account admin, String response) {
        req.setStatus(RequestStatus.APPROVED);
        req.setReviewedBy(admin);
        req.setReviewedAt(java.time.LocalDateTime.now());
        req.setResponse(response);
        requestRepository.save(req);
    }

    @Override
    @Transactional
    public RequestResponse rejectRequest(UUID adminAccountId, UUID requestId, String response) {
        Account acc = accountRepository.findById(adminAccountId)
                .orElseThrow(() -> new CustomException("Account not found"));

        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new CustomException("Request not found"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new CustomException("Yêu cầu này đã được xử lý trước đó.");
        }

        request.setStatus(RequestStatus.REJECTED);
        request.setResponse(response);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedBy(acc);
        request.setUpdatedAt(LocalDateTime.now());

        requestRepository.save(request);

        return RequestResponse.from(request);
    }

    @Override
    @Transactional(readOnly = true)
    public RequestDetailsResponse getDetails(UUID requestId) {

        Request r = requestRepository.findById(requestId)
                .orElseThrow(() -> new CustomException("Request not found: " + requestId));

        Object detail = switch (r.getType()) {

            case REPORT -> {
                Report rep = reportRepository.findByRequestId(requestId);
                if (rep == null) {
                    yield null;
                }
                String targetName = "Không xác định";
                String targetInfo = "";
                EscrowAdminResponse escrowDto = null;
                OrderReturnResponse orderReturnDto = null;
                String sellerResponse = rep.getSellerResponse();
                String sellerEvidenceUrl = rep.getSellerEvidenceUrl();
                DisputeSellerAction sellerAction = rep.getSellerAction();

                if (rep.getTargetType() != null && rep.getTargetId() != null) {
                    switch (rep.getTargetType()) {
                        case SHOP -> {
                            var shopOpt = shopRepository.findById(rep.getTargetId());
                            if (shopOpt.isPresent()) {
                                var s = shopOpt.get();
                                targetName = s.getName();
                                targetInfo = "SĐT: " + (s.getPhoneNumber() != null ? s.getPhoneNumber() : "N/A")
                                        + " | Địa chỉ: " + (s.getAddress() != null ? s.getAddress() : "N/A");
                            }
                        }
                        case PRODUCT -> {
                            var prodOpt = productRepository.findById(rep.getTargetId());
                            if (prodOpt.isPresent()) {
                                var p = prodOpt.get();
                                targetName = p.getName();
                                targetInfo = "SKU: " + (p.getSku() != null ? p.getSku() : "N/A")
                                        + " | Gian hàng: " + (p.getShop() != null ? p.getShop().getName() : "N/A")
                                        + " | Giá: " + (p.getBasePrice() != null ? p.getBasePrice() + " đ" : "");
                            }
                        }
                        case USER -> {
                            var accOpt = accountRepository.findById(rep.getTargetId());
                            if (accOpt.isPresent()) {
                                var a = accOpt.get();
                                var uOpt = userRepository.findByAccountId(a.getId());
                                String fullName = uOpt.map(User::getFullName).filter(s -> !s.isBlank()).orElse(null);
                                targetName = fullName != null ? fullName + " (" + a.getEmail() + ")" : a.getEmail();
                                targetInfo = "SĐT: " + uOpt.map(User::getPhoneNumber).orElse("N/A")
                                        + " | Số lần vi phạm: " + a.getViolationCount() + " lần"
                                        + " | Trạng thái: " + a.getStatus();
                            } else {
                                var uOpt = userRepository.findById(rep.getTargetId());
                                if (uOpt.isPresent()) {
                                    var u = uOpt.get();
                                    var a = u.getAccount();
                                    String fullName = u.getFullName();
                                    String email = a != null ? a.getEmail() : null;
                                    if (fullName != null && !fullName.isBlank()) {
                                        targetName = email != null ? fullName + " (" + email + ")" : fullName;
                                    } else {
                                        targetName = email != null ? email : "Người dùng #" + u.getId();
                                    }
                                    targetInfo = "SĐT: " + (u.getPhoneNumber() != null ? u.getPhoneNumber() : "N/A")
                                            + " | Số lần vi phạm: " + (a != null ? a.getViolationCount() : 0) + " lần"
                                            + " | Trạng thái: " + (a != null ? a.getStatus() : "ACTIVE");
                                }
                            }
                        }
                        case REVIEW -> {
                            var revOpt = reviewRepository.findById(rep.getTargetId());
                            if (revOpt.isPresent()) {
                                var rv = revOpt.get();
                                targetName = "Đánh giá " + rv.getRating() + " sao";
                                String prodName = rv.getProduct() != null ? rv.getProduct().getName() : "N/A";
                                String reviewerName = rv.getUser() != null ? rv.getUser().getFullName() : "N/A";
                                targetInfo = "Sản phẩm: " + prodName
                                        + " | Người đánh giá: " + reviewerName
                                        + " | Nội dung: " + (rv.getComment() != null ? rv.getComment() : "");
                            }
                        }
                        case ORDER -> {
                            var orderOpt = orderRepository.findById(rep.getTargetId());
                            if (orderOpt.isPresent()) {
                                var o = orderOpt.get();
                                targetName = "Đơn hàng " + o.getOrderNumber();
                                targetInfo = "Gian hàng: " + (o.getShop() != null ? o.getShop().getName() : "N/A")
                                        + " | Người mua: " + (o.getUser() != null ? o.getUser().getFullName() : "N/A")
                                        + " | Tổng tiền: " + (o.getTotal() != null ? o.getTotal() + " đ" : "")
                                        + " | Trạng thái: " + o.getStatus()
                                        + " | PTTT: " + o.getPaymentMethod();

                                var ret = orderReturnService.getReturnByOrderId(o.getId());
                                if (ret != null) {
                                    orderReturnDto = ret;
                                    targetInfo += " | Kiện hoàn: " + ret.getStatus()
                                            + (ret.getConditionStatus() != null ? " (" + ret.getConditionStatus() + ")"
                                                    : "");
                                }

                                var escOpt = escrowRepository.findByOrderId(o.getId());
                                if (escOpt.isPresent()) {
                                    escrowDto = EscrowAdminResponse.from(escOpt.get());
                                }
                            }
                        }
                    }
                }

                yield ReportDetailsResponse.builder()
                        .id(rep.getId())
                        .requestId(r.getId())
                        .targetId(rep.getTargetId())
                        .targetType(rep.getTargetType() != null ? TargetType.valueOf(rep.getTargetType().name()) : null)
                        .evidenceUrl(rep.getEvidenceUrl())
                        .moderatorNote(rep.getModeratorNote())
                        .targetName(targetName)
                        .targetInfo(targetInfo)
                        .stage(rep.getStage())
                        .sellerResponseDeadline(rep.getSellerResponseDeadline())
                        .sellerResponse(sellerResponse)
                        .sellerEvidenceUrl(sellerEvidenceUrl)
                        .sellerAction(sellerAction)
                        .escalatedAt(rep.getEscalatedAt())
                        .escalationReason(rep.getEscalationReason())
                        .resolutionType(rep.getResolutionType())
                        .status(r.getStatus() != null ? r.getStatus().name() : null)
                        .description(r.getDescription())
                        .response(r.getResponse())
                        .createdAt(r.getCreatedAt())
                        .reviewedAt(r.getReviewedAt())
                        .policyClauseCode(rep.getPolicyClauseCode())
                        .policyClauseTitle(rep.getPolicyClauseTitle())
                        .escrow(escrowDto)
                        .orderReturn(orderReturnDto)
                        .build();
            }

            case SELLER_REGISTRATION -> {
                Seller s = sellerRepository.findByRequestId(requestId);
                if (s == null)
                    throw new CustomException("Seller detail not found for request: " + requestId);

                yield RegisterSellerResponse.from(s);
            }

            case APPEAL -> {
                List<Request> priorAppeals = requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(
                        r.getAccount().getId(), RequestType.APPEAL);
                List<CreateRequestResponse> priorList = priorAppeals.stream()
                        .filter(req -> !req.getId().equals(r.getId()))
                        .map(CreateRequestResponse::from)
                        .toList();

                List<Report> approvedReports = reportRepository.findApprovedViolationsByAccountId(r.getAccount().getId());
                List<ViolationHistoryItemResponse> violationHistory = (approvedReports != null ? approvedReports : Collections.<Report>emptyList()).stream()
                        .map(rep -> ViolationHistoryItemResponse.builder()
                                .reportId(rep.getId())
                                .displayCode(rep.getRequest() != null ? rep.getRequest().getDisplayCode() : null)
                                .targetType(rep.getTargetType() != null ? rep.getTargetType().name() : null)
                                .targetId(rep.getTargetId())
                                .policyClauseCode(rep.getPolicyClauseCode())
                                .policyClauseTitle(rep.getPolicyClauseTitle() != null ? rep.getPolicyClauseTitle()
                                        : (rep.getTargetType() == TargetType.ORDER ? "Khiếu nại / tranh chấp đơn hàng"
                                                : (rep.getTargetType() == TargetType.SHOP ? "Vi phạm quy chế gian hàng" : "Vi phạm chính sách sàn")))
                                .description(rep.getRequest() != null ? rep.getRequest().getDescription() : null)
                                .moderatorNote(rep.getModeratorNote() != null ? rep.getModeratorNote()
                                        : (rep.getRequest() != null ? rep.getRequest().getResponse() : null))
                                .createdAt(rep.getRequest() != null ? rep.getRequest().getCreatedAt() : null)
                                .reviewedAt(rep.getRequest() != null ? rep.getRequest().getReviewedAt() : null)
                                .build())
                        .toList();

                yield BanReviewDetailsResponse.builder()
                        .accountId(r.getAccount().getId())
                        .username(r.getAccount().getUsername())
                        .email(r.getAccount().getEmail())
                        .currentAccountStatus(r.getAccount().getStatus())
                        .currentDisciplineLevel(r.getAccount().getDisciplineLevel())
                        .currentViolationCount(r.getAccount().getViolationCount())
                        .oldViolationCount(r.getOldViolationCount())
                        .newViolationCount(r.getNewViolationCount())
                        .description(r.getDescription())
                        .coverImageUrl(r.getCoverImageUrl())
                        .priorAppeals(priorList)
                        .violationHistory(violationHistory)
                        .build();
            }

            default -> throw new CustomException("Unsupported request type: " + r.getType());
        };

        return RequestDetailsResponse.from(r, detail);
    }

    @Override
    public Page<CreateRequestResponse> getRequests(UUID accountId, Pageable pageable) {
        return requestRepository.findAllRequestByAccountId(accountId, pageable).map(CreateRequestResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CreateRequestResponse> getAllRequests(RequestType type, RequestStatus status, Pageable pageable) {
        Pageable newestFirstPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, RequestConstant.CREATED_AT));

        Page<Request> requests = requestRepository.findAllAdminRequests(type, status, newestFirstPageable);

        List<UUID> reqIds = requests.getContent().stream().map(Request::getId).toList();
        Map<UUID, Report> reportMap = reqIds.isEmpty() ? Collections.emptyMap()
                : reportRepository.findAllById(reqIds).stream().collect(Collectors.toMap(Report::getId, r -> r));

        return requests.map(req -> CreateRequestResponse.from(req, reportMap.get(req.getId())));
    }

    private String generateDisplayCode(RequestType type) {
        String prefix = switch (type) {
            case REPORT -> "REP";
            case SELLER_REGISTRATION -> "REG";
            case APPEAL -> "APP";
            default -> "REQ";
        };
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return prefix + "-" + randomSuffix;
    }

    @Override
    @Transactional
    public CreateRequestResponse submitBanReview(UUID accountId, String description, List<MultipartFile> files) {
        if (description == null || description.trim().length() < 10) {
            throw new CustomException("Vui lòng nhập nội dung giải trình chi tiết (tối thiểu 10 ký tự).");
        }
        if (description.length() > 2000) {
            throw new CustomException("Nội dung giải trình không được vượt quá 2000 ký tự.");
        }

        Account account = accountRepository.findByIdForUpdate(accountId)
                .orElseThrow(() -> new CustomException("Account not found"));

        if (!account.isBanned()) {
            throw new CustomException("Chỉ tài khoản đang bị khóa vĩnh viễn mới có thể gửi yêu cầu xem xét.");
        }

        List<Request> appeals = requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accountId, RequestType.APPEAL);
        boolean hasPending = appeals.stream().anyMatch(r -> r.getStatus() == RequestStatus.PENDING);
        if (hasPending) {
            throw new CustomException("Tài khoản đang có một yêu cầu xem xét đang chờ xử lý. Vui lòng đợi quản trị viên phản hồi.");
        }

        boolean hasRejected = appeals.stream().anyMatch(r -> r.getStatus() == RequestStatus.REJECTED);
        if (hasRejected) {
            throw new CustomException("Yêu cầu xem xét trước đó của bạn đã bị từ chối. Tài khoản bị khóa vĩnh viễn và không thể khiếu nại thêm.");
        }

        // Lọc danh sách file không rỗng
        List<MultipartFile> validFiles = (files == null) ? Collections.emptyList() :
                files.stream().filter(f -> f != null && !f.isEmpty()).toList();

        if (validFiles.size() > 4) {
            throw new CustomException("Chỉ được gửi tối đa 4 ảnh minh chứng.");
        }

        // Validate toàn bộ file TRƯỚC KHI upload bất kỳ file nào lên MinIO
        for (MultipartFile file : validFiles) {
            if (file.getSize() > 10 * 1024 * 1024) {
                throw new CustomException("Tệp " + file.getOriginalFilename() + " vượt quá dung lượng tối đa 10MB.");
            }
            if (!com.marketplace.ecommerce.file.util.ImageContentValidator.isValidImage(file)) {
                throw new CustomException("Tệp " + file.getOriginalFilename() + " không phải là ảnh hợp lệ hoặc định dạng không được hỗ trợ (chỉ chấp nhận JPG, JPEG, PNG).");
            }
        }

        // Upload các file đã validate vào MinIO
        List<String> uploadedFileNames = new java.util.ArrayList<>();
        List<String> uploadedUrls = new java.util.ArrayList<>();
        AtomicBoolean cleanedUp = new AtomicBoolean(false);

        // Đăng ký TransactionSynchronization để dọn dẹp nếu transaction DB rollback tại thời điểm commit sau khi method trả về
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    if (status == STATUS_ROLLED_BACK) {
                        log.warn("Transaction rolled back at completion/commit time. Triggering MinIO cleanup for {} file(s)", uploadedFileNames.size());
                        cleanupUploadedFiles(uploadedFileNames, cleanedUp);
                    }
                }
            });
        }

        try {
            for (MultipartFile file : validFiles) {
                String fileName = fileService.uploadFile(file, "evidence/ban-review");
                uploadedFileNames.add(fileName);
                String fileUrl = fileService.getFileUrl(fileName);
                uploadedUrls.add(fileUrl);
            }

            String displayCode = generateDisplayCode(RequestType.APPEAL);
            LocalDateTime now = LocalDateTime.now();
            String coverImageUrl = uploadedUrls.isEmpty() ? null : String.join(",", uploadedUrls);

            Request req = Request.builder()
                    .account(account)
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.PENDING)
                    .description(description.trim())
                    .coverImageUrl(coverImageUrl)
                    .displayCode(displayCode)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();

            Request saved = requestRepository.save(req);
            log.info("Submitted ban review request: requestId={}, accountId={}, displayCode={}, imagesCount={}",
                    saved.getId(), accountId, displayCode, uploadedUrls.size());

            return CreateRequestResponse.from(saved);
        } catch (Exception ex) {
            // Tự động dọn dẹp các file vừa upload lên MinIO nếu có exception ngay trong method service
            cleanupUploadedFiles(uploadedFileNames, cleanedUp);
            throw ex;
        }
    }

    private void cleanupUploadedFiles(List<String> fileNames, AtomicBoolean cleanedUp) {
        if (fileNames == null || fileNames.isEmpty()) {
            return;
        }
        if (cleanedUp != null && !cleanedUp.compareAndSet(false, true)) {
            return; // Đã dọn dẹp rồi, không gọi lặp lại
        }
        for (String fName : fileNames) {
            try {
                fileService.deleteFile(fName);
                log.info("Cleaned up orphaned uploaded file after submission failure: {}", fName);
            } catch (Exception cleanupErr) {
                log.warn("Failed to clean up file {} from MinIO: {}", fName, cleanupErr.getMessage());
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public BanReviewStatusResponse getBanReviewStatus(UUID accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomException("Account not found"));

        List<Request> appeals = requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accountId, RequestType.APPEAL);
        CreateRequestResponse latest = appeals.isEmpty() ? null : CreateRequestResponse.from(appeals.get(0));
        List<CreateRequestResponse> history = appeals.stream().map(CreateRequestResponse::from).toList();

        boolean isBanned = account.isBanned();
        boolean hasPending = appeals.stream().anyMatch(r -> r.getStatus() == RequestStatus.PENDING);
        boolean hasRejected = appeals.stream().anyMatch(r -> r.getStatus() == RequestStatus.REJECTED);

        boolean canSubmit = false;
        String blockReason = null;

        if (!isBanned) {
            blockReason = "NOT_BANNED";
        } else if (hasPending) {
            blockReason = "PENDING_REVIEW";
        } else if (hasRejected) {
            blockReason = "PERMANENTLY_BLOCKED_REJECTED";
        } else {
            canSubmit = true;
        }

        return BanReviewStatusResponse.builder()
                .accountId(account.getId())
                .username(account.getUsername())
                .email(account.getEmail())
                .status(account.getStatus())
                .disciplineLevel(account.getDisciplineLevel())
                .violationCount(account.getViolationCount())
                .canSubmit(canSubmit)
                .blockReason(blockReason)
                .latestAppeal(latest)
                .appealHistory(history)
                .build();
    }

    @Override
    public Request createRequest(Account account, CreateSendRequest request) {
        String displayCode = generateDisplayCode(request.getRequestType());

        Request re = Request.builder().account(account).type(request.getRequestType()).status(RequestStatus.PENDING)
                .description(request.getDescription()).coverImageUrl(request.getCoverImage())
                .displayCode(displayCode)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();

        return requestRepository.save(re);
    }

    @Override
    @Transactional
    public void autoRefundExpiredDisputedOrders() {
        // No-op: Phán quyết của Admin đối với tranh chấp đơn hàng (ORDER) có hiệu lực
        // thi hành ngay lập tức.
        // Hệ thống không còn duy trì vòng chờ kháng cáo 72h đối với đơn hàng.
    }
}
