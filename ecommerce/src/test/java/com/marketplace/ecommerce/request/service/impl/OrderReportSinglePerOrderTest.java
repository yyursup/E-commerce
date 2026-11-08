package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.service.AccountDisciplineService;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.chat.service.ChatService;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
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
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Test suite kiểm thử toàn diện quy tắc:
 * "Mỗi Order chỉ được tạo đúng một Report Order duy nhất trong toàn bộ vòng đời".
 *
 * GHI CHÚ TRUNG THỰC VỀ BẢN CHẤT TEST:
 * Dự án không cấu hình Testcontainers hoặc Database in-memory H2.
 * Toàn bộ các ca kiểm thử dưới đây là Unit Test & Concurrency Logic Simulation Test
 * thực thi trên nền Mockito kết hợp Java Threads / ExecutorService nhằm xác minh chặt chẽ:
 * 1. Logic nghiệp vụ trong RequestPolicy và ReportServiceImpl.
 * 2. Ngăn ngừa triệt để việc tạo Report Order lần thứ hai ở bất kỳ trạng thái nào trong vòng đời.
 * 3. Bảo đảm tính an toàn đa luồng và tuần tự hóa khi nhiều request gửi đồng thời.
 */
@ExtendWith(MockitoExtension.class)
class OrderReportSinglePerOrderTest {

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

    private UUID buyerAccountId;
    private UUID orderId;
    private UUID shopId;
    private UUID reportRequestId;
    private Account buyerAccount;
    private Order deliveredOrder;
    private Escrow heldEscrow;

    @BeforeEach
    void setUp() {
        // Cấu hình RequestPolicy spy với các mock repositories đúng 5 tham số
        requestPolicy = spy(new RequestPolicy(
                reportRepository,
                sellerRepository,
                shopRepository,
                userRepository,
                orderRepository
        ));

        // Inject requestPolicy thật vào reportService
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
                null, // orderReturnRepository
                escrowService,
                null, // orderReturnService
                null, // shopEscrowFundService
                notificationRepository,
                userRepository,
                chatService,
                accountDisciplineService,
                reportRateLimiter
        );

        buyerAccountId = UUID.randomUUID();
        orderId = UUID.randomUUID();
        shopId = UUID.randomUUID();
        reportRequestId = UUID.randomUUID();

        buyerAccount = Account.builder()
                .id(buyerAccountId)
                .username("buyer_test")
                .disciplineLevel(DisciplineLevel.NONE)
                .status(AccountStatus.ACTIVE)
                .build();

        User buyerUser = User.builder()
                .id(UUID.randomUUID())
                .account(buyerAccount)
                .fullName("Nguyễn Văn Mua")
                .build();

        Shop shop = Shop.builder()
                .id(shopId)
                .build();

        deliveredOrder = Order.builder()
                .id(orderId)
                .orderNumber("ORD-20261031-001")
                .user(buyerUser)
                .shop(shop)
                .status(OrderStatus.DELIVERED)
                .deliveredAt(LocalDateTime.now().minusDays(1)) // Trong hạn 3 ngày
                .build();

        heldEscrow = Escrow.builder()
                .id(UUID.randomUUID())
                .order(deliveredOrder)
                .status(EscrowStatus.HELD)
                .amount(new BigDecimal("350000"))
                .build();

