package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.request.dto.request.CreateReportRequest;
import com.marketplace.ecommerce.request.dto.request.CreateSendRequest;
import com.marketplace.ecommerce.request.dto.request.HandleReportRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.dto.response.ReportDetailsResponse;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.service.ReportService;
import com.marketplace.ecommerce.request.service.RequestService;
import com.marketplace.ecommerce.request.policy.RequestPolicy;
import com.marketplace.ecommerce.request.valueObjects.ReportDecision;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.ResolutionType;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import com.marketplace.ecommerce.order.dto.response.OrderReturnResponse;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderReturn;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.repository.OrderReturnRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;
import com.marketplace.ecommerce.payment.dto.EscrowAdminResponse;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.order.service.OrderReturnService;
import com.marketplace.ecommerce.request.dto.request.EscalateReportRequest;
import com.marketplace.ecommerce.request.dto.request.SellerDisputeRespondRequest;
import com.marketplace.ecommerce.request.valueObjects.DisputeSellerAction;
import com.marketplace.ecommerce.request.valueObjects.ReportStage;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {
    private final RequestService requestService;
    private final RequestRepository requestRepository;
    private final ReportRepository reportRepository;
    private final AccountRepository accountRepository;
    private final RequestPolicy requestPolicy;
    private final ReviewRepository reviewRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final EscrowRepository escrowRepository;
    private final OrderReturnRepository orderReturnRepository;
    private final EscrowService escrowService;
    private final OrderReturnService orderReturnService;

    @Override
    @Transactional
    public void handleReport(UUID adminAccountId, UUID requestId, HandleReportRequest req) {

        Account admin = accountRepository.findById(adminAccountId)
                .orElseThrow(() -> new CustomException("Admin account not found"));

        Report report = reportRepository.findByRequestId(requestId);
        if (report == null)
            throw new CustomException("Report not found for requestId: " + requestId);

        Request r = report.getRequest();
        if (r == null)
            throw new CustomException("Request not found");

        LocalDateTime now = LocalDateTime.now();

        // Lấy thông tin OrderReturn (nếu có)
        Optional<OrderReturn> returnOpt = Optional.empty();
        if (report.getTargetType() == TargetType.ORDER && report.getTargetId() != null) {
            returnOpt = orderReturnRepository.findByOrderIdForUpdate(report.getTargetId());
        }

        // Case 3: Xác định khiếu nại kiện hoàn từ Shop (Seller return dispute)
        boolean isSellerReturnDispute = report.getTargetType() == TargetType.ORDER
                && ((returnOpt.isPresent() && returnOpt.get().getStatus() == ReturnStatus.DISPUTED)
                        || report.getViolationReportId() != null
                        || (report.getEscalationReason() != null
                                && report.getEscalationReason().contains("kiện hàng hoàn"))
                        || (r.getDescription() != null
                                && r.getDescription().contains("Shop khiếu nại kiện hàng hoàn")));

        if (!isSellerReturnDispute) {
            if (r.getStatus() == RequestStatus.APPROVED || r.getStatus() == RequestStatus.REJECTED
                    || report.getStage() == ReportStage.CLOSED) {
                throw new CustomException("Hồ sơ khiếu nại đã có phán quyết và được xử lý hoàn tất trước đó");
            }
            if (report.getTargetType() == TargetType.ORDER && report.getStage() != ReportStage.ESCALATED_TO_ADMIN) {
                throw new CustomException(
                        "Khiếu nại đơn hàng đang trong giai đoạn thương lượng trực tiếp hoặc xử lý đổi trả, Quản trị viên chưa thể can thiệp");
            }
        } else {
            if (returnOpt.isPresent() && returnOpt.get().getStatus() != ReturnStatus.DISPUTED) {
                throw new CustomException(
                        "Tranh chấp kiện hàng hoàn đã có phán quyết và không còn ở trạng thái tranh chấp");
            }
        }

        if (isSellerReturnDispute) {
            // Case 3: Xử lý tranh chấp kiện hàng hoàn do Seller khiếu nại
            // TUYỆT ĐỐI không gọi handleReportOrder (không phạt Shop vì đây là khiếu nại
            // tình trạng hàng hoàn)
            // TUYỆT ĐỐI không gọi orderReturnService.createReturn (không tạo mới kiện hoàn)
            boolean buyerWins = (req.getDecision() == ReportDecision.REJECT)
                    || (req.getResolutionType() == ResolutionType.REFUND_ONLY)
                    || (req.getResolutionType() == ResolutionType.RETURN_AND_REFUND);

            if (buyerWins) {
                handleSellerReturnDisputeBuyerWins(report, r, admin, now, req.getNote(), req.getDecision(), returnOpt);
            } else {
                handleSellerReturnDisputeSellerWins(report, r, admin, now, req.getNote(), req.getDecision(), returnOpt);
            }
            return;
        }

        if (req.getDecision() == ReportDecision.REJECT) {
            rejectRequest(r, admin, now, req.getNote(), report);
            return;
        }

        UUID targetId = report.getTargetId();
        TargetType type = report.getTargetType() != null ? report.getTargetType() : requestPolicy.resolve(targetId);

        switch (type) {
            case USER -> handleReportUser(targetId, now);
            case SHOP -> handleReportShop(targetId, now);
            case PRODUCT -> handleReportProduct(targetId, now);
            case REVIEW -> handleReportReview(targetId, now);
            case ORDER -> handleReportOrder(targetId, now);
            default -> throw new CustomException("Unsupported target type: " + type);
        }

        approveRequest(r, admin, now, req.getNote(), report, req.getResolutionType());
    }

    private void handleSellerReturnDisputeSellerWins(Report report, Request r, Account admin, LocalDateTime now,
            String note, ReportDecision decision, Optional<OrderReturn> returnOpt) {
        UUID orderId = report.getTargetId();
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new CustomException("Order not found: " + orderId));

        // 1. Kiểm tra Escrow tránh duplicate release hoặc release trên Escrow đã refund
        Optional<Escrow> escrowOpt = escrowRepository.findByOrderIdForUpdate(orderId);
        if (escrowOpt.isPresent() && (escrowOpt.get().getStatus() == EscrowStatus.RELEASED
                || order.getStatus() == OrderStatus.COMPLETED)) {
            throw new CustomException("Đơn hàng này đã được giải ngân hoàn tất trước đó");
        }
        if (escrowOpt.isPresent() && escrowOpt.get().getStatus() == EscrowStatus.REFUNDED) {
            throw new CustomException("Ký quỹ đơn hàng đã được hoàn tiền trước đó, không thể giải ngân cho Shop");
        }

        // 2. Phục hồi điểm vi phạm cho Shop nếu Shop từng bị phạt từ khiếu nại ban đầu
        // của Buyer
        if (report.getViolationReportId() != null && order.getShop() != null && order.getShop().getUser() != null) {
            Account shopOwner = order.getShop().getUser().getAccount();
            if (shopOwner != null) {
                int newViolationCount = Math.max(0, shopOwner.getViolationCount() - 1);
                shopOwner.setViolationCount(newViolationCount);
                if (newViolationCount < 5) {
                    order.getShop().setStatus(newViolationCount >= 3 ? ShopStatus.WARNED : ShopStatus.ACTIVE);
                    productRepository.updateStatusByShopId(order.getShop().getId(), ProductStatus.PUBLISHED);
                    shopOwner.setStatus(AccountStatus.ACTIVE);
                    shopOwner.setIsActive(true);
                    shopOwner.setBannedUntil(null);
                    shopOwner
                            .setDisciplineLevel(newViolationCount >= 3 ? DisciplineLevel.WARNED : DisciplineLevel.NONE);
                }
                accountRepository.save(shopOwner);
                shopRepository.save(order.getShop());
            }
        }

        // 3. Hủy kiện hàng hoàn (OrderReturn -> CANCELLED)
        OrderReturn ret = returnOpt.orElseGet(() -> orderReturnRepository.findByOrderIdForUpdate(orderId).orElse(null));
        if (ret != null) {
            ret.setStatus(ReturnStatus.CANCELLED);
            ret.setConditionNote((ret.getConditionNote() != null ? ret.getConditionNote() + " | " : "")
                    + "Admin phán quyết Shop thắng: " + (note != null ? note : ""));
            orderReturnRepository.save(ret);
        }

        // 4. Giải ngân cho Shop: CHỈ KHI Escrow cho phép
        // Phục hồi trạng thái Escrow từ DISPUTED sang HELD (TUYỆT ĐỐI không thay đổi
        // nếu đã RELEASED/REFUNDED)
        escrowOpt.ifPresent(escrow -> {
            if (escrow.getStatus() == EscrowStatus.DISPUTED) {
                escrow.setStatus(EscrowStatus.HELD);
                escrow.setUpdatedAt(now);
                escrowRepository.save(escrow);
            }
        });

        // Chỉ release khi Escrow là HELD hoặc DISPUTED
        if (escrowOpt.isPresent() && (escrowOpt.get().getStatus() == EscrowStatus.HELD
                || escrowOpt.get().getStatus() == EscrowStatus.DISPUTED)) {
            order.setReceivedByBuyer(true);
            order.setReceivedAt(now);
            order.setStatus(OrderStatus.DELIVERED);
            orderRepository.save(order);

            escrowService.releaseByOrder(orderId);

            order.setStatus(OrderStatus.COMPLETED);
            orderRepository.save(order);
        }

        // 5. Cập nhật Request & Report
        r.setStatus(RequestStatus.APPROVED);
        r.setReviewedBy(admin);
        r.setReviewedAt(now);
        r.setResponse(note);

        report.setModeratorNote(note);
        report.setStage(ReportStage.CLOSED);

        requestRepository.save(r);
        reportRepository.save(report);

        log.info("Admin resolved seller return dispute (Seller Wins) for orderId={}, released to shop", orderId);
    }

    private void handleSellerReturnDisputeBuyerWins(Report report, Request r, Account admin, LocalDateTime now,
            String note, ReportDecision decision, Optional<OrderReturn> returnOpt) {
        UUID orderId = report.getTargetId();
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new CustomException("Order not found: " + orderId));

        // 1. Kiểm tra Escrow tránh duplicate refund
        Optional<Escrow> escrowOpt = escrowRepository.findByOrderIdForUpdate(orderId);
        if (escrowOpt.isPresent() && escrowOpt.get().getStatus() == EscrowStatus.REFUNDED) {
            throw new CustomException("Đơn hàng này đã được hoàn tiền ký quỹ trước đó");
        }

        // 2. Hoàn tất kiện hoàn (OrderReturn -> COMPLETED)
        OrderReturn ret = returnOpt.orElseGet(() -> orderReturnRepository.findByOrderIdForUpdate(orderId).orElse(null));
        if (ret != null) {
            ret.setStatus(ReturnStatus.COMPLETED);
            ret.setConditionNote((ret.getConditionNote() != null ? ret.getConditionNote() + " | " : "")
                    + "Admin phán quyết Người mua thắng: " + (note != null ? note : ""));
            orderReturnRepository.save(ret);
        }

        // 3. Hoàn tiền Escrow về cho Người mua (nếu trạng thái Escrow chưa hoàn)
        escrowService.refundByOrder(orderId,
                "Admin phán quyết bồi hoàn cho Người mua sau khi phân xử khiếu nại kiện hoàn: "
                        + (note != null ? note : ""));

        order.setStatus(OrderStatus.REFUNDED);
        orderRepository.save(order);

        // 4. Cập nhật Request & Report
        r.setStatus(decision == ReportDecision.REJECT ? RequestStatus.REJECTED : RequestStatus.APPROVED);
        r.setReviewedBy(admin);
        r.setReviewedAt(now);
        r.setResponse(note);

        report.setModeratorNote(note);
        report.setStage(ReportStage.CLOSED);
        report.setResolutionType(ResolutionType.REFUND_ONLY);

        requestRepository.save(r);
        reportRepository.save(report);

        log.info("Admin resolved seller return dispute (Buyer Wins) for orderId={}, refunded buyer", orderId);
    }

    private void rejectRequest(Request r, Account admin, LocalDateTime now, String note, Report report) {
        r.setStatus(RequestStatus.REJECTED);
        r.setReviewedBy(admin);
        r.setReviewedAt(now);
        r.setResponse(note);
        requestRepository.save(r);

        if (report != null) {
            report.setStage(ReportStage.CLOSED);
            report.setModeratorNote(note);
            reportRepository.save(report);

            if (report.getTargetType() == TargetType.ORDER && report.getTargetId() != null) {
                UUID orderId = report.getTargetId();
                boolean hasActiveReturn = orderReturnRepository.findByOrderId(orderId)
                        .filter(ret -> ret.getStatus() != ReturnStatus.COMPLETED
                                && ret.getStatus() != ReturnStatus.CANCELLED)
                        .isPresent();

                Order order = orderRepository.findByIdForUpdate(orderId).orElse(null);
                if (order != null && !hasActiveReturn && order.getStatus() == OrderStatus.DELIVERED) {
                    order.setReceivedByBuyer(true);
                    order.setReceivedAt(now);
                    orderRepository.save(order);
                    escrowService.releaseByOrder(orderId);
                    order.setStatus(OrderStatus.COMPLETED);
                    orderRepository.save(order);
                    log.info("Admin rejected buyer report, released orderId={} to shop", orderId);
                } else {
                    escrowRepository.findByOrderIdForUpdate(orderId).ifPresent(escrow -> {
                        if (escrow.getStatus() == EscrowStatus.DISPUTED) {
                            boolean hasOtherDispute = reportRepository.hasActiveOrderDispute(orderId);
                            if (!hasOtherDispute) {
                                escrow.setStatus(EscrowStatus.HELD);
                                escrow.setUpdatedAt(now);
                                escrowRepository.save(escrow);
                            }
                        }
                    });
                }
            }
        }
    }

    private void approveRequest(Request r, Account admin, LocalDateTime now, String note, Report report,
            ResolutionType resolutionType) {
        r.setStatus(RequestStatus.APPROVED);
        r.setReviewedBy(admin);
        r.setReviewedAt(now);
        r.setResponse(note);
        report.setModeratorNote(note);
        report.setStage(ReportStage.CLOSED);

        if (report.getTargetType() == TargetType.ORDER) {
            ResolutionType finalResolution = resolutionType != null ? resolutionType : ResolutionType.REFUND_ONLY;
            report.setResolutionType(finalResolution);
            UUID orderId = report.getTargetId();

            if (finalResolution == ResolutionType.REFUND_ONLY) {
                escrowService.refundByOrder(orderId, "Admin chấp thuận khiếu nại của người mua");
                orderRepository.findByIdForUpdate(orderId).ifPresent(o -> {
                    o.setStatus(OrderStatus.REFUNDED);
                    orderRepository.save(o);
                });
                orderReturnRepository.findByOrderIdForUpdate(orderId).ifPresent(ret -> {
                    ret.setStatus(ReturnStatus.COMPLETED);
                    ret.setConditionNote((ret.getConditionNote() != null ? ret.getConditionNote() + " | " : "")
                            + "Admin chấp thuận hoàn tiền cho người mua: " + (note != null ? note : ""));
                    orderReturnRepository.save(ret);
                });
                log.info("Admin approved buyer dispute, refunded orderId={}", orderId);
            } else if (finalResolution == ResolutionType.RETURN_AND_REFUND) {
                Optional<OrderReturn> existingReturn = orderReturnRepository.findByOrderIdForUpdate(orderId);
                if (existingReturn.isEmpty()) {
                    // Case 1: Chưa có kiện hoàn -> Khởi tạo kiện hoàn mới qua OrderReturnService
                    // (thời hạn chuẩn 3 ngày)
                    orderReturnService.createReturn(orderId, report.getId());
                    report.setStage(ReportStage.RETURN_IN_PROGRESS);
                    log.info("Admin approved buyer dispute (Case 1), initiated return for orderId={}", orderId);
                } else {
                    // Case 2: Đã có kiện hoàn đang diễn ra -> Tái sử dụng, không tạo trùng, không
                    // reset trạng thái hay deadline
                    OrderReturn ret = existingReturn.get();
                    if (ret.getReport() == null) {
                        ret.setReport(report);
                        orderReturnRepository.save(ret);
                    }
                    report.setStage(ReportStage.RETURN_IN_PROGRESS);
                    log.info(
                            "Admin approved buyer dispute (Case 2), reusing existing returnId={} status={} for orderId={}",
                            ret.getId(), ret.getStatus(), orderId);
                }
            }
        }
        requestRepository.save(r);
        reportRepository.save(report);
    }

    @Override
    @Transactional
    public CreateRequestResponse createReport(UUID accountId, CreateReportRequest request) {

        Account acc = accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomException("Account not found"));

        if (acc.getDisciplineLevel() == DisciplineLevel.SUSPENDED || acc.getStatus() == AccountStatus.BANNED) {
            throw new CustomException("You can not create report because you got suspended or banned");
        }

        TargetType targetType = requestPolicy.resolve(request.getTargetId());

        ReportStage initialStage = ReportStage.ESCALATED_TO_ADMIN;
        LocalDateTime deadline = null;

        // B1: Phân loại Report:
        // - Trường hợp B: Report Tranh chấp Giao dịch (ORDER) -> Giai đoạn thương lượng
        // 1:1, SLA 48h
        // - Trường hợp A: Report Vấn đề Sản phẩm / Hệ thống (PRODUCT, SHOP, USER,
        // REVIEW) -> Thẳng Admin Queue
        if (targetType == TargetType.ORDER) {
            requestPolicy.validateOrderReport(accountId, request.getTargetId());
            escrowRepository.findByOrderIdForUpdate(request.getTargetId()).ifPresent(escrow -> {
                if (escrow.getStatus() == EscrowStatus.HELD) {
                    escrow.setStatus(EscrowStatus.DISPUTED);
                    escrow.setUpdatedAt(LocalDateTime.now());
                    escrowRepository.save(escrow);
                }
            });
            initialStage = ReportStage.DIRECT_NEGOTIATION;
            deadline = LocalDateTime.now().plusHours(48);
        }

        Request r = requestService.createRequest(acc, CreateSendRequest.builder()
                .requestType(RequestType.REPORT)
                .coverImage(request.getCoverImageUrl())
                .description(request.getDescription())
                .build());

        Report re = Report.builder()
                .request(r)
                .evidenceUrl(request.getEvidenceUrl())
                .targetType(targetType)
                .targetId(request.getTargetId())
                .stage(initialStage)
                .sellerResponseDeadline(deadline)
                .build();

        reportRepository.save(re);

        return CreateRequestResponse.from(r);
    }

    @Override
    @Transactional
    public void cancelReport(UUID buyerAccountId, UUID reportId) {
        Report report = reportRepository.findByIdForUpdate(reportId)
                .orElseThrow(() -> new CustomException("Không tìm thấy khiếu nại: " + reportId));

        Request req = report.getRequest();
        if (req == null) {
            throw new CustomException("Request không tồn tại");
        }

        if (!req.getAccount().getId().equals(buyerAccountId)) {
            throw new CustomException("Bạn không có quyền hủy khiếu nại này");
        }

        if (report.getStage() != ReportStage.DIRECT_NEGOTIATION) {
            throw new CustomException("Chỉ có thể hủy khiếu nại khi đang ở giai đoạn thương lượng 1:1");
        }

        LocalDateTime now = LocalDateTime.now();
        report.setStage(ReportStage.CANCELLED);
        req.setStatus(RequestStatus.REJECTED);
        req.setResponse("Khách hàng chủ động hủy khiếu nại");
        req.setReviewedAt(now);

        if (report.getTargetType() == TargetType.ORDER && report.getTargetId() != null) {
            UUID orderId = report.getTargetId();
            escrowRepository.findByOrderIdForUpdate(orderId).ifPresent(escrow -> {
                if (escrow.getStatus() == EscrowStatus.DISPUTED) {
                    boolean hasOtherDispute = reportRepository.hasActiveOrderDispute(orderId);
                    if (!hasOtherDispute) {
                        escrow.setStatus(EscrowStatus.HELD);
                        escrow.setUpdatedAt(now);
                        escrowRepository.save(escrow);
                    }
                }
            });
        }

        reportRepository.save(report);
        requestRepository.save(req);
        log.info("Buyer accountId={} cancelled dispute reportId={}", buyerAccountId, reportId);
    }

    @Override
    @Transactional
    public void sellerRespond(UUID sellerAccountId, UUID reportId, SellerDisputeRespondRequest req) {
        Report report = reportRepository.findByIdForUpdate(reportId)
                .orElseThrow(() -> new CustomException("Không tìm thấy khiếu nại: " + reportId));

        if (report.getTargetType() != TargetType.ORDER) {
            throw new CustomException("Chỉ áp dụng thương lượng cho khiếu nại đơn hàng");
        }

        UUID orderId = report.getTargetId();
        if (!isOrderSeller(orderId, sellerAccountId)) {
            throw new CustomException("Bạn không phải chủ gian hàng sở hữu đơn hàng này");
        }

        if (report.getStage() != ReportStage.DIRECT_NEGOTIATION) {
            throw new CustomException("Khiếu nại không ở giai đoạn thương lượng 1:1");
        }

        LocalDateTime now = LocalDateTime.now();
        report.setSellerAction(req.getAction());
        report.setSellerResponse(req.getResponseNote());
        report.setSellerEvidenceUrl(req.getEvidenceUrl());

        switch (req.getAction()) {
            case ACCEPT_REFUND -> {
                Order order = orderRepository.findByIdForUpdate(orderId)
                        .orElseThrow(() -> new CustomException("Order not found: " + orderId));

                report.setStage(ReportStage.RESOLVED);
                report.setResolutionType(ResolutionType.REFUND_ONLY);
                report.getRequest().setStatus(RequestStatus.APPROVED);
                report.getRequest().setResponse("Người bán đồng ý hoàn tiền trong thương lượng 1:1: "
                        + (req.getResponseNote() != null ? req.getResponseNote() : ""));
                report.getRequest().setReviewedAt(now);

                escrowService.refundByOrder(orderId, "Shop chấp nhận hoàn tiền trong thương lượng 1:1");
                order.setStatus(OrderStatus.REFUNDED);
                orderRepository.save(order);

                log.info("Seller accepted refund for dispute reportId={}, orderId={}", reportId, orderId);
            }

            case ACCEPT_RETURN -> {
                report.setStage(ReportStage.RETURN_IN_PROGRESS);
                report.setResolutionType(ResolutionType.RETURN_AND_REFUND);
                report.getRequest()
                        .setResponse("Người bán đồng ý nhận hàng đổi trả. Đã khởi tạo quy trình gửi hàng hoàn.");
                report.getRequest().setReviewedAt(now);

                orderReturnService.createReturn(orderId, report.getId());
                log.info("Seller accepted return for dispute reportId={}, created OrderReturn", reportId);
            }

            case REJECT_AND_ESCALATE -> {
                report.setStage(ReportStage.ESCALATED_TO_ADMIN);
                report.setEscalatedAt(now);
                report.setEscalatedByAccountId(sellerAccountId);
                report.setEscalationReason(
                        "Người bán từ chối khiếu nại: " + (req.getResponseNote() != null ? req.getResponseNote() : ""));
                log.info("Seller rejected dispute reportId={}, escalated to admin", reportId);
            }
        }

        reportRepository.save(report);
        requestRepository.save(report.getRequest());
    }

    @Override
    @Transactional
    public void escalateReport(UUID accountId, UUID reportId, EscalateReportRequest req) {
        Report report = reportRepository.findByIdForUpdate(reportId)
                .orElseThrow(() -> new CustomException("Không tìm thấy khiếu nại: " + reportId));

        if (report.getTargetType() != TargetType.ORDER) {
            throw new CustomException("Chỉ áp dụng can thiệp cho khiếu nại đơn hàng");
        }

        if (report.getStage() != ReportStage.DIRECT_NEGOTIATION) {
            throw new CustomException("Chỉ có thể yêu cầu can thiệp khi đang ở giai đoạn thương lượng");
        }

        UUID orderId = report.getTargetId();
        UUID buyerAccountId = report.getRequest() != null && report.getRequest().getAccount() != null
                ? report.getRequest().getAccount().getId()
                : null;
        boolean isReporter = accountId.equals(buyerAccountId);
        boolean isSeller = isOrderSeller(orderId, accountId);

        if (!isReporter && !isSeller) {
            throw new CustomException("Bạn không có quyền yêu cầu Admin can thiệp vào tranh chấp này");
        }

        LocalDateTime now = LocalDateTime.now();
        report.setStage(ReportStage.ESCALATED_TO_ADMIN);
        report.setEscalatedAt(now);
        report.setEscalatedByAccountId(accountId);
        report.setEscalationReason(req != null && req.getReason() != null && !req.getReason().isBlank()
                ? req.getReason()
                : "Hai bên không thống nhất được phương án giải quyết trong thương lượng 1:1");

        reportRepository.save(report);
        log.info("Dispute reportId={} escalated to Admin by accountId={}", reportId, accountId);
    }

    private void handleReportOrder(UUID orderId, LocalDateTime now) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new CustomException("Không tìm thấy đơn hàng: " + orderId));

        UUID ownerAccountId = requestPolicy.resolveTargetAccountId(TargetType.ORDER, orderId);
        if (ownerAccountId == null) {
            throw new CustomException("Không tìm thấy tài khoản chủ gian hàng của đơn hàng: " + orderId);
        }

        // Phạt tài khoản chủ Shop
        DisciplineLevel level = punishAccount(ownerAccountId, now);

        if (order.getShop() != null) {
            Shop shop = order.getShop();
            if (level == DisciplineLevel.WARNED) {
                if (shop.getStatus() == ShopStatus.ACTIVE) {
                    shop.setStatus(ShopStatus.WARNED);
                }
            } else if (level == DisciplineLevel.SUSPENDED) {
                shop.setStatus(ShopStatus.SUSPENDED);
                productRepository.updateStatusByShopId(shop.getId(), ProductStatus.INACTIVE);
            } else if (level == DisciplineLevel.BANNED) {
                shop.setStatus(ShopStatus.BANNED);
                productRepository.updateStatusByShopId(shop.getId(), ProductStatus.DELETED);
            }
            shopRepository.save(shop);
        }

        // Đảm bảo Escrow ở trạng thái DISPUTED
        escrowRepository.findByOrderIdForUpdate(orderId).ifPresent(escrow -> {
            if (escrow.getStatus() == EscrowStatus.HELD) {
                escrow.setStatus(EscrowStatus.DISPUTED);
                escrow.setUpdatedAt(now);
                escrowRepository.save(escrow);
            }
        });
    }

    private void handleReportUser(UUID targetId, LocalDateTime now) {
        UUID accountId = requestPolicy.resolveTargetAccountId(TargetType.USER, targetId);
        if (accountId == null)
            throw new CustomException("Cannot resolve USER accountId");
        punishAccount(accountId, now);
    }

    private void handleReportProduct(UUID targetId, LocalDateTime now) {
        Product product = productRepository.findByIdForUpdate(targetId)
                .orElseThrow(() -> new CustomException("Product not found: " + targetId));

        if (product.getStatus() == ProductStatus.DELETED) {
            throw new CustomException("Product is already deleted");
        }

        if (product.getLastReportedAt() != null && product.getReportCount() > 0) {
            long daysPassed = java.time.temporal.ChronoUnit.DAYS.between(product.getLastReportedAt(), now);
            long decayCycles = daysPassed / 30;
            if (decayCycles > 0) {
                int decayedCount = Math.max(0, product.getReportCount() - (int) decayCycles);
                product.setReportCount(decayedCount);
                if (decayedCount < 3) {
                    product.setFlagged(false);
                }
            }
        }

        int nextCount = product.getReportCount() + 1;
        product.setReportCount(nextCount);
        product.setLastReportedAt(now);

        if (nextCount >= 3) {
            product.setFlagged(true);
        }

        if (nextCount >= 5) {
            product.setStatus(ProductStatus.INACTIVE);
        }

        UUID accountId = requestPolicy.resolveTargetAccountId(TargetType.PRODUCT, targetId);
        if (accountId == null)
            throw new CustomException("Cannot resolve PRODUCT owner accountId");
        punishAccount(accountId, now);
    }

    private void handleReportReview(UUID reviewId, LocalDateTime now) {

        Review review = reviewRepository.findByIdForUpdate(reviewId)
                .orElseThrow(() -> new CustomException("Review not found: " + reviewId));

        if (review.getStatus() == ReviewStatus.HIDDEN) {
            throw new CustomException("Review is already hidden");
        }

        int nextCount = review.getReportCount() + 1;
        review.setReportCount(nextCount);

        if (nextCount >= 3) {
            review.setFlagged(true);
        }

        if (nextCount >= 5) {
            review.setStatus(ReviewStatus.HIDDEN);
        }

        UUID accountId = requestPolicy.resolveTargetAccountId(TargetType.REVIEW, reviewId);
        if (accountId == null)
            throw new CustomException("Cannot resolve REVIEW owner accountId");

        punishAccount(accountId, now);
    }

    private DisciplineLevel punishAccount(UUID targetAccountId, LocalDateTime now) {

        Account target = accountRepository.findByIdForUpdate(targetAccountId)
                .orElseThrow(() -> new CustomException("Target account not found"));

        if (target.getDisciplineLevel() == DisciplineLevel.BANNED || target.getStatus() == AccountStatus.BANNED) {
            throw new CustomException("Account is already banned");
        }

        // Thuật toán Hoàn lương (30-Day Monthly Decay):
        // Cứ mỗi 30 ngày liên tục không có vi phạm mới, số lần vi phạm được trừ đi 1
        // lần cho đến khi về 0.
        if (target.getLastViolationAt() != null && target.getViolationCount() > 0) {
            long daysPassed = java.time.temporal.ChronoUnit.DAYS.between(target.getLastViolationAt(), now);
            long decayCycles = daysPassed / 30;
            if (decayCycles > 0) {
                int decayedCount = Math.max(0, target.getViolationCount() - (int) decayCycles);
                target.setViolationCount(decayedCount);
            }
        }

        int next = target.getViolationCount() + 1;
        target.setViolationCount(next);
        target.setLastViolationAt(now);

        DisciplineLevel finalLevel;
        if (next >= 7) {
            target.setDisciplineLevel(DisciplineLevel.BANNED);
            target.setBannedUntil(now.plusDays(7));
            target.setStatus(AccountStatus.BANNED);
            target.setIsActive(false);
            finalLevel = DisciplineLevel.BANNED;
        } else if (next >= 5) {
            target.setDisciplineLevel(DisciplineLevel.SUSPENDED);
            target.setStatus(AccountStatus.SUSPENDED);
            target.setIsActive(true);
            finalLevel = DisciplineLevel.SUSPENDED;
        } else if (next >= 3) {
            target.setDisciplineLevel(DisciplineLevel.WARNED);
            finalLevel = DisciplineLevel.WARNED;
        } else {
            target.setDisciplineLevel(DisciplineLevel.NONE);
            finalLevel = DisciplineLevel.NONE;
        }

        accountRepository.save(target);
        return finalLevel;
    }

    private void handleReportShop(UUID shopId, LocalDateTime now) {

        Shop shop = shopRepository.findByIdForUpdate(shopId)
                .orElseThrow(() -> new CustomException("Shop not found: " + shopId));

        if (shop.getStatus() == ShopStatus.BANNED) {
            throw new CustomException("Shop is already banned");
        }

        UUID ownerAccountId = requestPolicy.resolveTargetAccountId(TargetType.SHOP, shopId);
        if (ownerAccountId == null) {
            throw new CustomException("Cannot resolve SHOP owner accountId");
        }

        DisciplineLevel level = punishAccount(ownerAccountId, now);

        if (level == DisciplineLevel.WARNED) {
            if (shop.getStatus() == ShopStatus.ACTIVE) {
                shop.setStatus(ShopStatus.WARNED);
            }
        } else if (level == DisciplineLevel.SUSPENDED) {
            shop.setStatus(ShopStatus.SUSPENDED);
            productRepository.updateStatusByShopId(shopId, ProductStatus.INACTIVE);
        } else if (level == DisciplineLevel.BANNED) {
            shop.setStatus(ShopStatus.BANNED);
            productRepository.updateStatusByShopId(shopId, ProductStatus.DELETED);
        }

        shopRepository.save(shop);
    }

    @Override
    @Transactional(readOnly = true)
    public ReportDetailsResponse getReportByOrderId(UUID accountId, UUID orderId) {
        List<Report> reports = reportRepository.findByOrderIdOrderByCreatedAtDesc(orderId);
        if (reports.isEmpty()) {
            return null;
        }
        Report report = reports.get(0);
        Request req = report.getRequest();

        boolean isReporter = req != null && req.getAccount() != null && req.getAccount().getId().equals(accountId);
        boolean isSeller = isOrderSeller(orderId, accountId);

        Account caller = accountRepository.findById(accountId).orElse(null);
        boolean isAdmin = caller != null && caller.getRole() != null
                && "ADMIN".equalsIgnoreCase(caller.getRole().getRoleName());

        if (!isReporter && !isSeller && !isAdmin) {
            throw new CustomException("Bạn không có quyền xem thông tin khiếu nại của đơn hàng này");
        }

        EscrowAdminResponse escrowDto = escrowRepository.findByOrderId(orderId)
                .map(EscrowAdminResponse::from)
                .orElse(null);

        String sellerResponse = report.getSellerResponse();
        String sellerEvidenceUrl = report.getSellerEvidenceUrl();
        DisputeSellerAction sellerAction = report.getSellerAction();

        OrderReturnResponse orderReturnDto = orderReturnService.getReturnByOrderId(orderId);

        return ReportDetailsResponse.builder()
                .id(report.getId())
                .requestId(req != null ? req.getId() : null)
                .targetType(report.getTargetType())
                .targetId(report.getTargetId())
                .evidenceUrl(report.getEvidenceUrl())
                .moderatorNote(report.getModeratorNote())
                .resolutionType(report.getResolutionType())
                .stage(report.getStage())
                .sellerResponseDeadline(report.getSellerResponseDeadline())
                .sellerResponse(sellerResponse)
                .sellerEvidenceUrl(sellerEvidenceUrl)
                .sellerAction(sellerAction)
                .escalatedAt(report.getEscalatedAt())
                .escalationReason(report.getEscalationReason())
                .status(req != null && req.getStatus() != null ? req.getStatus().name() : null)
                .description(req != null ? req.getDescription() : null)
                .response(req != null ? req.getResponse() : null)
                .createdAt(req != null ? req.getCreatedAt() : null)
                .reviewedAt(req != null ? req.getReviewedAt() : null)
                .escrow(escrowDto)
                .orderReturn(orderReturnDto)
                .build();
    }

    private boolean isOrderSeller(UUID orderId, UUID accountId) {
        if (orderId == null || accountId == null)
            return false;

        // 1. Kiểm tra qua quan hệ Order -> Shop -> User -> Account
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isPresent() && orderOpt.get().getShop() != null) {
            Shop shop = orderOpt.get().getShop();
            if (shop.getUser() != null && shop.getUser().getAccount() != null
                    && shop.getUser().getAccount().getId().equals(accountId)) {
                return true;
            }
        }

        // 2. Fallback qua requestPolicy resolve
        UUID sellerAccountId = requestPolicy.resolveTargetAccountId(TargetType.ORDER, orderId);
        return sellerAccountId != null && sellerAccountId.equals(accountId);
    }
}
