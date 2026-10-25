package com.marketplace.ecommerce.wallet.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.entity.Payment;
import com.marketplace.ecommerce.payment.entity.Transaction;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.repository.PaymentRepository;
import com.marketplace.ecommerce.payment.repository.TransactionRepository;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.payment.valueObjects.PaymentMethod;
import com.marketplace.ecommerce.payment.valueObjects.PaymentStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.wallet.dto.response.WalletResponse;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WalletPaymentFlowTest {

    @Mock
    private WalletRepository walletRepo;

    @Mock
    private EscrowRepository escrowRepo;

    @Mock
    private TransactionRepository txRepo;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private WalletServiceImpl walletService;

    private User buyer;
    private User seller;
    private Shop shop;
    private Order order;
    private Wallet buyerWallet;
    private Wallet sellerWallet;
    private Wallet escrowWallet;
    private Account account;

    @BeforeEach
    void setUp() {
        account = new Account();
        account.setId(UUID.randomUUID());
        account.setUsername("buyer_user");

        buyer = User.builder().id(UUID.randomUUID()).account(account).build();
        seller = User.builder().id(UUID.randomUUID()).build();
        shop = Shop.builder().id(UUID.randomUUID()).user(seller).build();

        order = Order.builder()
                .id(UUID.randomUUID())
                .orderNumber("ORD-WAL-0001")
                .user(buyer)
                .shop(shop)
                .total(new BigDecimal("500000"))
                .status(OrderStatus.CONFIRMED)
                .paymentMethod(PaymentMethod.WALLET)
                .build();

        buyerWallet = Wallet.builder()
                .id(UUID.randomUUID())
                .user(buyer)
                .availableBalance(new BigDecimal("1000000"))
                .lockedBalance(BigDecimal.ZERO)
                .walletType(WalletType.USER)
                .build();

        sellerWallet = Wallet.builder()
                .id(UUID.randomUUID())
                .user(seller)
                .availableBalance(BigDecimal.ZERO)
                .lockedBalance(BigDecimal.ZERO)
                .walletType(WalletType.USER)
                .build();

        escrowWallet = Wallet.builder()
                .id(UUID.randomUUID())
                .walletType(WalletType.ESCROW)
                .availableBalance(BigDecimal.ZERO)
                .lockedBalance(new BigDecimal("200000"))
                .build();
    }

    @Test
    @DisplayName("getWalletByUserName: Thành công")
    void testGetWalletByUserName_Success() {
        when(userRepository.findByAccountUsername("buyer_user")).thenReturn(Optional.of(buyer));
        when(walletRepo.findByUserId(buyer.getId())).thenReturn(Optional.of(buyerWallet));

        WalletResponse res = walletService.getWalletByUserName("buyer_user");
        assertNotNull(res);
        assertEquals(buyerWallet.getId(), res.getWalletId());
        assertEquals(new BigDecimal("1000000"), res.getAvailableBalance());
    }

    @Test
    @DisplayName("getWalletByUserName: Lỗi User not found")
    void testGetWalletByUserName_UserNotFound() {
        when(userRepository.findByAccountUsername("unknown")).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> walletService.getWalletByUserName("unknown"));
        assertTrue(ex.getMessage().contains("User not found"));
    }

    @Test
    @DisplayName("getWalletByUserName: Lỗi Wallet not found")
    void testGetWalletByUserName_WalletNotFound() {
        when(userRepository.findByAccountUsername("buyer_user")).thenReturn(Optional.of(buyer));
        when(walletRepo.findByUserId(buyer.getId())).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> walletService.getWalletByUserName("buyer_user"));
        assertTrue(ex.getMessage().contains("Wallet not found for userName="));
    }

    @Test
    @DisplayName("getWallet(accountId): Thành công")
    void testGetWalletByAccountId_Success() {
        UUID accId = account.getId();
        when(userRepository.findByAccountId(accId)).thenReturn(Optional.of(buyer));
        when(walletRepo.findByUserId(buyer.getId())).thenReturn(Optional.of(buyerWallet));

        WalletResponse res = walletService.getWallet(accId);
        assertNotNull(res);
        assertEquals(buyerWallet.getId(), res.getWalletId());
    }

    @Test
    @DisplayName("getWallet(accountId): Lỗi User not found")
    void testGetWalletByAccountId_UserNotFound() {
        UUID accId = UUID.randomUUID();
        when(userRepository.findByAccountId(accId)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> walletService.getWallet(accId));
        assertTrue(ex.getMessage().contains("User not found"));
    }

    @Test
    @DisplayName("getWallet(accountId): Lỗi Wallet not found")
    void testGetWalletByAccountId_WalletNotFound() {
        UUID accId = account.getId();
        when(userRepository.findByAccountId(accId)).thenReturn(Optional.of(buyer));
        when(walletRepo.findByUserId(buyer.getId())).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> walletService.getWallet(accId));
        assertTrue(ex.getMessage().contains("Wallet not found for userId="));
    }

    @Test
    @DisplayName("recordPaymentAndHoldEscrow: Thành công tạo PAYMENT và HOLD transactions")
    void testRecordPaymentAndHoldEscrow_Success() {
        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .order(order)
                .amount(BigDecimal.valueOf(500000))
                .providerTxnNo("VNPAY-12345")
                .build();

        buyerWallet.setAvailableBalance(BigDecimal.ZERO); // Ban đầu 0đ

        when(walletRepo.findByUserIdForUpdate(buyer.getId())).thenReturn(Optional.of(buyerWallet));
        when(walletRepo.findByUserIdForUpdate(seller.getId())).thenReturn(Optional.of(sellerWallet));
        when(walletRepo.findSystemWalletForUpdate(WalletType.ESCROW)).thenReturn(Optional.of(escrowWallet));
        when(escrowRepo.findByOrderId(order.getId())).thenReturn(Optional.empty());
        when(txRepo.existsByDedupeKey(anyString())).thenReturn(false);

        walletService.recordPaymentAndHoldEscrow(payment);

        // Buyer được cộng 500k rồi trừ 500k -> còn 0
        assertEquals(BigDecimal.ZERO, buyerWallet.getAvailableBalance());
        // Escrow được cộng thêm 500k -> 200k + 500k = 700k
        assertEquals(BigDecimal.valueOf(700000), escrowWallet.getLockedBalance());

        verify(txRepo, times(2)).save(any(Transaction.class));
        verify(walletRepo).save(buyerWallet);
        verify(walletRepo).save(escrowWallet);
        verify(escrowRepo).save(any(Escrow.class));
    }

    @Test
    @DisplayName("recordPaymentAndHoldEscrow: Lỗi khi không tìm thấy ví buyer/seller/escrow")
    void testRecordPaymentAndHoldEscrow_WalletNotFoundThrows() {
        Payment payment = Payment.builder().id(UUID.randomUUID()).order(order).amount(BigDecimal.valueOf(500000)).build();

        when(walletRepo.findByUserIdForUpdate(buyer.getId())).thenReturn(Optional.empty());
        CustomException ex1 = assertThrows(CustomException.class, () -> walletService.recordPaymentAndHoldEscrow(payment));
        assertTrue(ex1.getMessage().contains("Buyer wallet not found"));

        when(walletRepo.findByUserIdForUpdate(buyer.getId())).thenReturn(Optional.of(buyerWallet));
        when(walletRepo.findByUserIdForUpdate(seller.getId())).thenReturn(Optional.empty());
        CustomException ex2 = assertThrows(CustomException.class, () -> walletService.recordPaymentAndHoldEscrow(payment));
        assertTrue(ex2.getMessage().contains("Seller wallet not found"));

        when(walletRepo.findByUserIdForUpdate(seller.getId())).thenReturn(Optional.of(sellerWallet));
        when(walletRepo.findSystemWalletForUpdate(WalletType.ESCROW)).thenReturn(Optional.empty());
        CustomException ex3 = assertThrows(CustomException.class, () -> walletService.recordPaymentAndHoldEscrow(payment));
        assertTrue(ex3.getMessage().contains("System ESCROW wallet not found"));
    }

    @Test
    @DisplayName("recordPaymentAndHoldEscrow: DedupeKey đã tồn tại -> Không lưu trùng transaction")
    void testRecordPaymentAndHoldEscrow_DedupeKeyExists() {
        Payment payment = Payment.builder().id(UUID.randomUUID()).order(order).amount(BigDecimal.valueOf(500000)).build();

        when(walletRepo.findByUserIdForUpdate(buyer.getId())).thenReturn(Optional.of(buyerWallet));
        when(walletRepo.findByUserIdForUpdate(seller.getId())).thenReturn(Optional.of(sellerWallet));
        when(walletRepo.findSystemWalletForUpdate(WalletType.ESCROW)).thenReturn(Optional.of(escrowWallet));

        Escrow existingEscrow = Escrow.builder().id(UUID.randomUUID()).order(order).build();
        when(escrowRepo.findByOrderId(order.getId())).thenReturn(Optional.of(existingEscrow));
        when(txRepo.existsByDedupeKey(anyString())).thenReturn(true);

        walletService.recordPaymentAndHoldEscrow(payment);

        verify(txRepo, never()).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Thanh toán đơn hàng bằng ví thành công: chỉ lấy ví buyer & escrow, tuyệt đối không đụng ví seller")
    void testPayOrderWithWallet_Success() {
        when(walletRepo.findByUserIdForUpdate(buyer.getId())).thenReturn(Optional.of(buyerWallet));
        when(walletRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));
        when(walletRepo.findSystemWalletForUpdate(WalletType.ESCROW)).thenReturn(Optional.of(escrowWallet));
        when(paymentRepository.findByOrderId(order.getId())).thenReturn(Optional.empty());
        when(escrowRepo.findByOrderId(order.getId())).thenReturn(Optional.empty());
        when(txRepo.existsByDedupeKey(anyString())).thenReturn(false);

        walletService.payOrderWithWallet(order);

        verify(walletRepo, never()).findByUserIdForUpdate(seller.getId());
        verify(walletRepo, never()).findByUserId(seller.getId());

        assertEquals(new BigDecimal("500000"), buyerWallet.getAvailableBalance());
        assertEquals(new BigDecimal("700000"), escrowWallet.getLockedBalance());

        verify(paymentRepository).save(argThat(p -> p.getMethod() == PaymentMethod.WALLET &&
                p.getStatus() == PaymentStatus.SUCCESS &&
                p.getAmount().compareTo(new BigDecimal("500000")) == 0));

        verify(escrowRepo).save(argThat(e -> e.getStatus() == EscrowStatus.HELD &&
                e.getAmount().compareTo(new BigDecimal("500000")) == 0 &&
                e.getSellerWallet() == null));

        verify(txRepo).save(argThat(t -> t.getAmount().compareTo(new BigDecimal("500000")) == 0 &&
                t.getFromWallet().equals(buyerWallet) &&
                t.getToWallet().equals(escrowWallet)));
    }

    @Test
    @DisplayName("Thanh toán đơn hàng bằng ví: Payment và Escrow đã tồn tại sẵn")
    void testPayOrderWithWallet_PaymentAndEscrowAlreadyExist() {
        Payment existingPayment = Payment.builder().id(UUID.randomUUID()).order(order).build();
        Escrow existingEscrow = Escrow.builder().id(UUID.randomUUID()).order(order).build();

        when(walletRepo.findByUserIdForUpdate(buyer.getId())).thenReturn(Optional.of(buyerWallet));
        when(walletRepo.findSystemWalletForUpdate(WalletType.ESCROW)).thenReturn(Optional.of(escrowWallet));
        when(paymentRepository.findByOrderId(order.getId())).thenReturn(Optional.of(existingPayment));
        when(escrowRepo.findByOrderId(order.getId())).thenReturn(Optional.of(existingEscrow));
        when(txRepo.existsByDedupeKey(anyString())).thenReturn(true); // Dedupe exists

        walletService.payOrderWithWallet(order);

        verify(paymentRepository).save(existingPayment);
        verify(escrowRepo).save(existingEscrow);
        verify(txRepo, never()).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Thanh toán đơn hàng bằng ví thất bại: Số tiền đơn hàng null hoặc <= 0")
    void testPayOrderWithWallet_InvalidAmount() {
        order.setTotal(null);
        CustomException ex1 = assertThrows(CustomException.class, () -> walletService.payOrderWithWallet(order));
        assertTrue(ex1.getMessage().contains("không hợp lệ"));

        order.setTotal(BigDecimal.ZERO);
        CustomException ex2 = assertThrows(CustomException.class, () -> walletService.payOrderWithWallet(order));
        assertTrue(ex2.getMessage().contains("không hợp lệ"));
    }

    @Test
    @DisplayName("Thanh toán đơn hàng bằng ví thất bại: Số dư ví người mua không đủ")
    void testPayOrderWithWallet_InsufficientBalance() {
        buyerWallet.setAvailableBalance(new BigDecimal("300000")); // Thiếu 200.000đ
        when(walletRepo.findByUserIdForUpdate(buyer.getId())).thenReturn(Optional.of(buyerWallet));

        CustomException exception = assertThrows(CustomException.class,
                () -> walletService.payOrderWithWallet(order));

        assertTrue(exception.getMessage().contains("Số dư ví không đủ"));
        verify(escrowRepo, never()).save(any());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Thanh toán đơn hàng bằng ví thất bại: Không tìm thấy ví buyer hoặc escrow")
    void testPayOrderWithWallet_MissingWallets() {
        when(walletRepo.findByUserIdForUpdate(buyer.getId())).thenReturn(Optional.empty());
        CustomException ex1 = assertThrows(CustomException.class, () -> walletService.payOrderWithWallet(order));
        assertTrue(ex1.getMessage().contains("Ví người mua không tồn tại"));

        when(walletRepo.findByUserIdForUpdate(buyer.getId())).thenReturn(Optional.of(buyerWallet));
        when(walletRepo.findSystemWalletForUpdate(WalletType.ESCROW)).thenReturn(Optional.empty());
        CustomException ex2 = assertThrows(CustomException.class, () -> walletService.payOrderWithWallet(order));
        assertTrue(ex2.getMessage().contains("Hệ thống ví ký quỹ ESCROW không tồn tại"));
    }
}
