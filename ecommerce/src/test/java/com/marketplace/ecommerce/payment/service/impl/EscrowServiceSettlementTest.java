package com.marketplace.ecommerce.payment.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.dto.EscrowAdminResponse;
import com.marketplace.ecommerce.payment.dto.SettlementInfo;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.entity.Transaction;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.repository.TransactionRepository;
import com.marketplace.ecommerce.payment.valueObjects.*;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.wallet.entity.Wallet;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import com.marketplace.ecommerce.wallet.valueObjects.WalletType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.marketplace.ecommerce.payment.entity.Payment;
import com.marketplace.ecommerce.payment.repository.PaymentRepository;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EscrowServiceSettlementTest {

    @Mock
    private EscrowRepository escrowRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private WalletRepository walletRepository;

        @Mock
    private PaymentRepository paymentRepository;

@InjectMocks
    private EscrowServiceImpl escrowService;

    private UUID orderId;
    private Order order;
    private Escrow escrow;
    private Wallet escrowWallet;
    private Wallet buyerWallet;
    private Wallet sellerWallet;
    private User buyer;
    private User seller;
    private Shop shop;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();

        buyer = User.builder().id(UUID.randomUUID()).fullName("Nguyễn Văn Mua").build();
        seller = User.builder().id(UUID.randomUUID()).fullName("Trần Thị Bán").build();
        shop = Shop.builder().id(UUID.randomUUID()).name("Shop ABC").user(seller).build();

        escrowWallet = Wallet.builder()
                .id(UUID.randomUUID())
                .walletType(WalletType.ESCROW)
                .lockedBalance(BigDecimal.valueOf(1000000))
                .availableBalance(BigDecimal.ZERO)
                .build();

        buyerWallet = Wallet.builder()
                .id(UUID.randomUUID())
                .user(buyer)
                .walletType(WalletType.USER)
                .availableBalance(BigDecimal.ZERO)
                .lockedBalance(BigDecimal.ZERO)
                .build();

        sellerWallet = Wallet.builder()
                .id(UUID.randomUUID())
                .user(seller)
                .walletType(WalletType.USER)
                .availableBalance(BigDecimal.ZERO)
                .lockedBalance(BigDecimal.ZERO)
                .build();

        order = Order.builder()
                .id(orderId)
                .orderNumber("ORD-123456")
                .status(OrderStatus.DELIVERED)
                .paymentMethod(PaymentMethod.VNPAY)
                .platformCommission(BigDecimal.valueOf(50000))
                .user(buyer)
                .shop(shop)
                .build();

        escrow = Escrow.builder()
                .id(UUID.randomUUID())
                .order(order)
                .amount(BigDecimal.valueOf(1000000))
                .status(EscrowStatus.DISPUTED)
                .escrowWallet(escrowWallet)
                .buyerWallet(buyerWallet)
                .sellerWallet(sellerWallet)
                .build();
    }

    @Test
    @DisplayName("adminList: Trả về trang EscrowAdminResponse")
    void adminList_Success() {
        Page<Escrow> p = new PageImpl<>(List.of(escrow));
        when(escrowRepository.adminList(eq(EscrowStatus.DISPUTED), any(Pageable.class))).thenReturn(p);

        Page<EscrowAdminResponse> res = escrowService.adminList(EscrowStatus.DISPUTED, PageRequest.of(0, 10));
        assertNotNull(res);
        assertEquals(1, res.getContent().size());
    }

    @Test
    @DisplayName("SPLIT SETTLE: Lỗi nếu tổng phần trăm không bằng 100%")
    void splitSettleByOrder_InvalidPercentage_Throws() {
        CustomException ex = assertThrows(CustomException.class,
                () -> escrowService.splitSettleByOrder(orderId, 60, 50, "Sai tỷ lệ"));
        assertTrue(ex.getMessage().contains("phải chính xác bằng 100%"));
    }

    @Test
    @DisplayName("SPLIT SETTLE: Lỗi nếu trạng thái Escrow không phải HELD hoặc DISPUTED")
    void splitSettleByOrder_InvalidStatus_Throws() {
        escrow.setStatus(EscrowStatus.RELEASED);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));

        CustomException ex = assertThrows(CustomException.class,
                () -> escrowService.splitSettleByOrder(orderId, 50, 50, "Sai trạng thái"));
        assertTrue(ex.getMessage().contains("hoàn tất trước đó") || ex.getMessage().contains("không hợp lệ"));
    }

    @Test
    @DisplayName("SPLIT SETTLE: Thành công chia 60% Buyer / 40% Seller sau khi trừ hoa hồng sàn 50k")
    void splitSettleByOrder_Success_60Buyer_40Seller() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        when(transactionRepository.existsByDedupeKey(any())).thenReturn(false);

        escrowService.splitSettleByOrder(orderId, 60, 40, "Phân xử tranh chấp công bằng");

        assertEquals(BigDecimal.valueOf(50000), escrowWallet.getAvailableBalance());
        assertEquals(BigDecimal.ZERO, escrowWallet.getLockedBalance());
        assertEquals(BigDecimal.valueOf(570000), buyerWallet.getAvailableBalance());
        assertEquals(BigDecimal.valueOf(380000), sellerWallet.getAvailableBalance());

        verify(transactionRepository, times(3)).save(any(Transaction.class));
        assertEquals(EscrowStatus.RELEASED, escrow.getStatus());
        assertEquals(OrderStatus.REFUNDED, order.getStatus());
    }

    @Test
    @DisplayName("RELEASE: Lỗi nếu order chưa DELIVERED hoặc COMPLETED")
    void releaseByOrder_OrderNotDelivered_Throws() {
        order.setStatus(OrderStatus.SHIPPING);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        CustomException ex = assertThrows(CustomException.class, () -> escrowService.releaseByOrder(orderId));
        assertTrue(ex.getMessage().contains("chưa đủ điều kiện release"));
    }

    @Test
    @DisplayName("RELEASE: Lỗi nếu escrow status không hợp lệ")
    void releaseByOrder_InvalidEscrowStatus_Throws() {
        order.setStatus(OrderStatus.DELIVERED);
        escrow.setStatus(EscrowStatus.REFUNDED);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));

        CustomException ex = assertThrows(CustomException.class, () -> escrowService.releaseByOrder(orderId));
        assertTrue(ex.getMessage().contains("Escrow status không hợp lệ"));
    }

    @Test
    @DisplayName("RELEASE: Thành công đơn bình thường có phí ship")
    void releaseByOrder_Success_NormalOrderWithShipping() {
        order.setStatus(OrderStatus.DELIVERED);
        order.setShippingFee(BigDecimal.valueOf(30000));
        order.setPlatformCommission(BigDecimal.valueOf(10000));

        escrow.setAmount(BigDecimal.valueOf(130000));
        escrow.setStatus(EscrowStatus.HELD);
        escrowWallet.setLockedBalance(BigDecimal.valueOf(130000));
        escrowWallet.setAvailableBalance(BigDecimal.ZERO);
        sellerWallet.setAvailableBalance(BigDecimal.ZERO);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        when(walletRepository.findByUserIdForUpdate(seller.getId())).thenReturn(Optional.of(sellerWallet));
        when(walletRepository.findSystemWalletForUpdate(WalletType.ESCROW)).thenReturn(Optional.of(escrowWallet));
        when(transactionRepository.existsByReferenceTypeAndReferenceIdAndType(any(), any(), any())).thenReturn(false);
        when(transactionRepository.existsByDedupeKey(any())).thenReturn(false);

        escrowService.releaseByOrder(orderId);

        assertEquals(BigDecimal.valueOf(120000), sellerWallet.getAvailableBalance());
        assertEquals(BigDecimal.valueOf(10000), escrowWallet.getAvailableBalance());
        assertEquals(BigDecimal.ZERO, escrowWallet.getLockedBalance());
        assertEquals(EscrowStatus.RELEASED, escrow.getStatus());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
    }

    @Test
    @DisplayName("RELEASE: Thành công đơn giảm giá 100%")
    void releaseByOrder_Success_100PercentDiscount_NoCrash() {
        order.setStatus(OrderStatus.DELIVERED);
        order.setShippingFee(BigDecimal.valueOf(30000));
        order.setPlatformCommission(BigDecimal.valueOf(10000));

        escrow.setAmount(BigDecimal.valueOf(30000));
        escrow.setStatus(EscrowStatus.HELD);
        escrowWallet.setLockedBalance(BigDecimal.valueOf(30000));
        escrowWallet.setAvailableBalance(BigDecimal.ZERO);
        sellerWallet.setAvailableBalance(BigDecimal.ZERO);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        when(walletRepository.findByUserIdForUpdate(seller.getId())).thenReturn(Optional.of(sellerWallet));
        when(walletRepository.findSystemWalletForUpdate(WalletType.ESCROW)).thenReturn(Optional.of(escrowWallet));
        when(transactionRepository.existsByReferenceTypeAndReferenceIdAndType(any(), any(), any())).thenReturn(false);
        when(transactionRepository.existsByDedupeKey(any())).thenReturn(false);

        assertDoesNotThrow(() -> escrowService.releaseByOrder(orderId));
        assertEquals(BigDecimal.valueOf(20000), sellerWallet.getAvailableBalance());
        assertEquals(BigDecimal.valueOf(10000), escrowWallet.getAvailableBalance());
        assertEquals(BigDecimal.ZERO, escrowWallet.getLockedBalance());
        assertEquals(EscrowStatus.RELEASED, escrow.getStatus());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
    }

    @Test
    @DisplayName("RELEASE: Idempotent - Nếu Escrow đã RELEASED thì return ngay")
    void releaseByOrder_Idempotent_WhenAlreadyReleased() {
        order.setStatus(OrderStatus.DELIVERED);
        escrow.setStatus(EscrowStatus.RELEASED);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));

        escrowService.releaseByOrder(orderId);

        verify(walletRepository, never()).saveAll(any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("REFUND BY ORDER: Hoàn tiền toàn phần cho Buyer về Ví thành công")
    void refundByOrder_Success() {
        escrow.setStatus(EscrowStatus.HELD);
        escrow.setAmount(BigDecimal.valueOf(1000000));
        escrowWallet.setLockedBalance(BigDecimal.valueOf(1000000));
        buyerWallet.setAvailableBalance(BigDecimal.ZERO);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        when(transactionRepository.existsByDedupeKey(any())).thenReturn(false);

        escrowService.refundByOrder(orderId, "Khách hủy đơn hàng");

        assertEquals(BigDecimal.ZERO, escrowWallet.getLockedBalance());
        assertEquals(BigDecimal.valueOf(1000000), buyerWallet.getAvailableBalance());
        assertEquals(EscrowStatus.REFUNDED, escrow.getStatus());
        assertEquals(OrderStatus.REFUNDED, order.getStatus());
        verify(transactionRepository).save(any(Transaction.class));
        verify(walletRepository).saveAll(any());
    }

    @Test
    @DisplayName("REFUND BY ORDER: Idempotent khi đã REFUNDED")
    void refundByOrder_AlreadyRefunded_NoOp() {
        escrow.setStatus(EscrowStatus.REFUNDED);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));

        escrowService.refundByOrder(orderId, "Thử hoàn lại");

        verify(transactionRepository, never()).save(any());
        verify(walletRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("REFUND BY ORDER: Ném lỗi nếu trạng thái escrow không hợp lệ")
    void refundByOrder_InvalidStatus_Throws() {
        escrow.setStatus(EscrowStatus.RELEASED);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));

        CustomException ex = assertThrows(CustomException.class, () -> escrowService.refundByOrder(orderId, "Hủy"));
        assertTrue(ex.getMessage().contains("không hợp lệ để hoàn tiền"));
    }

    @Test
    @DisplayName("REFUND BY ORDER: Tự động cân bằng locked balance nếu nhỏ hơn amount")
    void refundByOrder_LockedBalanceLessThanAmount_AdjustsAndSucceeds() {
        escrow.setStatus(EscrowStatus.HELD);
        escrow.setAmount(BigDecimal.valueOf(1000000));
        escrowWallet.setLockedBalance(BigDecimal.valueOf(500000)); // Nhỏ hơn 1,000,000

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        when(transactionRepository.existsByDedupeKey(any())).thenReturn(false);

        escrowService.refundByOrder(orderId, "Hoàn tiền");

        assertEquals(BigDecimal.ZERO, escrowWallet.getLockedBalance());
        assertEquals(BigDecimal.valueOf(1000000), buyerWallet.getAvailableBalance());
    }

    @Test
    @DisplayName("getSettlementByOrderId: Trả về SettlementInfo từ danh sách giao dịch")
    void getSettlementByOrderId_Success() {
        Transaction tx = Transaction.builder()
                .amount(BigDecimal.valueOf(90000))
                .type(TransactionType.RELEASE)
                .build();

        when(escrowRepository.findByOrderId(orderId)).thenReturn(Optional.of(escrow));
        when(transactionRepository.findByReferenceTypeAndReferenceId(ReferenceType.ESCROW, escrow.getId()))
                .thenReturn(List.of(tx));

        SettlementInfo info = escrowService.getSettlementByOrderId(orderId);
        assertNotNull(info);
    }

    @Test
    @DisplayName("getSettlementByOrderId: Trả về null khi orderId null hoặc không tìm thấy escrow")
    void getSettlementByOrderId_NullChecks() {
        assertNull(escrowService.getSettlementByOrderId(null));

        when(escrowRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        assertNull(escrowService.getSettlementByOrderId(orderId));
    }

    @Test
    @DisplayName("splitSettleByOrder: Tất cả các trường hợp validation lỗi")
    void splitSettleByOrder_AllValidationErrors() {
        // 1. null percentage
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, null, 50, "note"));
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, 50, null, "note"));

        // 2. negative or sum != 100
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, -10, 110, "note"));
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, 40, 40, "note"));

        // 3. Order not found
        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, 50, 50, "note"));

        // 4. Escrow not found
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, 50, 50, "note"));

        // 5. Escrow status RELEASED or REFUNDED
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        escrow.setStatus(EscrowStatus.RELEASED);
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, 50, 50, "note"));

        // 6. Escrow status invalid (not HELD, not DISPUTED)
        escrow.setStatus(EscrowStatus.CANCELED);
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, 50, 50, "note"));

        // 7. Missing wallets
        escrow.setStatus(EscrowStatus.HELD);
        escrow.setEscrowWallet(null);
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, 50, 50, "note"));

        escrow.setEscrowWallet(escrowWallet);
        escrow.setBuyerWallet(null);
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, 50, 50, "note"));

        // 8. Amount <= 0 or null
        escrow.setBuyerWallet(buyerWallet);
        escrow.setAmount(BigDecimal.ZERO);
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, 50, 50, "note"));

        // 9. Commission > Amount
        escrow.setAmount(BigDecimal.valueOf(100000));
        order.setPlatformCommission(BigDecimal.valueOf(200000));
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, 50, 50, "note"));
    }

    @Test
    @DisplayName("splitSettleByOrder: Tự tạo SellerWallet nếu chưa có và xử lý COD")
    void splitSettleByOrder_SellerWalletCreated_And_COD() {
        escrow.setStatus(EscrowStatus.HELD);
        escrow.setAmount(BigDecimal.valueOf(1000000));
        escrow.setSellerWallet(null);
        order.setPlatformCommission(BigDecimal.valueOf(50000));
        order.setPaymentMethod(PaymentMethod.COD);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        when(walletRepository.findByUserIdForUpdate(seller.getId())).thenReturn(Optional.empty());
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));

        Payment payment = Payment.builder().id(UUID.randomUUID()).status(PaymentStatus.PENDING).build();
        when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.of(payment));

        escrowService.splitSettleByOrder(orderId, 50, 50, "Chia 50-50");

        assertNotNull(escrow.getSellerWallet());
        assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
        assertEquals(OrderStatus.REFUNDED, order.getStatus());
    }

    @Test
    @DisplayName("splitSettleByOrder: 100% Buyer và 100% Seller")
    void splitSettleByOrder_Extremes() {
        escrow.setStatus(EscrowStatus.DISPUTED);
        escrow.setAmount(BigDecimal.valueOf(1000000));
        order.setPlatformCommission(BigDecimal.ZERO);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));

        // 100% Buyer -> escrow REFUNDED, order REFUNDED
        escrowService.splitSettleByOrder(orderId, 100, 0, "100% hoàn người mua");
        assertEquals(EscrowStatus.REFUNDED, escrow.getStatus());
        assertEquals(OrderStatus.REFUNDED, order.getStatus());

        // 100% Seller -> escrow RELEASED, order COMPLETED
        escrow.setStatus(EscrowStatus.HELD);
        escrowService.splitSettleByOrder(orderId, 0, 100, "100% giải ngân người bán");
        assertEquals(EscrowStatus.RELEASED, escrow.getStatus());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
    }

    @Test
    @DisplayName("refundByOrder: Các nhánh lỗi thiếu ví hoặc dữ liệu")
    void refundByOrder_ValidationErrors() {
        // 1. Order not found
        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> escrowService.refundByOrder(orderId, "note"));

        // 2. Escrow not found
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> escrowService.refundByOrder(orderId, "note"));

        // 3. Missing wallets
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        escrow.setStatus(EscrowStatus.HELD);
        escrow.setEscrowWallet(null);
        assertThrows(CustomException.class, () -> escrowService.refundByOrder(orderId, "note"));

        escrow.setEscrowWallet(escrowWallet);
        escrow.setBuyerWallet(null);
        assertThrows(CustomException.class, () -> escrowService.refundByOrder(orderId, "note"));

        // 4. Amount <= 0
        escrow.setBuyerWallet(buyerWallet);
        escrow.setAmount(BigDecimal.ZERO);
        assertThrows(CustomException.class, () -> escrowService.refundByOrder(orderId, "note"));
    }

    @Test
    @DisplayName("releaseByOrder: Tất cả các nhánh biên, hụt hoa hồng, thâm hụt số dư khả dụng và COD")
    void releaseByOrder_AllRemainingBranches() {
        order.setStatus(OrderStatus.DELIVERED);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        // 1. Escrow not found
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> escrowService.releaseByOrder(orderId));

        // 2. already released txn exists and order not COMPLETED
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        escrow.setStatus(EscrowStatus.HELD);
        when(transactionRepository.existsByReferenceTypeAndReferenceIdAndType(any(), any(), eq(TransactionType.RELEASE))).thenReturn(true);
        escrowService.releaseByOrder(orderId);
        assertEquals(EscrowStatus.RELEASED, escrow.getStatus());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());

        // Reset released txn
        escrow.setStatus(EscrowStatus.HELD);
        when(transactionRepository.existsByReferenceTypeAndReferenceIdAndType(any(), any(), eq(TransactionType.RELEASE))).thenReturn(false);

        // 3. Seller wallet missing -> created via orElseGet
        when(walletRepository.findByUserIdForUpdate(seller.getId())).thenReturn(Optional.empty());
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));

        // 4. System Escrow wallet not found
        escrow.setEscrowWallet(null);
        assertThrows(CustomException.class, () -> escrowService.releaseByOrder(orderId));
        escrow.setEscrowWallet(escrowWallet);

        // 5. System Escrow wallet found, amount <= 0
        when(walletRepository.findSystemWalletForUpdate(WalletType.ESCROW)).thenReturn(Optional.of(escrowWallet));
        escrow.setAmount(BigDecimal.ZERO);
        assertThrows(CustomException.class, () -> escrowService.releaseByOrder(orderId));

        // 6. Nominal commission > Effective merchandise (shortfall warning) + Deficit available balance
        escrow.setAmount(BigDecimal.valueOf(100000));
        order.setShippingFee(BigDecimal.valueOf(10000));
        order.setPlatformDiscountAmount(BigDecimal.valueOf(300000)); // Large platform voucher
        order.setPlatformCommission(BigDecimal.valueOf(500000)); // nominal > effective
        order.setPaymentMethod(PaymentMethod.COD);

        Payment payment = Payment.builder().id(UUID.randomUUID()).status(PaymentStatus.PENDING).build();
        when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.of(payment));

        escrowWallet.setLockedBalance(BigDecimal.valueOf(50000)); // locked < amount
        escrowWallet.setAvailableBalance(BigDecimal.valueOf(10000));
        assertThrows(CustomException.class, () -> escrowService.releaseByOrder(orderId));
        order.setPlatformCommission(BigDecimal.valueOf(10000));

        escrowService.releaseByOrder(orderId);

        assertEquals(EscrowStatus.RELEASED, escrow.getStatus());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
        assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
    }

    @Test
    @DisplayName("recordCodEscrow và cancelCodEscrow: Đầy đủ các nhánh tạo mới và hủy COD Escrow")
    void testRecordAndCancelCodEscrow() {
        // 1. Null order or invalid total
        escrowService.recordCodEscrow(null);
        escrowService.cancelCodEscrow(null);

        Order invalidOrder = Order.builder().id(UUID.randomUUID()).total(BigDecimal.ZERO).build();
        escrowService.recordCodEscrow(invalidOrder);

        // 2. recordCodEscrow creates payment, buyerWallet, sellerWallet, escrow, and hold tx
        order.setTotal(BigDecimal.valueOf(500000));
        when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(walletRepository.findByUserIdForUpdate(buyer.getId())).thenReturn(Optional.empty());
        when(walletRepository.findByUserIdForUpdate(seller.getId())).thenReturn(Optional.empty());
        when(walletRepository.save(any(Wallet.class))).thenAnswer(inv -> inv.getArgument(0));
        when(walletRepository.findSystemWalletForUpdate(WalletType.ESCROW)).thenReturn(Optional.of(escrowWallet));
        when(escrowRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(escrowRepository.save(any(Escrow.class))).thenAnswer(inv -> {
            Escrow e = inv.getArgument(0);
            if (e.getId() == null) e.setId(UUID.randomUUID());
            return e;
        });
        when(transactionRepository.existsByDedupeKey(anyString())).thenReturn(false);

        escrowService.recordCodEscrow(order);
        verify(paymentRepository).save(any(Payment.class));
        verify(escrowRepository).save(any(Escrow.class));

        // 3. cancelCodEscrow cancels HELD escrow and PENDING payment
        escrow.setStatus(EscrowStatus.HELD);
        escrow.setEscrowWallet(escrowWallet);
        escrow.setAmount(BigDecimal.valueOf(500000));
        escrowWallet.setLockedBalance(BigDecimal.valueOf(600000));
        Payment pendingPayment = Payment.builder().id(UUID.randomUUID()).status(PaymentStatus.PENDING).build();

        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.of(pendingPayment));

        escrowService.cancelCodEscrow(order);
        assertEquals(EscrowStatus.CANCELED, escrow.getStatus());
        assertEquals(PaymentStatus.CANCELLED, pendingPayment.getStatus());

        // 4. releaseByOrder auto-heals missing COD escrow and missing sellerWallet
        order.setStatus(OrderStatus.DELIVERED);
        order.setPaymentMethod(PaymentMethod.COD);
        order.setPlatformCommission(BigDecimal.valueOf(10000));
        escrow.setStatus(EscrowStatus.HELD);
        escrow.setSellerWallet(null);
        escrow.setAmount(BigDecimal.valueOf(500000));
        escrowWallet.setLockedBalance(BigDecimal.valueOf(600000));

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(escrow));
        when(walletRepository.findByUserIdForUpdate(seller.getId())).thenReturn(Optional.empty());

        escrowService.releaseByOrder(orderId);
        assertEquals(EscrowStatus.RELEASED, escrow.getStatus());
        assertNotNull(escrow.getSellerWallet());
    }

}
