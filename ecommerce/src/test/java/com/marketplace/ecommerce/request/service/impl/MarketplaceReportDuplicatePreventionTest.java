package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.service.AccountDisciplineService;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.chat.service.ChatService;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.request.dto.request.CreateReportRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.policy.ReportRateLimiter;
import com.marketplace.ecommerce.request.policy.RequestPolicy;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.repository.SellerRepository;
import com.marketplace.ecommerce.request.service.RequestService;
import com.marketplace.ecommerce.request.valueObjects.ReportStage;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Test suite kiểm thử toàn diện quy tắc Task 3B:
 * "Chặn tạo trùng Marketplace Report (PRODUCT, SHOP, USER, REVIEW) khi Report cũ của cùng tài khoản đang PENDING".
 */
@ExtendWith(MockitoExtension.class)
class MarketplaceReportDuplicatePreventionTest {

    @Mock
    private RequestService requestService;

    @Mock
    private RequestRepository requestRepository;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private EscrowRepository escrowRepository;

    @Mock
    private EscrowService escrowService;

    @Mock
    private ShopRepository shopRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SellerRepository sellerRepository;

    @Mock
    private ChatService chatService;

    @Mock
    private AccountDisciplineService accountDisciplineService;

    @Mock
    private ReportRateLimiter reportRateLimiter;

    @Mock
    private com.marketplace.ecommerce.notification.repository.NotificationRepository notificationRepository;

    private RequestPolicy requestPolicy;
    private ReportServiceImpl reportService;

    private UUID reporterAccountId1;
    private UUID reporterAccountId2;
    private Account reporterAccount1;
    private Account reporterAccount2;
    private UUID targetProductId1;
    private UUID targetProductId2;
    private UUID targetShopId;
    private UUID targetUserId;

