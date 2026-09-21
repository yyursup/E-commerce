package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.Role;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.RoleRepository;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.request.constant.RequestConstant;
import com.marketplace.ecommerce.request.dto.request.CreateAppealRequest;
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
import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopService;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RequestServiceImpl implements RequestService {

    private final RequestRepository requestRepository;
    private final ReportRepository reportRepository;
    private final SellerRepository sellerRepository;
    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final RequestPolicy requestValidation;
    private final ShopService shopService;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final ReviewRepository reviewRepository;

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
            Account admin = accountRepository.findById(adminAccountId)
                    .orElseThrow(() -> new CustomException("Admin account not found: " + adminAccountId));

            Report report = reportRepository.findByRequestId(requestId);
            if (report != null && report.getTargetType() != null && report.getTargetId() != null) {
                TargetType targetType = report.getTargetType();
                UUID targetId = report.getTargetId();

                switch (targetType) {
                    case SHOP -> {
                        Shop shop = shopRepository.findById(targetId)
                                .orElseThrow(() -> new CustomException("Shop not found: " + targetId));

                        if (shop.getUser() != null && shop.getUser().getAccount() != null) {
                            Account owner = shop.getUser().getAccount();
                            // Mỗi lần duyệt kháng cáo thành công chỉ giảm trừ đúng 1 lần vi phạm tương ứng
                            int newViolationCount = Math.max(0, owner.getViolationCount() - 1);
                            owner.setViolationCount(newViolationCount);

                            // Cập nhật lại trạng thái tương ứng với số điểm vi phạm mới
                            if (newViolationCount < 5) {
                                // Đã giảm xuống dưới ngưỡng 5 -> Thoát đình chỉ SUSPENDED, khôi phục sản phẩm
                                shop.setStatus(newViolationCount >= 3 ? ShopStatus.WARNED : ShopStatus.ACTIVE);
                                productRepository.updateStatusByShopId(shop.getId(), ProductStatus.PUBLISHED);
                                owner.setStatus(AccountStatus.ACTIVE);
                                owner.setIsActive(true);
                                owner.setBannedUntil(null);
                                owner.setDisciplineLevel(
                                        newViolationCount >= 3 ? DisciplineLevel.WARNED : DisciplineLevel.NONE);
                            }
                            accountRepository.save(owner);
                            shopRepository.save(shop);
                        }
                    }
                    case PRODUCT -> {
                        Product product = productRepository.findById(targetId)
                                .orElseThrow(() -> new CustomException("Product not found: " + targetId));
                        product.setStatus(ProductStatus.PUBLISHED);
                        product.setFlagged(false);
                        product.setReportCount(0);
                        product.setDeleted(false);
                        productRepository.save(product);
                    }
                    case REVIEW -> {
                        Review review = reviewRepository.findById(targetId)
                                .orElseThrow(() -> new CustomException("Review not found: " + targetId));
                        review.setStatus(ReviewStatus.ACTIVE);
                        review.setFlagged(false);
                        review.setReportCount(0);
                        reviewRepository.save(review);
                    }
                    case USER -> {
                        Account userAcc = accountRepository.findById(targetId)
                                .orElseThrow(() -> new CustomException("Target user account not found: " + targetId));
                        userAcc.setStatus(AccountStatus.ACTIVE);
                        userAcc.setIsActive(true);
                        userAcc.setDisciplineLevel(DisciplineLevel.NONE);
                        userAcc.setViolationCount(0);
                        userAcc.setBannedUntil(null);
                        accountRepository.save(userAcc);
                    }
                }
            }

            markApprovedRequest(req, admin, response);
            return RequestResponse.from(req);
        }

        throw new CustomException("Unsupported request type for approve: " + req.getType());
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
    public CreateRequestResponse createAppeal(UUID accountId, CreateAppealRequest req) {
        Account acc = accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomException("Account not found: " + accountId));

        // Kiểm tra lịch sử kháng cáo của vi phạm này để tuân thủ quy tắc kháng cáo chuẩn
        if (req.getReportId() != null) {
            List<Report> existingAppeals = reportRepository.findAppealsByViolationReportId(req.getReportId());
            for (Report appeal : existingAppeals) {
                if (appeal.getRequest() != null) {
                    RequestStatus st = appeal.getRequest().getStatus();
                    if (st == RequestStatus.PENDING) {
                        throw new CustomException("Bạn đã có đơn kháng cáo đang chờ quản trị viên xử lý cho vi phạm này.");
                    } else if (st == RequestStatus.REJECTED) {
                        throw new CustomException("Đơn kháng cáo cho vi phạm này đã bị từ chối. Quyết định của Quản trị viên là quyết định cuối cùng.");
                    } else if (st == RequestStatus.APPROVED) {
                        throw new CustomException("Đơn kháng cáo cho vi phạm này đã được chấp thuận trước đó.");
                    }
                }
            }
        } else {
            List<Report> existingAppeals = reportRepository.findAppealsByAccountIdAndTargetId(accountId, req.getTargetId());
            for (Report appeal : existingAppeals) {
                if (appeal.getRequest() != null) {
                    RequestStatus st = appeal.getRequest().getStatus();
                    if (st == RequestStatus.PENDING) {
                        throw new CustomException("Bạn đã có đơn kháng cáo đang chờ quản trị viên xử lý cho mục này.");
                    } else if (st == RequestStatus.REJECTED) {
                        throw new CustomException("Đơn kháng cáo cho vi phạm này đã bị từ chối. Quyết định của Quản trị viên là quyết định cuối cùng.");
                    } else if (st == RequestStatus.APPROVED) {
                        throw new CustomException("Đơn kháng cáo cho vi phạm này đã được chấp thuận trước đó.");
                    }
                }
            }
        }

        Request r = Request.builder()
                .account(acc)
                .type(RequestType.APPEAL)
                .status(RequestStatus.PENDING)
                .description(req.getDescription())
                .coverImageUrl(req.getEvidenceUrl())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        r = requestRepository.save(r);

        Report appealReport = Report.builder()
                .request(r)
                .targetType(req.getTargetType())
                .targetId(req.getTargetId())
                .violationReportId(req.getReportId())
                .evidenceUrl(req.getEvidenceUrl())
                .moderatorNote(null)
                .build();
        reportRepository.save(appealReport);

        return CreateRequestResponse.from(r);
    }

    @Override
    @Transactional
    public RequestResponse rejectRequest(UUID adminAccountId, UUID requestId, String response) {
        Account acc = accountRepository.findById(adminAccountId)
                .orElseThrow(() -> new CustomException("Account not found"));

        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new CustomException("Request not found"));

        if (request.getType() == RequestType.APPEAL) {
            Report report = reportRepository.findByRequestId(requestId);
            if (report != null && report.getTargetType() == TargetType.PRODUCT && report.getTargetId() != null) {
                // Nếu bác đơn kháng cáo sản phẩm vi phạm -> Chuyển sang DELETED với flagged =
                // true
                productRepository.findById(report.getTargetId()).ifPresent(p -> {
                    p.setStatus(ProductStatus.DELETED);
                    p.setFlagged(true);
                    p.setDeleted(true);
                    productRepository.save(p);
                });
            }
        }

        request.setStatus(RequestStatus.REJECTED);
        request.setResponse(response);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedBy(acc);

        requestRepository.save(request);

        return RequestResponse.from(request);
    }

    @Override
    @Transactional(readOnly = true)
    public RequestDetailsResponse getDetails(UUID requestId) {

        Request r = requestRepository.findById(requestId)
                .orElseThrow(() -> new CustomException("Request not found: " + requestId));

        Object detail = switch (r.getType()) {

            case REPORT, APPEAL -> {
                Report rep = reportRepository.findByRequestId(requestId);
                if (rep == null) {
                    yield null;
                }
                String targetName = "Không xác định";
                String targetInfo = "";
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
                                targetName = a.getEmail();
                                targetInfo = "Số lần vi phạm: " + a.getViolationCount() + " lần"
                                        + " | Trạng thái: " + a.getStatus();
                            }
                        }
                        case REVIEW -> {
                            var revOpt = reviewRepository.findById(rep.getTargetId());
                            if (revOpt.isPresent()) {
                                var rv = revOpt.get();
                                targetName = "Đánh giá " + rv.getRating() + " sao";
                                targetInfo = "Nội dung: " + (rv.getComment() != null ? rv.getComment() : "");
                            }
                        }
                    }
                }

                yield ReportDetailsResponse.builder()
                        .targetId(rep.getTargetId())
                        .targetType(rep.getTargetType() != null ? TargetType.valueOf(rep.getTargetType().name()) : null)
                        .evidenceUrl(rep.getEvidenceUrl())
                        .moderatorNote(rep.getModeratorNote())
                        .targetName(targetName)
                        .targetInfo(targetInfo)
                        .build();
            }

            case SELLER_REGISTRATION -> {
                Seller s = sellerRepository.findByRequestId(requestId);
                if (s == null)
                    throw new CustomException("Seller detail not found for request: " + requestId);

                yield RegisterSellerResponse.from(s);
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
    public Page<CreateRequestResponse> getAllRequests(RequestStatus status, Pageable pageable) {
        return getAllRequests(null, status, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CreateRequestResponse> getAllRequests(RequestType type, RequestStatus status, Pageable pageable) {
        Pageable newestFirstPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, RequestConstant.CREATED_AT));

        Page<Request> requests;
        if (type != null) {
            requests = status == null
                    ? requestRepository.findAllByType(type, newestFirstPageable)
                    : requestRepository.findAllByTypeAndStatus(type, status, newestFirstPageable);
        } else {
            requests = status == null
                    ? requestRepository.findAll(newestFirstPageable)
                    : requestRepository.findAllByStatus(status, newestFirstPageable);
        }

        return requests.map(CreateRequestResponse::from);
    }

    @Override
    public Request createRequest(Account account, CreateSendRequest request) {

        Request re = Request.builder().account(account).type(request.getRequestType()).status(RequestStatus.PENDING)
                .description(request.getDescription()).coverImageUrl(request.getCoverImage())
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();

        return requestRepository.save(re);
    }
}
