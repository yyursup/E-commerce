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
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.order.valueObjects.ReturnConditionStatus;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductVariant;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.repository.ProductVariantRepository;
import com.marketplace.ecommerce.product.service.InventoryHistoryService;
import com.marketplace.ecommerce.product.valueObjects.InventoryActionType;
import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.valueObjects.ResolutionType;
import com.marketplace.ecommerce.shop.entity.Shop;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderReturnServiceTest {

    @Mock
    private OrderReturnRepository orderReturnRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ReportRepository reportRepository;
    @Mock
    private RequestRepository requestRepository;
    @Mock
    private EscrowRepository escrowRepository;
    @Mock
    private EscrowService escrowService;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductVariantRepository productVariantRepository;
    @Mock
    private InventoryHistoryService inventoryHistoryService;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderReturnServiceImpl orderReturnService;

    private UUID buyerAccountId;
    private UUID buyerUserId;
    private UUID sellerAccountId;
    private UUID sellerUserId;
    private UUID orderId;
    private UUID reportId;
    private UUID returnId;

    private User buyer;
    private User seller;
    private Shop shop;
    private Order order;
    private Report report;
    private OrderReturn orderReturn;

    @BeforeEach
    void setUp() {
        buyerAccountId = UUID.randomUUID();
        buyerUserId = UUID.randomUUID();
        sellerAccountId = UUID.randomUUID();
        sellerUserId = UUID.randomUUID();
        orderId = UUID.randomUUID();
        reportId = UUID.randomUUID();
        returnId = UUID.randomUUID();

        buyer = User.builder().id(buyerUserId).fullName("Nguyễn Văn Buyer").phoneNumber("0901234567").build();
        Account sellerAccount = com.marketplace.ecommerce.auth.entity.Account.builder().id(sellerAccountId).build();
        seller = User.builder().id(sellerUserId).account(sellerAccount).fullName("Trần Thị Seller")
                .phoneNumber("0987654321").build();

        shop = Shop.builder()
                .id(UUID.randomUUID())
                .name("Shop Công Nghệ")
                .address("123 Đường Công Nghệ, Q1, HCM")
                .phoneNumber("0987654321")
                .user(seller)
                .build();

        order = Order.builder()
                .id(orderId)
                .orderNumber("ORD-RETURN-001")
                .user(buyer)
                .shop(shop)
                .status(OrderStatus.DELIVERED)
                .build();

        report = Report.builder()
                .id(reportId)
                .resolutionType(ResolutionType.RETURN_AND_REFUND)
                .build();

        orderReturn = OrderReturn.builder()
                .id(returnId)
                .order(order)
                .report(report)
                .status(ReturnStatus.WAITING_FOR_SHIPMENT)
                .returnAddress(shop.getAddress())
                .returnRecipientName(seller.getFullName())
                .returnRecipientPhone(shop.getPhoneNumber())
                .buyerShipmentDeadline(LocalDateTime.now().plusDays(3))
                .isRestocked(false)
                .build();
    }

    @Test
    @DisplayName("CASE 2: Customer thắng -> Tạo OrderReturn ở trạng thái WAITING_FOR_SHIPMENT, chưa refund")
    void createReturn_Success() {
        when(orderReturnRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(orderReturnRepository.save(any(OrderReturn.class))).thenAnswer(i -> {
            OrderReturn r = i.getArgument(0);
            r.setId(returnId);
            return r;
        });

        OrderReturnResponse res = orderReturnService.createReturn(orderId, reportId);

        assertNotNull(res);
        assertEquals(ReturnStatus.WAITING_FOR_SHIPMENT, res.getStatus());
        assertEquals(shop.getAddress(), res.getReturnAddress());
        verify(escrowService, never()).refundByOrder(any(), any());
    }

    @Test
    @DisplayName("CASE 3: Customer nộp tracking hợp lệ -> Chuyển sang SHIPPED")
    void submitTracking_Success() {
        SubmitReturnTrackingRequest req = SubmitReturnTrackingRequest.builder()
                .carrierName("GHTK")
                .returnTrackingCode("TRACK-123456")
                .shippingFee(BigDecimal.valueOf(30000))
                .buyerEvidenceUrls("http://minio/bill.jpg")
                .build();

        when(orderReturnRepository.findByIdForUpdate(returnId)).thenReturn(Optional.of(orderReturn));
        when(userRepository.findByAccountId(buyerAccountId)).thenReturn(Optional.of(buyer));
        when(orderReturnRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        OrderReturnResponse res = orderReturnService.submitTracking(buyerAccountId, returnId, req);

        assertEquals(ReturnStatus.SHIPPED, res.getStatus());
        assertEquals("TRACK-123456", res.getReturnTrackingCode());
        assertNotNull(res.getBuyerShippedAt());
    }

    @Test
    @DisplayName("CASE 14: Customer nộp tracking khi state không hợp lệ -> Bị từ chối")
    void submitTracking_InvalidState_ThrowsException() {
        orderReturn.setStatus(ReturnStatus.SHIPPED);

        SubmitReturnTrackingRequest req = SubmitReturnTrackingRequest.builder()
                .carrierName("GHTK")
                .returnTrackingCode("TRACK-123456")
                .build();

        when(orderReturnRepository.findByIdForUpdate(returnId)).thenReturn(Optional.of(orderReturn));
        when(userRepository.findByAccountId(buyerAccountId)).thenReturn(Optional.of(buyer));

        CustomException ex = assertThrows(CustomException.class,
                () -> orderReturnService.submitTracking(buyerAccountId, returnId, req));

        assertTrue(ex.getMessage().contains("không hợp lệ để nộp vận đơn"));
    }

    @Test
    @DisplayName("CASE 4: Confirm chuyển từ SHIPPED thẳng sang RETURNED (Đã giao hàng hoàn) kích hoạt 72h inspection")
    void confirmDelivered_FromShipped_DirectlyTransitionsToReturnedAndSets72hDeadline() {
        orderReturn.setStatus(ReturnStatus.SHIPPED);
        when(orderReturnRepository.findByIdForUpdate(returnId)).thenReturn(Optional.of(orderReturn));
        when(userRepository.findByAccountId(buyerAccountId)).thenReturn(Optional.of(buyer));
        when(orderReturnRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // Confirm Delivered chuyển thẳng sang RETURNED (Đã giao hàng hoàn)
        OrderReturnResponse delRes = orderReturnService.confirmDelivered(buyerAccountId, returnId);
        assertEquals(ReturnStatus.RETURNED, delRes.getStatus());
        assertNotNull(orderReturn.getSellerReceivedAt());
        assertNotNull(orderReturn.getSellerInspectionDeadline());
        assertTrue(orderReturn.getSellerInspectionDeadline().isAfter(LocalDateTime.now().plusHours(70)));
    }

    @Test
    @DisplayName("CASE 5 & 6: Seller complete (restock = true) -> COMPLETED, hoàn tiền Buyer, kho tăng")
    void completeReturn_WithRestock_RestoresStockAndRefunds() {
        orderReturn.setStatus(ReturnStatus.RETURNED);

        Product product = Product.builder().id(UUID.randomUUID()).quantity(10).build();
        ProductVariant variant = ProductVariant.builder().id(UUID.randomUUID()).stock(5).build();

        OrderItem item = OrderItem.builder()
                .product(product)
                .variantId(variant.getId())
                .quantity(2)
                .build();
        order.setItems(java.util.Set.of(item));

        SellerCompleteReturnRequest req = SellerCompleteReturnRequest.builder()
                .conditionStatus(ReturnConditionStatus.INTACT)
                .conditionNote("Hàng nguyên vẹn")
                .isRestocked(true)
                .build();

        when(orderReturnRepository.findByIdForUpdate(returnId)).thenReturn(Optional.of(orderReturn));
        when(userRepository.findByAccountId(sellerAccountId)).thenReturn(Optional.of(seller));
        when(productRepository.findByIdForUpdate(product.getId())).thenReturn(Optional.of(product));
        when(productVariantRepository.findByIdForUpdate(variant.getId())).thenReturn(Optional.of(variant));

        OrderReturnResponse res = orderReturnService.completeReturn(sellerAccountId, returnId, req);

        assertEquals(ReturnStatus.COMPLETED, res.getStatus());
        assertTrue(res.getIsRestocked());
        assertEquals(12, product.getQuantity());
        assertEquals(7, variant.getStock());
        verify(productRepository).save(product);
        verify(productVariantRepository).save(variant);
        verify(inventoryHistoryService, times(2)).logInventoryChange(any(), any(), any(), anyInt(), anyInt(),
                eq(InventoryActionType.REFUND_RESTORE), any(), any());
        verify(escrowService).refundByOrder(eq(orderId), any());
    }

    @Test
    @DisplayName("CASE 7: Seller complete (restock = false) -> COMPLETED, hoàn tiền Buyer, kho KHÔNG tăng")
    void completeReturn_NoRestock_RefundsWithoutRestock() {
        orderReturn.setStatus(ReturnStatus.RETURNED);

        Product product = Product.builder().id(UUID.randomUUID()).quantity(10).build();
        OrderItem item = OrderItem.builder().product(product).quantity(2).build();
        order.setItems(java.util.Set.of(item));

        SellerCompleteReturnRequest req = SellerCompleteReturnRequest.builder()
                .conditionStatus(ReturnConditionStatus.INTACT)
                .isRestocked(false)
                .build();

        when(orderReturnRepository.findByIdForUpdate(returnId)).thenReturn(Optional.of(orderReturn));
        when(userRepository.findByAccountId(sellerAccountId)).thenReturn(Optional.of(seller));

        OrderReturnResponse res = orderReturnService.completeReturn(sellerAccountId, returnId, req);

        assertEquals(ReturnStatus.COMPLETED, res.getStatus());
        assertFalse(res.getIsRestocked());
        assertEquals(10, product.getQuantity());
        verify(productRepository, never()).save(any());
        verify(inventoryHistoryService, never()).logInventoryChange(any(), any(), any(), anyInt(), anyInt(), any(),
                any(), any());
        verify(escrowService).refundByOrder(eq(orderId), any());
    }

    @Test
    @DisplayName("CASE 8: Seller dispute -> Return = DISPUTED, KHÔNG refund, chờ Admin")
    void disputeReturn_Disputed_NoRefund() {
        orderReturn.setStatus(ReturnStatus.RETURNED);

        SellerDisputeReturnRequest req = SellerDisputeReturnRequest.builder()
                .conditionStatus(ReturnConditionStatus.DAMAGED)
                .conditionNote("Hàng vỡ màn hình")
                .sellerEvidenceUrls("http://minio/damaged.jpg")
                .build();

        when(orderReturnRepository.findByIdForUpdate(returnId)).thenReturn(Optional.of(orderReturn));
        when(userRepository.findByAccountId(sellerAccountId)).thenReturn(Optional.of(seller));
        when(orderReturnRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.empty());

        OrderReturnResponse res = orderReturnService.disputeReturn(sellerAccountId, returnId, req);

        assertEquals(ReturnStatus.DISPUTED, res.getStatus());
        assertEquals(ReturnConditionStatus.DAMAGED, res.getConditionStatus());
        verify(requestRepository, never()).save(any());
        verify(reportRepository, never()).save(any());
        verify(escrowService, never()).refundByOrder(any(), any());
    }

    @Test
    @DisplayName("CASE 9: Seller không xử lý sau 72h (Cron) -> Auto complete, refund Buyer, KHÔNG restock")
    void processExpiredSellerInspections_AutoCompletesWithoutRestock() {
        orderReturn.setStatus(ReturnStatus.RETURNED);
        orderReturn.setSellerInspectionDeadline(LocalDateTime.now().minusHours(1));

        when(orderReturnRepository.findExpiredSellerInspections(eq(ReturnStatus.RETURNED), any()))
                .thenReturn(List.of(orderReturn));
        when(orderReturnRepository.findByIdForUpdate(returnId)).thenReturn(Optional.of(orderReturn));

        orderReturnService.processExpiredSellerInspections();

        assertEquals(ReturnStatus.COMPLETED, orderReturn.getStatus());
        assertFalse(orderReturn.getIsRestocked());
        verify(escrowService).refundByOrder(eq(orderId), any());
        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("CASE 10: Customer quá 3 ngày không nộp tracking (Cron) -> CANCELLED, giải ngân cho Shop")
    void processExpiredBuyerShipments_AutoCancelsAndReleasesEscrow() {
        orderReturn.setStatus(ReturnStatus.WAITING_FOR_SHIPMENT);
        orderReturn.setBuyerShipmentDeadline(LocalDateTime.now().minusHours(1));

        Escrow escrow = Escrow.builder().id(UUID.randomUUID()).status(EscrowStatus.DISPUTED).build();

        when(orderReturnRepository.findExpiredBuyerShipments(eq(ReturnStatus.WAITING_FOR_SHIPMENT), any()))
                .thenReturn(List.of(orderReturn));
        when(orderReturnRepository.findByIdForUpdate(returnId)).thenReturn(Optional.of(orderReturn));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));

        orderReturnService.processExpiredBuyerShipments();

        assertEquals(ReturnStatus.CANCELLED, orderReturn.getStatus());
        assertEquals(EscrowStatus.HELD, escrow.getStatus());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
        verify(escrowService).releaseByOrder(orderId);
        verify(escrowService, never()).refundByOrder(any(), any());
    }

    @Test
    @DisplayName("Admin resolve dispute: APPROVE_RETURN -> Hoàn tiền Buyer")
    void resolveDispute_Approve_RefundsBuyer() {
        orderReturn.setStatus(ReturnStatus.DISPUTED);
        when(orderReturnRepository.findByIdForUpdate(returnId)).thenReturn(Optional.of(orderReturn));

        AdminResolveReturnDisputeRequest req = AdminResolveReturnDisputeRequest.builder()
                .decision(AdminResolveReturnDisputeRequest.AdminReturnDecision.APPROVE_RETURN)
                .adminNote("Chấp thuận khiếu nại của Buyer")
                .build();

        OrderReturnResponse res = orderReturnService.resolveDispute(UUID.randomUUID(), returnId, req);

        assertEquals(ReturnStatus.COMPLETED, res.getStatus());
        verify(escrowService).refundByOrder(eq(orderId), any());
    }

    @Test
    @DisplayName("Admin resolve dispute: REJECT_RETURN -> CANCELLED, giải ngân cho Shop")
    void resolveDispute_Reject_ReleasesToShop() {
        orderReturn.setStatus(ReturnStatus.DISPUTED);
        Escrow escrow = Escrow.builder().id(UUID.randomUUID()).status(EscrowStatus.DISPUTED).build();

        when(orderReturnRepository.findByIdForUpdate(returnId)).thenReturn(Optional.of(orderReturn));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));

        AdminResolveReturnDisputeRequest req = AdminResolveReturnDisputeRequest.builder()
                .decision(AdminResolveReturnDisputeRequest.AdminReturnDecision.REJECT_RETURN)
                .adminNote("Buyer tráo hàng, bác bỏ trả hàng")
                .build();

        OrderReturnResponse res = orderReturnService.resolveDispute(UUID.randomUUID(), returnId, req);

        assertEquals(ReturnStatus.CANCELLED, res.getStatus());
        assertEquals(EscrowStatus.HELD, escrow.getStatus());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
        verify(escrowService).releaseByOrder(orderId);
        verify(escrowService, never()).refundByOrder(any(), any());
    }
}
