package com.marketplace.ecommerce.order.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.dto.request.AdminResolveReturnDisputeRequest;
import com.marketplace.ecommerce.order.dto.request.SellerCompleteReturnRequest;
import com.marketplace.ecommerce.order.dto.request.SellerDisputeReturnRequest;
import com.marketplace.ecommerce.order.dto.request.SubmitReturnTrackingRequest;
import com.marketplace.ecommerce.order.dto.response.OrderReturnResponse;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.order.entity.OrderReturn;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.repository.OrderReturnRepository;
import com.marketplace.ecommerce.order.service.OrderReturnService;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.order.valueObjects.ReturnConditionStatus;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductVariant;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.repository.ProductVariantRepository;
import com.marketplace.ecommerce.product.service.InventoryHistoryService;
import com.marketplace.ecommerce.product.valueObjects.InventoryActionType;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderReturnServiceImpl implements OrderReturnService {

    private final OrderReturnRepository orderReturnRepository;
    private final OrderRepository orderRepository;
    private final ReportRepository reportRepository;
    private final EscrowRepository escrowRepository;
    private final EscrowService escrowService;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryHistoryService inventoryHistoryService;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public OrderReturnResponse createReturn(UUID orderId, UUID reportId) {
        Optional<OrderReturn> existing = orderReturnRepository.findByOrderId(orderId);
        if (existing.isPresent()) {
            log.info("OrderReturn already exists for orderId: {}", orderId);
            return OrderReturnResponse.from(existing.get());
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Order not found: " + orderId));

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new CustomException("Report not found: " + reportId));

        Shop shop = order.getShop();
        String returnAddress = (shop.getAddress() != null && !shop.getAddress().isBlank())
                ? shop.getAddress()
                : "Địa chỉ gian hàng: " + shop.getName();

        String recipientName = (shop.getUser() != null && shop.getUser().getFullName() != null)
                ? shop.getUser().getFullName()
                : shop.getName();

        String recipientPhone = (shop.getPhoneNumber() != null && !shop.getPhoneNumber().isBlank())
                ? shop.getPhoneNumber()
                : (shop.getUser() != null && shop.getUser().getPhoneNumber() != null ? shop.getUser().getPhoneNumber()
                        : "N/A");

        String defaultTracking = "GHN-RET-" + (order.getOrderNumber() != null ? order.getOrderNumber()
                : order.getId().toString().substring(0, 8).toUpperCase());

        OrderReturn orderReturn = OrderReturn.builder()
                .order(order)
                .report(report)
                .status(ReturnStatus.WAITING_FOR_SHIPMENT)
                .returnAddress(returnAddress)
                .returnRecipientName(recipientName)
                .returnRecipientPhone(recipientPhone)
                .carrierName("Giao Hàng Nhanh (GHN)")
                .returnTrackingCode(defaultTracking)
                .buyerShipmentDeadline(LocalDateTime.now().plusDays(3))
                .isRestocked(false)
                .build();

        OrderReturn saved = orderReturnRepository.save(orderReturn);
        log.info("Created OrderReturn id={} for orderId={} with default GHN tracking={}", saved.getId(), orderId,
                defaultTracking);
        return OrderReturnResponse.from(saved);
    }

    @Override
    @Transactional
    public OrderReturnResponse submitTracking(UUID accountId, UUID returnId, SubmitReturnTrackingRequest request) {
        OrderReturn returnObj = orderReturnRepository.findByIdForUpdate(returnId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin hoàn hàng: " + returnId));

        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found for account: " + accountId));

        if (!returnObj.getOrder().getUser().getId().equals(user.getId())) {
            throw new CustomException("Bạn không có quyền thực hiện thao tác trên yêu cầu trả hàng này");
        }

        if (returnObj.getStatus() != ReturnStatus.WAITING_FOR_SHIPMENT) {
            throw new CustomException("Trạng thái hoàn hàng không hợp lệ để nộp vận đơn: " + returnObj.getStatus());
        }

        if (LocalDateTime.now().isAfter(returnObj.getBuyerShipmentDeadline())) {
            throw new CustomException("Đã quá thời hạn 3 ngày gửi hàng hoàn. Yêu cầu trả hàng không còn hiệu lực.");
        }

        String carrier = (request.getCarrierName() != null && !request.getCarrierName().isBlank())
                ? request.getCarrierName()
                : (returnObj.getCarrierName() != null ? returnObj.getCarrierName() : "Giao Hàng Nhanh (GHN)");

        String defaultTracking = "GHN-RET-"
                + (returnObj.getOrder() != null && returnObj.getOrder().getOrderNumber() != null
                        ? returnObj.getOrder().getOrderNumber()
                        : returnObj.getId().toString().substring(0, 8).toUpperCase());

        String tracking = (request.getReturnTrackingCode() != null && !request.getReturnTrackingCode().isBlank())
                ? request.getReturnTrackingCode()
                : (returnObj.getReturnTrackingCode() != null ? returnObj.getReturnTrackingCode() : defaultTracking);

        returnObj.setCarrierName(carrier);
        returnObj.setReturnTrackingCode(tracking);
        returnObj.setShippingFee(request.getShippingFee());
        returnObj.setBuyerEvidenceUrls(request.getBuyerEvidenceUrls());
        returnObj.setBuyerShippedAt(LocalDateTime.now());
        returnObj.setStatus(ReturnStatus.SHIPPED);

        OrderReturn saved = orderReturnRepository.save(returnObj);
        log.info("Buyer submitted return tracking for returnId={}, trackingCode={}", returnId,
                request.getReturnTrackingCode());
        return OrderReturnResponse.from(saved);
    }

    @Override
    @Transactional
    public OrderReturnResponse confirmDelivered(UUID accountId, UUID returnId) {
        OrderReturn returnObj = orderReturnRepository.findByIdForUpdate(returnId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin hoàn hàng: " + returnId));

        if (returnObj.getStatus() != ReturnStatus.SHIPPED) {
            throw new CustomException(
                    "Chỉ có thể xác nhận đã giao khi hàng ở trạng thái SHIPPED: " + returnObj.getStatus());
        }

        returnObj.setStatus(ReturnStatus.RETURNED);
        returnObj.setSellerReceivedAt(LocalDateTime.now());
        returnObj.setSellerInspectionDeadline(LocalDateTime.now().plusHours(72));

        OrderReturn saved = orderReturnRepository.save(returnObj);
        log.info("Return marked as RETURNED (Đã hoàn hàng) for returnId={}", returnId);
        return OrderReturnResponse.from(saved);
    }

    @Override
    @Transactional
    public OrderReturnResponse confirmReturned(UUID accountId, UUID returnId) {
        OrderReturn returnObj = orderReturnRepository.findByIdForUpdate(returnId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin hoàn hàng: " + returnId));

        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found for account: " + accountId));

        if (!returnObj.getOrder().getUser().getId().equals(user.getId())) {
            throw new CustomException("Bạn không có quyền thực hiện thao tác trên yêu cầu trả hàng này");
        }

        if (returnObj.getStatus() != ReturnStatus.SHIPPED) {
            throw new CustomException(
                    "Chỉ có thể xác nhận khi hàng ở trạng thái SHIPPED: " + returnObj.getStatus());
        }

        returnObj.setStatus(ReturnStatus.RETURNED);
        returnObj.setSellerReceivedAt(LocalDateTime.now());
        returnObj.setSellerInspectionDeadline(LocalDateTime.now().plusHours(72));

        OrderReturn saved = orderReturnRepository.save(returnObj);
        log.info("Buyer confirmed RETURNED for returnId={}, seller inspection deadline set to {}",
                returnId, returnObj.getSellerInspectionDeadline());
        return OrderReturnResponse.from(saved);
    }

    @Override
    @Transactional
    public OrderReturnResponse completeReturn(UUID accountId, UUID returnId, SellerCompleteReturnRequest request) {
        OrderReturn returnObj = orderReturnRepository.findByIdForUpdate(returnId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin hoàn hàng: " + returnId));

        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found for account: " + accountId));

        Shop shop = returnObj.getOrder().getShop();
        if (shop == null || shop.getUser() == null || !shop.getUser().getId().equals(user.getId())) {
            throw new CustomException("Bạn không phải người bán sở hữu đơn hàng này");
        }

        if (returnObj.getStatus() != ReturnStatus.RETURNED) {
            throw new CustomException("Trạng thái hoàn hàng không hợp lệ để nghiệm thu: " + returnObj.getStatus());
        }

        returnObj.setStatus(ReturnStatus.COMPLETED);
        returnObj.setConditionStatus(
                request.getConditionStatus() != null ? request.getConditionStatus() : ReturnConditionStatus.INTACT);
        returnObj.setConditionNote(request.getConditionNote());
        boolean isRestock = Boolean.TRUE.equals(request.getIsRestocked());
        returnObj.setIsRestocked(isRestock);

        orderReturnRepository.save(returnObj);

        Order order = returnObj.getOrder();
        if (isRestock) {
            restoreOrderStock(order);
        }

        escrowService.refundByOrder(order.getId(),
                "Hoàn tiền cho người mua sau khi người bán nghiệm thu hoàn hàng thành công");
        log.info("Completed return id={}, refunded orderId={}, isRestocked={}", returnId, order.getId(), isRestock);

        return OrderReturnResponse.from(returnObj);
    }

    @Override
    @Transactional
    public OrderReturnResponse disputeReturn(UUID accountId, UUID returnId, SellerDisputeReturnRequest request) {
        OrderReturn returnObj = orderReturnRepository.findByIdForUpdate(returnId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin hoàn hàng: " + returnId));

        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found for account: " + accountId));

        Shop shop = returnObj.getOrder().getShop();
        if (shop == null || shop.getUser() == null || !shop.getUser().getId().equals(user.getId())) {
            throw new CustomException("Bạn không phải người bán sở hữu đơn hàng này");
        }

        if (returnObj.getStatus() != ReturnStatus.RETURNED) {
            throw new CustomException("Không thể khiếu nại kiện hoàn ở trạng thái: " + returnObj.getStatus());
        }

        returnObj.setStatus(ReturnStatus.DISPUTED);
        returnObj.setConditionStatus(request.getConditionStatus());
        returnObj.setConditionNote(request.getConditionNote());
        returnObj.setSellerEvidenceUrls(request.getSellerEvidenceUrls());

        OrderReturn saved = orderReturnRepository.save(returnObj);

        Order order = returnObj.getOrder();

        escrowRepository.findByOrderIdForUpdate(order.getId()).ifPresent(escrow -> {
            escrow.setStatus(EscrowStatus.DISPUTED);
            escrow.setUpdatedAt(LocalDateTime.now());
            escrowRepository.save(escrow);
        });

        // Không tạo Request/Report sang bên Báo Cáo Vi Phạm để tránh xử phạt gậy vi phạm cho Shop/Khách.
        // Thông tin tranh chấp kiện hoàn được lưu trực tiếp trên OrderReturn và quản lý tại phần Ký Quỹ & Tranh Chấp.
        log.warn("Seller disputed returnId={}, condition={}, note={}",
                returnId, request.getConditionStatus(), request.getConditionNote());
        return OrderReturnResponse.from(saved);
    }

    @Override
    @Transactional
    public OrderReturnResponse resolveDispute(UUID adminAccountId, UUID returnId,
            AdminResolveReturnDisputeRequest request) {
        OrderReturn returnObj = orderReturnRepository.findByIdForUpdate(returnId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin hoàn hàng: " + returnId));

        if (returnObj.getStatus() != ReturnStatus.DISPUTED) {
            throw new CustomException("Chỉ có thể phân xử kiện hàng ở trạng thái DISPUTED: " + returnObj.getStatus());
        }

        Order order = returnObj.getOrder();

        if (request.getDecision() == AdminResolveReturnDisputeRequest.AdminReturnDecision.APPROVE_RETURN) {
            returnObj.setStatus(ReturnStatus.COMPLETED);
            returnObj
                    .setConditionNote((returnObj.getConditionNote() != null ? returnObj.getConditionNote() + " | " : "")
                            + "Admin chấp thuận: " + request.getAdminNote());
            orderReturnRepository.save(returnObj);

            escrowService.refundByOrder(order.getId(),
                    "Admin chấp thuận hoàn tiền cho người mua sau khi phân xử khiếu nại hoàn hàng: "
                            + (request.getAdminNote() != null ? request.getAdminNote() : ""));
            log.info("Admin approved return dispute for returnId={}, refunded orderId={}", returnId, order.getId());
        } else {
            returnObj.setStatus(ReturnStatus.CANCELLED);
            returnObj
                    .setConditionNote((returnObj.getConditionNote() != null ? returnObj.getConditionNote() + " | " : "")
                            + "Admin bác bỏ hoàn hàng: " + request.getAdminNote());
            orderReturnRepository.save(returnObj);

            // Phục hồi Escrow về HELD rồi release tiền cho Seller
            escrowRepository.findByOrderIdForUpdate(order.getId()).ifPresent(escrow -> {
                if (escrow.getStatus() == EscrowStatus.DISPUTED) {
                    escrow.setStatus(EscrowStatus.HELD);
                    escrowRepository.save(escrow);
                }
            });

            order.setReceivedByBuyer(true);
            order.setReceivedAt(LocalDateTime.now());
            escrowService.releaseByOrder(order.getId());
            order.setStatus(OrderStatus.COMPLETED);
            orderRepository.save(order);
            log.info("Admin rejected return dispute for returnId={}, released money to shop for orderId={}", returnId,
                    order.getId());
        }

        return OrderReturnResponse.from(returnObj);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderReturnResponse getReturnByOrderId(UUID orderId) {
        return orderReturnRepository.findByOrderId(orderId)
                .map(OrderReturnResponse::from)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderReturnResponse getReturnDetails(UUID returnId) {
        return orderReturnRepository.findById(returnId)
                .map(OrderReturnResponse::from)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin hoàn hàng: " + returnId));
    }

    @Override
    @Transactional
    public void closeReturnOnEscrowSettled(UUID orderId, ReturnStatus finalStatus, String note) {
        if (orderId == null || finalStatus == null) {
            return;
        }
        orderReturnRepository.findByOrderIdForUpdate(orderId).ifPresent(ret -> {
            if (ret.getStatus() != ReturnStatus.COMPLETED && ret.getStatus() != ReturnStatus.CANCELLED) {
                ret.setStatus(finalStatus);
                if (note != null && !note.isBlank()) {
                    ret.setConditionNote((ret.getConditionNote() != null ? ret.getConditionNote() + " | " : "") + note);
                }
                orderReturnRepository.save(ret);
                log.info("Closed returnId={} with status={} on escrow settlement for orderId={}", ret.getId(), finalStatus, orderId);
            }
        });
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 */10 * * * *") // Quét mỗi 10 phút một lần
    public void processExpiredBuyerShipments() {
        LocalDateTime now = LocalDateTime.now();
        List<OrderReturn> expired = orderReturnRepository.findExpiredBuyerShipments(ReturnStatus.WAITING_FOR_SHIPMENT,
                now);

        for (OrderReturn r : expired) {
            try {
                Optional<OrderReturn> lockedOpt = orderReturnRepository.findByIdForUpdate(r.getId());
                if (lockedOpt.isPresent() && lockedOpt.get().getStatus() == ReturnStatus.WAITING_FOR_SHIPMENT) {
                    OrderReturn ret = lockedOpt.get();
                    ret.setStatus(ReturnStatus.CANCELLED);
                    ret.setConditionNote(
                            "Hệ thống tự động hủy do Người mua không nộp mã vận đơn trong thời hạn 3 ngày");
                    orderReturnRepository.save(ret);

                    Order order = ret.getOrder();
                    escrowRepository.findByOrderIdForUpdate(order.getId()).ifPresent(escrow -> {
                        if (escrow.getStatus() == EscrowStatus.DISPUTED) {
                            escrow.setStatus(EscrowStatus.HELD);
                            escrowRepository.save(escrow);
                        }
                    });

                    order.setReceivedByBuyer(true);
                    order.setReceivedAt(now);
                    escrowService.releaseByOrder(order.getId());
                    order.setStatus(OrderStatus.COMPLETED);
                    orderRepository.save(order);

                    log.info("Auto cancelled expired returnId={} due to 3-day buyer deadline, released orderId={}",
                            ret.getId(), order.getId());
                }
            } catch (Exception e) {
                log.error("Failed to process expired buyer shipment for returnId={}", r.getId(), e);
            }
        }
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 */10 * * * *") // Quét mỗi 10 phút một lần
    public void processExpiredSellerInspections() {
        LocalDateTime now = LocalDateTime.now();
        List<OrderReturn> expired = orderReturnRepository.findExpiredSellerInspections(ReturnStatus.RETURNED, now);

        for (OrderReturn r : expired) {
            try {
                Optional<OrderReturn> lockedOpt = orderReturnRepository.findByIdForUpdate(r.getId());
                if (lockedOpt.isPresent() && lockedOpt.get().getStatus() == ReturnStatus.RETURNED) {
                    OrderReturn ret = lockedOpt.get();
                    ret.setStatus(ReturnStatus.COMPLETED);
                    ret.setIsRestocked(false); // Tuyệt đối không auto-restock khi seller không phản hồi
                    ret.setConditionNote("Hệ thống tự động nghiệm thu do Người bán không kiểm tra hàng trong 72 giờ");
                    orderReturnRepository.save(ret);

                    Order order = ret.getOrder();
                    escrowService.refundByOrder(order.getId(),
                            "Tự động hoàn tiền do Người bán quá hạn 72h kiểm tra hàng hoàn");

                    log.info("Auto completed expired inspection for returnId={}, refunded orderId={}", ret.getId(),
                            order.getId());
                }
            } catch (Exception e) {
                log.error("Failed to process expired seller inspection for returnId={}", r.getId(), e);
            }
        }
    }

    private void restoreOrderStock(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            return;
        }

        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                Product p = item.getProduct();
                if (p.getQuantity() != null) {
                    int oldQ = p.getQuantity();
                    p.setQuantity(oldQ + item.getQuantity());
                    productRepository.save(p);
                    inventoryHistoryService.logInventoryChange(
                            order.getShop(), p, null, oldQ, p.getQuantity(),
                            InventoryActionType.REFUND_RESTORE, order.getOrderNumber(),
                            "Nhập lại kho hàng hoàn: " + order.getOrderNumber());
                }
            }
            if (item.getVariantId() != null) {
                Optional<ProductVariant> optVariant = productVariantRepository.findById(item.getVariantId());
                if (optVariant.isPresent()) {
                    ProductVariant variant = optVariant.get();
                    int currentStock = variant.getStock() != null ? variant.getStock() : 0;
                    variant.setStock(currentStock + item.getQuantity());
                    productVariantRepository.save(variant);
                    inventoryHistoryService.logInventoryChange(
                            order.getShop(), item.getProduct(), variant, currentStock, variant.getStock(),
                            InventoryActionType.REFUND_RESTORE, order.getOrderNumber(),
                            "Nhập lại kho hàng hoàn biến thể: " + order.getOrderNumber());
                }
            }
        }
    }
}
