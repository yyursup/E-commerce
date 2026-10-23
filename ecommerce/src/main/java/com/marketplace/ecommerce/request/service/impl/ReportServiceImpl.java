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
import com.marketplace.ecommerce.shop.service.ShopEscrowFundService;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import com.marketplace.ecommerce.request.valueObjects.DisputePolicyClause;
import com.marketplace.ecommerce.request.dto.response.DisputePolicyClauseResponse;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.service.AccountDisciplineService;
import com.marketplace.ecommerce.notification.entity.Notification;
import com.marketplace.ecommerce.notification.repository.NotificationRepository;
import com.marketplace.ecommerce.notification.valueObjects.NotificationChannelType;
import com.marketplace.ecommerce.notification.valueObjects.NotificationStatus;
import com.marketplace.ecommerce.notification.valueObjects.NotificationType;
import com.marketplace.ecommerce.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
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
    private final ShopEscrowFundService shopEscrowFundService;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ChatService chatService;
    private final AccountDisciplineService accountDisciplineService;

    @Override
    @Transactional
    public void handleReport(UUID adminAccountId, UUID requestId, HandleReportRequest req) {

        Account admin = accountRepository.findById(adminAccountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy tài khoản quản trị viên"));

        Report report = reportRepository.findByRequestId(requestId);
        if (report == null)
            throw new CustomException("Không tìm thấy báo cáo khiếu nại cho mã yêu cầu: " + requestId);

        Request r = report.getRequest();
        if (r == null)
            throw new CustomException("Không tìm thấy yêu cầu");

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

        // Validate và lưu Căn cứ Điều khoản Chính sách bắt buộc đối với tranh chấp Đơn
        // hàng
        DisputePolicyClause policyClause = requestPolicy.validateDisputePolicyClause(
                report.getTargetType(), req.getPolicyClauseCode(), req.getDecision(), isSellerReturnDispute);
        if (policyClause != null) {
            report.setPolicyClauseCode(policyClause.getCode());
            report.setPolicyClauseTitle(policyClause.getTitle());
        }

        if (isSellerReturnDispute) {
            // Case 3: Xử lý tranh chấp kiện hàng hoàn do Seller khiếu nại
            // TUYỆT ĐỐI không gọi handleReportOrder (không phạt Shop vì đây là khiếu nại
            // tình trạng hàng hoàn)
            // TUYỆT ĐỐI không gọi orderReturnService.createReturn (không tạo mới kiện hoàn)

            // Bảo vệ nghiệp vụ: Trong tranh chấp kiện hoàn do Shop khiếu nại:
            // - REJECT: Bác bỏ khiếu nại của Shop -> Buyer thắng (Bồi hoàn Escrow cho Buyer)
            // - RETURN_AND_REFUND: Nhánh generic bồi hoàn không tạo return trùng -> Buyer thắng
            // - APPROVE: Chấp thuận khiếu nại của Shop -> Shop thắng (Giải ngân Escrow cho Shop)
            // BẢO VỆ ESCROW: Khi Admin chọn APPROVE, nếu payload vô tình kẹp resolutionType=REFUND_ONLY
            // (do fallback mặc định của FE hoặc modal chung), hệ thống TUYỆT ĐỐI KHÔNG coi là Buyer thắng,
            // bảo đảm giải ngân cho Shop, không hoàn tiền cho Buyer và không phạt Shop.
            if (req.getDecision() == ReportDecision.APPROVE && req.getResolutionType() == ResolutionType.REFUND_ONLY) {
                log.warn("Cảnh báo mâu thuẫn payload: Khiếu nại kiện hoàn Shop có decision=APPROVE nhưng kèm resolutionType=REFUND_ONLY. Bỏ qua resolutionType để bảo toàn phán quyết giải ngân cho Shop.");
            }

            boolean buyerWins = (req.getDecision() == ReportDecision.REJECT)
                    || (req.getDecision() != ReportDecision.APPROVE && req.getResolutionType() == ResolutionType.REFUND_ONLY)
                    || (req.getResolutionType() == ResolutionType.RETURN_AND_REFUND && req.getRemoveShopPenalty() == null);

            if (buyerWins) {
                handleSellerReturnDisputeBuyerWins(report, r, admin, now, req.getNote(), req.getDecision(), returnOpt);
            } else {
                handleSellerReturnDisputeSellerWins(report, r, admin, now, req.getNote(), req.getDecision(), returnOpt, req.getRemoveShopPenalty());
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
            String note, ReportDecision decision, Optional<OrderReturn> returnOpt, Boolean removeShopPenalty) {
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

        // 2. Quyết định của Admin về việc xóa gậy hay giữ nguyên cho Shop:
        boolean shouldPardonShop = removeShopPenalty == null || removeShopPenalty;
        if (shouldPardonShop && order.getShop() != null) {
            Shop shop = order.getShop();
            if (shop.getViolationCount() != null && shop.getViolationCount() > 0) {
                shop.setViolationCount(Math.max(0, shop.getViolationCount() - 1));
                restoreShopIfEligible(shop);
                shopRepository.save(shop);
            }
            log.info("Admin decided to PARDON shop penalty: orderId={}, newViolationCount={}", orderId, shop.getViolationCount());
        } else {
            log.info("Admin decided to KEEP shop penalty: orderId={}, removeShopPenalty={}", orderId, removeShopPenalty);
        }

        // 3. Xử phạt Buyer vì gian lận kiện hoàn (Return Fraud) & Chặn vĩnh viễn quyền kháng cáo theo mốc kỷ luật chuẩn
        if (order.getUser() != null && order.getUser().getAccount() != null) {
            UUID buyerAccountId = order.getUser().getAccount().getId();
            DisciplineLevel buyerLevel = punishAccount(buyerAccountId, now);
            log.info("Penalized buyer for return fraud via punishAccount: buyerAccountId={}, finalDisciplineLevel={}",
                    buyerAccountId, buyerLevel);
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
            releaseDeliveredOrderToShop(order, now);
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

        chatService.closeDisputeThread(r.getId(), "Admin giải quyết khiếu nại kiện hoàn: chấp thuận giải trình từ phía gian hàng");

        // Gửi thông báo In-App cho Người bán và Người mua
        String orderCodeSellerWins = order.getOrderNumber() != null ? order.getOrderNumber() : orderId.toString();
        User buyerSellerWins = getOrderBuyerUser(order, report);
        User sellerSellerWins = getOrderSellerUser(order);
        sendDisputeNotification(sellerSellerWins,
                "Khiếu nại kiện hoàn thành công - Giải ngân cho gian hàng",
                "Ban Quản Trị đã chấp thuận khiếu nại kiện hoàn đơn hàng #" + orderCodeSellerWins + ". Tiền thanh toán đã được giải ngân cho gian hàng.",
                orderId, report.getId());
        sendDisputeNotification(buyerSellerWins,
                "Kết quả phân xử khiếu nại kiện hoàn đơn hàng",
                "Ban Quản Trị đã giải quyết khiếu nại kiện hoàn đơn hàng #" + orderCodeSellerWins + " với phán quyết chấp thuận giải trình từ phía gian hàng.",
                orderId, report.getId());

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

        // 2. Xử phạt Shop nếu ở Giai đoạn 1 Shop chưa từng bị phạt (do tự thương lượng ACCEPT_RETURN hoặc chưa qua Admin xử phạt)
        boolean shouldPenalizeShop = (report.getSellerAction() == DisputeSellerAction.ACCEPT_RETURN || r.getReviewedBy() == null);
        if (shouldPenalizeShop && order.getShop() != null) {
            Shop shop = shopRepository.findByIdForUpdate(order.getShop().getId())
                    .orElse(order.getShop());
            punishShop(shop, now);
            log.info("Penalized shop on seller return dispute rejection (Buyer Wins): orderId={}, shopId={}, newViolationCount={}",
                    orderId, shop.getId(), shop.getViolationCount());
        }

        // 3. Hoàn tất kiện hoàn (OrderReturn -> COMPLETED)
        OrderReturn ret = returnOpt.orElseGet(() -> orderReturnRepository.findByOrderIdForUpdate(orderId).orElse(null));
        if (ret != null) {
            ret.setStatus(ReturnStatus.COMPLETED);
            ret.setConditionNote((ret.getConditionNote() != null ? ret.getConditionNote() + " | " : "")
                    + "Admin phán quyết Người mua thắng: " + (note != null ? note : ""));
            orderReturnRepository.save(ret);
            shopEscrowFundService.deductReturnDisputeShippingFees(ret);
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

        chatService.closeDisputeThread(r.getId(), "Admin phán quyết bồi hoàn cho Người mua sau khiếu nại kiện hoàn");

        // Gửi thông báo In-App cho Người mua và Người bán
        String orderCodeBuyerWins = order.getOrderNumber() != null ? order.getOrderNumber() : orderId.toString();
        User buyerBuyerWins = getOrderBuyerUser(order, report);
        User sellerBuyerWins = getOrderSellerUser(order);
        sendDisputeNotification(buyerBuyerWins,
                "Khiếu nại kiện hoàn: Chấp thuận bồi hoàn cho người mua",
                "Ban Quản Trị đã phân xử chấp thuận bồi hoàn đơn hàng #" + orderCodeBuyerWins + " cho bạn. Tiền thanh toán ký quỹ đã được hoàn trả.",
                orderId, report.getId());
        sendDisputeNotification(sellerBuyerWins,
                "Kết quả phân xử khiếu nại kiện hoàn đơn hàng",
                "Ban Quản Trị đã bác bỏ khiếu nại kiện hoàn đơn hàng #" + orderCodeBuyerWins + ". Tiền thanh toán đã được hoàn trả lại cho người mua.",
                orderId, report.getId());

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
                    releaseDeliveredOrderToShop(order, now);
                    log.info("Admin rejected buyer report, released orderId={} to shop", orderId);
                } else {
                    restoreEscrowToHeldIfNoActiveDispute(orderId, now);
                }

                if (order != null) {
                    String orderCode = order.getOrderNumber() != null ? order.getOrderNumber() : orderId.toString();
                    User buyer = getOrderBuyerUser(order, report);
                    User seller = getOrderSellerUser(order);
                    String clauseInfo = report.getPolicyClauseTitle() != null ? " (Căn cứ: " + report.getPolicyClauseTitle() + ")" : "";
                    sendDisputeNotification(buyer,
                            "Khiếu nại đơn hàng bị từ chối",
                            "Khiếu nại của bạn cho đơn hàng #" + orderCode + " đã bị Ban Quản Trị từ chối" + clauseInfo + ". Lý do: " + (note != null ? note : "Không đáp ứng quy định khiếu nại"),
                            order.getId(), report.getId());
                    sendDisputeNotification(seller,
                            "Khiếu nại đơn hàng được bác bỏ - Giải ngân thành công",
                            "Ban Quản Trị đã bác bỏ khiếu nại của người mua cho đơn hàng #" + orderCode + " " + clauseInfo + ". Tiền thanh toán đã được giải ngân cho gian hàng.",
                            order.getId(), report.getId());
                }

                if (report.getRequest() != null) {
                    chatService.closeDisputeThread(report.getRequest().getId(), "Admin bác bỏ khiếu nại và giải ngân cho Shop");
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
                if (report.getRequest() != null) {
                    chatService.closeDisputeThread(report.getRequest().getId(), "Admin phê duyệt hoàn tiền cho Người mua");
                }
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
                if (report.getRequest() != null) {
                    chatService.closeDisputeThread(
                            report.getRequest().getId(),
                            "Ban Quản Trị đã chấp thuận yêu cầu trả hàng - hoàn tiền. Quy trình đổi trả tiếp tục qua hệ thống vận chuyển chính thức, phòng chat 1:1 đã khóa.");
                }
            }

            orderRepository.findById(orderId).ifPresent(order -> {
                String orderCode = order.getOrderNumber() != null ? order.getOrderNumber() : orderId.toString();
                User buyer = getOrderBuyerUser(order, report);
                User seller = getOrderSellerUser(order);
                String clauseInfo = report.getPolicyClauseTitle() != null ? " (Căn cứ: " + report.getPolicyClauseTitle() + ")" : "";
                if (finalResolution == ResolutionType.REFUND_ONLY) {
                    sendDisputeNotification(buyer,
                            "Khiếu nại được chấp thuận - Hoàn tiền thành công",
                            "Ban Quản Trị đã chấp thuận khiếu nại đơn hàng #" + orderCode + " " + clauseInfo + ". Tiền thanh toán đã được hoàn trả lại cho bạn.",
                            order.getId(), report.getId());
                    sendDisputeNotification(seller,
                            "Phán quyết khiếu nại: Chấp thuận hoàn tiền cho người mua",
                            "Ban Quản Trị đã chấp thuận khiếu nại của người mua cho đơn hàng #" + orderCode + " " + clauseInfo + ". Tiền ký quỹ được hoàn trả cho người mua.",
                            order.getId(), report.getId());
                } else if (finalResolution == ResolutionType.RETURN_AND_REFUND) {
                    sendDisputeNotification(buyer,
                            "Khiếu nại được chấp thuận - Hướng dẫn gửi trả hàng",
                            "Ban Quản Trị đã chấp thuận khiếu nại đơn hàng #" + orderCode + " " + clauseInfo + ". Vui lòng đóng gói và gửi hàng hoàn theo hướng dẫn trên hệ thống.",
                            order.getId(), report.getId());
                    sendDisputeNotification(seller,
                            "Phán quyết khiếu nại: Yêu cầu trả hàng hoàn tiền",
                            "Ban Quản Trị đã chấp thuận khiếu nại của người mua cho đơn hàng #" + orderCode + " " + clauseInfo + ". Quy trình gửi trả hàng đã được khởi tạo.",
                            order.getId(), report.getId());
                }
            });
        }
        requestRepository.save(r);
        reportRepository.save(report);
    }

    @Override
    @Transactional
    public CreateRequestResponse createReport(UUID accountId, CreateReportRequest request) {

        Account rawAcc = accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy tài khoản người dùng."));

        Account acc = accountDisciplineService.checkAndReconcileSuspension(rawAcc, LocalDateTime.now());

        if (acc.getDisciplineLevel() == DisciplineLevel.SUSPENDED
                || acc.getStatus() == AccountStatus.SUSPENDED
                || acc.getDisciplineLevel() == DisciplineLevel.BANNED
                || acc.getStatus() == AccountStatus.BANNED) {
            throw new CustomException("Bạn không thể gửi báo cáo khiếu nại do tài khoản đang bị tạm ngưng hoặc đã bị khóa vĩnh viễn.");
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

        if (targetType == TargetType.ORDER) {
            orderRepository.findById(request.getTargetId()).ifPresent(order -> {
                String orderCode = order.getOrderNumber() != null ? order.getOrderNumber() : order.getId().toString();
                UUID buyerAccountId = acc.getId();
                UUID shopId = order.getShop() != null ? order.getShop().getId() : null;
                if (shopId != null) {
                    try {
                        chatService.getOrCreateDisputeThread(order.getId(), r.getId(), buyerAccountId, shopId, orderCode);
                    } catch (Exception ex) {
                        log.error("Lỗi khi tự động khởi tạo phòng chat tranh chấp cho reportId={}: {}", re.getId(), ex.getMessage(), ex);
                    }
                }

                User buyer = getOrderBuyerUser(order, re);
                User seller = getOrderSellerUser(order);
                sendDisputeNotification(seller,
                        "Khiếu nại đơn hàng mới - Cần phản hồi trong 48h",
                        "Người mua đã gửi khiếu nại cho đơn hàng #" + orderCode + ". Vui lòng phản hồi thương lượng trực tiếp trong vòng 48 giờ để tránh bị tự động chuyển lên Ban Quản Trị sàn.",
                        order.getId(), re.getId());
                sendDisputeNotification(buyer,
                        "Đã gửi khiếu nại đơn hàng thành công",
                        "Bạn đã gửi khiếu nại cho đơn hàng #" + orderCode + ". Gian hàng có thời hạn tối đa 48 giờ để phản hồi thương lượng trực tiếp cùng bạn.",
                        order.getId(), re.getId());
            });
        }

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
            restoreEscrowToHeldIfNoActiveDispute(report.getTargetId(), now);
        }

        reportRepository.save(report);
        requestRepository.save(req);

        if (report.getTargetType() == TargetType.ORDER) {
            chatService.closeDisputeThread(req.getId(), "Người mua tự nguyện rút khiếu nại");
        }

        if (report.getTargetType() == TargetType.ORDER && report.getTargetId() != null) {
            orderRepository.findById(report.getTargetId()).ifPresent(order -> {
                String orderCode = order.getOrderNumber() != null ? order.getOrderNumber() : order.getId().toString();
                User seller = getOrderSellerUser(order);
                sendDisputeNotification(seller,
                        "Người mua đã rút khiếu nại đơn hàng",
                        "Người mua đã chủ động rút khiếu nại cho đơn hàng #" + orderCode + ". Giao dịch tiếp tục được xử lý bình thường.",
                        order.getId(), report.getId());
            });
        }

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

        if (report.getStage() != ReportStage.DIRECT_NEGOTIATION && report.getStage() != ReportStage.ESCALATED_TO_ADMIN) {
            throw new CustomException("Khiếu nại không ở giai đoạn có thể phản hồi hoặc gửi giải trình");
        }

        if (report.getRequest() != null && report.getRequest().getStatus() != RequestStatus.PENDING) {
            throw new CustomException("Khiếu nại đã được Quản trị viên xử lý hoặc đã kết thúc, không thể gửi phản hồi");
        }

        if (report.getStage() == ReportStage.ESCALATED_TO_ADMIN
                && (report.getSellerResponse() != null || report.getSellerEvidenceUrl() != null)) {
            throw new CustomException("Hồ sơ giải trình đối soát đã được gửi và khóa bất biến, không thể chỉnh sửa");
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
                report.getRequest().setResponse("Người bán đồng ý hoàn tiền: "
                        + (req.getResponseNote() != null ? req.getResponseNote() : ""));
                report.getRequest().setReviewedAt(now);

                escrowService.refundMerchandiseOnly(orderId, "Shop chấp nhận hoàn tiền (khách giữ hàng)");
                order.setStatus(OrderStatus.REFUNDED);
                orderRepository.save(order);

                if (report.getRequest() != null) {
                    chatService.closeDisputeThread(report.getRequest().getId(), "Shop chấp thuận hoàn tiền");
                }

                String orderCode = order.getOrderNumber() != null ? order.getOrderNumber() : orderId.toString();
                User buyer = getOrderBuyerUser(order, report);
                sendDisputeNotification(buyer,
                        "Người bán đồng ý hoàn tiền khiếu nại",
                        "Người bán đã chấp nhận hoàn tiền cho đơn hàng #" + orderCode + ". Số tiền ký quỹ đã được hoàn trả lại cho bạn.",
                        orderId, reportId);

                log.info("Seller accepted refund for dispute reportId={}, orderId={}", reportId, orderId);
            }

            case ACCEPT_RETURN -> {
                report.setStage(ReportStage.RETURN_IN_PROGRESS);
                report.setResolutionType(ResolutionType.RETURN_AND_REFUND);
                report.getRequest()
                        .setResponse("Người bán đồng ý nhận hàng đổi trả. Đã khởi tạo quy trình gửi hàng hoàn.");
                report.getRequest().setReviewedAt(now);

                orderReturnService.createReturn(orderId, report.getId());

                if (report.getRequest() != null) {
                    chatService.closeDisputeThread(
                            report.getRequest().getId(),
                            "Người bán đồng ý nhận hàng đổi trả. Quy trình đổi trả tiếp tục qua hệ thống vận chuyển chính thức, phòng chat 1:1 đã khóa.");
                }

                orderRepository.findById(orderId).ifPresent(order -> {
                    String orderCode = order.getOrderNumber() != null ? order.getOrderNumber() : orderId.toString();
                    User buyer = getOrderBuyerUser(order, report);
                    sendDisputeNotification(buyer,
                            "Người bán đồng ý nhận hàng đổi trả",
                            "Người bán đã chấp nhận yêu cầu trả hàng cho đơn hàng #" + orderCode + ". Vui lòng theo dõi và gửi hàng hoàn theo hướng dẫn trên hệ thống.",
                            orderId, reportId);
                });

                log.info("Seller accepted return for dispute reportId={}, created OrderReturn", reportId);
            }

            case REJECT_AND_ESCALATE -> {
                report.setStage(ReportStage.ESCALATED_TO_ADMIN);
                if (report.getEscalatedAt() == null) {
                    report.setEscalatedAt(now);
                    report.setEscalatedByAccountId(sellerAccountId);
                }
                if (report.getEscalationReason() == null || report.getEscalationReason().isBlank()) {
                    report.setEscalationReason(
                            "Người bán từ chối khiếu nại: " + (req.getResponseNote() != null ? req.getResponseNote() : ""));
                }

                if (report.getRequest() != null) {
                    chatService.closeDisputeThread(
                            report.getRequest().getId(),
                            "Người bán từ chối phương án giải quyết và chuyển hồ sơ lên Ban Quản Trị sàn phân xử. Khung chat 1:1 đã khóa để bảo lưu hồ sơ đối soát.");
                }

                orderRepository.findById(orderId).ifPresent(order -> {
                    String orderCode = order.getOrderNumber() != null ? order.getOrderNumber() : orderId.toString();
                    User buyer = getOrderBuyerUser(order, report);
                    sendDisputeNotification(buyer,
                            "Khiếu nại được chuyển lên Ban Quản Trị sàn",
                            "Người bán từ chối phương án thương lượng cho đơn hàng #" + orderCode + " và đã gửi giải trình. Vụ việc được chuyển lên Ban Quản Trị sàn phân xử.",
                            orderId, reportId);
                });

                log.info("Seller rejected dispute or provided explanation for reportId={}, escalated to admin", reportId);
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

        if (report.getRequest() != null) {
            chatService.closeDisputeThread(
                    report.getRequest().getId(),
                    "Khiếu nại đã chuyển lên Ban Quản Trị sàn can thiệp phân xử. Khung chat 1:1 đã khóa để bảo lưu hồ sơ đối soát.");
        }

        orderRepository.findById(orderId).ifPresent(order -> {
            String orderCode = order.getOrderNumber() != null ? order.getOrderNumber() : orderId.toString();
            User buyer = getOrderBuyerUser(order, report);
            User seller = getOrderSellerUser(order);
            sendDisputeNotification(buyer,
                    "Khiếu nại đã chuyển lên Ban Quản Trị sàn",
                    "Khiếu nại đơn hàng #" + orderCode + " đã được chuyển lên Ban Quản Trị sàn phân xử. Quản trị viên sẽ xem xét hồ sơ và ra phán quyết.",
                    order.getId(), report.getId());
            sendDisputeNotification(seller,
                    "Khiếu nại đã chuyển lên Ban Quản Trị sàn",
                    "Khiếu nại đơn hàng #" + orderCode + " đã được chuyển lên Ban Quản Trị sàn phân xử. Vui lòng kiểm tra hồ sơ và chuẩn bị bằng chứng đối soát.",
                    order.getId(), report.getId());
        });

        log.info("Dispute reportId={} escalated to Admin by accountId={}", reportId, accountId);
    }

    private void handleReportOrder(UUID orderId, LocalDateTime now) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new CustomException("Không tìm thấy đơn hàng: " + orderId));

        if (order.getShop() != null) {
            Shop shop = shopRepository.findByIdForUpdate(order.getShop().getId())
                    .orElse(order.getShop());
            punishShop(shop, now);
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
            throw new CustomException("Không thể xác định tài khoản người dùng được báo cáo");
        punishAccount(accountId, now);
    }

    private void handleReportProduct(UUID targetId, LocalDateTime now) {
        Product product = productRepository.findByIdForUpdate(targetId)
                .orElseThrow(() -> new CustomException("Không tìm thấy sản phẩm: " + targetId));

        if (product.getStatus() == ProductStatus.DELETED) {
            throw new CustomException("Sản phẩm đã bị xóa trước đó");
        }

        int decayedProductReports = calculateMonthlyDecay(product.getLastReportedAt(), product.getReportCount(), now);
        product.setReportCount(decayedProductReports);
        if (decayedProductReports < 3) {
            product.setFlagged(false);
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

        productRepository.save(product);

        if (product.getShop() != null) {
            Shop shop = shopRepository.findByIdForUpdate(product.getShop().getId())
                    .orElse(product.getShop());
            punishShop(shop, now);
        }
    }

    private void handleReportReview(UUID reviewId, LocalDateTime now) {

        Review review = reviewRepository.findByIdForUpdate(reviewId)
                .orElseThrow(() -> new CustomException("Không tìm thấy đánh giá: " + reviewId));

        if (review.getStatus() == ReviewStatus.HIDDEN) {
            throw new CustomException("Đánh giá đã bị ẩn trước đó");
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
            throw new CustomException("Không thể xác định tài khoản sở hữu đánh giá");

        punishAccount(accountId, now);
    }

    private DisciplineLevel punishAccount(UUID targetAccountId, LocalDateTime now) {

        Account target = accountRepository.findByIdForUpdate(targetAccountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy tài khoản đối tượng"));

        if (target.getDisciplineLevel() == DisciplineLevel.BANNED || target.getStatus() == AccountStatus.BANNED) {
            throw new CustomException("Tài khoản đã bị khóa vĩnh viễn trước đó");
        }

        // Thuật toán Hoàn lương (30-Day Monthly Decay):
        // Cứ mỗi 30 ngày liên tục không có vi phạm mới, số lần vi phạm được trừ đi 1 lần cho đến khi về 0.
        int decayedAccountViolations = calculateMonthlyDecay(target.getLastViolationAt(), target.getViolationCount(), now);
        target.setViolationCount(decayedAccountViolations);

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
            target.setSuspendedUntil(now.plusDays(14));
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

    private void punishShop(Shop shop, LocalDateTime now) {
        if (shop.getStatus() == ShopStatus.BANNED) {
            throw new CustomException("Gian hàng đã bị cấm trước đó");
        }

        // Thuật toán Hoàn Lương 30 Ngày (Monthly Decay) cho Shop
        int currentViolations = shop.getViolationCount() != null ? shop.getViolationCount() : 0;
        int decayedShopViolations = calculateMonthlyDecay(shop.getLastViolationAt(), currentViolations, now);
        shop.setViolationCount(decayedShopViolations);

        int nextCount = (shop.getViolationCount() != null ? shop.getViolationCount() : 0) + 1;
        shop.setViolationCount(nextCount);
        shop.setLastViolationAt(now);

        ShopStatus finalStatus;
        if (nextCount >= 7) {
            finalStatus = ShopStatus.BANNED;
            shop.setStatus(ShopStatus.BANNED);
            shop.setSuspendedUntil(null);
            productRepository.updateStatusByShopId(shop.getId(), ProductStatus.DELETED);
        } else if (nextCount >= 5) {
            finalStatus = ShopStatus.SUSPENDED;
            shop.setStatus(ShopStatus.SUSPENDED);
            shop.setSuspendedUntil(now.plusDays(14));
            productRepository.updateStatusByShopId(shop.getId(), ProductStatus.INACTIVE);
        } else if (nextCount >= 3) {
            finalStatus = ShopStatus.WARNED;
            if (shop.getStatus() == ShopStatus.ACTIVE) {
                shop.setStatus(ShopStatus.WARNED);
            }
        } else {
            finalStatus = shop.getStatus() != null ? shop.getStatus() : ShopStatus.ACTIVE;
        }

        shopRepository.save(shop);
        log.info("Penalized shop: shopId={}, newViolationCount={}, finalStatus={}, suspendedUntil={}",
                shop.getId(), nextCount, finalStatus, shop.getSuspendedUntil());
    }

    private void handleReportShop(UUID shopId, LocalDateTime now) {
        Shop shop = shopRepository.findByIdForUpdate(shopId)
                .orElseThrow(() -> new CustomException("Shop not found: " + shopId));
        punishShop(shop, now);
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
                .policyClauseCode(report.getPolicyClauseCode())
                .policyClauseTitle(report.getPolicyClauseTitle())
                .escrow(escrowDto)
                .orderReturn(orderReturnDto)
                .build();
    }

    private void sendDisputeNotification(User recipient, String title, String content, UUID orderId, UUID reportId) {
        if (recipient == null) return;
        try {
            Notification notif = Notification.builder()
                    .eventId("DISPUTE_" + UUID.randomUUID())
                    .user(recipient)
                    .type(NotificationType.ORDER)
                    .channel(NotificationChannelType.IN_APP)
                    .status(NotificationStatus.SENT)
                    .title(title)
                    .content(content)
                    .payload(Map.of(
                            "orderId", orderId != null ? orderId.toString() : "",
                            "reportId", reportId != null ? reportId.toString() : ""))
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notif);
            log.info("Dispatched dispute in-app notification to userId={}: {}", recipient.getId(), title);
        } catch (Exception e) {
            log.error("Failed to dispatch dispute notification to userId={}", recipient.getId(), e);
        }
    }

    private User getOrderBuyerUser(Order order, Report report) {
        if (order != null && order.getUser() != null) {
            return order.getUser();
        }
        if (report != null && report.getRequest() != null && report.getRequest().getAccount() != null) {
            return userRepository.findByAccountId(report.getRequest().getAccount().getId()).orElse(null);
        }
        return null;
    }

    private User getOrderSellerUser(Order order) {
        if (order != null && order.getShop() != null && order.getShop().getUser() != null) {
            return order.getShop().getUser();
        }
        return null;
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

    @Override
    public List<DisputePolicyClauseResponse> getDisputePolicyClauses() {
        return Arrays.stream(DisputePolicyClause.values())
                .map(DisputePolicyClauseResponse::from)
                .toList();
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 */10 * * * *")
    public void processExpiredDirectNegotiations() {
        LocalDateTime now = LocalDateTime.now();
        List<Report> expired = reportRepository.findExpiredDirectNegotiations(now);
        for (Report r : expired) {
            try {
                Optional<Report> lockedOpt = reportRepository.findByIdForUpdate(r.getId());
                if (lockedOpt.isPresent()) {
                    Report report = lockedOpt.get();
                    if (report.getStage() == ReportStage.DIRECT_NEGOTIATION
                            && report.getSellerResponseDeadline() != null
                            && !report.getSellerResponseDeadline().isAfter(now)) {
                        report.setStage(ReportStage.ESCALATED_TO_ADMIN);
                        report.setEscalatedAt(now);
                        report.setEscalatedByAccountId(null);
                        report.setEscalationReason(
                                "Hệ thống tự động chuyển Ban Quản Trị sàn phân xử do Người bán quá hạn 48 giờ không phản hồi thương lượng.");
                        reportRepository.save(report);
                        log.info("Auto escalated expired dispute reportId={} to Admin queue", report.getId());

                        if (report.getRequest() != null) {
                            chatService.closeDisputeThread(
                                    report.getRequest().getId(),
                                    "Hết thời hạn 48 giờ thương lượng trực tiếp, hệ thống tự động chuyển hồ sơ lên Ban Quản Trị sàn phân xử. Khung chat 1:1 đã khóa để bảo lưu hồ sơ đối soát.");
                        }

                        if (report.getTargetType() == TargetType.ORDER && report.getTargetId() != null) {
                            orderRepository.findById(report.getTargetId()).ifPresent(order -> {
                                String orderCode = order.getOrderNumber() != null ? order.getOrderNumber() : order.getId().toString();
                                User buyer = getOrderBuyerUser(order, report);
                                User seller = getOrderSellerUser(order);
                                sendDisputeNotification(buyer,
                                        "Khiếu nại tự động chuyển BQT sàn (Quá hạn 48h)",
                                        "Do Người bán không phản hồi khiếu nại đơn hàng #" + orderCode + " trong vòng 48 giờ, hệ thống đã tự động chuyển hồ sơ lên Ban Quản Trị sàn phân xử.",
                                        order.getId(), report.getId());
                                sendDisputeNotification(seller,
                                        "Cảnh báo: Khiếu nại quá hạn 48h đã chuyển BQT sàn",
                                        "Đơn hàng #" + orderCode + " đã quá hạn 48 giờ thương lượng trực tiếp mà bạn chưa phản hồi. Hồ sơ đã chuyển lên Ban Quản Trị sàn phân xử.",
                                        order.getId(), report.getId());
                            });
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to auto-escalate expired dispute reportId={}", r.getId(), e);
            }
        }
    }

    private int calculateMonthlyDecay(LocalDateTime lastViolationAt, int currentViolations, LocalDateTime now) {
        if (lastViolationAt == null || currentViolations <= 0) {
            return currentViolations;
        }
        long daysPassed = ChronoUnit.DAYS.between(lastViolationAt, now);
        long decayCycles = daysPassed / 30;
        return decayCycles > 0 ? Math.max(0, currentViolations - (int) decayCycles) : currentViolations;
    }

    private void restoreEscrowToHeldIfNoActiveDispute(UUID orderId, LocalDateTime now) {
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

    private void releaseDeliveredOrderToShop(Order order, LocalDateTime now) {
        order.setReceivedByBuyer(true);
        order.setReceivedAt(now);
        order.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);
        escrowService.releaseByOrder(order.getId());
        order.setStatus(OrderStatus.COMPLETED);
        orderRepository.save(order);
    }

    private void restoreShopIfEligible(Shop shop) {
        int violationCount = shop.getViolationCount() != null ? shop.getViolationCount() : 0;
        LocalDateTime now = LocalDateTime.now();
        if (violationCount >= 7) {
            shop.setStatus(ShopStatus.BANNED);
            shop.setSuspendedUntil(null);
            productRepository.updateStatusByShopId(shop.getId(), ProductStatus.DELETED);
        } else if (violationCount >= 5) {
            shop.setStatus(ShopStatus.SUSPENDED);
            if (shop.getSuspendedUntil() == null || shop.getSuspendedUntil().isBefore(now)) {
                shop.setSuspendedUntil(now.plusDays(14));
            }
            productRepository.updateStatusByShopId(shop.getId(), ProductStatus.INACTIVE);
        } else if (violationCount >= 3) {
            shop.setStatus(ShopStatus.WARNED);
            shop.setSuspendedUntil(null);
            productRepository.updateStatusByShopId(shop.getId(), ProductStatus.PUBLISHED);
        } else {
            shop.setStatus(ShopStatus.ACTIVE);
            shop.setSuspendedUntil(null);
            productRepository.updateStatusByShopId(shop.getId(), ProductStatus.PUBLISHED);
        }
    }
}