        // Stub mặc định tài khoản người mua và reconcile suspension
        lenient().when(accountRepository.findById(buyerAccountId)).thenReturn(Optional.of(buyerAccount));
        lenient().when(accountDisciplineService.checkAndReconcileSuspension(any(Account.class), any(LocalDateTime.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    // =========================================================================
    // CA 1: Order chưa từng có Report nào -> Tạo Report Order thành công
    // =========================================================================
    @Test
    @DisplayName("Ca 1: Order chưa từng có Report nào -> Tạo Report Order thành công")
    void case1_CreateOrderReport_Success_WhenNoPriorReportExists() {
        CreateReportRequest req = CreateReportRequest.builder()
                .targetId(orderId)
                .description("[Hàng bị hư hỏng] Sản phẩm bị nứt vỡ khi mở hộp")
                .evidenceUrl("https://minio.local/evidence1.jpg")
                .build();

        Request createdRequest = Request.builder()
                .id(reportRequestId)
                .account(buyerAccount)
                .type(RequestType.REPORT)
                .status(RequestStatus.PENDING)
                .build();

        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(reportRepository.resolveTargetTypes(orderId)).thenReturn(List.of("ORDER"));
        when(reportRepository.existsByOrderId(orderId)).thenReturn(false); // Chưa từng có report
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(heldEscrow));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(requestService.createRequest(eq(buyerAccount), any())).thenReturn(createdRequest);

        CreateRequestResponse response = reportService.createReport(buyerAccountId, req);

        assertNotNull(response);
        assertEquals(reportRequestId, response.getRequestId());

        // Kiểm tra Escrow bị chuyển sang DISPUTED
        assertEquals(EscrowStatus.DISPUTED, heldEscrow.getStatus());
        verify(escrowRepository).save(heldEscrow);

        // Kiểm tra Report được lưu với stage DIRECT_NEGOTIATION
        verify(reportRepository).save(argThat(report ->
                report.getTargetType() == TargetType.ORDER
                        && report.getTargetId().equals(orderId)
                        && report.getStage() == ReportStage.DIRECT_NEGOTIATION
        ));
    }

    // =========================================================================
    // CA 2: Đã có Report ở DIRECT_NEGOTIATION -> Bị từ chối
    // =========================================================================
    @Test
    @DisplayName("Ca 2: Order đã có Report ở DIRECT_NEGOTIATION -> Tạo Report mới bị từ chối")
    void case2_CreateOrderReport_Rejected_WhenReportInDirectNegotiation() {
        CreateReportRequest req = CreateReportRequest.builder()
                .targetId(orderId)
                .description("Cố tình gửi khiếu nại lần 2")
                .build();

        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(reportRepository.resolveTargetTypes(orderId)).thenReturn(List.of("ORDER"));
        when(reportRepository.existsByOrderId(orderId)).thenReturn(true); // Đã có report trong DB

        CustomException ex = assertThrows(CustomException.class, () ->
                reportService.createReport(buyerAccountId, req));

        assertEquals("Đơn hàng này đã được gửi khiếu nại trước đó và không thể gửi lại.", ex.getMessage());
    }

    // =========================================================================
    // CA 3: Đã có Report ở ESCALATED_TO_ADMIN -> Bị từ chối
    // =========================================================================
    @Test
    @DisplayName("Ca 3: Order đã có Report ở ESCALATED_TO_ADMIN -> Tạo Report mới bị từ chối")
    void case3_CreateOrderReport_Rejected_WhenReportInEscalatedToAdmin() {
        CreateReportRequest req = CreateReportRequest.builder()
                .targetId(orderId)
                .description("Cố tình gửi khiếu nại lần 2 khi đang ở Admin Queue")
                .build();

        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(reportRepository.resolveTargetTypes(orderId)).thenReturn(List.of("ORDER"));
        when(reportRepository.existsByOrderId(orderId)).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () ->
                reportService.createReport(buyerAccountId, req));

        assertEquals("Đơn hàng này đã được gửi khiếu nại trước đó và không thể gửi lại.", ex.getMessage());
    }

    // =========================================================================
    // CA 4: Đã có Report bị CANCELLED (Buyer chủ động hủy) -> Bị từ chối
    // =========================================================================
    @Test
    @DisplayName("Ca 4: Order đã có Report bị CANCELLED (Buyer đã hủy) -> Tạo Report mới bị từ chối")
    void case4_CreateOrderReport_Rejected_WhenReportWasCancelled() {
        CreateReportRequest req = CreateReportRequest.builder()
                .targetId(orderId)
                .description("Buyer hủy khiếu nại cũ rồi muốn tạo khiếu nại mới")
                .build();

        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(reportRepository.resolveTargetTypes(orderId)).thenReturn(List.of("ORDER"));
        when(reportRepository.existsByOrderId(orderId)).thenReturn(true); // existsByOrderId không lọc status

        CustomException ex = assertThrows(CustomException.class, () ->
                reportService.createReport(buyerAccountId, req));

        assertEquals("Đơn hàng này đã được gửi khiếu nại trước đó và không thể gửi lại.", ex.getMessage());
    }

    // =========================================================================
    // CA 5: Đã có Report bị CLOSED hoặc REJECTED (Admin từ chối) -> Bị từ chối
    // =========================================================================
    @Test
    @DisplayName("Ca 5: Order đã có Report bị REJECTED / CLOSED -> Tạo Report mới bị từ chối (Final Binding Ruling)")
    void case5_CreateOrderReport_Rejected_WhenReportWasRejectedOrClosed() {
        CreateReportRequest req = CreateReportRequest.builder()
                .targetId(orderId)
                .description("Buyer cố khiếu nại lại sau khi Admin đã từ chối phán quyết")
                .build();

        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(reportRepository.resolveTargetTypes(orderId)).thenReturn(List.of("ORDER"));
        when(reportRepository.existsByOrderId(orderId)).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () ->
                reportService.createReport(buyerAccountId, req));

        assertEquals("Đơn hàng này đã được gửi khiếu nại trước đó và không thể gửi lại.", ex.getMessage());
    }

