package com.marketplace.ecommerce.shop.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.repository.OrderReturnRepository;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.entity.Transaction;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.repository.TransactionRepository;
import com.marketplace.ecommerce.payment.valueObjects.ReferenceType;
import com.marketplace.ecommerce.payment.valueObjects.TransactionStatus;
import com.marketplace.ecommerce.payment.valueObjects.TransactionType;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.shop.dto.request.AdminDeductCompensationRequest;
import com.marketplace.ecommerce.shop.dto.response.ShopEscrowFundResponse;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.entity.ShopEscrowFund;
import com.marketplace.ecommerce.shop.entity.ShopEscrowTransaction;
import com.marketplace.ecommerce.shop.entity.TrustLevelConfig;
import com.marketplace.ecommerce.shop.repository.ShopEscrowFundRepository;
import com.marketplace.ecommerce.shop.repository.ShopEscrowTransactionRepository;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.TrustLevelConfigService;
import com.marketplace.ecommerce.shop.valueObjects.EscrowFundStatus;
import com.marketplace.ecommerce.shop.valueObjects.EscrowFundTransactionType;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import com.marketplace.ecommerce.product.service.ProductService;
import com.marketplace.ecommerce.voucher.service.VoucherService;
import com.marketplace.ecommerce.wallet.entity.Wallet;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShopEscrowFundServiceImplTest {

        @Mock
        private ShopEscrowFundRepository shopEscrowFundRepository;

        @Mock
        private ShopEscrowTransactionRepository shopEscrowTransactionRepository;

        @Mock
        private ShopRepository shopRepository;

        @Mock
        private TrustLevelConfigService trustLevelConfigService;

        @Mock
        private WalletRepository walletRepository;

        @Mock
        private OrderRepository orderRepository;

        @Mock
        private TransactionRepository transactionRepository;

        @Mock
        private EscrowRepository escrowRepository;

        @Mock
        private OrderReturnRepository orderReturnRepository;

        @Mock
        private ReportRepository reportRepository;

        @Mock
        private RequestRepository requestRepository;

        @Mock
        private VoucherService voucherService;

        @Mock
        private ProductService productService;

        @InjectMocks
        private ShopEscrowFundServiceImpl shopEscrowFundService;

        private UUID shopId;
        private UUID buyerId;
        private UUID sellerId;
        private UUID orderId;
        private Shop shop;
        private ShopEscrowFund fund;
        private User buyer;
        private User seller;
        private Wallet buyerWallet;
        private Wallet sellerWallet;
        private Order order;

        @BeforeEach
        void setUp() {
                shopId = UUID.randomUUID();
                buyerId = UUID.randomUUID();
                sellerId = UUID.randomUUID();
                orderId = UUID.randomUUID();

                seller = new User();
                seller.setId(sellerId);
                seller.setAccount(Account.builder().id(UUID.randomUUID()).build());

                buyer = new User();
                buyer.setId(buyerId);
                buyer.setAccount(Account.builder().id(UUID.randomUUID()).build());

                shop = Shop.builder()
                                .id(shopId)
                                .user(seller)
                                .name("Test Shop")
                                .status(ShopStatus.ACTIVE)
                                .build();

                fund = ShopEscrowFund.builder()
                                .id(UUID.randomUUID())
                                .shop(shop)
                                .balance(new BigDecimal("5000000"))
                                .committedAmount(new BigDecimal("5000000"))
                                .currentTrustLevel(1)
                                .status(EscrowFundStatus.ACTIVE)
                                .isDeficit(false)
                                .deficitAmount(BigDecimal.ZERO)
                                .build();

                buyerWallet = Wallet.builder()
                                .id(UUID.randomUUID())
                                .user(buyer)
                                .availableBalance(BigDecimal.ZERO)
                                .lockedBalance(BigDecimal.ZERO)
                                .build();

                sellerWallet = Wallet.builder()
                                .id(UUID.randomUUID())
                                .user(seller)
                                .availableBalance(BigDecimal.ZERO)
                                .lockedBalance(BigDecimal.ZERO)
                                .build();

                order = Order.builder()
                                .id(orderId)
                                .shop(shop)
                                .user(buyer)
                                .total(new BigDecimal("1000000"))
                                .build();

                lenient().when(shopEscrowFundRepository.save(any(ShopEscrowFund.class)))
                                .thenAnswer(inv -> inv.getArgument(0));
                lenient().when(shopEscrowTransactionRepository.save(any(ShopEscrowTransaction.class)))
                                .thenAnswer(inv -> inv.getArgument(0));

                TrustLevelConfig tier1 = TrustLevelConfig.builder()
                                .starLevel(1)
                                .minDeposit(new BigDecimal("1000000"))
                                .tierName("1 Sao")
                                .build();
                lenient().when(trustLevelConfigService.getConfigByStarLevel(anyInt())).thenReturn(tier1);
        }

        @Test
        @DisplayName("Trích bồi thường thành công cho Người mua trong hạn mức")
        void deductCompensation_Success() {
                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));
                when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
                when(walletRepository.findByUserIdForUpdate(buyerId)).thenReturn(Optional.of(buyerWallet));

                // Dedupe key check
                String dedupeKey = "COMPENSATION:ORDER:" + orderId + ":CLIENT-REQ-1";
                when(transactionRepository.existsByDedupeKey(dedupeKey)).thenReturn(false);

                // refundAlreadyPaid: 200,000 via Escrow
                UUID escrowId = UUID.randomUUID();
                Escrow escrow = Escrow.builder().id(escrowId).order(order).build();
                when(escrowRepository.findByOrderId(orderId)).thenReturn(Optional.of(escrow));

                Transaction refundTx = Transaction.builder()
                                .id(UUID.randomUUID())
                                .amount(new BigDecimal("200000"))
                                .type(TransactionType.REFUND)
                                .status(TransactionStatus.SUCCESS)
                                .toWallet(buyerWallet)
                                .build();
                when(transactionRepository.findByReferenceTypeAndReferenceId(eq(ReferenceType.ESCROW), eq(escrowId)))
                                .thenReturn(Collections.singletonList(refundTx));

                // compensationAlreadyPaid: 100,000
                when(shopEscrowTransactionRepository.sumCompensationByOrderId(orderId))
                                .thenReturn(new BigDecimal("100000"));

                AdminDeductCompensationRequest req = AdminDeductCompensationRequest.builder()
                                .orderId(orderId)
                                .amount(new BigDecimal("400000"))
                                .reason("Giao sai hàng, bồi thường người mua")
                                .clientRequestId("CLIENT-REQ-1")
                                .build();

                ShopEscrowTransaction tx = shopEscrowFundService.deductCompensation(shopId, req);

                assertNotNull(tx);
                assertEquals(EscrowFundTransactionType.COMPENSATION_DEDUCTION, tx.getTransactionType());
                assertEquals(new BigDecimal("-400000"), tx.getAmount());
                assertEquals(new BigDecimal("4600000"), fund.getBalance());
                assertEquals(new BigDecimal("400000"), buyerWallet.getAvailableBalance());

                // Verify ledger transaction recorded
                ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
                verify(transactionRepository).save(captor.capture());
                Transaction ledgerTx = captor.getValue();
                assertEquals(TransactionType.COMPENSATION, ledgerTx.getType());
                assertEquals(ReferenceType.ORDER, ledgerTx.getReferenceType());
                assertEquals(orderId, ledgerTx.getReferenceId());
                assertEquals(new BigDecimal("400000"), ledgerTx.getAmount());
                assertEquals(dedupeKey, ledgerTx.getDedupeKey());
        }

        @Test
        @DisplayName("Trích bồi thường một phần (Partial) khi Quỹ không đủ số dư -> kích hoạt DEFICIT")
        void deductCompensation_PartialDeficit() {
                fund.setBalance(new BigDecimal("300000"));
                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));
                when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
                when(walletRepository.findByUserIdForUpdate(buyerId)).thenReturn(Optional.of(buyerWallet));

                String dedupeKey = "COMPENSATION:ORDER:" + orderId + ":CLIENT-REQ-PARTIAL";
                when(transactionRepository.existsByDedupeKey(dedupeKey)).thenReturn(false);
                when(escrowRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
                when(shopEscrowTransactionRepository.sumCompensationByOrderId(orderId))
                                .thenReturn(BigDecimal.ZERO);

                AdminDeductCompensationRequest req = AdminDeductCompensationRequest.builder()
                                .orderId(orderId)
                                .amount(new BigDecimal("800000"))
                                .reason("Bồi thường toàn bộ nhưng quỹ chỉ còn 300k")
                                .clientRequestId("CLIENT-REQ-PARTIAL")
                                .build();

                ShopEscrowTransaction tx = shopEscrowFundService.deductCompensation(shopId, req);

                assertNotNull(tx);
                // actualDeduct = min(800k, 1m, 300k) = 300k
                assertEquals(new BigDecimal("-300000"), tx.getAmount());
                assertEquals(BigDecimal.ZERO, fund.getBalance());
                assertEquals(new BigDecimal("300000"), buyerWallet.getAvailableBalance());

                // Fund should enter DEFICIT
                assertTrue(fund.getIsDeficit());
                assertEquals(EscrowFundStatus.DEFICIT, fund.getStatus());
                assertNotNull(fund.getDeficitDeadline());
        }

        @Test
        @DisplayName("Từ chối trích bồi thường nếu tổng bồi hoàn đã đạt cap giá trị đơn hàng")
        void deductCompensation_ExceedsCap_Rejected() {
                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));
                when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
                when(walletRepository.findByUserIdForUpdate(buyerId)).thenReturn(Optional.of(buyerWallet));

                String dedupeKey = "COMPENSATION:ORDER:" + orderId + ":CLIENT-REQ-CAP";
                when(transactionRepository.existsByDedupeKey(dedupeKey)).thenReturn(false);

                // Đã refund 1,000,000 (hết sạch recoverable) qua Escrow
                UUID escrowId = UUID.randomUUID();
                Escrow escrow = Escrow.builder().id(escrowId).order(order).build();
                when(escrowRepository.findByOrderId(orderId)).thenReturn(Optional.of(escrow));

                Transaction refundTx = Transaction.builder()
                                .id(UUID.randomUUID())
                                .amount(new BigDecimal("1000000"))
                                .type(TransactionType.REFUND)
                                .status(TransactionStatus.SUCCESS)
                                .toWallet(buyerWallet)
                                .build();
                when(transactionRepository.findByReferenceTypeAndReferenceId(eq(ReferenceType.ESCROW), eq(escrowId)))
                                .thenReturn(Collections.singletonList(refundTx));
                when(shopEscrowTransactionRepository.sumCompensationByOrderId(orderId))
                                .thenReturn(BigDecimal.ZERO);

                AdminDeductCompensationRequest req = AdminDeductCompensationRequest.builder()
                                .orderId(orderId)
                                .amount(new BigDecimal("200000"))
                                .reason("Bồi thường vượt hạn mức đơn")
                                .clientRequestId("CLIENT-REQ-CAP")
                                .build();

                CustomException ex = assertThrows(CustomException.class,
                                () -> shopEscrowFundService.deductCompensation(shopId, req));
                assertTrue(ex.getMessage().contains("Đơn hàng đã được hoàn tiền/bồi thường tối đa"));
        }

        @Test
        @DisplayName("Seller yêu cầu đóng shop thành công -> Shop chuyển INACTIVE, Fund chuyển REFUND_PENDING")
        void requestCloseShopAndRefund_Success() {
                when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
                when(shopEscrowFundRepository.findByShopId(shopId)).thenReturn(Optional.of(fund));
                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));

                // Preconditions check: không có đơn active, escrow, return, report pending
                when(orderRepository.existsByShopIdAndStatusIn(eq(shopId), any())).thenReturn(false);
                when(orderRepository.existsCompletedOrderWithinCoolingPeriod(eq(shopId), any())).thenReturn(false);
                when(escrowRepository.existsByOrderShopIdAndStatusIn(eq(shopId), any())).thenReturn(false);
                when(orderReturnRepository.existsByOrderShopIdAndStatusIn(eq(shopId), any())).thenReturn(false);
                when(reportRepository.existsPendingReportsForShop(shopId)).thenReturn(false);
                when(requestRepository.existsByAccountIdAndTypeAndStatus(any(), eq(RequestType.APPEAL),
                                eq(RequestStatus.PENDING))).thenReturn(false);

                ShopEscrowFundResponse res = shopEscrowFundService.requestCloseShopAndRefund(shopId);

                assertNotNull(res);
                assertEquals(ShopStatus.INACTIVE, shop.getStatus());
                assertEquals(EscrowFundStatus.REFUND_PENDING, fund.getStatus());
        }

        @Test
        @DisplayName("Admin phê duyệt đóng shop & hoàn quỹ -> Shop chuyển CLOSED, Fund chuyển REFUNDED, tiền về Ví Seller")
        void adminApproveCloseShopRefund_Success() {
                fund.setStatus(EscrowFundStatus.REFUND_PENDING);
                fund.setBalance(new BigDecimal("5000000"));
                shop.setStatus(ShopStatus.INACTIVE);

                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));
                when(walletRepository.findByUserIdForUpdate(sellerId)).thenReturn(Optional.of(sellerWallet));

                // Preconditions revalidation
                when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
                when(shopEscrowFundRepository.findByShopId(shopId)).thenReturn(Optional.of(fund));
                when(orderRepository.existsByShopIdAndStatusIn(eq(shopId), any())).thenReturn(false);
                when(orderRepository.existsCompletedOrderWithinCoolingPeriod(eq(shopId), any())).thenReturn(false);
                when(escrowRepository.existsByOrderShopIdAndStatusIn(eq(shopId), any())).thenReturn(false);
                when(orderReturnRepository.existsByOrderShopIdAndStatusIn(eq(shopId), any())).thenReturn(false);
                when(reportRepository.existsPendingReportsForShop(shopId)).thenReturn(false);
                when(requestRepository.existsByAccountIdAndTypeAndStatus(any(), eq(RequestType.APPEAL),
                                eq(RequestStatus.PENDING))).thenReturn(false);

                ShopEscrowFundResponse res = shopEscrowFundService.adminApproveCloseShopRefund(shopId);

                assertNotNull(res);
                assertEquals(BigDecimal.ZERO, fund.getBalance());
                assertEquals(EscrowFundStatus.REFUNDED, fund.getStatus());
                assertEquals(ShopStatus.CLOSED, shop.getStatus());
                assertEquals(new BigDecimal("5000000"), sellerWallet.getAvailableBalance());

                // Verify ShopEscrowTransaction recorded WITHDRAWAL_ON_CLOSE
                verify(shopEscrowTransactionRepository).save(any(ShopEscrowTransaction.class));
                // Verify Wallet Transaction recorded REFUND
                verify(transactionRepository).save(any(Transaction.class));
                // Verify vouchers and products deactivated on shop close via domain services
                verify(voucherService).deactivateVouchersOnShopClose(shopId);
                verify(productService).deactivateProductsOnShopClose(shopId);
        }

        @Test
        @DisplayName("Admin từ chối đóng shop -> Shop và Fund phục hồi ACTIVE")
        void adminRejectCloseShopRefund_Success() {
                fund.setStatus(EscrowFundStatus.REFUND_PENDING);
                shop.setStatus(ShopStatus.INACTIVE);

                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));

                ShopEscrowFundResponse res = shopEscrowFundService.adminRejectCloseShopRefund(shopId,
                                "Chưa hoàn tất kiểm kê kho hàng");

                assertNotNull(res);
                assertEquals(EscrowFundStatus.ACTIVE, fund.getStatus());
                assertEquals(ShopStatus.ACTIVE, shop.getStatus());
        }
}