    @BeforeEach
    void setUp() {
        requestPolicy = spy(new RequestPolicy(
                reportRepository,
                sellerRepository,
                shopRepository,
                userRepository,
                orderRepository
        ));

        reportService = new ReportServiceImpl(
                requestService,
                requestRepository,
                reportRepository,
                accountRepository,
                requestPolicy,
                reviewRepository,
                shopRepository,
                productRepository,
                orderRepository,
                escrowRepository,
                null,
                escrowService,
                null,
                null,
                notificationRepository,
                userRepository,
                chatService,
                accountDisciplineService,
                reportRateLimiter
        );

        reporterAccountId1 = UUID.randomUUID();
        reporterAccountId2 = UUID.randomUUID();

        reporterAccount1 = Account.builder()
                .id(reporterAccountId1)
                .username("reporter_1")
                .disciplineLevel(DisciplineLevel.NONE)
                .status(AccountStatus.ACTIVE)
                .build();

        reporterAccount2 = Account.builder()
                .id(reporterAccountId2)
                .username("reporter_2")
                .disciplineLevel(DisciplineLevel.NONE)
                .status(AccountStatus.ACTIVE)
                .build();

        targetProductId1 = UUID.randomUUID();
        targetProductId2 = UUID.randomUUID();
        targetShopId = UUID.randomUUID();
        targetUserId = UUID.randomUUID();

        lenient().when(accountDisciplineService.checkAndReconcileSuspension(any(Account.class), any(LocalDateTime.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    private void mockRequestCreationSuccess(Account acc) {
        Request createdReq = Request.builder()
                .id(UUID.randomUUID())
                .account(acc)
                .type(RequestType.REPORT)
                .status(RequestStatus.PENDING)
                .build();

        when(requestService.createRequest(eq(acc), any())).thenReturn(createdReq);
        when(reportRepository.save(any(Report.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @DisplayName("Kịch bản 1: Chặn tạo Report khi có Report cũ PENDING cho cùng đối tượng (BLOCK)")
    void testBlockDuplicateReportWhenOldReportIsPending() {
        when(accountRepository.findById(reporterAccountId1)).thenReturn(Optional.of(reporterAccount1));
        doReturn(TargetType.PRODUCT).when(requestPolicy).resolve(targetProductId1);
        when(reportRepository.existsActiveReportByReporterAndTarget(reporterAccountId1, TargetType.PRODUCT, targetProductId1))
                .thenReturn(true);

        CreateReportRequest request = CreateReportRequest.builder()
                .targetId(targetProductId1)
                .description("Sản phẩm có dấu hiệu giả mạo")
                .build();

        CustomException ex = assertThrows(CustomException.class,
                () -> reportService.createReport(reporterAccountId1, request));

        assertTrue(ex.getMessage().contains("đang có một báo cáo cho đối tượng này đang chờ xử lý"));
        verify(requestPolicy).validateMarketplaceReport(reporterAccountId1, TargetType.PRODUCT, targetProductId1);
        verify(requestService, never()).createRequest(any(), any());
        verify(reportRepository, never()).save(any());
    }

    @Test
    @DisplayName("Kịch bản 2: Cho phép tạo Report khi Report cũ đã APPROVED (ALLOW)")
    void testAllowReportWhenOldReportWasApproved() {
        when(accountRepository.findById(reporterAccountId1)).thenReturn(Optional.of(reporterAccount1));
        doReturn(TargetType.PRODUCT).when(requestPolicy).resolve(targetProductId1);
        // DB trả về false vì Report cũ đã APPROVED (không còn PENDING)
        when(reportRepository.existsActiveReportByReporterAndTarget(reporterAccountId1, TargetType.PRODUCT, targetProductId1))
                .thenReturn(false);
        mockRequestCreationSuccess(reporterAccount1);

        CreateReportRequest request = CreateReportRequest.builder()
                .targetId(targetProductId1)
                .description("Sản phẩm tái phạm sau khi đã xử lý trước đó")
                .build();

        CreateRequestResponse response = reportService.createReport(reporterAccountId1, request);

        assertNotNull(response);
        verify(requestPolicy).validateMarketplaceReport(reporterAccountId1, TargetType.PRODUCT, targetProductId1);
        verify(requestService).createRequest(eq(reporterAccount1), any());
        verify(reportRepository).save(any(Report.class));
    }

    @Test
    @DisplayName("Kịch bản 3: Cho phép tạo Report khi Report cũ đã REJECTED (ALLOW)")
    void testAllowReportWhenOldReportWasRejected() {
        when(accountRepository.findById(reporterAccountId1)).thenReturn(Optional.of(reporterAccount1));
        doReturn(TargetType.PRODUCT).when(requestPolicy).resolve(targetProductId1);
        // DB trả về false vì Report cũ đã REJECTED (không còn PENDING)
        when(reportRepository.existsActiveReportByReporterAndTarget(reporterAccountId1, TargetType.PRODUCT, targetProductId1))
                .thenReturn(false);
        mockRequestCreationSuccess(reporterAccount1);

        CreateReportRequest request = CreateReportRequest.builder()
                .targetId(targetProductId1)
                .description("Bổ sung bằng chứng rõ ràng hơn sau khi report cũ bị từ chối")
                .build();

        CreateRequestResponse response = reportService.createReport(reporterAccountId1, request);

        assertNotNull(response);
        verify(requestPolicy).validateMarketplaceReport(reporterAccountId1, TargetType.PRODUCT, targetProductId1);
        verify(requestService).createRequest(eq(reporterAccount1), any());
        verify(reportRepository).save(any(Report.class));
    }

    @Test
    @DisplayName("Kịch bản 4: Cho phép tạo Report cho target ID khác dù target ID 1 đang PENDING (ALLOW)")
    void testAllowReportForDifferentTargetId() {
        when(accountRepository.findById(reporterAccountId1)).thenReturn(Optional.of(reporterAccount1));
        doReturn(TargetType.PRODUCT).when(requestPolicy).resolve(targetProductId2);
        // targetId2 không có report PENDING nào
        when(reportRepository.existsActiveReportByReporterAndTarget(reporterAccountId1, TargetType.PRODUCT, targetProductId2))
                .thenReturn(false);
        mockRequestCreationSuccess(reporterAccount1);

        CreateReportRequest request = CreateReportRequest.builder()
                .targetId(targetProductId2)
                .description("Báo cáo sản phẩm thứ hai")
                .build();

        CreateRequestResponse response = reportService.createReport(reporterAccountId1, request);

        assertNotNull(response);
        verify(requestPolicy).validateMarketplaceReport(reporterAccountId1, TargetType.PRODUCT, targetProductId2);
        verify(requestService).createRequest(eq(reporterAccount1), any());
        verify(reportRepository).save(any(Report.class));
    }

    @Test
    @DisplayName("Kịch bản 5: Cho phép tạo Report cùng UUID nhưng khác TargetType (ALLOW)")
    void testAllowReportForSameUuidDifferentTargetType() {
        UUID sharedId = UUID.randomUUID();
        when(accountRepository.findById(reporterAccountId1)).thenReturn(Optional.of(reporterAccount1));
        doReturn(TargetType.SHOP).when(requestPolicy).resolve(sharedId);
        // SHOP với sharedId không có report PENDING
        when(reportRepository.existsActiveReportByReporterAndTarget(reporterAccountId1, TargetType.SHOP, sharedId))
                .thenReturn(false);
        mockRequestCreationSuccess(reporterAccount1);

        CreateReportRequest request = CreateReportRequest.builder()
                .targetId(sharedId)
                .description("Báo cáo gian hàng")
                .build();

        CreateRequestResponse response = reportService.createReport(reporterAccountId1, request);

        assertNotNull(response);
        verify(requestPolicy).validateMarketplaceReport(reporterAccountId1, TargetType.SHOP, sharedId);
        verify(requestService).createRequest(eq(reporterAccount1), any());
        verify(reportRepository).save(any(Report.class));
    }

    @Test
    @DisplayName("Kịch bản 6: Cho phép tài khoản khác tạo Report cho cùng target dù reporter 1 đang PENDING (ALLOW)")
    void testAllowDifferentReporterForSameTarget() {
        when(accountRepository.findById(reporterAccountId2)).thenReturn(Optional.of(reporterAccount2));
        doReturn(TargetType.PRODUCT).when(requestPolicy).resolve(targetProductId1);
        // reporter 2 chưa có report PENDING cho targetProductId1
        when(reportRepository.existsActiveReportByReporterAndTarget(reporterAccountId2, TargetType.PRODUCT, targetProductId1))
                .thenReturn(false);
        mockRequestCreationSuccess(reporterAccount2);

        CreateReportRequest request = CreateReportRequest.builder()
                .targetId(targetProductId1)
                .description("Người dùng khác báo cáo cùng sản phẩm này")
                .build();

        CreateRequestResponse response = reportService.createReport(reporterAccountId2, request);

        assertNotNull(response);
        verify(requestPolicy).validateMarketplaceReport(reporterAccountId2, TargetType.PRODUCT, targetProductId1);
        verify(requestService).createRequest(eq(reporterAccount2), any());
        verify(reportRepository).save(any(Report.class));
    }

    @Test
    @DisplayName("Kịch bản 7: Validation chặn trước khi tạo Request / Report (Verify zero side effects)")
    void testValidationBlocksBeforeRequestAndReportCreation() {
        when(accountRepository.findById(reporterAccountId1)).thenReturn(Optional.of(reporterAccount1));
        doReturn(TargetType.REVIEW).when(requestPolicy).resolve(targetProductId1);
        when(reportRepository.existsActiveReportByReporterAndTarget(reporterAccountId1, TargetType.REVIEW, targetProductId1))
                .thenReturn(true);

        CreateReportRequest request = CreateReportRequest.builder()
                .targetId(targetProductId1)
                .description("Đánh giá xúc phạm")
                .build();

        assertThrows(CustomException.class, () -> reportService.createReport(reporterAccountId1, request));

        // Xác minh nghiêm ngặt: không có request nào được tạo và không có report nào được lưu vào DB
        verify(requestService, never()).createRequest(any(), any());
        verify(reportRepository, never()).save(any());
        verify(escrowRepository, never()).findByOrderIdForUpdate(any());
    }

    @Test
    @DisplayName("Kịch bản 8: Order Report không gọi validateMarketplaceReport (Bảo toàn Task 2B)")
    void testOrderReportDoesNotCallValidateMarketplaceReport() {
        UUID orderId = UUID.randomUUID();
        when(accountRepository.findById(reporterAccountId1)).thenReturn(Optional.of(reporterAccount1));
        doReturn(TargetType.ORDER).when(requestPolicy).resolve(orderId);
        doNothing().when(requestPolicy).validateOrderReport(reporterAccountId1, orderId);
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.empty());
        mockRequestCreationSuccess(reporterAccount1);

        CreateReportRequest request = CreateReportRequest.builder()
                .targetId(orderId)
                .description("Hàng không đúng mô tả")
                .build();

        CreateRequestResponse response = reportService.createReport(reporterAccountId1, request);

        assertNotNull(response);
        // Xác minh: KHÔNG BAO GIỜ gọi validateMarketplaceReport cho ORDER
        verify(requestPolicy, never()).validateMarketplaceReport(any(), any(), any());
        // Xác minh: VẪN GỌI validateOrderReport theo chuẩn Task 2B
        verify(requestPolicy).validateOrderReport(reporterAccountId1, orderId);
        verify(requestService).createRequest(eq(reporterAccount1), any());
        verify(reportRepository).save(any(Report.class));
    }
}
