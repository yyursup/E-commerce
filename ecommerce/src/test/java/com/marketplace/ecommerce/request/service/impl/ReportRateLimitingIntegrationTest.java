package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.auth.service.AccountDisciplineService;
import com.marketplace.ecommerce.chat.service.ChatService;
import com.marketplace.ecommerce.common.ErrorResponse;
import com.marketplace.ecommerce.common.exception.GlobalExceptionHandler;
import com.marketplace.ecommerce.common.exception.RateLimitException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.repository.OrderReturnRepository;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.notification.repository.NotificationRepository;
import com.marketplace.ecommerce.order.service.OrderReturnService;
import com.marketplace.ecommerce.request.dto.request.CreateReportRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.policy.ReportRateLimiter;
import com.marketplace.ecommerce.request.policy.RequestPolicy;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.service.RequestService;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopEscrowFundService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReportRateLimitingIntegrationTest {

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
    @Mock
    private OrderReturnService orderReturnService;
    @Mock
    private ShopEscrowFundService shopEscrowFundService;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ChatService chatService;
    @Mock
    private AccountDisciplineService accountDisciplineService;

    @Mock
    private ReportRateLimiter reportRateLimiter;

    private ReportServiceImpl reportService;

    private UUID buyerAccountId;
    private Account buyerAccount;
    private Request sampleRequest;

    @BeforeEach
    void setUp() {
        buyerAccountId = UUID.randomUUID();
        buyerAccount = Account.builder()
                .id(buyerAccountId)
                .status(AccountStatus.ACTIVE)
                .disciplineLevel(DisciplineLevel.NONE)
                .build();

        sampleRequest = Request.builder()
                .id(UUID.randomUUID())
                .account(buyerAccount)
                .type(RequestType.REPORT)
                .createdAt(LocalDateTime.now())
                .build();

        when(accountRepository.findById(buyerAccountId)).thenReturn(Optional.of(buyerAccount));
        when(accountDisciplineService.checkAndReconcileSuspension(eq(buyerAccount), any()))
                .thenReturn(buyerAccount);
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
                orderReturnRepository,
                escrowService,
                orderReturnService,
                shopEscrowFundService,
                notificationRepository,
                userRepository,
                chatService,
                accountDisciplineService,
                reportRateLimiter
        );
    }

    @Test
    @DisplayName("B1. Request Marketplace đầu tiên được xử lý bình thường")
    void testFirstMarketplaceReport_Success() {
        UUID productId = UUID.randomUUID();
        CreateReportRequest req = CreateReportRequest.builder()
                .targetId(productId)
                .description("Hàng giả kém chất lượng")
                .evidenceUrl("http://img.com/fake.jpg")
                .build();

        when(requestPolicy.resolve(productId)).thenReturn(TargetType.PRODUCT);
        doNothing().when(reportRateLimiter).checkRateLimit(buyerAccountId);
        when(requestService.createRequest(eq(buyerAccount), any())).thenReturn(sampleRequest);

        CreateRequestResponse response = reportService.createReport(buyerAccountId, req);

        assertNotNull(response);
        assertEquals(sampleRequest.getId(), response.getRequestId());
        verify(reportRateLimiter, times(1)).checkRateLimit(buyerAccountId);
        verify(reportRepository, times(1)).save(any(Report.class));
        verify(requestService, times(1)).createRequest(eq(buyerAccount), any());
    }

    @Test
    @DisplayName("B2 & B6. Request tiếp theo trong thời gian giới hạn nhận RateLimitException, KHÔNG tạo Report và không có side effect")
    void testSubsequentMarketplaceReportWithinLimit_ThrowsRateLimitException_NoDataCreated() {
        UUID shopId = UUID.randomUUID();
        CreateReportRequest req = CreateReportRequest.builder()
                .targetId(shopId)
                .description("Shop có dấu hiệu lừa đảo")
                .build();

        when(requestPolicy.resolve(shopId)).thenReturn(TargetType.SHOP);
        // Rate limiter ném ngoại lệ khi gửi quá nhanh
        doThrow(new RateLimitException("Bạn đang gửi báo cáo quá nhanh. Vui lòng thử lại sau 3 giây.", 3L))
                .when(reportRateLimiter).checkRateLimit(buyerAccountId);

        RateLimitException thrown = assertThrows(
                RateLimitException.class,
                () -> reportService.createReport(buyerAccountId, req)
        );

        assertEquals(3L, thrown.getRetryAfterSeconds());
        assertTrue(thrown.getMessage().contains("3 giây"));

        // Xác nhận B6: Không có bất kỳ dữ liệu nào được lưu vào DB
        verify(requestService, never()).createRequest(any(), any());
        verify(reportRepository, never()).save(any(Report.class));
        verify(chatService, never()).getOrCreateDisputeThread(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("B3. Request sau khi hết giới hạn (hết cooldown) xử lý bình thường")
    void testReportAfterCooldown_Success() {
        UUID reviewId = UUID.randomUUID();
        CreateReportRequest req = CreateReportRequest.builder()
                .targetId(reviewId)
                .description("Đánh giá spam bôi nhọ")
                .build();

        when(requestPolicy.resolve(reviewId)).thenReturn(TargetType.REVIEW);
        // Lần 1: Cho phép
        doNothing().doThrow(new RateLimitException("Chờ 2s", 2L)).doNothing()
                .when(reportRateLimiter).checkRateLimit(buyerAccountId);
        when(requestService.createRequest(eq(buyerAccount), any())).thenReturn(sampleRequest);

        // Lần 1 thành công
        assertNotNull(reportService.createReport(buyerAccountId, req));

        // Lần 2 (ngay sau đó): Bị chặn
        assertThrows(RateLimitException.class, () -> reportService.createReport(buyerAccountId, req));

        // Lần 3 (sau khi hết cooldown): Thành công trở lại
        assertNotNull(reportService.createReport(buyerAccountId, req));
        verify(reportRepository, times(2)).save(any(Report.class));
    }

    @Test
    @DisplayName("B4. Các tài khoản khác nhau không chặn lẫn nhau")
    void testDifferentAccountsDoNotBlockEachOther() {
        UUID userBAccountId = UUID.randomUUID();
        Account userB = Account.builder()
                .id(userBAccountId)
                .status(AccountStatus.ACTIVE)
                .disciplineLevel(DisciplineLevel.NONE)
                .build();

        when(accountRepository.findById(userBAccountId)).thenReturn(Optional.of(userB));
        when(accountDisciplineService.checkAndReconcileSuspension(eq(userB), any())).thenReturn(userB);

        UUID prod1 = UUID.randomUUID();
        UUID prod2 = UUID.randomUUID();
        CreateReportRequest req1 = CreateReportRequest.builder().targetId(prod1).description("Report 1").build();
        CreateReportRequest req2 = CreateReportRequest.builder().targetId(prod2).description("Report 2").build();

        when(requestPolicy.resolve(prod1)).thenReturn(TargetType.PRODUCT);
        when(requestPolicy.resolve(prod2)).thenReturn(TargetType.PRODUCT);

        // Account A bị rate limit
        doThrow(new RateLimitException("Chờ 3s", 3L)).when(reportRateLimiter).checkRateLimit(buyerAccountId);
        // Account B được phép đi qua
        doNothing().when(reportRateLimiter).checkRateLimit(userBAccountId);

        when(requestService.createRequest(eq(userB), any())).thenReturn(sampleRequest);

        // User A bị từ chối
        assertThrows(RateLimitException.class, () -> reportService.createReport(buyerAccountId, req1));

        // User B hoàn tất bình thường
        CreateRequestResponse responseB = reportService.createReport(userBAccountId, req2);
        assertNotNull(responseB);
        verify(requestService, times(1)).createRequest(eq(userB), any());
    }

    @Test
    @DisplayName("B5. Kiểm thử request đồng thời: chỉ một request của cùng tài khoản được cấp lượt")
    void testConcurrentRequestsSameAccount() throws InterruptedException {
        UUID targetUserId = UUID.randomUUID();
        CreateReportRequest req = CreateReportRequest.builder()
                .targetId(targetUserId)
                .description("Báo cáo vi phạm đồng thời")
                .build();

        when(requestPolicy.resolve(targetUserId)).thenReturn(TargetType.USER);
        when(requestService.createRequest(eq(buyerAccount), any())).thenReturn(sampleRequest);

        // Giả lập cơ chế Atomic Redis: chỉ 1 request đầu tiên trả về thành công, các request sau ném RateLimitException
        AtomicInteger callCount = new AtomicInteger(0);
        doAnswer(invocation -> {
            if (callCount.incrementAndGet() == 1) {
                return null; // Được cấp quyền
            } else {
                throw new RateLimitException("Bạn đang gửi báo cáo quá nhanh.", 3L);
            }
        }).when(reportRateLimiter).checkRateLimit(buyerAccountId);

        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger rateLimitedCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    reportService.createReport(buyerAccountId, req);
                    successCount.incrementAndGet();
                } catch (RateLimitException e) {
                    rateLimitedCount.incrementAndGet();
                } catch (Exception e) {
                    fail("Lỗi không mong muốn: " + e.getMessage());
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown(); // Bắn đồng thời toàn bộ 10 threads
        assertTrue(doneLatch.await(5, TimeUnit.SECONDS));
        executor.shutdown();

        // Khẳng định: Chính xác 1 request thành công, 9 request bị từ chối với 429 RateLimitException
        assertEquals(1, successCount.get(), "Chỉ có duy nhất 1 request được xử lý thành công");
        assertEquals(9, rateLimitedCount.get(), "9 request còn lại phải bị từ chối bởi Rate Limiter");
        verify(reportRepository, times(1)).save(any(Report.class));
    }

    @Test
    @DisplayName("B7. TargetType.ORDER hoàn toàn KHÔNG bị rate limit tác động, Escrow và Chat giữ nguyên")
    void testOrderReport_NeverRateLimited() {
        UUID orderId = UUID.randomUUID();
        Escrow escrow = Escrow.builder()
                .id(UUID.randomUUID())
                .status(EscrowStatus.HELD)
                .build();

        Shop shop = Shop.builder().id(UUID.randomUUID()).build();
        User buyerUser = User.builder().id(UUID.randomUUID()).account(buyerAccount).build();
        User sellerUser = User.builder().id(UUID.randomUUID()).account(Account.builder().id(UUID.randomUUID()).build()).build();
        shop.setUser(sellerUser);

        Order order = Order.builder()
                .id(orderId)
                .orderNumber("ORD-123456")
                .user(buyerUser)
                .shop(shop)
                .build();

        CreateReportRequest req = CreateReportRequest.builder()
                .targetId(orderId)
                .description("Hàng hỏng phần cứng")
                .build();

        when(requestPolicy.resolve(orderId)).thenReturn(TargetType.ORDER);
        doNothing().when(requestPolicy).validateOrderReport(buyerAccountId, orderId);
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(requestService.createRequest(eq(buyerAccount), any())).thenReturn(sampleRequest);

        CreateRequestResponse response = reportService.createReport(buyerAccountId, req);

        assertNotNull(response);
        // B7.1: Xác nhận reportRateLimiter TUYỆT ĐỐI KHÔNG ĐƯỢC GỌI
        verify(reportRateLimiter, never()).checkRateLimit(any());

        // B7.2: Xác nhận Escrow bị khóa sang DISPUTED
        assertEquals(EscrowStatus.DISPUTED, escrow.getStatus());
        verify(escrowRepository, times(1)).save(escrow);

        // B7.3: Xác nhận Chat tranh chấp và notification được kích hoạt
        verify(chatService, times(1)).getOrCreateDisputeThread(eq(orderId), any(), eq(buyerAccountId), eq(shop.getId()), eq("ORD-123456"));
    }

    @Test
    @DisplayName("GlobalExceptionHandler: Trả về HTTP 429 và header Retry-After khi bắt RateLimitException")
    void testGlobalExceptionHandler_RateLimitResponse() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        HttpServletRequest mockRequest = mock(HttpServletRequest.class);
        when(mockRequest.getRequestURI()).thenReturn("/api/v1/report");

        RateLimitException ex = new RateLimitException("Bạn đang gửi báo cáo quá nhanh. Vui lòng thử lại sau 3 giây.", 3L);

        ResponseEntity<ErrorResponse> response = handler.handleRateLimit(ex, mockRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, response.getStatusCode());
        assertEquals("3", response.getHeaders().getFirst(HttpHeaders.RETRY_AFTER));

        ErrorResponse body = response.getBody();
        assertNotNull(body);
        assertEquals(429, body.status());
        assertEquals("Too Many Requests", body.error());
        assertEquals("Bạn đang gửi báo cáo quá nhanh. Vui lòng thử lại sau 3 giây.", body.message());
        assertEquals("/api/v1/report", body.path());
        assertNotNull(body.timestamp());
    }
}
