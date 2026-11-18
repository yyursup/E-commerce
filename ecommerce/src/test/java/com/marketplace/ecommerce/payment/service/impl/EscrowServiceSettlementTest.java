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
import com.marketplace.ecommerce.payment.valueObjects.ReferenceType;
import com.marketplace.ecommerce.payment.valueObjects.TransactionType;
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

import com.marketplace.ecommerce.payment.repository.PaymentRepository;
import com.marketplace.ecommerce.payment.entity.Payment;
import com.marketplace.ecommerce.payment.valueObjects.PaymentStatus;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

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
    @DisplayName("SPLIT SETTLE: Phí ship không được đem chia cho Buyer/Seller, trả ra cho GHN")
    void splitSettleByOrder_ShippingFeeIsNotSplit() {
        order.setShippingFee(BigDecimal.valueOf(30000));
        escrow.setAmount(BigDecimal.valueOf(1030000));
        escrowWallet.setLockedBalance(BigDecimal.valueOf(1030000));

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        when(transactionRepository.existsByDedupeKey(any())).thenReturn(false);

        // Tiền hàng = 1.030.000 - 30.000 ship = 1.000.000; trừ hoa hồng 50.000 còn 950.000 để chia
        escrowService.splitSettleByOrder(orderId, 60, 40, "Chia sau khi tách ship");

        assertEquals(BigDecimal.valueOf(570000), buyerWallet.getAvailableBalance());
        assertEquals(BigDecimal.valueOf(380000), sellerWallet.getAvailableBalance());
        assertEquals(BigDecimal.valueOf(50000), escrowWallet.getAvailableBalance(), "Sàn chỉ nhận hoa hồng");
        assertEquals(0, escrowWallet.getLockedBalance().signum(), "Ship đã trả ra cho GHN, không còn giữ lại");

        // Bảo toàn tiền: người mua + người bán + sàn + ship trả GHN (30.000) = ký quỹ
        assertEquals(escrow.getAmount(), buyerWallet.getAvailableBalance().add(sellerWallet.getAvailableBalance())
                .add(escrowWallet.getAvailableBalance()).add(BigDecimal.valueOf(30000)));

        org.mockito.ArgumentCaptor<Transaction> captor = org.mockito.ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, times(4)).save(captor.capture());
        Transaction shipTx = captor.getAllValues().stream()
                .filter(t -> t.getType() == TransactionType.SHIPPING_FEE).findFirst().orElseThrow();
        assertEquals(BigDecimal.valueOf(30000), shipTx.getAmount());
        assertNull(shipTx.getToWallet());
        assertEquals("SHIPPING_RETAIN:" + orderId, shipTx.getDedupeKey());
    }

    @Test
    @DisplayName("SPLIT SETTLE: Buyer 100% vẫn không được hoàn phần ship đã giao")
    void splitSettleByOrder_FullBuyerShare_StillKeepsShipping() {
        order.setShippingFee(BigDecimal.valueOf(30000));
        escrow.setAmount(BigDecimal.valueOf(1030000));
        escrowWallet.setLockedBalance(BigDecimal.valueOf(1030000));

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        when(transactionRepository.existsByDedupeKey(any())).thenReturn(false);

        escrowService.splitSettleByOrder(orderId, 100, 0, "Buyer thắng");

        assertEquals(BigDecimal.valueOf(950000), buyerWallet.getAvailableBalance());
        assertEquals(BigDecimal.ZERO, sellerWallet.getAvailableBalance());
        assertEquals(EscrowStatus.REFUNDED, escrow.getStatus());
    }

    @Test
    @DisplayName("SPLIT SETTLE: Báo lỗi khi hoa hồng lớn hơn tiền hàng sau khi tách ship")
    void splitSettleByOrder_CommissionExceedsMerchandise_Throws() {
        order.setShippingFee(BigDecimal.valueOf(980000));
        escrow.setAmount(BigDecimal.valueOf(1000000));

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));

        // Tiền hàng chỉ còn 20.000 < hoa hồng 50.000
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, 50, 50, "x"));
        assertEquals(BigDecimal.ZERO, buyerWallet.getAvailableBalance());
    }

    @Test
    @DisplayName("SettlementInfo: nhận diện phí ship trả GHN theo loại giao dịch SHIPPING_FEE và cả dữ liệu cũ (TRANSFER + ghi chú shipping)")
    void settlementInfo_RecognisesShippingFeeTransactions() {
        escrow.setAmount(BigDecimal.valueOf(1030000));
        when(escrowRepository.findByOrderId(orderId)).thenReturn(Optional.of(escrow));

        Transaction ship = Transaction.builder().type(TransactionType.SHIPPING_FEE).amount(BigDecimal.valueOf(30000)).build();
        Transaction legacyShip = Transaction.builder().type(TransactionType.TRANSFER)
                .note("Customer shipping fee retained by platform").amount(BigDecimal.valueOf(10000)).build();
        Transaction commission = Transaction.builder().type(TransactionType.COMMISSION).amount(BigDecimal.valueOf(50000)).build();
        Transaction release = Transaction.builder().type(TransactionType.RELEASE).amount(BigDecimal.valueOf(950000)).build();
        when(transactionRepository.findByReferenceTypeAndReferenceId(eq(ReferenceType.ESCROW), eq(escrow.getId())))
                .thenReturn(List.of(ship, legacyShip, commission, release));

        com.marketplace.ecommerce.payment.dto.SettlementInfo info = escrowService.getSettlementByOrderId(orderId);

        assertNotNull(info);
        assertEquals(BigDecimal.valueOf(40000), info.getShippingRetainedAmount());
        assertEquals(BigDecimal.valueOf(50000), info.getCommissionAmount());
        assertEquals(BigDecimal.valueOf(950000), info.getSellerReleaseAmount());
    }

    @Test
    @DisplayName("SettlementInfo: giao dịch ship không bị tính là giải ngân/hoàn tiền (đơn chỉ mới giữ ship)")
    void settlementInfo_ShippingOnlyIsNotASettlement() {
        escrow.setAmount(BigDecimal.valueOf(30000));
        when(escrowRepository.findByOrderId(orderId)).thenReturn(Optional.of(escrow));
        Transaction ship = Transaction.builder().type(TransactionType.SHIPPING_FEE).amount(BigDecimal.valueOf(30000)).build();
        when(transactionRepository.findByReferenceTypeAndReferenceId(eq(ReferenceType.ESCROW), eq(escrow.getId())))
                .thenReturn(List.of(ship));

        assertNull(escrowService.getSettlementByOrderId(orderId));
    }

    @Test
    @DisplayName("RELEASE: Thành công đơn bình thường có phí ship (Seller nhận hàng ròng 90k, Sàn thu hoa hồng 10k, ship 30k trả GHN)")
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
        // Sàn chỉ nhận 10k hoa hồng; 30k ship trả ra cho GHN, không phải doanh thu sàn
        assertEquals(BigDecimal.valueOf(10000), escrowWallet.getAvailableBalance());
        assertEquals(0, escrowWallet.getLockedBalance().signum());

        // Đảm bảo bảo toàn tiền: 90k (shop) + 10k (sàn) + 30k (trả GHN) = 130k
        assertEquals(escrow.getAmount(), sellerWallet.getAvailableBalance()
                .add(escrowWallet.getAvailableBalance()).add(BigDecimal.valueOf(30000)));

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
        // Sàn không có doanh thu; 30k ship trả ra cho GHN
        assertEquals(BigDecimal.ZERO, escrowWallet.getAvailableBalance());
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
    @DisplayName("RELEASE: Thành công đơn có Voucher Sàn ECOMNEW15 (-150k), Seller nhận đủ 16.160.200đ, Sàn thu ròng 179.800đ, ship 60.500đ trả GHN")
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

        // Sàn nhận ròng: 329.800 (hoa hồng) - 150.000 (voucher sàn) = 179.800 VND, ship không phải doanh thu
        assertEquals(BigDecimal.valueOf(179800), escrowWallet.getAvailableBalance());
        assertEquals(BigDecimal.ZERO, escrowWallet.getLockedBalance());

        // Bảo toàn tiền: 16.160.200 + 179.800 + 60.500 (trả GHN) = 16.400.500 VND
        assertEquals(escrowAmt, sellerWallet.getAvailableBalance()
                .add(escrowWallet.getAvailableBalance()).add(BigDecimal.valueOf(60500)));

        // Verify transactions: RELEASE, COMMISSION, SHIPPING_RETAIN, PLATFORM_SUBSIDY (4 transactions)
        verify(transactionRepository, times(4)).save(any(Transaction.class));

        assertEquals(EscrowStatus.RELEASED, escrow.getStatus());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
    }

    @Test
    @DisplayName("refundMerchandiseOnly: Khách giữ hàng -> Hoàn tiền hàng cho Buyer, phí ship trả ra cho GHN")
    void refundMerchandiseOnly_CustomerKeepsItem_RefundsMerchandiseRetainsShippingForPlatform() {
        BigDecimal subtotal = BigDecimal.valueOf(500000);
        BigDecimal shippingFee = BigDecimal.valueOf(30000);
        BigDecimal total = subtotal.add(shippingFee);

        order.setSubtotal(subtotal);
        order.setShippingFee(shippingFee);
        order.setTotal(total);

        escrow.setAmount(total);
        escrow.setStatus(EscrowStatus.HELD);
        escrow.setEscrowWallet(escrowWallet);
        escrow.setBuyerWallet(buyerWallet);

        escrowWallet.setLockedBalance(total);
        escrowWallet.setAvailableBalance(BigDecimal.ZERO);
        buyerWallet.setAvailableBalance(BigDecimal.ZERO);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        when(transactionRepository.existsByDedupeKey(any())).thenReturn(false);

        escrowService.refundMerchandiseOnly(orderId, "Khách giữ hàng trong thương lượng 1:1");

        // 1. Buyer chỉ nhận lại 500.000đ tiền hàng
        assertEquals(subtotal, buyerWallet.getAvailableBalance());

        // 2. 30.000đ tiền ship không thành doanh thu sàn: trả ra cho GHN
        assertEquals(BigDecimal.ZERO, escrowWallet.getAvailableBalance());
        assertEquals(BigDecimal.ZERO, escrowWallet.getLockedBalance());

        // 3. Trạng thái cập nhật REFUNDED
        assertEquals(EscrowStatus.REFUNDED, escrow.getStatus());
        assertEquals(OrderStatus.REFUNDED, order.getStatus());

        // 4. Kiểm tra lưu transactions
        verify(transactionRepository, atLeast(1)).save(any(Transaction.class));
    }

    @Test
    @DisplayName("adminList: Phân trang danh sách ký quỹ theo trạng thái cho quản trị viên")
    void testAdminList() {
        when(escrowRepository.adminList(eq(EscrowStatus.HELD), any())).thenReturn(new PageImpl<>(List.of(escrow)));
        Page<com.marketplace.ecommerce.payment.dto.EscrowAdminResponse> page = escrowService.adminList(EscrowStatus.HELD, PageRequest.of(0, 10));
        assertNotNull(page);
        assertEquals(1, page.getTotalElements());
    }

    @Test
    @DisplayName("splitSettleByOrder: Kiểm tra validation (null, tổng khác 100%, trạng thái ký quỹ không hợp lệ, hoa hồng vượt quá ký quỹ)")
    void testSplitSettleByOrder_Validation() {
        // 1. null percentage
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, null, 50, "Note"));
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, 50, null, "Note"));

        // 2. sum != 100
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, 40, 50, "Note"));
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, -10, 110, "Note"));

        // 3. order not found
        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, 50, 50, "Note"));

        // 4. escrow not found
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, 50, 50, "Note"));

        // 5. escrow already RELEASED or REFUNDED
        escrow.setStatus(EscrowStatus.RELEASED);
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, 50, 50, "Note"));

        // 6. escrow status not HELD / DISPUTED
        escrow.setStatus(EscrowStatus.CANCELED);
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, 50, 50, "Note"));

        // 7. commission > totalAmount
        escrow.setStatus(EscrowStatus.DISPUTED);
        escrow.setAmount(new BigDecimal("100000"));
        escrow.setEscrowWallet(escrowWallet);
        escrow.setBuyerWallet(buyerWallet);
        escrow.setSellerWallet(sellerWallet);
        order.setPlatformCommission(new BigDecimal("150000"));
        assertThrows(CustomException.class, () -> escrowService.splitSettleByOrder(orderId, 50, 50, "Note"));
    }

    @Test
    @DisplayName("splitSettleByOrder: Thành công phân chia tỷ lệ 50-50 kèm hoa hồng và cập nhật COD payment")
    void testSplitSettleByOrder_Success_WithCodPayment() {
        order.setPlatformCommission(new BigDecimal("50000"));
        order.setPaymentMethod(PaymentMethod.COD);
        escrow.setStatus(EscrowStatus.DISPUTED);
        escrow.setAmount(new BigDecimal("1050000")); // netAmount = 1.000.000
        escrow.setEscrowWallet(escrowWallet);
        escrow.setBuyerWallet(buyerWallet);
        escrow.setSellerWallet(null); // triggers orElseGet seller wallet branch

        escrowWallet.setLockedBalance(new BigDecimal("1050000"));
        escrowWallet.setAvailableBalance(BigDecimal.ZERO);
        buyerWallet.setAvailableBalance(BigDecimal.ZERO);
        sellerWallet.setAvailableBalance(BigDecimal.ZERO);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        when(walletRepository.findByUserIdForUpdate(seller.getId())).thenReturn(Optional.of(sellerWallet));
        when(transactionRepository.existsByDedupeKey(any())).thenReturn(false);

        Payment codPayment = Payment.builder().order(order).status(PaymentStatus.PENDING).build();
        when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.of(codPayment));

        escrowService.splitSettleByOrder(orderId, 50, 50, "Admin split 50-50");

        assertEquals(new BigDecimal("50000"), escrowWallet.getAvailableBalance()); // commission
        assertEquals(new BigDecimal("500000"), buyerWallet.getAvailableBalance());
        assertEquals(new BigDecimal("500000"), sellerWallet.getAvailableBalance());
        assertEquals(EscrowStatus.RELEASED, escrow.getStatus());
        assertEquals(OrderStatus.REFUNDED, order.getStatus());
        assertEquals(PaymentStatus.SUCCESS, codPayment.getStatus());
    }

    @Test
    @DisplayName("getSettlementByOrderId: Trả về null khi orderId null hoặc không tìm thấy escrow, và trả về SettlementInfo khi thành công")
    void testGetSettlementByOrderId() {
        assertNull(escrowService.getSettlementByOrderId(null));

        when(escrowRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        assertNull(escrowService.getSettlementByOrderId(orderId));

        escrow.setAmount(new BigDecimal("500000"));
        when(escrowRepository.findByOrderId(orderId)).thenReturn(Optional.of(escrow));
        Transaction tx = Transaction.builder().type(TransactionType.RELEASE).amount(new BigDecimal("500000")).build();
        when(transactionRepository.findByReferenceTypeAndReferenceId(eq(ReferenceType.ESCROW), eq(escrow.getId())))
                .thenReturn(List.of(tx));

        com.marketplace.ecommerce.payment.dto.SettlementInfo info = escrowService.getSettlementByOrderId(orderId);
        assertNotNull(info);
    }
}

