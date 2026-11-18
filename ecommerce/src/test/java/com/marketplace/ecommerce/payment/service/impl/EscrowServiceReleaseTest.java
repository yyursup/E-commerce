package com.marketplace.ecommerce.payment.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
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
import com.marketplace.ecommerce.payment.valueObjects.ReferenceType;
import com.marketplace.ecommerce.payment.valueObjects.TransactionType;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.wallet.entity.Wallet;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import com.marketplace.ecommerce.wallet.valueObjects.WalletType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Giải ngân ký quỹ cho shop khi đơn hoàn tất (releaseByOrder):
 * điều kiện được giải ngân, cách chia tiền giữa shop và sàn, sổ cái và tính idempotent.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EscrowServiceReleaseTest {

    @Mock private EscrowRepository escrowRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private WalletRepository walletRepository;
    @Mock private PaymentRepository paymentRepository;

    @InjectMocks private EscrowServiceImpl escrowService;

    private UUID orderId;
    private User seller;
    private Order order;
    private Escrow escrow;
    private Wallet escrowWallet;
    private Wallet sellerWallet;

    private static BigDecimal vnd(long amount) {
        return BigDecimal.valueOf(amount);
    }

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        seller = User.builder().id(UUID.randomUUID()).fullName("Trần Thị Bán").build();
        Shop shop = Shop.builder().id(UUID.randomUUID()).name("Shop ABC").user(seller).build();

        // Đơn chuẩn: 1.000.000đ tiền hàng + 30.000đ ship, hoa hồng 50.000đ, không voucher sàn.
        order = Order.builder().id(orderId).orderNumber("ORD-REL-1").status(OrderStatus.DELIVERED)
                .paymentMethod(PaymentMethod.VNPAY).shop(shop)
                .shippingFee(vnd(30_000)).platformCommission(vnd(50_000)).build();

        escrowWallet = Wallet.builder().id(UUID.randomUUID()).walletType(WalletType.ESCROW)
                .lockedBalance(vnd(1_030_000)).availableBalance(BigDecimal.ZERO).build();
        sellerWallet = Wallet.builder().id(UUID.randomUUID()).user(seller).walletType(WalletType.USER)
                .lockedBalance(BigDecimal.ZERO).availableBalance(BigDecimal.ZERO).build();

        escrow = Escrow.builder().id(UUID.randomUUID()).order(order).amount(vnd(1_030_000))
                .status(EscrowStatus.HELD).escrowWallet(escrowWallet).build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        when(walletRepository.findByUserIdForUpdate(seller.getId())).thenReturn(Optional.of(sellerWallet));
        when(walletRepository.findSystemWalletForUpdate(WalletType.ESCROW)).thenReturn(Optional.of(escrowWallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.existsByReferenceTypeAndReferenceIdAndType(any(), any(), any())).thenReturn(false);
        when(transactionRepository.existsByDedupeKey(anyString())).thenReturn(false);
    }

    private Map<String, Transaction> savedTransactionsByKey() {
        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, atLeast(0)).save(captor.capture());
        return captor.getAllValues().stream()
                .collect(Collectors.toMap(t -> t.getDedupeKey().split(":")[0], Function.identity()));
    }

    @Nested
    @DisplayName("Chia tiền khi giải ngân")
    class MoneySplit {

        @Test
        @DisplayName("Shop nhận tiền hàng trừ hoa hồng, sàn chỉ hưởng hoa hồng, phí ship trả ra cho GHN")
        void standardOrder() {
            escrowService.releaseByOrder(orderId);

            assertEquals(vnd(950_000), sellerWallet.getAvailableBalance());
            assertEquals(vnd(50_000), escrowWallet.getAvailableBalance(), "Doanh thu sàn chỉ gồm hoa hồng");
            assertEquals(0, escrowWallet.getLockedBalance().signum(), "Toàn bộ ký quỹ đã được phân bổ, không còn công nợ lơ lửng");
            assertEquals(EscrowStatus.RELEASED, escrow.getStatus());
            assertSame(sellerWallet, escrow.getSellerWallet());
            assertEquals(OrderStatus.COMPLETED, order.getStatus());
        }

        @Test
        @DisplayName("Không sinh hay mất tiền: phần shop + doanh thu sàn + ship trả GHN = số tiền ký quỹ")
        void conservesMoney() {
            order.setPlatformDiscountAmount(vnd(100_000));
            escrow.setAmount(vnd(930_000));
            escrowWallet.setLockedBalance(vnd(930_000));
            escrowWallet.setAvailableBalance(vnd(500_000)); // doanh thu cũ của sàn

            escrowService.releaseByOrder(orderId);

            BigDecimal platformDelta = escrowWallet.getAvailableBalance().subtract(vnd(500_000));
            BigDecimal paidToCarrier = savedTransactionsByKey().get("SHIPPING_RETAIN").getAmount();
            assertEquals(vnd(930_000), sellerWallet.getAvailableBalance().add(platformDelta).add(paidToCarrier));
            assertEquals(0, escrowWallet.getLockedBalance().signum());
        }

        @Test
        @DisplayName("Voucher sàn không làm giảm thu nhập của shop: sàn bù phần giảm giá")
        void platformVoucherIsSubsidisedByPlatform() {
            order.setPlatformDiscountAmount(vnd(100_000));
            escrow.setAmount(vnd(930_000)); // khách trả ít hơn 100.000đ
            escrowWallet.setLockedBalance(vnd(930_000));
            escrowWallet.setAvailableBalance(vnd(500_000));

            escrowService.releaseByOrder(orderId);

            assertEquals(vnd(950_000), sellerWallet.getAvailableBalance(), "Shop nhận như khi không có voucher");
            // Sàn: +50.000 hoa hồng -100.000 trợ giá = -50.000 (ship 30.000 không phải doanh thu)
            assertEquals(vnd(450_000), escrowWallet.getAvailableBalance());
            assertEquals(0, escrowWallet.getLockedBalance().signum());
        }

        @Test
        @DisplayName("Hoa hồng không vượt quá tiền hàng: shop nhận 0 chứ không bị âm")
        void commissionCappedAtMerchandise() {
            order.setPlatformCommission(vnd(5_000_000));

            escrowService.releaseByOrder(orderId);

            assertEquals(0, sellerWallet.getAvailableBalance().signum());
            assertEquals(vnd(1_000_000), escrowWallet.getAvailableBalance(), "Sàn chỉ nhận tối đa tiền hàng, không nhận ship");
            assertEquals(0, escrowWallet.getLockedBalance().signum());
            assertEquals(vnd(1_000_000), savedTransactionsByKey().get("COMMISSION").getAmount());
        }

        @Test
        @DisplayName("Đơn không có ship, hoa hồng hay voucher: shop nhận trọn")
        void nothingToDeduct() {
            order.setShippingFee(null);
            order.setPlatformCommission(null);
            escrow.setAmount(vnd(1_000_000));

            escrowService.releaseByOrder(orderId);

            assertEquals(vnd(1_000_000), sellerWallet.getAvailableBalance());
            assertEquals(0, escrowWallet.getAvailableBalance().signum());
            assertEquals(List.of("ESCROW"), List.copyOf(savedTransactionsByKey().keySet()));
        }
    }

    @Nested
    @DisplayName("Phí ship trả ra cho GHN")
    class ShippingPaidOut {

        @Test
        @DisplayName("Ship được ghi là giao dịch SHIPPING_FEE trả ra ngoài, không vào ví nào và không vào doanh thu sàn")
        void shippingIsPaidOutNotRevenue() {
            escrowService.releaseByOrder(orderId);

            Transaction ship = savedTransactionsByKey().get("SHIPPING_RETAIN");
            assertEquals(TransactionType.SHIPPING_FEE, ship.getType());
            assertEquals(vnd(30_000), ship.getAmount());
            assertSame(escrowWallet, ship.getFromWallet());
            assertNull(ship.getToWallet(), "Tiền trả ra cho GHN, không vào ví nội bộ");
            assertEquals(vnd(50_000), escrowWallet.getAvailableBalance());
        }

        @Test
        @DisplayName("Đơn miễn ship thì không có giao dịch phí vận chuyển")
        void freeShippingHasNoShippingTransaction() {
            order.setShippingFee(BigDecimal.ZERO);
            escrow.setAmount(vnd(1_000_000));
            escrowWallet.setLockedBalance(vnd(1_000_000));

            escrowService.releaseByOrder(orderId);

            assertEquals(0, escrowWallet.getLockedBalance().signum());
            assertFalse(savedTransactionsByKey().containsKey("SHIPPING_RETAIN"));
        }

        @Test
        @DisplayName("Ship không bao giờ vượt quá số tiền ký quỹ")
        void shippingCappedAtEscrowAmount() {
            order.setShippingFee(vnd(5_000_000));

            escrowService.releaseByOrder(orderId);

            assertEquals(vnd(1_030_000), savedTransactionsByKey().get("SHIPPING_RETAIN").getAmount());
            assertEquals(0, sellerWallet.getAvailableBalance().signum());
        }
    }

    @Nested
    @DisplayName("Sổ cái giao dịch")
    class Ledger {

        @Test
        @DisplayName("Ghi giao dịch giải ngân, hoa hồng, phí ship và trợ giá voucher với khóa chống trùng")
        void recordsEachMovement() {
            order.setPlatformDiscountAmount(vnd(100_000));
            escrow.setAmount(vnd(930_000));
            escrowWallet.setLockedBalance(vnd(930_000));

            escrowService.releaseByOrder(orderId);

            Map<String, Transaction> txs = savedTransactionsByKey();
            assertEquals(4, txs.size());

            Transaction release = txs.get("ESCROW");
            assertEquals(TransactionType.RELEASE, release.getType());
            assertEquals(vnd(950_000), release.getAmount());
            assertSame(sellerWallet, release.getToWallet());
            assertEquals("ESCROW:" + orderId, release.getDedupeKey());
            assertEquals(ReferenceType.ESCROW, release.getReferenceType());
            assertEquals(escrow.getId(), release.getReferenceId());

            assertEquals(TransactionType.COMMISSION, txs.get("COMMISSION").getType());
            assertEquals(vnd(50_000), txs.get("COMMISSION").getAmount());
            assertEquals(vnd(30_000), txs.get("SHIPPING_RETAIN").getAmount());
            assertEquals(TransactionType.SHIPPING_FEE, txs.get("SHIPPING_RETAIN").getType(),
                    "Ship được ghi bằng loại giao dịch riêng, không lẫn với doanh thu sàn");
            assertEquals(vnd(100_000), txs.get("PLATFORM_SUBSIDY").getAmount());
            assertSame(sellerWallet, txs.get("PLATFORM_SUBSIDY").getToWallet());
        }

        @Test
        @DisplayName("Bỏ qua giao dịch đã ghi trước đó")
        void skipsDuplicates() {
            when(transactionRepository.existsByDedupeKey("ESCROW:" + orderId)).thenReturn(true);
            when(transactionRepository.existsByDedupeKey("COMMISSION:" + orderId)).thenReturn(true);

            escrowService.releaseByOrder(orderId);

            assertEquals(List.of("SHIPPING_RETAIN"), List.copyOf(savedTransactionsByKey().keySet()));
        }
    }

    @Nested
    @DisplayName("Điều kiện giải ngân")
    class Preconditions {

        @ParameterizedTest
        @EnumSource(value = OrderStatus.class, names = {"DELIVERED", "COMPLETED"}, mode = EnumSource.Mode.EXCLUDE)
        @DisplayName("Chỉ giải ngân đơn đã giao hoặc đã hoàn tất")
        void rejectsOrderNotDelivered(OrderStatus status) {
            order.setStatus(status);

            CustomException ex = assertThrows(CustomException.class, () -> escrowService.releaseByOrder(orderId));

            assertTrue(ex.getMessage().contains(status.name()));
            verifyNoInteractions(walletRepository);
        }

        @ParameterizedTest
        @EnumSource(value = EscrowStatus.class, names = {"HELD", "DISPUTED", "RELEASED"}, mode = EnumSource.Mode.EXCLUDE)
        @DisplayName("Không giải ngân ký quỹ đã hoàn tiền hoặc đang xử lý dở")
        void rejectsEscrowInOtherStates(EscrowStatus status) {
            escrow.setStatus(status);

            assertThrows(CustomException.class, () -> escrowService.releaseByOrder(orderId));
            assertEquals(0, sellerWallet.getAvailableBalance().signum());
        }

        @Test
        @DisplayName("Giải ngân được ký quỹ đang tranh chấp (sau khi admin xử lý cho shop)")
        void releasesDisputedEscrow() {
            escrow.setStatus(EscrowStatus.DISPUTED);
            escrowService.releaseByOrder(orderId);
            assertEquals(EscrowStatus.RELEASED, escrow.getStatus());
        }

        @Test
        @DisplayName("Báo lỗi khi không có đơn, ký quỹ hoặc ví ký quỹ hệ thống")
        void rejectsMissingRecords() {
            when(walletRepository.findSystemWalletForUpdate(WalletType.ESCROW)).thenReturn(Optional.empty());
            assertThrows(CustomException.class, () -> escrowService.releaseByOrder(orderId));

            when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.empty());
            assertThrows(CustomException.class, () -> escrowService.releaseByOrder(orderId));

            when(orderRepository.findById(orderId)).thenReturn(Optional.empty());
            assertThrows(CustomException.class, () -> escrowService.releaseByOrder(orderId));
            assertEquals(0, sellerWallet.getAvailableBalance().signum());
        }

        @Test
        @DisplayName("Báo lỗi khi số tiền ký quỹ không hợp lệ")
        void rejectsInvalidAmount() {
            escrow.setAmount(BigDecimal.ZERO);
            assertThrows(CustomException.class, () -> escrowService.releaseByOrder(orderId));
            verify(walletRepository, never()).saveAll(any());
        }

        @Test
        @DisplayName("Tạo ví cho shop nếu shop chưa có ví")
        void createsSellerWalletWhenMissing() {
            when(walletRepository.findByUserIdForUpdate(seller.getId())).thenReturn(Optional.empty());

            escrowService.releaseByOrder(orderId);

            ArgumentCaptor<Wallet> captor = ArgumentCaptor.forClass(Wallet.class);
            verify(walletRepository).save(captor.capture());
            Wallet created = captor.getValue();
            assertSame(seller, created.getUser());
            assertEquals(WalletType.USER, created.getWalletType());
            assertEquals("VND", created.getCurrency());
            assertEquals(vnd(950_000), created.getAvailableBalance());
        }
    }

    @Nested
    @DisplayName("Idempotent")
    class Idempotency {

        @Test
        @DisplayName("Ký quỹ đã giải ngân: không làm gì")
        void alreadyReleased() {
            escrow.setStatus(EscrowStatus.RELEASED);

            escrowService.releaseByOrder(orderId);

            verifyNoInteractions(walletRepository);
            verify(transactionRepository, never()).save(any());
            verify(orderRepository, never()).save(any());
        }

        @Test
        @DisplayName("Đã có giao dịch giải ngân nhưng trạng thái chưa cập nhật: chỉ sửa trạng thái, không trả tiền lần hai")
        void repairsStatusWithoutPayingTwice() {
            when(transactionRepository.existsByReferenceTypeAndReferenceIdAndType(
                    ReferenceType.ESCROW, escrow.getId(), TransactionType.RELEASE)).thenReturn(true);

            escrowService.releaseByOrder(orderId);

            assertEquals(EscrowStatus.RELEASED, escrow.getStatus());
            assertEquals(OrderStatus.COMPLETED, order.getStatus());
            verify(orderRepository).save(order);
            verifyNoInteractions(walletRepository);
            verify(transactionRepository, never()).save(any());
        }

        @Test
        @DisplayName("Đơn đã COMPLETED thì không lưu lại đơn khi chỉ sửa trạng thái ký quỹ")
        void completedOrderNotSavedAgain() {
            order.setStatus(OrderStatus.COMPLETED);
            when(transactionRepository.existsByReferenceTypeAndReferenceIdAndType(any(), any(), any())).thenReturn(true);

            escrowService.releaseByOrder(orderId);

            verify(escrowRepository).save(escrow);
            verify(orderRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Thanh toán khi nhận hàng (COD)")
    class CashOnDelivery {

        @Test
        @DisplayName("Đánh dấu thanh toán COD là thành công khi giải ngân")
        void marksCodPaymentSuccessful() {
            order.setPaymentMethod(PaymentMethod.COD);
            Payment payment = Payment.builder().id(UUID.randomUUID()).status(PaymentStatus.PENDING).build();
            when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.of(payment));

            escrowService.releaseByOrder(orderId);

            assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
            assertNotNull(payment.getUpdatedAt());
            verify(paymentRepository).save(payment);
        }

        @Test
        @DisplayName("Không lưu lại thanh toán COD đã thành công")
        void leavesSuccessfulPaymentAlone() {
            order.setPaymentMethod(PaymentMethod.COD);
            Payment payment = Payment.builder().id(UUID.randomUUID()).status(PaymentStatus.SUCCESS).build();
            when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.of(payment));

            escrowService.releaseByOrder(orderId);

            verify(paymentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Không đụng tới bảng thanh toán với đơn trả trước")
        void ignoresPrepaidOrders() {
            escrowService.releaseByOrder(orderId);
            verify(paymentRepository, never()).findByOrderId(eq(orderId));
        }
    }
}
