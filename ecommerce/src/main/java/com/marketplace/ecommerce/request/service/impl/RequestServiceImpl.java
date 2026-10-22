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
import com.marketplace.ecommerce.order.dto.response.OrderReturnResponse;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.service.OrderReturnService;
import com.marketplace.ecommerce.payment.dto.EscrowAdminResponse;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.request.valueObjects.DisputeSellerAction;
import com.marketplace.ecommerce.shop.service.ShopEscrowFundService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public RequestResponse rejectRequest(UUID adminAccountId, UUID requestId, String response) {
        Account acc = accountRepository.findById(adminAccountId)
                .orElseThrow(() -> new CustomException("Account not found"));

        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new CustomException("Request not found"));

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

    private String generateDisplayCode(com.marketplace.ecommerce.request.valueObjects.RequestType type) {
        String prefix = type == com.marketplace.ecommerce.request.valueObjects.RequestType.REPORT ? "REP" : "REG";
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return prefix + "-" + randomSuffix;
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
