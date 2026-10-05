package com.marketplace.ecommerce.payment.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.entity.Transaction;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.repository.TransactionRepository;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.payment.valueObjects.PaymentMethod;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.wallet.entity.Wallet;
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
class EscrowServiceSettlementTest {

    @Mock
    private EscrowRepository escrowRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private TransactionRepository transactionRepository;

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
    @DisplayName("SPLIT SETTLE: Lỗi nếu tổng phần trăm không bằng 100%")
    void splitSettleByOrder_InvalidPercentage_Throws() {
        CustomException ex = assertThrows(CustomException.class,
                () -> escrowService.splitSettleByOrder(orderId, 60, 50, "Sai tỷ lệ"));
        assertTrue(ex.getMessage().contains("phải chính xác bằng 100%"));
    }

    @Test
    @DisplayName("SPLIT SETTLE: Thành công chia 60% Buyer / 40% Seller sau khi trừ hoa hồng sàn 50k")
    void splitSettleByOrder_Success_60Buyer_40Seller() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        when(transactionRepository.existsByDedupeKey(any())).thenReturn(false);

        // Net Amount = 1,000,000 - 50,000 (commission) = 950,000 VND
        // Buyer 60% of 950,000 = 570,000 VND
        // Seller 40% of 950,000 = 380,000 VND
        escrowService.splitSettleByOrder(orderId, 60, 40, "Phân xử tranh chấp công bằng");

        // Verify balances
        assertEquals(BigDecimal.valueOf(50000), escrowWallet.getAvailableBalance());
        assertEquals(BigDecimal.ZERO, escrowWallet.getLockedBalance());
        assertEquals(BigDecimal.valueOf(570000), buyerWallet.getAvailableBalance());
        assertEquals(BigDecimal.valueOf(380000), sellerWallet.getAvailableBalance());

        // Verify transactions created: 1 commission, 1 buyer refund, 1 seller release
        verify(transactionRepository, times(3)).save(any(Transaction.class));

        // Verify escrow status
        assertEquals(EscrowStatus.RELEASED, escrow.getStatus());
        assertEquals(OrderStatus.REFUNDED, order.getStatus());
    }
}
