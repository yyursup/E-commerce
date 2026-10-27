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
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.config.VNPayConfig;
import com.marketplace.ecommerce.notification.repository.NotificationRepository;
import com.marketplace.ecommerce.payment.service.VNPayService;
import com.marketplace.ecommerce.shop.dto.request.AdminAdjustEscrowFundRequest;
import com.marketplace.ecommerce.shop.dto.request.TopUpEscrowFundRequest;
import com.marketplace.ecommerce.shop.dto.response.ShopEscrowTransactionResponse;
import com.marketplace.ecommerce.order.entity.OrderReturn;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.wallet.valueObjects.WalletType;
import com.marketplace.ecommerce.notification.entity.Notification;
import com.marketplace.ecommerce.notification.valueObjects.NotificationType;
import com.marketplace.ecommerce.notification.valueObjects.NotificationStatus;
import com.marketplace.ecommerce.notification.valueObjects.NotificationChannelType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
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

        @Mock
        private UserRepository userRepository;

        @Mock
        private NotificationRepository notificationRepository;

        @Mock
        private VNPayService vnPayService;

        @Mock
        private VNPayConfig vnPayConfig;

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

        @Test
        @DisplayName("getFundByShopId lấy thông tin quỹ ký quỹ của shop")
        void testGetFundByShopId() {
                when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
                when(shopEscrowFundRepository.findByShopId(shopId)).thenReturn(Optional.of(fund));

                ShopEscrowFundResponse res = shopEscrowFundService.getFundByShopId(shopId);
                assertNotNull(res);
                assertEquals(new BigDecimal("5000000"), res.getBalance());

                // Test tạo default fund khi chưa có
                when(shopEscrowFundRepository.findByShopId(shopId)).thenReturn(Optional.empty());
                ShopEscrowFundResponse defaultRes = shopEscrowFundService.getFundByShopId(shopId);
                assertNotNull(defaultRes);
        }

        @Test
        @DisplayName("getFundByAccountId lấy quỹ ký quỹ theo account ID của seller")
        void testGetFundByAccountId() {
                UUID accId = seller.getAccount().getId();
                when(userRepository.findByAccountId(accId)).thenReturn(Optional.of(seller));
                when(shopRepository.findByUserId(seller.getId())).thenReturn(Optional.of(shop));
                when(shopRepository.findById(shop.getId())).thenReturn(Optional.of(shop));
                when(shopEscrowFundRepository.findByShopId(shop.getId())).thenReturn(Optional.of(fund));

                ShopEscrowFundResponse res = shopEscrowFundService.getFundByAccountId(accId);
                assertNotNull(res);
        }

        @Test
        @DisplayName("createInitialFund tạo quỹ ký quỹ ban đầu khi đăng ký gian hàng")
        void testCreateInitialFund() {
                when(shopEscrowFundRepository.save(any(ShopEscrowFund.class))).thenAnswer(i -> i.getArgument(0));

                ShopEscrowFund created = shopEscrowFundService.createInitialFund(shop, new BigDecimal("2000000"), "REG-001");
                assertNotNull(created);
                assertEquals(BigDecimal.ZERO, created.getBalance());
                assertEquals(new BigDecimal("2000000"), created.getCommittedAmount());
        }

        @Test
        @DisplayName("topUpFund nạp thêm tiền vào quỹ ký quỹ và thoát trạng thái DEFICIT nếu đủ bù")
        void testTopUpFund() {
                fund.setIsDeficit(true);
                fund.setDeficitAmount(new BigDecimal("1000000"));
                fund.setStatus(EscrowFundStatus.DEFICIT);

                when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));

                TopUpEscrowFundRequest req = TopUpEscrowFundRequest.builder()
                                .amount(new BigDecimal("2000000"))
                                .paymentMethod("VNPAY")
                                .referenceCode("TXN-TOPUP-01")
                                .note("Nạp bù tiền ký quỹ")
                                .build();

                ShopEscrowFundResponse res = shopEscrowFundService.topUpFund(shopId, req);
                assertNotNull(res);
                assertFalse(fund.getIsDeficit());
                assertEquals(EscrowFundStatus.ACTIVE, fund.getStatus());
                verify(shopEscrowTransactionRepository).save(any(ShopEscrowTransaction.class));
        }

        @Test
        @DisplayName("adminAdjustFund Admin điều chỉnh số dư và hạn mức cam kết của quỹ")
        void testAdminAdjustFund() {
                when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));

                AdminAdjustEscrowFundRequest req = AdminAdjustEscrowFundRequest.builder()
                                .balance(new BigDecimal("6000000"))
                                .committedAmount(new BigDecimal("6000000"))
                                .targetTrustLevel(2)
                                .reason("Thưởng uy tín gian hàng bán tốt")
                                .build();

                ShopEscrowFundResponse res = shopEscrowFundService.adminAdjustFund(shopId, req, UUID.randomUUID());
                assertNotNull(res);
                assertEquals(new BigDecimal("6000000"), fund.getBalance());
                verify(shopEscrowTransactionRepository).save(any(ShopEscrowTransaction.class));
        }

        @Test
        @DisplayName("Lấy danh sách giao dịch ký quỹ phân trang và lấy tất cả quỹ ký quỹ")
        void testPaginationMethods() {
                ShopEscrowTransaction tx = ShopEscrowTransaction.builder()
                                .id(UUID.randomUUID())
                                .fund(fund)
                                .amount(new BigDecimal("1000000"))
                                .transactionType(EscrowFundTransactionType.TOPUP_DEPOSIT)
                                .createdAt(java.time.LocalDateTime.now())
                                .build();

                Page<ShopEscrowTransaction> txPage = new PageImpl<>(List.of(tx));
                when(shopEscrowFundRepository.findByShopId(shopId)).thenReturn(Optional.of(fund));
                when(shopEscrowTransactionRepository.findByFundIdOrderByCreatedAtDesc(eq(fund.getId()), any(Pageable.class)))
                                .thenReturn(txPage);

                Page<ShopEscrowTransactionResponse> page1 = shopEscrowFundService.getTransactionsByShopId(shopId, PageRequest.of(0, 10));
                assertNotNull(page1);
                assertEquals(1, page1.getContent().size());

                Page<ShopEscrowTransactionResponse> page2 = shopEscrowFundService.getTransactionsByFundId(fund.getId(), PageRequest.of(0, 10));
                assertNotNull(page2);

                Page<ShopEscrowFund> fundPage = new PageImpl<>(List.of(fund));
                when(shopEscrowFundRepository.findByStatus(eq(EscrowFundStatus.ACTIVE), any(Pageable.class)))
                                .thenReturn(fundPage);

                Page<ShopEscrowFundResponse> allFunds = shopEscrowFundService.getAllFunds(null, EscrowFundStatus.ACTIVE, PageRequest.of(0, 10));
                assertNotNull(allFunds);
                assertEquals(1, allFunds.getContent().size());
        }

        @Test
        @DisplayName("createVnpayPaymentUrl tạo URL thanh toán VNPay cho nạp ký quỹ")
        void testCreateVnpayPaymentUrl() {
                when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
                when(vnPayService.buildPaymentUrl(anyString(), any(BigDecimal.class), anyString(), any(), anyString()))
                                .thenReturn("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?test=123");

                TopUpEscrowFundRequest req = TopUpEscrowFundRequest.builder()
                                .amount(new BigDecimal("500000"))
                                .build();

                String url = shopEscrowFundService.createVnpayPaymentUrl(shopId, req, "127.0.0.1");
                assertNotNull(url);
                assertTrue(url.contains("sandbox.vnpayment.vn"));
        }

        @Test
        @DisplayName("processVnpayCallback xử lý IPN từ VNPay nạp tiền ký quỹ")
        void testProcessVnpayCallback() {
                when(vnPayService.verifyChecksumFromQueryString(anyString())).thenReturn(true);

                String txnRef = "ESCROW_" + shopId + "_123456789";
                Map<String, String> params = Map.of(
                                "vnp_TxnRef", txnRef,
                                "vnp_ResponseCode", "00",
                                "vnp_Amount", "200000000" // 2 triệu * 100
                );

                when(shopEscrowTransactionRepository.existsByReferenceCode(txnRef)).thenReturn(false);
                when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));

                shopEscrowFundService.processVnpayCallback(params, "vnp_TxnRef=" + txnRef + "&vnp_SecureHash=valid");

                verify(shopEscrowTransactionRepository).save(any(ShopEscrowTransaction.class));
        }

        // --- topUpFund tests ---
        @Test
        @DisplayName("topUpFund throws CustomException when amount is null or <= 0")
        void testTopUpFund_InvalidAmount() {
                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));
                assertThrows(CustomException.class, () -> shopEscrowFundService.topUpFund(shopId, TopUpEscrowFundRequest.builder().amount(null).build()));
                assertThrows(CustomException.class, () -> shopEscrowFundService.topUpFund(shopId, TopUpEscrowFundRequest.builder().amount(BigDecimal.ZERO).build()));
                assertThrows(CustomException.class, () -> shopEscrowFundService.topUpFund(shopId, TopUpEscrowFundRequest.builder().amount(new BigDecimal("-1000")).build()));
        }

        @Test
        @DisplayName("topUpFund throws CustomException when fund not found")
        void testTopUpFund_NotFound() {
                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.empty());
                assertThrows(CustomException.class, () -> shopEscrowFundService.topUpFund(shopId, TopUpEscrowFundRequest.builder().amount(BigDecimal.valueOf(100000)).build()));
        }

        @Test
        @DisplayName("topUpFund activates shop when pending deposit reaches committed amount")
        void testTopUpFund_PendingDeposit_ActivatesShop() {
                fund.setStatus(EscrowFundStatus.PENDING_DEPOSIT);
                fund.getShop().setStatus(ShopStatus.PENDING_DEPOSIT);
                fund.setBalance(BigDecimal.ZERO);
                fund.setCommittedAmount(new BigDecimal("5000000"));

                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));
                when(trustLevelConfigService.resolveTrustLevel(any())).thenReturn(3);

                TopUpEscrowFundRequest req = TopUpEscrowFundRequest.builder().amount(new BigDecimal("5000000")).build();
                ShopEscrowFundResponse res = shopEscrowFundService.topUpFund(shopId, req);

                assertNotNull(res);
                assertEquals(EscrowFundStatus.ACTIVE, fund.getStatus());
                assertEquals(ShopStatus.ACTIVE, fund.getShop().getStatus());
                assertEquals(3, fund.getCurrentTrustLevel());
                verify(shopRepository).save(fund.getShop());
                verify(notificationRepository).save(any(Notification.class));
        }

        @Test
        @DisplayName("topUpFund handles partial deposit during pending deposit stage")
        void testTopUpFund_PendingDeposit_Partial() {
                fund.setStatus(EscrowFundStatus.PENDING_DEPOSIT);
                fund.getShop().setStatus(ShopStatus.PENDING_DEPOSIT);
                fund.setBalance(BigDecimal.ZERO);
                fund.setCommittedAmount(new BigDecimal("5000000"));

                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));

                TopUpEscrowFundRequest req = TopUpEscrowFundRequest.builder().amount(new BigDecimal("2000000")).build();
                ShopEscrowFundResponse res = shopEscrowFundService.topUpFund(shopId, req);

                assertNotNull(res);
                assertEquals(EscrowFundStatus.PENDING_DEPOSIT, fund.getStatus());
                assertEquals(new BigDecimal("2000000"), fund.getBalance());
        }

        @Test
        @DisplayName("topUpFund upgrades star level when active shop balance increases")
        void testTopUpFund_ActiveShop_IncreasesStarLevel() {
                fund.setStatus(EscrowFundStatus.ACTIVE);
                fund.getShop().setStatus(ShopStatus.ACTIVE);
                fund.setBalance(new BigDecimal("5000000"));
                fund.setCommittedAmount(new BigDecimal("5000000"));
                fund.setCurrentTrustLevel(2);

                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));
                when(trustLevelConfigService.resolveTrustLevel(any())).thenReturn(4);
                when(trustLevelConfigService.getConfigByStarLevel(4)).thenReturn(TrustLevelConfig.builder().minDeposit(new BigDecimal("8000000")).build());

                TopUpEscrowFundRequest req = TopUpEscrowFundRequest.builder().amount(new BigDecimal("5000000")).build();
                ShopEscrowFundResponse res = shopEscrowFundService.topUpFund(shopId, req);

                assertNotNull(res);
                assertEquals(4, fund.getCurrentTrustLevel());
                assertEquals(4, fund.getShop().getTrustLevel());
                assertEquals(new BigDecimal("10000000"), fund.getCommittedAmount());
        }

        @Test
        @DisplayName("topUpFund updates deficit amount when active shop still under min deposit")
        void testTopUpFund_ActiveShop_StillDeficit() {
                fund.setStatus(EscrowFundStatus.ACTIVE);
                fund.setBalance(new BigDecimal("1000000"));
                fund.setCommittedAmount(new BigDecimal("5000000"));
                fund.setCurrentTrustLevel(2);

                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));
                when(trustLevelConfigService.resolveTrustLevel(any())).thenReturn(2);
                when(trustLevelConfigService.getConfigByStarLevel(2)).thenReturn(TrustLevelConfig.builder().minDeposit(new BigDecimal("5000000")).build());

                TopUpEscrowFundRequest req = TopUpEscrowFundRequest.builder().amount(new BigDecimal("1000000")).build();
                ShopEscrowFundResponse res = shopEscrowFundService.topUpFund(shopId, req);

                assertNotNull(res);
                assertEquals(new BigDecimal("3000000"), fund.getDeficitAmount());
        }

        // --- deductCompensation tests ---
        @Test
        @DisplayName("deductCompensation validations")
        void testDeductCompensation_Validations() {
                assertThrows(CustomException.class, () -> shopEscrowFundService.deductCompensation(shopId, null));

                AdminDeductCompensationRequest reqSmall = AdminDeductCompensationRequest.builder().amount(new BigDecimal("500")).build();
                assertThrows(CustomException.class, () -> shopEscrowFundService.deductCompensation(shopId, reqSmall));

                AdminDeductCompensationRequest reqValid = AdminDeductCompensationRequest.builder().amount(new BigDecimal("20000")).build();
                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.empty());
                assertThrows(CustomException.class, () -> shopEscrowFundService.deductCompensation(shopId, reqValid));

                // Fund zero balance
                fund.setBalance(BigDecimal.ZERO);
                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));
                assertThrows(CustomException.class, () -> shopEscrowFundService.deductCompensation(shopId, reqValid));

                // OrderId null
                fund.setBalance(new BigDecimal("1000000"));
                assertThrows(CustomException.class, () -> shopEscrowFundService.deductCompensation(shopId, reqValid));

                // Order not found
                reqValid.setOrderId(orderId);
                when(orderRepository.findById(orderId)).thenReturn(Optional.empty());
                assertThrows(CustomException.class, () -> shopEscrowFundService.deductCompensation(shopId, reqValid));

                // Order shop mismatch
                Shop otherShop = new Shop();
                otherShop.setId(UUID.randomUUID());
                order.setShop(otherShop);
                when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
                assertThrows(CustomException.class, () -> shopEscrowFundService.deductCompensation(shopId, reqValid));

                // Order user null
                order.setShop(shop);
                order.setUser(null);
                assertThrows(CustomException.class, () -> shopEscrowFundService.deductCompensation(shopId, reqValid));
        }

        @Test
        @DisplayName("deductCompensation creates buyer wallet when not exists and dedupeKey checks")
        void testDeductCompensation_BuyerWalletCreated_AndDedupeKey() {
                AdminDeductCompensationRequest req = AdminDeductCompensationRequest.builder()
                                .orderId(orderId)
                                .amount(new BigDecimal("50000"))
                                .reportId(UUID.randomUUID())
                                .build();

                order.setShop(shop);
                order.setUser(buyer);
                order.setTotal(new BigDecimal("200000"));
                fund.setBalance(new BigDecimal("1000000"));

                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));
                when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
                when(walletRepository.findByUserIdForUpdate(buyer.getId())).thenReturn(Optional.empty());
                when(walletRepository.save(any(Wallet.class))).thenAnswer(i -> {
                        Wallet w = i.getArgument(0);
                        w.setId(UUID.randomUUID());
                        return w;
                });

                // Case 1: DedupeKey exists
                when(transactionRepository.existsByDedupeKey("COMPENSATION:REPORT:" + req.getReportId())).thenReturn(true);
                assertThrows(CustomException.class, () -> shopEscrowFundService.deductCompensation(shopId, req));

                // Case 2: DedupeKey not exists, success with reportId
                when(transactionRepository.existsByDedupeKey("COMPENSATION:REPORT:" + req.getReportId())).thenReturn(false);
                when(shopEscrowTransactionRepository.sumCompensationByOrderId(orderId)).thenReturn(BigDecimal.ZERO);
                when(escrowRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
                when(shopEscrowFundRepository.save(any())).thenAnswer(i -> i.getArgument(0));
                when(shopEscrowTransactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

                ShopEscrowTransaction tx = shopEscrowFundService.deductCompensation(shopId, req);
                assertNotNull(tx);
                assertEquals(new BigDecimal("-50000"), tx.getAmount());
        }

        // --- validateCanCloseShopInternal tests ---
        @Test
        @DisplayName("validateCanCloseShopInternal validates all shop and fund conditions")
        void testValidateCanCloseShop_VariousConditions() {
                // Shop not found
                when(shopRepository.findById(shopId)).thenReturn(Optional.empty());
                assertThrows(CustomException.class, () -> shopEscrowFundService.requestCloseShopAndRefund(shopId));

                when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
                when(shopEscrowFundRepository.findByShopId(shopId)).thenReturn(Optional.empty());
                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));
                assertThrows(CustomException.class, () -> shopEscrowFundService.requestCloseShopAndRefund(shopId));

                when(shopEscrowFundRepository.findByShopId(shopId)).thenReturn(Optional.of(fund));

                // Non-approval step: shop not ACTIVE
                shop.setStatus(ShopStatus.INACTIVE);
                assertThrows(CustomException.class, () -> shopEscrowFundService.requestCloseShopAndRefund(shopId));

                // Shop ACTIVE, but fund DEFICIT
                shop.setStatus(ShopStatus.ACTIVE);
                fund.setStatus(EscrowFundStatus.DEFICIT);
                assertThrows(CustomException.class, () -> shopEscrowFundService.requestCloseShopAndRefund(shopId));

                // Fund LOCKED
                fund.setStatus(EscrowFundStatus.LOCKED);
                assertThrows(CustomException.class, () -> shopEscrowFundService.requestCloseShopAndRefund(shopId));

                fund.setStatus(EscrowFundStatus.ACTIVE);
                fund.setIsDeficit(false);

                // Active orders exist
                when(orderRepository.existsByShopIdAndStatusIn(eq(shopId), any())).thenReturn(true);
                assertThrows(CustomException.class, () -> shopEscrowFundService.requestCloseShopAndRefund(shopId));

                // Cooling period orders exist
                when(orderRepository.existsByShopIdAndStatusIn(eq(shopId), any())).thenReturn(false);
                when(orderRepository.existsCompletedOrderWithinCoolingPeriod(eq(shopId), any())).thenReturn(true);
                assertThrows(CustomException.class, () -> shopEscrowFundService.requestCloseShopAndRefund(shopId));

                // Active escrow exists
                when(orderRepository.existsCompletedOrderWithinCoolingPeriod(eq(shopId), any())).thenReturn(false);
                when(escrowRepository.existsByOrderShopIdAndStatusIn(eq(shopId), any())).thenReturn(true);
                assertThrows(CustomException.class, () -> shopEscrowFundService.requestCloseShopAndRefund(shopId));

                // Active order return exists
                when(escrowRepository.existsByOrderShopIdAndStatusIn(eq(shopId), any())).thenReturn(false);
                when(orderReturnRepository.existsByOrderShopIdAndStatusIn(eq(shopId), any())).thenReturn(true);
                assertThrows(CustomException.class, () -> shopEscrowFundService.requestCloseShopAndRefund(shopId));

                // Pending reports exist
                when(orderReturnRepository.existsByOrderShopIdAndStatusIn(eq(shopId), any())).thenReturn(false);
                when(reportRepository.existsPendingReportsForShop(shopId)).thenReturn(true);
                assertThrows(CustomException.class, () -> shopEscrowFundService.requestCloseShopAndRefund(shopId));
                // Fund DEFICIT
                fund.setStatus(EscrowFundStatus.DEFICIT);
                assertThrows(CustomException.class, () -> shopEscrowFundService.requestCloseShopAndRefund(shopId));
                fund.setStatus(EscrowFundStatus.ACTIVE);
        }

        // --- adminApproveCloseShopRefund edge cases ---
        @Test
        @DisplayName("adminApproveCloseShopRefund edge cases")
        void testAdminApproveCloseShopRefund_EdgeCases() {
                // Not found
                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.empty());
                assertThrows(CustomException.class, () -> shopEscrowFundService.adminApproveCloseShopRefund(shopId));

                // Status not REFUND_PENDING
                fund.setStatus(EscrowFundStatus.ACTIVE);
                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));
                assertThrows(CustomException.class, () -> shopEscrowFundService.adminApproveCloseShopRefund(shopId));

                // Shop or user null
                fund.setStatus(EscrowFundStatus.REFUND_PENDING);
                fund.getShop().setUser(null);
                assertThrows(CustomException.class, () -> shopEscrowFundService.adminApproveCloseShopRefund(shopId));

                // Approval step validation: Shop status CLOSED
                fund.getShop().setUser(seller);
                shop.setStatus(ShopStatus.CLOSED);
                when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
                when(shopEscrowFundRepository.findByShopId(shopId)).thenReturn(Optional.of(fund));
                assertThrows(CustomException.class, () -> shopEscrowFundService.adminApproveCloseShopRefund(shopId));

                // Approval step validation: Fund status not REFUND_PENDING in validate
                shop.setStatus(ShopStatus.INACTIVE);
                ShopEscrowFund fundInDb = new ShopEscrowFund();
                fundInDb.setStatus(EscrowFundStatus.ACTIVE);
                when(shopEscrowFundRepository.findByShopId(shopId)).thenReturn(Optional.of(fundInDb));
                assertThrows(CustomException.class, () -> shopEscrowFundService.adminApproveCloseShopRefund(shopId));
        }

        // --- adminRejectCloseShopRefund edge cases ---
        @Test
        @DisplayName("adminRejectCloseShopRefund edge cases")
        void testAdminRejectCloseShopRefund_EdgeCases() {
                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.empty());
                assertThrows(CustomException.class, () -> shopEscrowFundService.adminRejectCloseShopRefund(shopId, "reason"));

                fund.setStatus(EscrowFundStatus.ACTIVE);
                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));
                assertThrows(CustomException.class, () -> shopEscrowFundService.adminRejectCloseShopRefund(shopId, "reason"));

                fund.setStatus(EscrowFundStatus.REFUND_PENDING);
                fund.setShop(null);
                assertThrows(CustomException.class, () -> shopEscrowFundService.adminRejectCloseShopRefund(shopId, "reason"));
        }

        // --- processVnpayCallback edge cases ---
        @Test
        @DisplayName("processVnpayCallback edge cases")
        void testProcessVnpayCallback_EdgeCases() {
                when(vnPayService.verifyChecksumFromQueryString(anyString())).thenReturn(false);
                assertThrows(CustomException.class, () -> shopEscrowFundService.processVnpayCallback(Map.of(), "query"));

                when(vnPayService.verifyChecksumFromQueryString(anyString())).thenReturn(true);

                // Failed response code
                Map<String, String> failParams = Map.of("vnp_TxnRef", "ESCROW_" + shopId + "_1", "vnp_ResponseCode", "24");
                shopEscrowFundService.processVnpayCallback(failParams, "query");

                // Already processed
                Map<String, String> successParams = Map.of("vnp_TxnRef", "ESCROW_" + shopId + "_2", "vnp_ResponseCode", "00", "vnp_Amount", "10000000");
                when(shopEscrowTransactionRepository.existsByReferenceCode("ESCROW_" + shopId + "_2")).thenReturn(true);
                shopEscrowFundService.processVnpayCallback(successParams, "query");

                // Invalid amount
                Map<String, String> zeroAmountParams = Map.of("vnp_TxnRef", "ESCROW_" + shopId + "_3", "vnp_ResponseCode", "00", "vnp_Amount", "0");
                when(shopEscrowTransactionRepository.existsByReferenceCode("ESCROW_" + shopId + "_3")).thenReturn(false);
                assertThrows(CustomException.class, () -> shopEscrowFundService.processVnpayCallback(zeroAmountParams, "query"));
        }


        @Test
        @DisplayName("adminAdjustFund validation and branch coverage")
        void testAdminAdjustFund_Branches() {
                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));
                
                // Negative balance
                AdminAdjustEscrowFundRequest reqNegBal = AdminAdjustEscrowFundRequest.builder().balance(new BigDecimal("-100")).build();
                assertThrows(CustomException.class, () -> shopEscrowFundService.adminAdjustFund(shopId, reqNegBal, UUID.randomUUID()));

                // Negative committed
                AdminAdjustEscrowFundRequest reqNegCom = AdminAdjustEscrowFundRequest.builder().committedAmount(new BigDecimal("-100")).build();
                assertThrows(CustomException.class, () -> shopEscrowFundService.adminAdjustFund(shopId, reqNegCom, UUID.randomUUID()));

                // Invalid star level
                AdminAdjustEscrowFundRequest reqBadStarLow = AdminAdjustEscrowFundRequest.builder().targetTrustLevel(0).build();
                assertThrows(CustomException.class, () -> shopEscrowFundService.adminAdjustFund(shopId, reqBadStarLow, UUID.randomUUID()));
                AdminAdjustEscrowFundRequest reqBadStarHigh = AdminAdjustEscrowFundRequest.builder().targetTrustLevel(6).build();
                assertThrows(CustomException.class, () -> shopEscrowFundService.adminAdjustFund(shopId, reqBadStarHigh, UUID.randomUUID()));

                // Deficit condition: newBalance < newCommitted
                fund.setBalance(new BigDecimal("5000000"));
                AdminAdjustEscrowFundRequest reqDeficit = AdminAdjustEscrowFundRequest.builder()
                                .balance(new BigDecimal("3000000"))
                                .committedAmount(new BigDecimal("5000000"))
                                .targetTrustLevel(2)
                                .build();
                ShopEscrowFundResponse res = shopEscrowFundService.adminAdjustFund(shopId, reqDeficit, UUID.randomUUID());
                assertTrue(fund.getIsDeficit());
                assertEquals(new BigDecimal("2000000"), fund.getDeficitAmount());
                assertEquals(EscrowFundStatus.DEFICIT, fund.getStatus());

                // No balance change (diff == 0) and null targetTrustLevel
                AdminAdjustEscrowFundRequest reqNoChange = AdminAdjustEscrowFundRequest.builder()
                                .balance(new BigDecimal("3000000"))
                                .committedAmount(new BigDecimal("2000000"))
                                .targetTrustLevel(null)
                                .build();
                when(trustLevelConfigService.resolveTrustLevel(any())).thenReturn(2);
                ShopEscrowFundResponse res2 = shopEscrowFundService.adminAdjustFund(shopId, reqNoChange, UUID.randomUUID());
                assertFalse(fund.getIsDeficit());
                assertEquals(BigDecimal.ZERO, fund.getDeficitAmount());
        }

        @Test
        @DisplayName("getAllFunds branches: isDeficit, findAll, and fallback tier name")
        void testGetAllFunds_Branches() {
                when(trustLevelConfigService.getConfigByStarLevel(anyInt())).thenReturn(null);
                Page<ShopEscrowFund> page = new PageImpl<>(List.of(fund));

                // status null, isDeficit not null
                when(shopEscrowFundRepository.findByIsDeficit(eq(true), any())).thenReturn(page);
                Page<ShopEscrowFundResponse> res1 = shopEscrowFundService.getAllFunds(true, null, PageRequest.of(0, 10));
                assertNotNull(res1);

                // status null, isDeficit null
                when(shopEscrowFundRepository.findAll(any(Pageable.class))).thenReturn(page);
                Page<ShopEscrowFundResponse> res2 = shopEscrowFundService.getAllFunds(null, null, PageRequest.of(0, 10));
                assertNotNull(res2);
        }

        @Test
        @DisplayName("processVnpayCallback and createVnpayPaymentUrl edge cases")
        void testCallbackAndPaymentUrlBranches() {
                // createVnpayPaymentUrl invalid amount and blank clientIp
                when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
                assertThrows(CustomException.class, () -> shopEscrowFundService.createVnpayPaymentUrl(shopId, TopUpEscrowFundRequest.builder().amount(BigDecimal.ZERO).build(), null));
                
                TopUpEscrowFundRequest reqValid = TopUpEscrowFundRequest.builder().amount(new BigDecimal("100000")).build();
                when(vnPayService.buildPaymentUrl(anyString(), any(), anyString(), any(), eq("127.0.0.1"))).thenReturn("http://vnpay.vn");
                String url = shopEscrowFundService.createVnpayPaymentUrl(shopId, reqValid, "   ");
                assertEquals("http://vnpay.vn", url);

                // processVnpayCallback with map verification
                when(vnPayService.verifyChecksumFromMap(any())).thenReturn(true);
                when(vnPayService.verifyChecksumFromQueryString(anyString())).thenReturn(true);
                shopEscrowFundService.processVnpayCallback(Map.of("vnp_TxnRef", "OTHER_123"), null);

                // processVnpayCallback non-escrow txnRef
                shopEscrowFundService.processVnpayCallback(Map.of("vnp_TxnRef", "ORDER_123"), "vnp_TxnRef=ORDER_123");

                // parts length < 2
                shopEscrowFundService.processVnpayCallback(Map.of("vnp_TxnRef", "ESCROW"), "vnp_TxnRef=ESCROW");

                // Invalid UUID
                shopEscrowFundService.processVnpayCallback(Map.of("vnp_TxnRef", "ESCROW_invaliduuid_123"), "vnp_TxnRef=ESCROW_invaliduuid_123");

                // Amount missing
                shopEscrowFundService.processVnpayCallback(Map.of("vnp_TxnRef", "ESCROW_" + shopId + "_123", "vnp_ResponseCode", "00"), "vnp_TxnRef=ESCROW_" + shopId + "_123");
        }


        @Test
        @DisplayName("createInitialFund with zero deposit")
        void testCreateInitialFund_ZeroDeposit() {
                when(shopEscrowFundRepository.save(any(ShopEscrowFund.class))).thenAnswer(i -> i.getArgument(0));
                ShopEscrowFund created = shopEscrowFundService.createInitialFund(shop, BigDecimal.ZERO, "REG-002");
                assertNotNull(created);
                assertEquals(EscrowFundStatus.ACTIVE, created.getStatus());
                assertEquals(ShopStatus.ACTIVE, shop.getStatus());
        }

        @Test
        @DisplayName("processVnpayCallback with txnRef extracted from rawQueryString")
        void testProcessVnpayCallback_ExtractTxnRefFromRawQuery() {
                String txnRef = "ESCROW_" + shopId + "_777777";
                String rawQuery = "vnp_TxnRef=" + txnRef + "&vnp_ResponseCode=00&vnp_Amount=300000000";

                when(vnPayService.verifyChecksumFromQueryString(anyString())).thenReturn(true);
                when(shopEscrowTransactionRepository.existsByReferenceCode(txnRef)).thenReturn(false);
                when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
                when(shopEscrowFundRepository.findByShopIdForUpdate(shopId)).thenReturn(Optional.of(fund));

                shopEscrowFundService.processVnpayCallback(Map.of("vnp_ResponseCode", "00", "vnp_Amount", "300000000"), rawQuery);

                verify(shopEscrowTransactionRepository).save(any(ShopEscrowTransaction.class));
        }

}
