package com.marketplace.ecommerce.order.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.Role;
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
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.repository.ReportRepository;
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
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
        Account sellerAccount = Account.builder().id(sellerAccountId).build();
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
                .orderNumber("ORD-2026-001")
                .user(buyer)
                .shop(shop)
                .status(OrderStatus.DELIVERED)
                .total(new BigDecimal("500000"))
                .build();

        report = Report.builder()
                .id(reportId)
                .targetId(orderId)
                .build();

        orderReturn = OrderReturn.builder()
                .id(returnId)
                .order(order)
                .report(report)
                .status(ReturnStatus.WAITING_FOR_SHIPMENT)
                .returnAddress(shop.getAddress())
                .returnRecipientName(seller.getFullName())
                .returnRecipientPhone(shop.getPhoneNumber())
                .carrierName("Giao Hàng Nhanh (GHN)")
                .returnTrackingCode("GHN-RET-ORD-2026-001")
                .buyerShipmentDeadline(LocalDateTime.now().plusDays(3))
                .isRestocked(false)
                .build();
    }

    @Test
    @DisplayName("createReturn: Tạo mới và các nhánh fallback địa chỉ/tên/SĐT")
    void testCreateReturn_AllBranches() {
        when(orderReturnRepository.findByOrderId(orderId)).thenReturn(Optional.of(orderReturn));
        assertNotNull(orderReturnService.createReturn(orderId, reportId));

        when(orderReturnRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(orderReturnRepository.save(any(OrderReturn.class))).thenAnswer(inv -> {
            OrderReturn saved = inv.getArgument(0);
            saved.setId(returnId);
            return saved;
        });

        OrderReturnResponse res = orderReturnService.createReturn(orderId, reportId);
        assertEquals(ReturnStatus.WAITING_FOR_SHIPMENT, res.getStatus());

        // Fallbacks when shop address/phone/user are blank/null and orderNumber is null
        shop.setAddress("  ");
        shop.setPhoneNumber("");
        seller.setFullName(null);
        seller.setPhoneNumber(null);
        order.setOrderNumber(null);
        OrderReturnResponse resFallback = orderReturnService.createReturn(orderId, reportId);
        assertTrue(resFallback.getReturnAddress().contains("Địa chỉ gian hàng"));
        assertEquals("N/A", resFallback.getReturnRecipientPhone());

        when(reportRepository.findById(reportId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> orderReturnService.createReturn(orderId, reportId));

        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> orderReturnService.createReturn(orderId, reportId));
    }

    @Test
    @DisplayName("submitTracking: Thành công và các nhánh lỗi/fallback")
    void testSubmitTracking_AllBranches() {
        when(orderReturnRepository.findByIdForUpdate(returnId)).thenReturn(Optional.of(orderReturn));
        when(userRepository.findByAccountId(buyerAccountId)).thenReturn(Optional.of(buyer));
        when(orderReturnRepository.save(any(OrderReturn.class))).thenAnswer(inv -> inv.getArgument(0));

        SubmitReturnTrackingRequest req = new SubmitReturnTrackingRequest();
        req.setCarrierName("GHTK");
        req.setReturnTrackingCode("GHTK-999888");
        req.setShippingFee(new BigDecimal("30000"));
        req.setBuyerEvidenceUrls("http://img.com/pack.jpg");

        OrderReturnResponse res = orderReturnService.submitTracking(buyerAccountId, returnId, req);
        assertEquals(ReturnStatus.SHIPPED, res.getStatus());
        assertEquals("GHTK-999888", res.getReturnTrackingCode());

        // Fallback carrier & tracking when blank
        orderReturn.setStatus(ReturnStatus.WAITING_FOR_SHIPMENT);
        orderReturn.setCarrierName(null);
        orderReturn.setReturnTrackingCode(null);
        order.setOrderNumber(null);
        SubmitReturnTrackingRequest blankReq = new SubmitReturnTrackingRequest();
        OrderReturnResponse resBlank = orderReturnService.submitTracking(buyerAccountId, returnId, blankReq);
        assertEquals("Giao Hàng Nhanh (GHN)", resBlank.getCarrierName());

        // Expired deadline
        orderReturn.setStatus(ReturnStatus.WAITING_FOR_SHIPMENT);
        orderReturn.setBuyerShipmentDeadline(LocalDateTime.now().minusMinutes(5));
        assertThrows(CustomException.class, () -> orderReturnService.submitTracking(buyerAccountId, returnId, req));

        // Wrong status
        orderReturn.setStatus(ReturnStatus.SHIPPED);
        assertThrows(CustomException.class, () -> orderReturnService.submitTracking(buyerAccountId, returnId, req));

        // Wrong user
        when(userRepository.findByAccountId(sellerAccountId)).thenReturn(Optional.of(seller));
        assertThrows(CustomException.class, () -> orderReturnService.submitTracking(sellerAccountId, returnId, req));
    }

    @Test
    @DisplayName("confirmDelivered và confirmReturned: Đầy đủ quyền Buyer/Seller/Admin và lỗi")
    void testConfirmDelivered_AndConfirmReturned() {
        orderReturn.setStatus(ReturnStatus.SHIPPED);
        when(orderReturnRepository.findByIdForUpdate(returnId)).thenReturn(Optional.of(orderReturn));
        when(orderReturnRepository.save(any(OrderReturn.class))).thenAnswer(inv -> inv.getArgument(0));

        // Buyer confirmDelivered
        when(userRepository.findByAccountId(buyerAccountId)).thenReturn(Optional.of(buyer));
        assertEquals(ReturnStatus.RETURNED, orderReturnService.confirmDelivered(buyerAccountId, returnId).getStatus());

        // Seller confirmDelivered
        orderReturn.setStatus(ReturnStatus.SHIPPED);
        when(userRepository.findByAccountId(sellerAccountId)).thenReturn(Optional.of(seller));
        assertEquals(ReturnStatus.RETURNED, orderReturnService.confirmDelivered(sellerAccountId, returnId).getStatus());

        // Admin confirmDelivered
        orderReturn.setStatus(ReturnStatus.SHIPPED);
        UUID adminAccId = UUID.randomUUID();
        User adminUser = User.builder().id(UUID.randomUUID())
                .account(Account.builder().role(Role.builder().roleName("ADMIN").build()).build()).build();
        when(userRepository.findByAccountId(adminAccId)).thenReturn(Optional.of(adminUser));
        assertEquals(ReturnStatus.RETURNED, orderReturnService.confirmDelivered(adminAccId, returnId).getStatus());

        // Stranger confirmDelivered throws
        UUID strangerAccId = UUID.randomUUID();
        User stranger = User.builder().id(UUID.randomUUID()).build();
        when(userRepository.findByAccountId(strangerAccId)).thenReturn(Optional.of(stranger));
        assertThrows(CustomException.class, () -> orderReturnService.confirmDelivered(strangerAccId, returnId));

        // Wrong status in confirmDelivered
        orderReturn.setStatus(ReturnStatus.RETURNED);
        assertThrows(CustomException.class, () -> orderReturnService.confirmDelivered(buyerAccountId, returnId));

        // confirmReturned by buyer
        orderReturn.setStatus(ReturnStatus.SHIPPED);
        assertEquals(ReturnStatus.RETURNED, orderReturnService.confirmReturned(buyerAccountId, returnId).getStatus());

        // confirmReturned wrong status & wrong user
        assertThrows(CustomException.class, () -> orderReturnService.confirmReturned(buyerAccountId, returnId));
        assertThrows(CustomException.class, () -> orderReturnService.confirmReturned(sellerAccountId, returnId));
    }

    @Test
    @DisplayName("completeReturn: Nghiệm thu, hoàn kho Product + Variant, hoàn tiền Escrow")
    void testCompleteReturn_AllBranches() {
        orderReturn.setStatus(ReturnStatus.RETURNED);
        UUID productId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();
        Product product = Product.builder().id(productId).quantity(10).build();
        ProductVariant variant = ProductVariant.builder().id(variantId).stock(5).build();
        OrderItem item = OrderItem.builder().product(product).variantId(variantId).quantity(2).build();
        order.setItems(java.util.Set.of(item));

        when(orderReturnRepository.findByIdForUpdate(returnId)).thenReturn(Optional.of(orderReturn));
        when(userRepository.findByAccountId(sellerAccountId)).thenReturn(Optional.of(seller));
        when(productRepository.findByIdForUpdate(productId)).thenReturn(Optional.of(product));
        when(productVariantRepository.findByIdForUpdate(variantId)).thenReturn(Optional.of(variant));
        when(orderReturnRepository.save(any(OrderReturn.class))).thenAnswer(inv -> inv.getArgument(0));

        SellerCompleteReturnRequest req = new SellerCompleteReturnRequest();
        req.setConditionStatus(ReturnConditionStatus.INTACT);
        req.setConditionNote("Hàng nguyên vẹn");
        req.setIsRestocked(true);

        OrderReturnResponse res = orderReturnService.completeReturn(sellerAccountId, returnId, req);
        assertEquals(ReturnStatus.COMPLETED, res.getStatus());
        assertEquals(12, product.getQuantity());
        assertEquals(7, variant.getStock());
        verify(escrowService).refundByOrder(eq(orderId), anyString());

        // Wrong status & wrong seller
        assertThrows(CustomException.class, () -> orderReturnService.completeReturn(sellerAccountId, returnId, req));
        when(userRepository.findByAccountId(buyerAccountId)).thenReturn(Optional.of(buyer));
        assertThrows(CustomException.class, () -> orderReturnService.completeReturn(buyerAccountId, returnId, req));
    }

    @Test
    @DisplayName("disputeReturn và resolveDispute: APPROVE_RETURN và REJECT_RETURN")
    void testDisputeReturn_AndResolveDispute() {
        orderReturn.setStatus(ReturnStatus.RETURNED);
        Escrow escrow = Escrow.builder().id(UUID.randomUUID()).status(EscrowStatus.HELD).build();

        when(orderReturnRepository.findByIdForUpdate(returnId)).thenReturn(Optional.of(orderReturn));
        when(userRepository.findByAccountId(sellerAccountId)).thenReturn(Optional.of(seller));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        when(orderReturnRepository.save(any(OrderReturn.class))).thenAnswer(inv -> inv.getArgument(0));

        SellerDisputeReturnRequest disputeReq = new SellerDisputeReturnRequest();
        disputeReq.setConditionStatus(ReturnConditionStatus.DAMAGED);
        disputeReq.setConditionNote("Vỡ màn hình");
        disputeReq.setSellerEvidenceUrls("http://img.com/broken.jpg");

        OrderReturnResponse disputeRes = orderReturnService.disputeReturn(sellerAccountId, returnId, disputeReq);
        assertEquals(ReturnStatus.DISPUTED, disputeRes.getStatus());
        assertEquals(EscrowStatus.DISPUTED, escrow.getStatus());

        // Wrong status for disputeReturn
        assertThrows(CustomException.class, () -> orderReturnService.disputeReturn(sellerAccountId, returnId, disputeReq));

        // resolveDispute APPROVE_RETURN
        AdminResolveReturnDisputeRequest approveReq = new AdminResolveReturnDisputeRequest();
        approveReq.setDecision(AdminResolveReturnDisputeRequest.AdminReturnDecision.APPROVE_RETURN);
        approveReq.setAdminNote("Đồng ý hoàn tiền");

        OrderReturnResponse resolveApprove = orderReturnService.resolveDispute(UUID.randomUUID(), returnId, approveReq);
        assertEquals(ReturnStatus.COMPLETED, resolveApprove.getStatus());
        verify(escrowService).refundByOrder(eq(orderId), anyString());

        // resolveDispute REJECT_RETURN
        orderReturn.setStatus(ReturnStatus.DISPUTED);
        escrow.setStatus(EscrowStatus.DISPUTED);
        AdminResolveReturnDisputeRequest rejectReq = new AdminResolveReturnDisputeRequest();
        rejectReq.setDecision(AdminResolveReturnDisputeRequest.AdminReturnDecision.REJECT_RETURN);
        rejectReq.setAdminNote("Người mua làm hỏng");

        OrderReturnResponse resolveReject = orderReturnService.resolveDispute(UUID.randomUUID(), returnId, rejectReq);
        assertEquals(ReturnStatus.CANCELLED, resolveReject.getStatus());
        assertEquals(EscrowStatus.HELD, escrow.getStatus());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
        verify(escrowService).releaseByOrder(orderId);

        // Wrong status for resolveDispute
        assertThrows(CustomException.class, () -> orderReturnService.resolveDispute(UUID.randomUUID(), returnId, rejectReq));
    }

    @Test
    @DisplayName("getReturnByOrderId, getReturnInfoBatch, getReturnDetails, closeReturnOnEscrowSettled, và Cron Jobs")
    void testQueryMethods_CloseReturn_AndScheduledJobs() {
        when(orderReturnRepository.findByOrderId(orderId)).thenReturn(Optional.of(orderReturn));
        assertNotNull(orderReturnService.getReturnByOrderId(orderId));

        assertTrue(orderReturnService.getReturnInfoBatch(null).isEmpty());
        assertTrue(orderReturnService.getReturnInfoBatch(Collections.emptyList()).isEmpty());
        when(orderReturnRepository.findByOrderIdIn(List.of(orderId))).thenReturn(List.of(orderReturn));
        Map<UUID, OrderReturnResponse> batch = orderReturnService.getReturnInfoBatch(List.of(orderId));
        assertEquals(1, batch.size());

        when(orderReturnRepository.findById(returnId)).thenReturn(Optional.of(orderReturn));
        assertNotNull(orderReturnService.getReturnDetails(returnId));
        when(orderReturnRepository.findById(returnId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> orderReturnService.getReturnDetails(returnId));

        // closeReturnOnEscrowSettled
        orderReturnService.closeReturnOnEscrowSettled(null, ReturnStatus.COMPLETED, "note");
        orderReturn.setStatus(ReturnStatus.RETURNED);
        orderReturn.setConditionNote("Old");
        when(orderReturnRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(orderReturn));
        orderReturnService.closeReturnOnEscrowSettled(orderId, ReturnStatus.COMPLETED, "Settled");
        assertEquals(ReturnStatus.COMPLETED, orderReturn.getStatus());

        // processExpiredBuyerShipments
        orderReturn.setStatus(ReturnStatus.WAITING_FOR_SHIPMENT);
        Escrow escrow = Escrow.builder().id(UUID.randomUUID()).status(EscrowStatus.DISPUTED).build();
        when(orderReturnRepository.findExpiredBuyerShipments(eq(ReturnStatus.WAITING_FOR_SHIPMENT), any()))
                .thenReturn(List.of(orderReturn));
        when(orderReturnRepository.findByIdForUpdate(returnId)).thenReturn(Optional.of(orderReturn));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));

        orderReturnService.processExpiredBuyerShipments();
        assertEquals(ReturnStatus.CANCELLED, orderReturn.getStatus());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());

        // processExpiredSellerInspections
        orderReturn.setStatus(ReturnStatus.RETURNED);
        when(orderReturnRepository.findExpiredSellerInspections(eq(ReturnStatus.RETURNED), any()))
                .thenReturn(List.of(orderReturn));
        orderReturnService.processExpiredSellerInspections();
        assertEquals(ReturnStatus.COMPLETED, orderReturn.getStatus());

        // Exception handling in cron jobs
        doThrow(new RuntimeException("DB err")).when(orderReturnRepository).findByIdForUpdate(returnId);
        assertDoesNotThrow(() -> orderReturnService.processExpiredBuyerShipments());
        assertDoesNotThrow(() -> orderReturnService.processExpiredSellerInspections());
    }
}
