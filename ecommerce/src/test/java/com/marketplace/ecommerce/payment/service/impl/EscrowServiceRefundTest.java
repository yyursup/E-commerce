package com.marketplace.ecommerce.payment.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.entity.Transaction;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.repository.PaymentRepository;
import com.marketplace.ecommerce.payment.repository.TransactionRepository;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.payment.valueObjects.PaymentMethod;
import com.marketplace.ecommerce.payment.valueObjects.ReferenceType;
import com.marketplace.ecommerce.payment.valueObjects.TransactionStatus;
import com.marketplace.ecommerce.payment.valueObjects.TransactionType;
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
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Hoàn tiền ký quỹ: hoàn toàn bộ (refundByOrder) và hoàn tiền hàng, sàn giữ phí ship (refundMerchandiseOnly).
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EscrowServiceRefundTest {

    private static final BigDecimal TOTAL = BigDecimal.valueOf(530_000);
    private static final BigDecimal SHIPPING = BigDecimal.valueOf(30_000);

    @Mock private EscrowRepository escrowRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private WalletRepository walletRepository;
    @Mock private PaymentRepository paymentRepository;

    @InjectMocks private EscrowServiceImpl escrowService;

    private UUID orderId;
    private Order order;
    private Escrow escrow;
    private Wallet escrowWallet;
    private Wallet buyerWallet;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        User buyer = User.builder().id(UUID.randomUUID()).fullName("Nguyễn Văn Mua").build();

        escrowWallet = Wallet.builder().id(UUID.randomUUID()).walletType(WalletType.ESCROW)
                .lockedBalance(TOTAL).availableBalance(BigDecimal.ZERO).build();
        buyerWallet = Wallet.builder().id(UUID.randomUUID()).user(buyer).walletType(WalletType.USER)
                .lockedBalance(BigDecimal.ZERO).availableBalance(BigDecimal.ZERO).build();

        order = Order.builder().id(orderId).orderNumber("ORD-REFUND-1").status(OrderStatus.DELIVERED)
                .paymentMethod(PaymentMethod.VNPAY).shippingFee(SHIPPING).total(TOTAL).user(buyer).build();

        escrow = Escrow.builder().id(UUID.randomUUID()).order(order).amount(TOTAL).status(EscrowStatus.HELD)
                .escrowWallet(escrowWallet).buyerWallet(buyerWallet).build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        when(transactionRepository.existsByDedupeKey(anyString())).thenReturn(false);
    }

    private List<Transaction> savedTransactions() {
        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, atLeast(0)).save(captor.capture());
        return captor.getAllValues();
    }

    @Nested
    @DisplayName("refundByOrder: hoàn 100% tiền ký quỹ về ví người mua")
    class RefundByOrder {

        @ParameterizedTest
        @EnumSource(value = EscrowStatus.class, names = {"HELD", "DISPUTED"})
        @DisplayName("Chuyển toàn bộ tiền đang khóa sang số dư khả dụng của người mua")
        void movesWholeAmountToBuyer(EscrowStatus status) {
            escrow.setStatus(status);

            escrowService.refundByOrder(orderId, null);

            assertEquals(0, escrowWallet.getLockedBalance().signum());
            assertEquals(0, escrowWallet.getAvailableBalance().signum(), "Sàn không giữ lại đồng nào");
            assertEquals(TOTAL, buyerWallet.getAvailableBalance());
            assertEquals(EscrowStatus.REFUNDED, escrow.getStatus());
            assertNotNull(escrow.getUpdatedAt());
            assertEquals(OrderStatus.REFUNDED, order.getStatus());
            verify(walletRepository).saveAll(List.of(escrowWallet, buyerWallet));
            verify(escrowRepository).save(escrow);
            verify(orderRepository).save(order);
        }

        @Test
        @DisplayName("Ghi một giao dịch REFUND có khóa chống trùng theo mã đơn")
        void recordsRefundTransaction() {
            escrowService.refundByOrder(orderId, null);

            List<Transaction> txs = savedTransactions();
            assertEquals(1, txs.size());
            Transaction tx = txs.get(0);
            assertEquals(TransactionType.REFUND, tx.getType());
            assertEquals(TransactionStatus.SUCCESS, tx.getStatus());
            assertEquals(ReferenceType.ESCROW, tx.getReferenceType());
            assertEquals(escrow.getId(), tx.getReferenceId());
            assertEquals(TOTAL, tx.getAmount());
            assertSame(escrowWallet, tx.getFromWallet());
            assertSame(buyerWallet, tx.getToWallet());
            assertEquals("ESCROW_REFUND:" + orderId, tx.getDedupeKey());
            assertTrue(tx.getNote().contains("ORD-REFUND-1"), "Ghi chú mặc định nêu mã đơn");
        }

        @Test
        @DisplayName("Dùng lý do do admin nhập làm ghi chú giao dịch")
        void usesGivenReasonAsNote() {
            escrowService.refundByOrder(orderId, "Shop lừa đảo, hoàn 100%");
            assertEquals("Shop lừa đảo, hoàn 100%", savedTransactions().get(0).getNote());
        }

        @Test
        @DisplayName("Không ghi trùng giao dịch khi đã có khóa chống trùng, nhưng vẫn chốt trạng thái")
        void skipsDuplicateTransaction() {
            when(transactionRepository.existsByDedupeKey("ESCROW_REFUND:" + orderId)).thenReturn(true);

            escrowService.refundByOrder(orderId, null);

            verify(transactionRepository, never()).save(any());
            assertEquals(EscrowStatus.REFUNDED, escrow.getStatus());
        }

        @Test
        @DisplayName("Gọi lại khi đã hoàn tiền thì không làm gì (idempotent)")
        void idempotentWhenAlreadyRefunded() {
            escrow.setStatus(EscrowStatus.REFUNDED);

            escrowService.refundByOrder(orderId, null);

            assertEquals(0, buyerWallet.getAvailableBalance().signum());
            assertEquals(TOTAL, escrowWallet.getLockedBalance());
            verifyNoInteractions(walletRepository);
            verify(transactionRepository, never()).save(any());
            verify(orderRepository, never()).save(any());
        }

        @ParameterizedTest
        @EnumSource(value = EscrowStatus.class, names = {"HELD", "DISPUTED", "REFUNDED"}, mode = EnumSource.Mode.EXCLUDE)
        @DisplayName("Từ chối hoàn tiền khi ký quỹ đã giải ngân hoặc ở trạng thái khác")
        void rejectsOtherStatuses(EscrowStatus status) {
            escrow.setStatus(status);

            CustomException ex = assertThrows(CustomException.class, () -> escrowService.refundByOrder(orderId, null));

            assertTrue(ex.getMessage().contains(status.name()));
            assertEquals(0, buyerWallet.getAvailableBalance().signum());
            verifyNoInteractions(walletRepository);
        }

        @Test
        @DisplayName("Báo lỗi khi không tìm thấy đơn hoặc ký quỹ")
        void rejectsMissingOrderOrEscrow() {
            UUID unknown = UUID.randomUUID();
            when(orderRepository.findById(unknown)).thenReturn(Optional.empty());
            assertThrows(CustomException.class, () -> escrowService.refundByOrder(unknown, null));

            when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.empty());
            assertThrows(CustomException.class, () -> escrowService.refundByOrder(orderId, null));
        }

        @Test
        @DisplayName("Báo lỗi khi thiếu ví ký quỹ hoặc ví người mua")
        void rejectsMissingWallets() {
            escrow.setEscrowWallet(null);
            assertThrows(CustomException.class, () -> escrowService.refundByOrder(orderId, null));

            escrow.setEscrowWallet(escrowWallet);
            escrow.setBuyerWallet(null);
            assertThrows(CustomException.class, () -> escrowService.refundByOrder(orderId, null));
            verifyNoInteractions(walletRepository);
        }

        @Test
        @DisplayName("Báo lỗi khi số tiền ký quỹ rỗng hoặc bằng 0")
        void rejectsInvalidAmount() {
            escrow.setAmount(null);
            assertThrows(CustomException.class, () -> escrowService.refundByOrder(orderId, null));

            escrow.setAmount(BigDecimal.ZERO);
            assertThrows(CustomException.class, () -> escrowService.refundByOrder(orderId, null));
            verifyNoInteractions(walletRepository);
        }

        @Test
        @DisplayName("Ví ký quỹ khóa thiếu tiền: vẫn hoàn đủ và không để số dư khóa bị âm")
        void lockedBalanceShortfallDoesNotGoNegative() {
            escrowWallet.setLockedBalance(BigDecimal.valueOf(100_000));

            escrowService.refundByOrder(orderId, null);

            // Hành vi hiện tại: số dư khóa được nâng lên bằng số tiền ký quỹ trước khi trừ.
            assertEquals(0, escrowWallet.getLockedBalance().signum());
            assertEquals(TOTAL, buyerWallet.getAvailableBalance());
        }
    }

    @Nested
    @DisplayName("refundMerchandiseOnly: hoàn tiền hàng, sàn giữ phí ship chiều đi trả GHN")
    class RefundMerchandiseOnly {

        @Test
        @DisplayName("Ghi hai giao dịch: hoàn tiền hàng cho người mua và giữ phí ship cho sàn")
        void recordsRefundAndRetainedShipping() {
            escrowService.refundMerchandiseOnly(orderId, null);

            assertEquals(BigDecimal.valueOf(500_000), buyerWallet.getAvailableBalance());
            assertEquals(SHIPPING, escrowWallet.getAvailableBalance());
            assertEquals(0, escrowWallet.getLockedBalance().signum());

            List<Transaction> txs = savedTransactions();
            assertEquals(2, txs.size());

            Transaction refund = txs.stream().filter(t -> t.getType() == TransactionType.REFUND).findFirst().orElseThrow();
            assertEquals(BigDecimal.valueOf(500_000), refund.getAmount());
            assertSame(buyerWallet, refund.getToWallet());
            assertEquals("ESCROW_MERCHANDISE_REFUND:" + orderId, refund.getDedupeKey());

            Transaction retained = txs.stream().filter(t -> t.getType() == TransactionType.RELEASE).findFirst().orElseThrow();
            assertEquals(SHIPPING, retained.getAmount());
            assertSame(escrowWallet, retained.getFromWallet());
            assertSame(escrowWallet, retained.getToWallet());
            assertEquals("ESCROW_SHIP_RETAINED:" + orderId, retained.getDedupeKey());
        }

        @Test
        @DisplayName("Tổng tiền hoàn + phí ship giữ lại luôn bằng số tiền ký quỹ")
        void conservesMoney() {
            escrowService.refundMerchandiseOnly(orderId, null);
            assertEquals(TOTAL, buyerWallet.getAvailableBalance().add(escrowWallet.getAvailableBalance()));
        }

        @Test
        @DisplayName("Đơn miễn phí ship: hoàn toàn bộ cho người mua, không ghi giao dịch giữ phí ship")
        void noShippingFee() {
            order.setShippingFee(null);

            escrowService.refundMerchandiseOnly(orderId, null);

            assertEquals(TOTAL, buyerWallet.getAvailableBalance());
            assertEquals(0, escrowWallet.getAvailableBalance().signum());
            List<Transaction> txs = savedTransactions();
            assertEquals(1, txs.size());
            assertEquals(TransactionType.REFUND, txs.get(0).getType());
        }

        @Test
        @DisplayName("Phí ship lớn hơn tiền ký quỹ: sàn giữ tối đa bằng tiền ký quỹ, người mua nhận 0")
        void shippingCappedAtEscrowAmount() {
            order.setShippingFee(BigDecimal.valueOf(1_000_000));

            escrowService.refundMerchandiseOnly(orderId, null);

            assertEquals(0, buyerWallet.getAvailableBalance().signum());
            assertEquals(TOTAL, escrowWallet.getAvailableBalance());
            List<Transaction> txs = savedTransactions();
            assertEquals(1, txs.size(), "Không ghi giao dịch hoàn tiền 0đ");
            assertEquals(TransactionType.RELEASE, txs.get(0).getType());
        }

        @Test
        @DisplayName("Dùng lý do được truyền vào cho giao dịch hoàn tiền hàng")
        void usesGivenReason() {
            escrowService.refundMerchandiseOnly(orderId, "Khách giữ hàng, giảm giá 100%");
            Transaction refund = savedTransactions().stream()
                    .filter(t -> t.getType() == TransactionType.REFUND).findFirst().orElseThrow();
            assertEquals("Khách giữ hàng, giảm giá 100%", refund.getNote());
        }

        @Test
        @DisplayName("Không ghi trùng giao dịch khi đã có khóa chống trùng")
        void skipsDuplicates() {
            when(transactionRepository.existsByDedupeKey(anyString())).thenReturn(true);

            escrowService.refundMerchandiseOnly(orderId, null);

            verify(transactionRepository, never()).save(any());
            assertEquals(EscrowStatus.REFUNDED, escrow.getStatus());
            assertEquals(OrderStatus.REFUNDED, order.getStatus());
        }

        @Test
        @DisplayName("Gọi lại khi đã hoàn tiền thì không làm gì (idempotent)")
        void idempotentWhenAlreadyRefunded() {
            escrow.setStatus(EscrowStatus.REFUNDED);

            escrowService.refundMerchandiseOnly(orderId, null);

            verifyNoInteractions(walletRepository);
            assertEquals(0, buyerWallet.getAvailableBalance().signum());
        }

        @Test
        @DisplayName("Từ chối khi ký quỹ đã giải ngân cho shop")
        void rejectsReleasedEscrow() {
            escrow.setStatus(EscrowStatus.RELEASED);
            assertThrows(CustomException.class, () -> escrowService.refundMerchandiseOnly(orderId, null));
            verifyNoInteractions(walletRepository);
        }

        @Test
        @DisplayName("Báo lỗi khi thiếu ví hoặc số tiền ký quỹ không hợp lệ")
        void rejectsInvalidState() {
            escrow.setBuyerWallet(null);
            assertThrows(CustomException.class, () -> escrowService.refundMerchandiseOnly(orderId, null));

            escrow.setBuyerWallet(buyerWallet);
            escrow.setAmount(BigDecimal.valueOf(-1));
            assertThrows(CustomException.class, () -> escrowService.refundMerchandiseOnly(orderId, null));
            verifyNoInteractions(walletRepository);
        }
    }
}
