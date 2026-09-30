package com.marketplace.ecommerce.wallet.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.repository.PaymentRepository;
import com.marketplace.ecommerce.payment.repository.TransactionRepository;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.payment.valueObjects.PaymentMethod;
import com.marketplace.ecommerce.payment.valueObjects.PaymentStatus;
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

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
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
        private Wallet escrowWallet;

        @BeforeEach
        void setUp() {
                buyer = User.builder().id(UUID.randomUUID()).build();
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

                escrowWallet = Wallet.builder()
                                .id(UUID.randomUUID())
                                .walletType(WalletType.ESCROW)
                                .availableBalance(BigDecimal.ZERO)
                                .lockedBalance(new BigDecimal("200000"))
                                .build();
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

                // Khẳng định ví người bán tuyệt đối không bị đụng vào lúc thanh toán
                verify(walletRepo, never()).findByUserIdForUpdate(seller.getId());
                verify(walletRepo, never()).findByUserId(seller.getId());

                // Kiểm tra số dư ví buyer bị trừ đúng 500.000đ
                assertEquals(new BigDecimal("500000"), buyerWallet.getAvailableBalance());
                // Kiểm tra escrow wallet bị khóa thêm 500.000đ (200k + 500k = 700k)
                assertEquals(new BigDecimal("700000"), escrowWallet.getLockedBalance());

                // Kiểm tra lưu Payment
                verify(paymentRepository).save(argThat(p -> p.getMethod() == PaymentMethod.WALLET &&
                                p.getStatus() == PaymentStatus.SUCCESS &&
                                p.getAmount().compareTo(new BigDecimal("500000")) == 0));

                // Kiểm tra lưu Escrow với trạng thái HELD và sellerWallet chưa cần gán
                verify(escrowRepo).save(argThat(e -> e.getStatus() == EscrowStatus.HELD &&
                                e.getAmount().compareTo(new BigDecimal("500000")) == 0 &&
                                e.getSellerWallet() == null));

                // Kiểm tra lưu Transaction
                verify(txRepo).save(argThat(t -> t.getAmount().compareTo(new BigDecimal("500000")) == 0 &&
                                t.getFromWallet().equals(buyerWallet) &&
                                t.getToWallet().equals(escrowWallet)));
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
}
