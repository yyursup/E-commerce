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
class EscrowServiceSettlementTest {

    @Mock
    private EscrowRepository escrowRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private WalletRepository walletRepository;

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

    @Test
    @DisplayName("RELEASE: Thành công đơn bình thường có phí ship (Seller nhận hàng ròng 90k, Sàn giữ ship 30k + hoa hồng 10k)")
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

        // Seller nhận tiền hàng ròng: (130k - 30k ship) - 10k hoa hồng = 90k
        assertEquals(BigDecimal.valueOf(90000), sellerWallet.getAvailableBalance());
        // Sàn nhận: 10k hoa hồng + 30k ship = 40k
        assertEquals(BigDecimal.valueOf(40000), escrowWallet.getAvailableBalance());
        assertEquals(BigDecimal.ZERO, escrowWallet.getLockedBalance());

        // Đảm bảo bảo toàn tiền: 90k + 40k = 130k
        assertEquals(escrow.getAmount(), sellerWallet.getAvailableBalance().add(escrowWallet.getAvailableBalance()));

        assertEquals(EscrowStatus.RELEASED, escrow.getStatus());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
    }

    @Test
    @DisplayName("RELEASE: Thành công đơn giảm giá 100% (Voucher Shop giảm hết hàng, không bị Exception)")
    void releaseByOrder_Success_100PercentDiscount_NoCrash() {
        order.setStatus(OrderStatus.DELIVERED);
        order.setShippingFee(BigDecimal.valueOf(30000));
        order.setPlatformCommission(BigDecimal.valueOf(10000)); // Hoa hồng danh nghĩa 10k > tiền hàng 0k

        escrow.setAmount(BigDecimal.valueOf(30000)); // Chỉ còn 30k tiền ship khách trả
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

        // Trước đây đoạn này ném CustomException("Commission > amount") làm kẹt đơn.
        // Giờ đây chạy thành công suôn sẻ.
        assertDoesNotThrow(() -> escrowService.releaseByOrder(orderId));

        // Seller nhận 0đ
        assertEquals(BigDecimal.ZERO, sellerWallet.getAvailableBalance());
        // Sàn giữ lại 30k tiền ship
        assertEquals(BigDecimal.valueOf(30000), escrowWallet.getAvailableBalance());
        assertEquals(BigDecimal.ZERO, escrowWallet.getLockedBalance());

        assertEquals(EscrowStatus.RELEASED, escrow.getStatus());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
    }

    @Test
    @DisplayName("RELEASE: Idempotent - Nếu Escrow đã RELEASED thì return ngay, không trừ/cộng trùng")
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
    @DisplayName("RELEASE: Thành công đơn có Voucher Sàn ECOMNEW15 (-150k), Seller nhận đủ 16.160.200đ, Sàn thu ròng 240.300đ")
    void releaseByOrder_Success_WithPlatformVoucherSubsidy() {
        order.setStatus(OrderStatus.DELIVERED);
        order.setSubtotal(BigDecimal.valueOf(16490000));
        order.setShippingFee(BigDecimal.valueOf(60500));
        order.setPlatformDiscountAmount(BigDecimal.valueOf(150000));
        order.setPlatformCommission(BigDecimal.valueOf(329800)); // 2% của 16.490.000

        // Escrow amount = 16.490.000 + 60.500 - 150.000 = 16.400.500
        BigDecimal escrowAmt = BigDecimal.valueOf(16400500);
        escrow.setAmount(escrowAmt);
        escrow.setStatus(EscrowStatus.HELD);
        escrowWallet.setLockedBalance(escrowAmt);
        escrowWallet.setAvailableBalance(BigDecimal.ZERO);
        sellerWallet.setAvailableBalance(BigDecimal.ZERO);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        when(walletRepository.findByUserIdForUpdate(seller.getId())).thenReturn(Optional.of(sellerWallet));
        when(walletRepository.findSystemWalletForUpdate(WalletType.ESCROW)).thenReturn(Optional.of(escrowWallet));
        when(transactionRepository.existsByReferenceTypeAndReferenceIdAndType(any(), any(), any())).thenReturn(false);
        when(transactionRepository.existsByDedupeKey(any())).thenReturn(false);

        escrowService.releaseByOrder(orderId);

        // Seller nhận đúng: 16.490.000 - 329.800 = 16.160.200 VND (Được sàn bù 150.000đ voucher)
        assertEquals(BigDecimal.valueOf(16160200), sellerWallet.getAvailableBalance());

        // Sàn nhận ròng: 329.800 (hoa hồng) + 60.500 (ship) - 150.000 (voucher sàn) = 240.300 VND
        assertEquals(BigDecimal.valueOf(240300), escrowWallet.getAvailableBalance());
        assertEquals(BigDecimal.ZERO, escrowWallet.getLockedBalance());

        // Bảo toàn tiền: 16.160.200 + 240.300 = 16.400.500 VND
        assertEquals(escrowAmt, sellerWallet.getAvailableBalance().add(escrowWallet.getAvailableBalance()));

        // Verify transactions: RELEASE, COMMISSION, SHIPPING_RETAIN, PLATFORM_SUBSIDY (4 transactions)
        verify(transactionRepository, times(4)).save(any(Transaction.class));

        assertEquals(EscrowStatus.RELEASED, escrow.getStatus());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
    }
}
