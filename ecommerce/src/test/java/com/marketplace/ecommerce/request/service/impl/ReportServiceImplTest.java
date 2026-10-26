package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderReturn;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.repository.OrderReturnRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.request.dto.request.CreateReportRequest;
import com.marketplace.ecommerce.request.dto.request.HandleReportRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.policy.RequestPolicy;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.service.RequestService;
import com.marketplace.ecommerce.request.valueObjects.*;
import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceImplTest {

    @Mock
    private RequestService requestService;
    @Mock
    private RequestRepository requestRepository;
    @Mock
    private ReportRepository reportRepository;
    @Mock
    private AccountRepository accountRepository;
    @Mock
    private RequestPolicy requestPolicy;
    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private ShopRepository shopRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private EscrowRepository escrowRepository;
    @Mock
    private OrderReturnRepository orderReturnRepository;
    @Mock
    private EscrowService escrowService;

    @InjectMocks
    private ReportServiceImpl reportService;

    private UUID adminAccountId;
    private UUID requestId;
    private Account admin;
    private Request request;
    private Report report;

    @BeforeEach
    void setUp() {
        adminAccountId = UUID.randomUUID();
        requestId = UUID.randomUUID();

        admin = Account.builder()
                .id(adminAccountId)
                .username("admin")
                .build();

        request = Request.builder()
                .id(requestId)
                .status(RequestStatus.PENDING)
                .type(RequestType.REPORT)
                .build();

        report = Report.builder()
                .id(requestId)
                .request(request)
                .build();
    }

    @Test
    @DisplayName("handleReport cho đối tượng USER, SHOP, PRODUCT, REVIEW, ORDER và thuật toán 30-day decay")
    void testHandleReport_AllTargetTypes_AndDisciplineLevels() {
        when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(admin));
        when(reportRepository.findByRequestId(requestId)).thenReturn(report);

        // 1. USER with 30-day decay
        UUID targetUserId = UUID.randomUUID();
        Account targetAcc = Account.builder()
                .id(targetUserId)
                .violationCount(3)
                .lastViolationAt(LocalDateTime.now().minusDays(65))
                .disciplineLevel(DisciplineLevel.WARNED)
                .build();
        report.setTargetType(TargetType.USER);
        report.setTargetId(targetUserId);
        when(requestPolicy.resolveTargetAccountId(TargetType.USER, targetUserId)).thenReturn(targetUserId);
        when(accountRepository.findByIdForUpdate(targetUserId)).thenReturn(Optional.of(targetAcc));

        HandleReportRequest approveReq = HandleReportRequest.builder()
                .decision(ReportDecision.APPROVE)
                .note("Xử lý vi phạm")
                .resolutionType(ResolutionType.RETURN_AND_REFUND)
                .build();

        reportService.handleReport(adminAccountId, requestId, approveReq);
        assertEquals(2, targetAcc.getViolationCount());
        assertEquals(DisciplineLevel.NONE, targetAcc.getDisciplineLevel());

        // 2. SHOP -> WARNED, SUSPENDED, BANNED
        UUID shopId = UUID.randomUUID();
        Shop shop = Shop.builder().id(shopId).status(ShopStatus.ACTIVE).build();
        report.setTargetType(TargetType.SHOP);
        report.setTargetId(shopId);
        when(shopRepository.findByIdForUpdate(shopId)).thenReturn(Optional.of(shop));
        when(requestPolicy.resolveTargetAccountId(TargetType.SHOP, shopId)).thenReturn(targetUserId);

        request.setStatus(RequestStatus.PENDING);
        targetAcc.setViolationCount(2);
        targetAcc.setLastViolationAt(null);
        reportService.handleReport(adminAccountId, requestId, approveReq);
        assertEquals(ShopStatus.WARNED, shop.getStatus());

        request.setStatus(RequestStatus.PENDING);
        targetAcc.setViolationCount(4);
        targetAcc.setLastViolationAt(null);
        reportService.handleReport(adminAccountId, requestId, approveReq);
        assertEquals(ShopStatus.SUSPENDED, shop.getStatus());
        verify(productRepository).updateStatusByShopId(shopId, ProductStatus.INACTIVE);

        request.setStatus(RequestStatus.PENDING);
        targetAcc.setViolationCount(6);
        targetAcc.setLastViolationAt(null);
        reportService.handleReport(adminAccountId, requestId, approveReq);
        assertEquals(ShopStatus.BANNED, shop.getStatus());
        verify(productRepository).updateStatusByShopId(shopId, ProductStatus.DELETED);

        // 3. PRODUCT with 30-day decay & flagged/inactive
        UUID prodId = UUID.randomUUID();
        Product product = Product.builder()
                .id(prodId)
                .status(ProductStatus.PUBLISHED)
                .reportCount(4)
                .lastReportedAt(LocalDateTime.now().minusDays(35))
                .build();
        report.setTargetType(TargetType.PRODUCT);
        report.setTargetId(prodId);
        when(productRepository.findByIdForUpdate(prodId)).thenReturn(Optional.of(product));
        when(requestPolicy.resolveTargetAccountId(TargetType.PRODUCT, prodId)).thenReturn(targetUserId);

        request.setStatus(RequestStatus.PENDING);
        targetAcc.setStatus(AccountStatus.ACTIVE);
        targetAcc.setDisciplineLevel(DisciplineLevel.NONE);
        targetAcc.setViolationCount(0);
        targetAcc.setLastViolationAt(null);
        reportService.handleReport(adminAccountId, requestId, approveReq);
        assertTrue(product.isFlagged());

        request.setStatus(RequestStatus.PENDING);
        product.setReportCount(4);
        product.setLastReportedAt(null);
        reportService.handleReport(adminAccountId, requestId, approveReq);
        assertEquals(ProductStatus.INACTIVE, product.getStatus());

        // 4. REVIEW
        UUID reviewId = UUID.randomUUID();
        Review review = Review.builder().id(reviewId).status(ReviewStatus.ACTIVE).reportCount(4).build();
        report.setTargetType(TargetType.REVIEW);
        report.setTargetId(reviewId);
        when(reviewRepository.findByIdForUpdate(reviewId)).thenReturn(Optional.of(review));
        when(requestPolicy.resolveTargetAccountId(TargetType.REVIEW, reviewId)).thenReturn(targetUserId);

        request.setStatus(RequestStatus.PENDING);
        targetAcc.setViolationCount(0);
        targetAcc.setLastViolationAt(null);
        reportService.handleReport(adminAccountId, requestId, approveReq);
        assertEquals(ReviewStatus.HIDDEN, review.getStatus());

        // 5. ORDER (WARNED, SUSPENDED, BANNED + Escrow HELD -> DISPUTED)
        UUID orderId = UUID.randomUUID();
        shop.setStatus(ShopStatus.ACTIVE);
        Order order = Order.builder().id(orderId).shop(shop).status(OrderStatus.DELIVERED).build();
        Escrow escrow = Escrow.builder().id(UUID.randomUUID()).status(EscrowStatus.HELD).build();
        report.setTargetType(TargetType.ORDER);
        report.setTargetId(orderId);
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));
        when(requestPolicy.resolveTargetAccountId(TargetType.ORDER, orderId)).thenReturn(targetUserId);
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));

        request.setStatus(RequestStatus.PENDING);
        targetAcc.setViolationCount(2);
        targetAcc.setLastViolationAt(null);
        reportService.handleReport(adminAccountId, requestId, approveReq);
        assertEquals(ShopStatus.WARNED, shop.getStatus());
        assertEquals(EscrowStatus.DISPUTED, escrow.getStatus());
        assertEquals(ResolutionType.RETURN_AND_REFUND, report.getResolutionType());

        request.setStatus(RequestStatus.PENDING);
        targetAcc.setViolationCount(4);
        targetAcc.setLastViolationAt(null);
        reportService.handleReport(adminAccountId, requestId, approveReq);
        assertEquals(ShopStatus.SUSPENDED, shop.getStatus());

        request.setStatus(RequestStatus.PENDING);
        targetAcc.setViolationCount(6);
        targetAcc.setLastViolationAt(null);
        reportService.handleReport(adminAccountId, requestId, approveReq);
        assertEquals(ShopStatus.BANNED, shop.getStatus());
    }

    @Test
    @DisplayName("handleReport: Khiếu nại kiện hàng hoàn của Seller (Approve & Reject) và Reject báo cáo thường")
    void testHandleSellerReturnDispute_AndRejectRequest() {
        when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(admin));
        when(reportRepository.findByRequestId(requestId)).thenReturn(report);

        UUID orderId = UUID.randomUUID();
        Account shopOwner = Account.builder().id(UUID.randomUUID()).violationCount(4).status(AccountStatus.SUSPENDED).build();
        User sellerUser = User.builder().id(UUID.randomUUID()).account(shopOwner).build();
        Shop shop = Shop.builder().id(UUID.randomUUID()).user(sellerUser).status(ShopStatus.SUSPENDED).build();
        Order order = Order.builder().id(orderId).shop(shop).status(OrderStatus.DELIVERED).build();
        OrderReturn orderReturn = OrderReturn.builder().id(UUID.randomUUID()).status(ReturnStatus.DISPUTED).conditionNote("Cũ").build();
        Escrow escrow = Escrow.builder().id(UUID.randomUUID()).status(EscrowStatus.DISPUTED).build();

        report.setTargetType(TargetType.ORDER);
        report.setTargetId(orderId);
        report.setViolationReportId(UUID.randomUUID());

        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));
        when(orderReturnRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(orderReturn));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));

        // 1. Approve Seller Return Dispute
        HandleReportRequest approveReq = HandleReportRequest.builder()
                .decision(ReportDecision.APPROVE)
                .note("Shop đúng")
                .build();
        reportService.handleReport(adminAccountId, requestId, approveReq);
        assertEquals(ReturnStatus.CANCELLED, orderReturn.getStatus());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
        assertEquals(3, shopOwner.getViolationCount());
        assertEquals(ShopStatus.WARNED, shop.getStatus());
        verify(escrowService).releaseByOrder(orderId);

        // 2. Reject Seller Return Dispute
        request.setStatus(RequestStatus.PENDING);
        request.setDescription("Shop khiếu nại kiện hàng hoàn");
        report.setViolationReportId(null);
        HandleReportRequest rejectReq = HandleReportRequest.builder()
                .decision(ReportDecision.REJECT)
                .note("Khách đúng")
                .build();
        reportService.handleReport(adminAccountId, requestId, rejectReq);
        assertEquals(ReturnStatus.COMPLETED, orderReturn.getStatus());
        assertEquals(OrderStatus.REFUNDED, order.getStatus());
        verify(escrowService).refundByOrder(eq(orderId), anyString());

        // 3. Normal Reject Request for ORDER
        request.setStatus(RequestStatus.PENDING);
        request.setDescription("Báo cáo thường");
        escrow.setStatus(EscrowStatus.DISPUTED);
        reportService.handleReport(adminAccountId, requestId, rejectReq);
        assertEquals(RequestStatus.REJECTED, request.getStatus());
        assertEquals(EscrowStatus.HELD, escrow.getStatus());
    }

    @Test
    @DisplayName("createReport và các nhánh ngoại lệ trong ReportServiceImpl")
    void testCreateReport_AndExceptions() {
        UUID buyerAccId = UUID.randomUUID();
        Account buyerAcc = Account.builder().id(buyerAccId).status(AccountStatus.ACTIVE).disciplineLevel(DisciplineLevel.NONE).build();
        UUID orderId = UUID.randomUUID();
        Escrow escrow = Escrow.builder().id(UUID.randomUUID()).status(EscrowStatus.HELD).build();

        when(accountRepository.findById(buyerAccId)).thenReturn(Optional.of(buyerAcc));
        when(requestPolicy.resolve(orderId)).thenReturn(TargetType.ORDER);
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        when(requestService.createRequest(eq(buyerAcc), any())).thenReturn(request);

        CreateReportRequest createReq = new CreateReportRequest();
        createReq.setTargetId(orderId);
        createReq.setDescription("Khiếu nại đơn hàng");
        createReq.setEvidenceUrl("http://img.com/ev.jpg");

        CreateRequestResponse res = reportService.createReport(buyerAccId, createReq);
        assertNotNull(res);
        assertEquals(EscrowStatus.DISPUTED, escrow.getStatus());

        // Suspended or Banned account cannot createReport
        buyerAcc.setDisciplineLevel(DisciplineLevel.SUSPENDED);
        assertThrows(CustomException.class, () -> reportService.createReport(buyerAccId, createReq));

        // Guard clauses in handleReport
        when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(admin));
        when(reportRepository.findByRequestId(requestId)).thenReturn(null);
        HandleReportRequest approveReq = HandleReportRequest.builder().decision(ReportDecision.APPROVE).build();
        assertThrows(CustomException.class, () -> reportService.handleReport(adminAccountId, requestId, approveReq));

        report.setRequest(null);
        when(reportRepository.findByRequestId(requestId)).thenReturn(report);
        assertThrows(CustomException.class, () -> reportService.handleReport(adminAccountId, requestId, approveReq));

        report.setRequest(request);
        request.setStatus(RequestStatus.APPROVED);
        assertThrows(CustomException.class, () -> reportService.handleReport(adminAccountId, requestId, approveReq));

        // Additional exception branches for handleReport targets
        request.setStatus(RequestStatus.PENDING);
        report.setTargetType(TargetType.PRODUCT);
        UUID delProdId = UUID.randomUUID();
        report.setTargetId(delProdId);
        Product deletedProd = Product.builder().id(delProdId).status(ProductStatus.DELETED).build();
        when(productRepository.findByIdForUpdate(delProdId)).thenReturn(Optional.of(deletedProd));
        assertThrows(CustomException.class, () -> reportService.handleReport(adminAccountId, requestId, approveReq));

        report.setTargetType(TargetType.REVIEW);
        UUID hidRevId = UUID.randomUUID();
        report.setTargetId(hidRevId);
        Review hiddenRev = Review.builder().id(hidRevId).status(ReviewStatus.HIDDEN).build();
        when(reviewRepository.findByIdForUpdate(hidRevId)).thenReturn(Optional.of(hiddenRev));
        assertThrows(CustomException.class, () -> reportService.handleReport(adminAccountId, requestId, approveReq));

        report.setTargetType(TargetType.SHOP);
        UUID banShopId = UUID.randomUUID();
        report.setTargetId(banShopId);
        Shop bannedShop = Shop.builder().id(banShopId).status(ShopStatus.BANNED).build();
        when(shopRepository.findByIdForUpdate(banShopId)).thenReturn(Optional.of(bannedShop));
        assertThrows(CustomException.class, () -> reportService.handleReport(adminAccountId, requestId, approveReq));

        report.setTargetType(TargetType.USER);
        UUID noAccTargetId = UUID.randomUUID();
        report.setTargetId(noAccTargetId);
        when(requestPolicy.resolveTargetAccountId(TargetType.USER, noAccTargetId)).thenReturn(null);
        assertThrows(CustomException.class, () -> reportService.handleReport(adminAccountId, requestId, approveReq));

        UUID bannedAccId = UUID.randomUUID();
        Account bannedAcc = Account.builder().id(bannedAccId).status(AccountStatus.BANNED).disciplineLevel(DisciplineLevel.BANNED).build();
        when(requestPolicy.resolveTargetAccountId(TargetType.USER, noAccTargetId)).thenReturn(bannedAccId);
        when(accountRepository.findByIdForUpdate(bannedAccId)).thenReturn(Optional.of(bannedAcc));
        assertThrows(CustomException.class, () -> reportService.handleReport(adminAccountId, requestId, approveReq));

        // Target account not found in punishAccount
        UUID missingTargetAccId = UUID.randomUUID();
        when(requestPolicy.resolveTargetAccountId(TargetType.USER, noAccTargetId)).thenReturn(missingTargetAccId);
        when(accountRepository.findByIdForUpdate(missingTargetAccId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> reportService.handleReport(adminAccountId, requestId, approveReq));

        // Product decay to < 3 (unflagged) and ownerAccountId null
        UUID prodDecayId = UUID.randomUUID();
        Product decayProd = Product.builder()
                .id(prodDecayId)
                .status(ProductStatus.PUBLISHED)
                .flagged(true)
                .reportCount(3)
                .lastReportedAt(LocalDateTime.now().minusDays(65))
                .build();
        report.setTargetType(TargetType.PRODUCT);
        report.setTargetId(prodDecayId);
        when(productRepository.findByIdForUpdate(prodDecayId)).thenReturn(Optional.of(decayProd));
        when(requestPolicy.resolveTargetAccountId(TargetType.PRODUCT, prodDecayId)).thenReturn(null);
        assertThrows(CustomException.class, () -> reportService.handleReport(adminAccountId, requestId, approveReq));
        assertFalse(decayProd.isFlagged());

        // Order not found & ownerAccountId null in handleReportOrder
        UUID missingOrdId = UUID.randomUUID();
        report.setTargetType(TargetType.ORDER);
        report.setTargetId(missingOrdId);
        when(orderRepository.findByIdForUpdate(missingOrdId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> reportService.handleReport(adminAccountId, requestId, approveReq));

        when(orderRepository.findByIdForUpdate(missingOrdId)).thenReturn(Optional.of(Order.builder().id(missingOrdId).build()));
        when(requestPolicy.resolveTargetAccountId(TargetType.ORDER, missingOrdId)).thenReturn(null);
        assertThrows(CustomException.class, () -> reportService.handleReport(adminAccountId, requestId, approveReq));

        // Seller Return Dispute with violationCount = 1 -> newViolationCount = 0 (< 3 -> ACTIVE / NONE) and null note
        Account lowVioOwner = Account.builder().id(UUID.randomUUID()).violationCount(1).status(AccountStatus.ACTIVE).build();
        Shop lowVioShop = Shop.builder().id(UUID.randomUUID()).user(User.builder().id(UUID.randomUUID()).account(lowVioOwner).build()).status(ShopStatus.WARNED).build();
        Order lowVioOrd = Order.builder().id(missingOrdId).shop(lowVioShop).status(OrderStatus.DELIVERED).build();
        OrderReturn lowVioRet = OrderReturn.builder().id(UUID.randomUUID()).status(ReturnStatus.DISPUTED).conditionNote(null).build();
        report.setViolationReportId(UUID.randomUUID());
        when(orderRepository.findByIdForUpdate(missingOrdId)).thenReturn(Optional.of(lowVioOrd));
        when(orderReturnRepository.findByOrderIdForUpdate(missingOrdId)).thenReturn(Optional.of(lowVioRet));
        reportService.handleReport(adminAccountId, requestId, approveReq);
        assertEquals(ShopStatus.ACTIVE, lowVioShop.getStatus());
        assertEquals(DisciplineLevel.NONE, lowVioOwner.getDisciplineLevel());
    }
}
