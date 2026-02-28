package com.marketplace.ecommerce.payment.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.entity.Payment;
import com.marketplace.ecommerce.payment.repository.PaymentRepository;
import com.marketplace.ecommerce.payment.service.VNPayService;
import com.marketplace.ecommerce.payment.valueObjects.PaymentStatus;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.wallet.service.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
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
    private WalletService walletService;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private UUID orderId;
    private UUID accountId;
    private User user;
    private Order order;
    private Payment payment;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        accountId = UUID.randomUUID();
        user = new User();
        user.setId(UUID.randomUUID());
        
        order = new Order();
        order.setId(orderId);
        order.setUser(user);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setTotal(BigDecimal.valueOf(100));
        order.setOrderNumber("ORD123");
        order.setItems(new HashSet<>());

        payment = new Payment();
        payment.setId(UUID.randomUUID());
        payment.setOrder(order);
        payment.setStatus(PaymentStatus.PENDING);
    }

    @Test
    void createPayment_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(vnPayService.buildPaymentUrl(any())).thenReturn("http://vnpay.url");

        String url = paymentService.createPayment(orderId, accountId);

        assertEquals("http://vnpay.url", url);
        verify(paymentRepository).save(any());
    }

    @Test
    void createPayment_AlreadyPaid_ThrowsException() {
        payment.setStatus(PaymentStatus.SUCCESS);
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.of(payment));

        assertThrows(CustomException.class, () -> paymentService.createPayment(orderId, accountId));
    }

    @Test
    void processCallback_Success() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", "PAY123");
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TransactionNo", "VNP123");

        when(vnPayService.verifyChecksum(params)).thenReturn(true);
        when(paymentRepository.findByTxnRef("PAY123")).thenReturn(Optional.of(payment));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        paymentService.processCallback(params);

        assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
        assertEquals(OrderStatus.CONFIRMED, order.getStatus());
        verify(walletService).recordPaymentAndHoldEscrow(payment);
    }

    @Test
    void processCallback_Failed() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", "PAY123");
        params.put("vnp_ResponseCode", "01");

        when(vnPayService.verifyChecksum(params)).thenReturn(true);
        when(paymentRepository.findByTxnRef("PAY123")).thenReturn(Optional.of(payment));

        paymentService.processCallback(params);

        assertEquals(PaymentStatus.FAILED, payment.getStatus());
        assertEquals(OrderStatus.CANCELLED, order.getStatus());
    }

    @Test
    void handlePaymentSuccess_DeductsStock() {
        Product product = new Product();
        product.setQuantity(10);
        OrderItem item = new OrderItem();
        item.setProduct(product);
        item.setQuantity(2);
        order.setItems(new HashSet<>(Collections.singletonList(item)));

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        paymentService.handlePaymentSuccess(orderId);

        assertEquals(8, product.getQuantity());
        assertTrue(order.isStockDeducted());
        verify(productRepository).saveAll(any());
        verify(orderRepository).save(order);
    }
}