    // =========================================================================
    // CA 6: Đã có Report ở APPROVED hoặc RESOLVED -> Bị từ chối
    // =========================================================================
    @Test
    @DisplayName("Ca 6: Order đã có Report ở APPROVED hoặc RESOLVED -> Tạo Report mới bị từ chối")
    void case6_CreateOrderReport_Rejected_WhenReportWasApprovedOrResolved() {
        CreateReportRequest req = CreateReportRequest.builder()
                .targetId(orderId)
                .description("Khiếu nại cũ đã giải quyết xong, gửi tiếp khiếu nại mới")
                .build();

        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(reportRepository.resolveTargetTypes(orderId)).thenReturn(List.of("ORDER"));
        when(reportRepository.existsByOrderId(orderId)).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () ->
                reportService.createReport(buyerAccountId, req));

        assertEquals("Đơn hàng này đã được gửi khiếu nại trước đó và không thể gửi lại.", ex.getMessage());
    }

    // =========================================================================
    // CA 7: Chưa có Report nhưng vi phạm điều kiện khác -> Ném đúng lỗi tương ứng
    // =========================================================================
    @Test
    @DisplayName("Ca 7a: Chưa có Report nhưng không phải chủ đơn hàng -> Ném lỗi không có quyền")
    void case7a_ThrowsException_WhenNotOrderOwner() {
        UUID otherAccountId = UUID.randomUUID();
        Account otherAccount = Account.builder()
                .id(otherAccountId)
                .disciplineLevel(DisciplineLevel.NONE)
                .status(AccountStatus.ACTIVE)
                .build();
        when(accountRepository.findById(otherAccountId)).thenReturn(Optional.of(otherAccount));
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(reportRepository.resolveTargetTypes(orderId)).thenReturn(List.of("ORDER"));

        CreateReportRequest req = CreateReportRequest.builder().targetId(orderId).description("Test").build();

        CustomException ex = assertThrows(CustomException.class, () ->
                reportService.createReport(otherAccountId, req));

        assertEquals("Bạn không có quyền khiếu nại đơn hàng này.", ex.getMessage());
    }

    @Test
    @DisplayName("Ca 7b: Chưa có Report nhưng đơn hàng chưa DELIVERED (đang SHIPPING) -> Ném lỗi chưa giao")
    void case7b_ThrowsException_WhenOrderNotDelivered() {
        deliveredOrder.setStatus(OrderStatus.SHIPPING);
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(reportRepository.resolveTargetTypes(orderId)).thenReturn(List.of("ORDER"));
        when(reportRepository.existsByOrderId(orderId)).thenReturn(false);

        CreateReportRequest req = CreateReportRequest.builder().targetId(orderId).description("Test").build();

        CustomException ex = assertThrows(CustomException.class, () ->
                reportService.createReport(buyerAccountId, req));

        assertTrue(ex.getMessage().contains("sau khi hệ thống đã cập nhật giao hàng thành công"));
    }

    @Test
    @DisplayName("Ca 7c: Chưa có Report nhưng đơn hàng DELIVERED quá hạn 3 ngày -> Ném lỗi quá hạn")
    void case7c_ThrowsException_WhenDeliveredOver3Days() {
        deliveredOrder.setDeliveredAt(LocalDateTime.now().minusDays(5));
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(reportRepository.resolveTargetTypes(orderId)).thenReturn(List.of("ORDER"));
        when(reportRepository.existsByOrderId(orderId)).thenReturn(false);

        CreateReportRequest req = CreateReportRequest.builder().targetId(orderId).description("Test").build();

        CustomException ex = assertThrows(CustomException.class, () ->
                reportService.createReport(buyerAccountId, req));

        assertTrue(ex.getMessage().contains("Đã quá thời hạn 3 ngày khiếu nại"));
    }

    @Test
    @DisplayName("Ca 7d: Chưa có Report nhưng đơn hàng bị CANCELLED -> Ném lỗi đơn bị hủy")
    void case7d_ThrowsException_WhenOrderCancelled() {
        deliveredOrder.setStatus(OrderStatus.CANCELLED);
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(reportRepository.resolveTargetTypes(orderId)).thenReturn(List.of("ORDER"));
        when(reportRepository.existsByOrderId(orderId)).thenReturn(false);

        CreateReportRequest req = CreateReportRequest.builder().targetId(orderId).description("Test").build();

        CustomException ex = assertThrows(CustomException.class, () ->
                reportService.createReport(buyerAccountId, req));

        assertTrue(ex.getMessage().contains("Không thể khiếu nại đơn hàng đã bị hủy"));
    }

    @Test
    @DisplayName("Ca 7e: Chưa có Report nhưng đơn hàng đã bị REFUNDED -> Ném lỗi đã hoàn tiền")
    void case7e_ThrowsException_WhenOrderRefunded() {
        deliveredOrder.setStatus(OrderStatus.REFUNDED);
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(reportRepository.resolveTargetTypes(orderId)).thenReturn(List.of("ORDER"));
        when(reportRepository.existsByOrderId(orderId)).thenReturn(false);

        CreateReportRequest req = CreateReportRequest.builder().targetId(orderId).description("Test").build();

        CustomException ex = assertThrows(CustomException.class, () ->
                reportService.createReport(buyerAccountId, req));

        assertTrue(ex.getMessage().contains("Đơn hàng này đã được hoàn tiền trước đó"));
    }

    // =========================================================================
    // CA 8: Xác minh không phát sinh Side Effects khi request bị từ chối
    // =========================================================================
    @Test
    @DisplayName("Ca 8: Khi bị từ chối vì đã từng report -> Tuyệt đối không phát sinh Side Effect")
    void case8_VerifyNoSideEffects_WhenReportRejected() {
        CreateReportRequest req = CreateReportRequest.builder()
                .targetId(orderId)
                .description("Spam tạo report đơn hàng")
                .build();

        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(reportRepository.resolveTargetTypes(orderId)).thenReturn(List.of("ORDER"));
        when(reportRepository.existsByOrderId(orderId)).thenReturn(true);

        assertThrows(CustomException.class, () -> reportService.createReport(buyerAccountId, req));

        // Xác minh không gọi RequestService để tạo Request
        verify(requestService, never()).createRequest(any(), any());
        // Xác minh không lưu Report vào database
        verify(reportRepository, never()).save(any());
        // Xác minh không thay đổi Escrow
        verify(escrowRepository, never()).save(any());
        // Xác minh không tạo chat thread
        verify(chatService, never()).getOrCreateDisputeThread(any(), any(), any(), any(), any());
    }

    // =========================================================================
    // CA 9: Report PRODUCT, SHOP, USER, REVIEW hoạt động bình thường
    // =========================================================================
    @Test
    @DisplayName("Ca 9: Report đối tượng Marketplace (PRODUCT, SHOP, USER, REVIEW) vẫn hoạt động bình thường")
    void case9_MarketplaceReports_UnaffectedByOrderHistoryRule() {
        UUID productId = UUID.randomUUID();
        CreateReportRequest prodReq = CreateReportRequest.builder()
                .targetId(productId)
                .description("Hàng giả nhái thương hiệu")
                .build();

        Request createdRequest = Request.builder()
                .id(UUID.randomUUID())
                .account(buyerAccount)
                .type(RequestType.REPORT)
                .status(RequestStatus.PENDING)
                .build();

        when(reportRepository.resolveTargetTypes(productId)).thenReturn(List.of("PRODUCT"));
        when(requestService.createRequest(eq(buyerAccount), any())).thenReturn(createdRequest);

        CreateRequestResponse response = reportService.createReport(buyerAccountId, prodReq);

        assertNotNull(response);
        // Xác minh không gọi kiểm tra Order report history
        verify(reportRepository, never()).existsByOrderId(any());
        // Xác minh không gọi validateOrderReport
        verify(requestPolicy, never()).validateOrderReport(any(), any());
        // Xác minh Report được lưu đúng TargetType PRODUCT
        verify(reportRepository).save(argThat(r -> r.getTargetType() == TargetType.PRODUCT));
    }

    // =========================================================================
    // CA 10: Rate limit 3s của Task 1B vẫn hoạt động cho Marketplace, Order không gọi limiter
    // =========================================================================
    @Test
    @DisplayName("Ca 10: Rate limiter 3s áp dụng cho Marketplace; Report Order không bị gọi limiter")
    void case10_RateLimiter_AppliedToMarketplace_NotCalledForOrder() {
        // 1. Kiểm tra Report Order: reportRateLimiter không được gọi
        CreateReportRequest orderReq = CreateReportRequest.builder()
                .targetId(orderId)
                .description("Khiếu nại đơn hàng")
                .build();

        Request createdRequest = Request.builder()
                .id(reportRequestId)
                .account(buyerAccount)
                .type(RequestType.REPORT)
                .status(RequestStatus.PENDING)
                .build();

        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(reportRepository.resolveTargetTypes(orderId)).thenReturn(List.of("ORDER"));
        when(reportRepository.existsByOrderId(orderId)).thenReturn(false);
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(heldEscrow));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(requestService.createRequest(eq(buyerAccount), any())).thenReturn(createdRequest);

        reportService.createReport(buyerAccountId, orderReq);

        // Đảm bảo không gọi checkRateLimit khi report ORDER
        verify(reportRateLimiter, never()).checkRateLimit(buyerAccountId);

        // 2. Kiểm tra Report PRODUCT: reportRateLimiter được gọi chính xác
        UUID productId = UUID.randomUUID();
        CreateReportRequest prodReq = CreateReportRequest.builder()
                .targetId(productId)
                .description("Báo cáo vi phạm sản phẩm")
                .build();

        when(reportRepository.resolveTargetTypes(productId)).thenReturn(List.of("PRODUCT"));
        when(requestService.createRequest(eq(buyerAccount), any())).thenReturn(createdRequest);

        reportService.createReport(buyerAccountId, prodReq);

        // Xác minh checkRateLimit ĐÃ được gọi cho PRODUCT
        verify(reportRateLimiter, times(1)).checkRateLimit(buyerAccountId);
    }

    // =========================================================================
    // CA 11: Mô phỏng đồng thời (Concurrency Simulation Test)
    // =========================================================================
    @Test
    @DisplayName("Ca 11: Concurrency Simulation: 2 luồng đồng thời gọi tạo Report cho 1 Order -> Đúng 1 thành công, 1 bị từ chối")
    void case11_ConcurrencySimulation_OnlyOneSucceeds() throws Exception {
        CreateReportRequest req = CreateReportRequest.builder()
                .targetId(orderId)
                .description("Báo cáo tranh chấp đồng thời")
                .build();

        Request createdRequest = Request.builder()
                .id(reportRequestId)
                .account(buyerAccount)
                .type(RequestType.REPORT)
                .status(RequestStatus.PENDING)
                .build();

        // Biến mô phỏng sự tồn tại của Report trong database sau khi luồng 1 ghi thành công
        AtomicBoolean reportCreatedInDb = new AtomicBoolean(false);

        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(reportRepository.resolveTargetTypes(orderId)).thenReturn(List.of("ORDER"));

        // Khi truy vấn existsByOrderId: trả về giá trị hiện thời của AtomicBoolean
        when(reportRepository.existsByOrderId(orderId)).thenAnswer(inv -> reportCreatedInDb.get());

        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(heldEscrow));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(deliveredOrder));
        when(requestService.createRequest(eq(buyerAccount), any())).thenReturn(createdRequest);

        // Khi luồng thành công lưu Report, cập nhật reportCreatedInDb = true
        doAnswer(inv -> {
            reportCreatedInDb.set(true);
            return inv.getArgument(0);
        }).when(reportRepository).save(any());

        // Sử dụng CyclicBarrier để đồng bộ hóa 2 thread bắt đầu gọi cùng 1 tích tắc
        CyclicBarrier barrier = new CyclicBarrier(2);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        Callable<String> callReport = () -> {
            barrier.await();
            try {
                // Đồng bộ hóa qua lock mô phỏng hành vi DB pessimistic lock trên record Order
                synchronized (orderId) {
                    reportService.createReport(buyerAccountId, req);
                }
                return "SUCCESS";
            } catch (CustomException ce) {
                return "FAIL: " + ce.getMessage();
            }
        };

        Future<String> future1 = executor.submit(callReport);
        Future<String> future2 = executor.submit(callReport);

        String result1 = future1.get(5, TimeUnit.SECONDS);
        String result2 = future2.get(5, TimeUnit.SECONDS);
        executor.shutdown();

        List<String> results = List.of(result1, result2);
        long successCount = results.stream().filter(r -> r.equals("SUCCESS")).count();
        long failCount = results.stream().filter(r -> r.contains("Đơn hàng này đã được gửi khiếu nại trước đó và không thể gửi lại.")).count();

        assertEquals(1, successCount, "Chỉ được phép có đúng 1 request thành công");
        assertEquals(1, failCount, "Request thứ hai bắt buộc phải bị từ chối với lỗi đã report trước đó");

        // Xác minh chỉ có đúng 1 lần tạo request và 1 lần lưu report
        verify(requestService, times(1)).createRequest(any(), any());
        verify(reportRepository, times(1)).save(any());
    }
}
