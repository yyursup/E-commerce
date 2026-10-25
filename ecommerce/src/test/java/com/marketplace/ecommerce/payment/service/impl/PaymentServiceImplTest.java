package com.marketplace.ecommerce.payment.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.service.OrderService;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.entity.Payment;
import com.marketplace.ecommerce.payment.repository.PaymentRepository;
import com.marketplace.ecommerce.payment.service.VNPayService;
import com.marketplace.ecommerce.payment.valueObjects.PaymentMethod;
import com.marketplace.ecommerce.payment.valueObjects.PaymentStatus;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.repository.ProductVariantRepository;
import com.marketplace.ecommerce.wallet.service.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private VNPayService vnPayService;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductVariantRepository productVariantRepository;
    @Mock
    private WalletService walletService;
    @Mock
    private OrderService orderService;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private UUID accountId;
    private User sampleUser;
    private Order sampleOrder;
    private Payment samplePayment;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        sampleUser = new User();
        sampleUser.setId(UUID.randomUUID());

        sampleOrder = new Order();
        sampleOrder.setId(UUID.randomUUID());
        sampleOrder.setOrderNumber("ORD-PAY-01");
        sampleOrder.setUser(sampleUser);
        sampleOrder.setStatus(OrderStatus.PENDING_PAYMENT);
        sampleOrder.setTotal(BigDecimal.valueOf(500000));

        samplePayment = Payment.builder()
                .id(UUID.randomUUID())
                .order(sampleOrder)
                .amount(BigDecimal.valueOf(500000))
                .method(PaymentMethod.VNPAY)
                .status(PaymentStatus.PENDING)
                .txnRef("PAY-2026-ORD-01")
                .build();
    }

    @Test
    @DisplayName("createPayment tạo giao dịch VNPay và trả về URL thanh toán")
    void testCreatePayment_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.of(sampleOrder));
        when(paymentRepository.findByOrderId(sampleOrder.getId())).thenReturn(Optional.of(samplePayment));
        when(vnPayService.buildPaymentUrl(samplePayment)).thenReturn("https://vnpay.vn/payment-url");

        String url = paymentService.createPayment(sampleOrder.getId(), accountId);
        assertNotNull(url);
        assertEquals("https://vnpay.vn/payment-url", url);
        verify(paymentRepository).save(samplePayment);
    }

    @Test
    @DisplayName("createPayment ném lỗi khi đơn không ở trạng thái PENDING_PAYMENT")
    void testCreatePayment_InvalidStatus() {
        sampleOrder.setStatus(OrderStatus.CONFIRMED);
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.of(sampleOrder));

        CustomException ex = assertThrows(CustomException.class, () -> paymentService.createPayment(sampleOrder.getId(), accountId));
        assertTrue(ex.getMessage().contains("Order is not payable"));
    }

    @Test
    @DisplayName("processCallback xử lý thanh toán VNPay thành công (responseCode = 00)")
    void testProcessCallback_Success() {
        when(vnPayService.verifyChecksumFromMap(any())).thenReturn(true);
        when(paymentRepository.findByTxnRef("PAY-2026-ORD-01")).thenReturn(Optional.of(samplePayment));
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.of(sampleOrder));

        Map<String, String> params = Map.of(
                "vnp_TxnRef", "PAY-2026-ORD-01",
                "vnp_ResponseCode", "00",
                "vnp_TransactionNo", "TRANS_999"
        );

        paymentService.processCallback(params, null);

        assertEquals(PaymentStatus.SUCCESS, samplePayment.getStatus());
        assertEquals("TRANS_999", samplePayment.getProviderTxnNo());
        assertEquals(OrderStatus.CONFIRMED, sampleOrder.getStatus());
        verify(walletService).recordPaymentAndHoldEscrow(samplePayment);
        verify(orderService).tryCreateGHNOrder(sampleOrder);
        verify(paymentRepository).save(samplePayment);
        verify(orderRepository, atLeastOnce()).save(sampleOrder);
    }

    @Test
    @DisplayName("processCallback xử lý thất bại (responseCode != 00) và hoàn tồn kho")
    void testProcessCallback_Failed() {
        when(vnPayService.verifyChecksumFromMap(any())).thenReturn(true);
        when(paymentRepository.findByTxnRef("PAY-2026-ORD-01")).thenReturn(Optional.of(samplePayment));

        sampleOrder.setStockDeducted(true);
        Product prod = new Product();
        prod.setQuantity(5);
        OrderItem item = new OrderItem();
        item.setProduct(prod);
        item.setQuantity(2);
        sampleOrder.setItems(new java.util.HashSet<>(List.of(item)));

        Map<String, String> params = Map.of(
                "vnp_TxnRef", "PAY-2026-ORD-01",
                "vnp_ResponseCode", "24", // Hủy giao dịch
                "vnp_TransactionNo", "TRANS_FAIL"
        );

        paymentService.processCallback(params, null);

        assertEquals(PaymentStatus.FAILED, samplePayment.getStatus());
        assertEquals(OrderStatus.CANCELLED, sampleOrder.getStatus());
        assertEquals(7, prod.getQuantity()); // 5 + 2 = 7
        verify(productRepository).save(prod);
    }

    @Test
    @DisplayName("processCallback ném lỗi khi checksum không hợp lệ")
    void testProcessCallback_InvalidChecksum() {
        when(vnPayService.verifyChecksumFromMap(any())).thenReturn(false);

        CustomException ex = assertThrows(CustomException.class, () -> paymentService.processCallback(Map.of(), null));
        assertTrue(ex.getMessage().contains("Invalid VNPay checksum"));
    }

    @Test
    @DisplayName("processCallback với rawQueryString, hoàn kho variant và trạng thái đã SUCCESS")
    void testProcessCallback_RawQueryStringAndVariant() {
        when(vnPayService.verifyChecksumFromQueryString(anyString())).thenReturn(true);
        when(vnPayService.verifyChecksumFromMap(any())).thenReturn(true);
        samplePayment.setStatus(PaymentStatus.SUCCESS);
        when(paymentRepository.findByTxnRef("PAY-RAW-01")).thenReturn(Optional.of(samplePayment));

        paymentService.processCallback(Map.of(), "vnp_TxnRef=PAY-RAW-01&vnp_ResponseCode=00&vnp_TransactionNo=123");
        // payment đã SUCCESS thì return luôn
        verify(walletService, never()).recordPaymentAndHoldEscrow(samplePayment);

        // 2. TxnRef không tìm thấy
        when(paymentRepository.findByTxnRef("PAY-NOT-FOUND")).thenReturn(Optional.empty());
        CustomException exNotFound = assertThrows(CustomException.class,
                () -> paymentService.processCallback(Map.of("vnp_TxnRef", "PAY-NOT-FOUND"), null));
        assertTrue(exNotFound.getMessage().contains("Payment not found"));

        // 3. Thanh toán thất bại và có variant
        samplePayment.setStatus(PaymentStatus.PENDING);
        when(paymentRepository.findByTxnRef("PAY-VAR-01")).thenReturn(Optional.of(samplePayment));

        UUID varId = UUID.randomUUID();
        com.marketplace.ecommerce.product.entity.ProductVariant variant = com.marketplace.ecommerce.product.entity.ProductVariant.builder()
                .id(varId)
                .stock(10)
                .build();
        when(productVariantRepository.findById(varId)).thenReturn(Optional.of(variant));

        sampleOrder.setStockDeducted(true);
        OrderItem itemWithVar = new OrderItem();
        itemWithVar.setProduct(null);
        itemWithVar.setVariantId(varId);
        itemWithVar.setQuantity(3);
        sampleOrder.setItems(new java.util.HashSet<>(List.of(itemWithVar)));

        when(vnPayService.verifyChecksumFromMap(any())).thenReturn(true);
        paymentService.processCallback(Map.of("vnp_TxnRef", "PAY-VAR-01", "vnp_ResponseCode", "99"), null);

        assertEquals(13, variant.getStock()); // 10 + 3 = 13
        verify(productVariantRepository).save(variant);
    }

    @Test
    @DisplayName("createPayment các nhánh ngoại lệ: user/order không tìm thấy, không có quyền, đã SUCCESS, và tạo Payment mới khi chưa có")
    void testCreatePayment_AllBranches() {
        // 1. User không tồn tại
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> paymentService.createPayment(sampleOrder.getId(), accountId));

        // 2. Order không tồn tại
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> paymentService.createPayment(sampleOrder.getId(), accountId));

        // 3. User không phải chủ đơn hàng
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.of(sampleOrder));
        User stranger = new User();
        stranger.setId(UUID.randomUUID());
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(stranger));
        CustomException exPerm = assertThrows(CustomException.class,
                () -> paymentService.createPayment(sampleOrder.getId(), accountId));
        assertTrue(exPerm.getMessage().contains("permission to pay"));

        // 4. Payment đã SUCCESS
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        samplePayment.setStatus(PaymentStatus.SUCCESS);
        when(paymentRepository.findByOrderId(sampleOrder.getId())).thenReturn(Optional.of(samplePayment));
        CustomException exSuccess = assertThrows(CustomException.class,
                () -> paymentService.createPayment(sampleOrder.getId(), accountId));
        assertTrue(exSuccess.getMessage().contains("already SUCCESS"));

        // 5. Payment chưa tồn tại (orElseGet builder)
        when(paymentRepository.findByOrderId(sampleOrder.getId())).thenReturn(Optional.empty());
        when(vnPayService.buildPaymentUrl(any())).thenReturn("https://vnpay.vn/pay-new");

        String url = paymentService.createPayment(sampleOrder.getId(), accountId);
        assertNotNull(url);
        assertEquals("https://vnpay.vn/pay-new", url);
        verify(paymentRepository, atLeastOnce()).save(any(Payment.class));
    }

    @Test
    @DisplayName("handlePaymentSuccess trừ kho thành công, bỏ qua khi đã trừ, và ném lỗi khi thiếu kho")
    void testHandlePaymentSuccess() {
        // 1. Đã trừ kho -> return luôn
        sampleOrder.setStockDeducted(true);
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.of(sampleOrder));
        paymentService.handlePaymentSuccess(sampleOrder.getId());
        verify(productRepository, never()).saveAll(any());

        // 2. Thiếu tồn kho -> ném CustomException("Not enough stock")
        sampleOrder.setStockDeducted(false);
        Product prod = new Product();
        prod.setQuantity(2);
        OrderItem item = new OrderItem();
        item.setProduct(prod);
        item.setQuantity(5); // Cần 5 nhưng chỉ còn 2
        sampleOrder.setItems(new java.util.HashSet<>(List.of(item)));

        assertThrows(CustomException.class, () -> paymentService.handlePaymentSuccess(sampleOrder.getId()));

        // 3. Đủ kho -> trừ thành công
        prod.setQuantity(10);
        paymentService.handlePaymentSuccess(sampleOrder.getId());
        assertEquals(5, prod.getQuantity()); // 10 - 5 = 5
        assertTrue(sampleOrder.isStockDeducted());
        verify(productRepository).saveAll(any());
        verify(orderRepository).save(sampleOrder);
    }

}
