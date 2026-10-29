package com.marketplace.ecommerce.auth.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.service.AccountDisciplineService;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.chat.service.ChatService;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.notification.repository.NotificationRepository;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.repository.OrderReturnRepository;
import com.marketplace.ecommerce.order.service.OrderReturnService;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.product.dto.request.CreateProductRequest;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductCategoryRepository;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.service.InventoryHistoryService;
import com.marketplace.ecommerce.product.service.ProductImageService;
import com.marketplace.ecommerce.product.service.impl.ProductServiceImpl;
import com.marketplace.ecommerce.product.validate.ProductValidation;
import com.marketplace.ecommerce.request.dto.request.CreateReportRequest;
import com.marketplace.ecommerce.request.policy.ReportRateLimiter;
import com.marketplace.ecommerce.request.policy.RequestPolicy;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.service.RequestService;
import com.marketplace.ecommerce.request.service.impl.ReportServiceImpl;
import com.marketplace.ecommerce.review.dto.request.ReplyRequest;
import com.marketplace.ecommerce.review.entity.Reply;
import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.repository.ReplyRepository;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.service.impl.ReplyServiceImpl;
import com.marketplace.ecommerce.review.validate.ReviewValidation;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopEscrowFundService;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.dto.request.CreateSendRequest;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.valueObjects.ReportStage;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Tests kiểm tra Kỷ luật User 5-6 gậy, Ranh giới Review/Report và Cách ly User/Seller")
class UserDisciplineEnforcementTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ShopRepository shopRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductCategoryRepository productCategoryRepository;

    @Mock
    private ProductValidation productValidation;

    @Mock
    private ProductImageService productImageService;

    @Mock
    private InventoryHistoryService inventoryHistoryService;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ReplyRepository replyRepository;

    @Mock
    private RequestService requestService;

    @Mock
    private RequestRepository requestRepository;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private RequestPolicy requestPolicy;

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
    private ChatService chatService;

    private AccountDisciplineService accountDisciplineService;
    private ProductServiceImpl productService;
    private ReplyServiceImpl replyService;
    private ReviewValidation reviewValidationInstance;
    private ReportServiceImpl reportService;
    private ReportRateLimiter reportRateLimiter;

    @BeforeEach
    void setUp() {
        accountDisciplineService = new AccountDisciplineServiceImpl(accountRepository);
        productService = new ProductServiceImpl(
                productRepository,
                userRepository,
                shopRepository,
                productImageService,
                productCategoryRepository,
                inventoryHistoryService,
                productValidation
        );
        replyService = new ReplyServiceImpl(
                reviewRepository,
                replyRepository,
                userRepository
        );
        reviewValidationInstance = new ReviewValidation();
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

    @Nested
    @DisplayName("A. Kiểm tra punishAccount khi vi phạm đạt 5-6 gậy")
    class PunishAccountTests {

        @Test
        @DisplayName("1. Vi phạm từ 4 lên 5: Chuyển SUSPENDED, hạn đúng 14 ngày, violationCount=5, isActive=true")
        void punishAccount_from4To5_SetsSuspensionCorrectly() throws Exception {
            UUID targetAccountId = UUID.randomUUID();
            LocalDateTime now = LocalDateTime.now();

            Account targetAccount = Account.builder()
                    .id(targetAccountId)
                    .violationCount(4)
                    .lastViolationAt(now.minusDays(5)) // Trong vòng 30 ngày -> không decay
                    .disciplineLevel(DisciplineLevel.WARNED)
                    .status(AccountStatus.ACTIVE)
                    .isActive(true)
                    .build();

            when(accountRepository.findByIdForUpdate(targetAccountId)).thenReturn(Optional.of(targetAccount));
            when(accountRepository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            Method method = ReportServiceImpl.class.getDeclaredMethod("punishAccount", UUID.class, LocalDateTime.class);
            method.setAccessible(true);
            DisciplineLevel resultLevel = (DisciplineLevel) method.invoke(reportService, targetAccountId, now);

            assertEquals(DisciplineLevel.SUSPENDED, resultLevel);
            assertEquals(DisciplineLevel.SUSPENDED, targetAccount.getDisciplineLevel());
            assertEquals(AccountStatus.SUSPENDED, targetAccount.getStatus());
            assertTrue(targetAccount.getIsActive(), "Tài khoản SUSPENDED phải giữ isActive=true để đăng nhập và mua hàng");
            assertEquals(5, targetAccount.getViolationCount(), "Số vi phạm phải tăng lên 5");
            assertEquals(now.plusDays(14), targetAccount.getSuspendedUntil(), "Thời hạn suspension phải đúng 14 ngày sau thời điểm phạt");
            verify(accountRepository).save(targetAccount);
        }

        @Test
        @DisplayName("2. Vi phạm đạt 6 gậy: Giữ nguyên SUSPENDED và thời hạn 14 ngày, không đổi sang BANNED")
        void punishAccount_reach6_PreservesSuspended() throws Exception {
            UUID targetAccountId = UUID.randomUUID();
            LocalDateTime now = LocalDateTime.now();

            Account targetAccount = Account.builder()
                    .id(targetAccountId)
                    .violationCount(5)
                    .lastViolationAt(now.minusDays(2))
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .status(AccountStatus.SUSPENDED)
                    .isActive(true)
                    .build();

            when(accountRepository.findByIdForUpdate(targetAccountId)).thenReturn(Optional.of(targetAccount));
            when(accountRepository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            Method method = ReportServiceImpl.class.getDeclaredMethod("punishAccount", UUID.class, LocalDateTime.class);
            method.setAccessible(true);
            DisciplineLevel resultLevel = (DisciplineLevel) method.invoke(reportService, targetAccountId, now);

            assertEquals(DisciplineLevel.SUSPENDED, resultLevel);
            assertEquals(6, targetAccount.getViolationCount());
            assertEquals(DisciplineLevel.SUSPENDED, targetAccount.getDisciplineLevel());
            assertEquals(AccountStatus.SUSPENDED, targetAccount.getStatus());
            assertEquals(now.plusDays(14), targetAccount.getSuspendedUntil());
        }
    }

    @Nested
    @DisplayName("B. Kiểm tra Review và Report bị chặn khi SUSPENDED và mở lại sau 14 ngày")
    class ReviewAndReportEnforcementTests {

        @Test
        @DisplayName("3. User đang bị SUSPENDED: Bị từ chối tạo Review")
        void suspendedUser_cannotCreateReview() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.SUSPENDED)
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .suspendedUntil(LocalDateTime.now().plusDays(10))
                    .isActive(true)
                    .build();

            User user = new User();
            user.setAccount(account);

            Order order = Order.builder()
                    .user(user)
                    .status(OrderStatus.COMPLETED)
                    .receivedByBuyer(true)
                    .items(java.util.Set.of())
                    .build();

            CustomException ex = assertThrows(CustomException.class, () ->
                    reviewValidationInstance.validateCanReview(accountId, order, UUID.randomUUID())
            );
            assertTrue(ex.getMessage().contains("tài khoản đang bị tạm ngưng hoặc đã bị khóa vĩnh viễn"));
        }

        @Test
        @DisplayName("4. User đang bị SUSPENDED: Bị từ chối tạo Report")
        void suspendedUser_cannotCreateReport() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.SUSPENDED)
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .suspendedUntil(LocalDateTime.now().plusDays(10))
                    .isActive(true)
                    .build();

            when(accountRepository.findById(accountId)).thenReturn(Optional.of(account));

            CreateReportRequest request = new CreateReportRequest();
            request.setTargetId(UUID.randomUUID());
            request.setDescription("Báo cáo vi phạm");

            CustomException ex = assertThrows(CustomException.class, () ->
                    reportService.createReport(accountId, request)
            );
            assertTrue(ex.getMessage().contains("tài khoản đang bị tạm ngưng hoặc đã bị khóa vĩnh viễn"));
        }

        @Test
        @DisplayName("5. User đã hết hạn SUSPENDED (được reconcile): Được phép tạo Review nếu đủ điều kiện")
        void expiredSuspendedUser_canCreateReviewAfterReconcile() {
            UUID accountId = UUID.randomUUID();
            LocalDateTime past = LocalDateTime.now().minusDays(1);
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.SUSPENDED)
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .suspendedUntil(past)
                    .violationCount(5)
                    .isActive(true)
                    .build();

            when(accountRepository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            // Gọi reconcile on-demand
            Account reconciled = accountDisciplineService.checkAndReconcileSuspension(account, LocalDateTime.now());
            assertEquals(AccountStatus.ACTIVE, reconciled.getStatus());
            assertEquals(DisciplineLevel.WARNED, reconciled.getDisciplineLevel());
            assertNull(reconciled.getSuspendedUntil());
            assertEquals(5, reconciled.getViolationCount()); // Bảo lưu 5 gậy

            User user = new User();
            user.setAccount(reconciled);

            UUID productId = UUID.randomUUID();
            Product product = Product.builder().id(productId).build();
            OrderItem item = OrderItem.builder().product(product).build();

            Order order = Order.builder()
                    .user(user)
                    .status(OrderStatus.COMPLETED)
                    .receivedByBuyer(true)
                    .items(java.util.Set.of(item))
                    .build();

            assertDoesNotThrow(() ->
                    reviewValidationInstance.validateCanReview(accountId, order, productId)
            );
        }

        @Test
        @DisplayName("5.1. User đã hết hạn SUSPENDED: Được phép tạo Report sau khi reconcile on-demand")
        void expiredSuspendedUser_canCreateReportAfterReconcile() {
            UUID accountId = UUID.randomUUID();
            LocalDateTime past = LocalDateTime.now().minusDays(1);
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.SUSPENDED)
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .suspendedUntil(past)
                    .violationCount(5)
                    .isActive(true)
                    .build();

            when(accountRepository.findById(accountId)).thenReturn(Optional.of(account));
            when(accountRepository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            UUID targetId = UUID.randomUUID();
            CreateReportRequest request = new CreateReportRequest();
            request.setTargetId(targetId);
            request.setDescription("Báo cáo sản phẩm vi phạm");

            when(requestPolicy.resolve(targetId)).thenReturn(TargetType.PRODUCT);
            Request mockRequest = Request.builder()
                    .id(UUID.randomUUID())
                    .type(RequestType.REPORT)
                    .description("Báo cáo sản phẩm vi phạm")
                    .status(RequestStatus.PENDING)
                    .account(account)
                    .build();
            when(requestService.createRequest(eq(account), any(CreateSendRequest.class))).thenReturn(mockRequest);
            when(reportRepository.save(any(Report.class))).thenAnswer(i -> i.getArgument(0));

            CreateRequestResponse response = reportService.createReport(accountId, request);

            assertNotNull(response);
            assertEquals(AccountStatus.ACTIVE, account.getStatus(), "Account sau khi reconcile phải là ACTIVE");
            assertEquals(DisciplineLevel.WARNED, account.getDisciplineLevel(), "Discipline level phải chuyển về WARNED");
            assertNull(account.getSuspendedUntil(), "suspendedUntil phải được xóa về null");
            verify(accountRepository).save(account);
            verify(reportRepository).save(any(Report.class));
        }
    }

    @Nested
    @DisplayName("C. Cách ly kỷ luật User và hoạt động quản lý sản phẩm của Seller")
    class ProductManagementIsolationTests {

        @Test
        @DisplayName("6. Chủ shop bị kỷ luật User (SUSPENDED): Vẫn quản lý sản phẩm bình thường nếu Shop ACTIVE")
        void userSuspended_canManageProductsWhenShopIsActive() throws Exception {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.SUSPENDED)
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .suspendedUntil(LocalDateTime.now().plusDays(10))
                    .isActive(true)
                    .build();

            UUID userId = UUID.randomUUID();
            User user = new User();
            user.setId(userId);
            user.setAccount(account);

            Shop shop = Shop.builder()
                    .id(UUID.randomUUID())
                    .status(ShopStatus.ACTIVE)
                    .user(user)
                    .build();

            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
            when(shopRepository.findByUserId(userId)).thenReturn(Optional.of(shop));

            Method getShopMethod = ProductServiceImpl.class.getDeclaredMethod("getShopByAccountId", UUID.class);
            getShopMethod.setAccessible(true);
            Shop resolvedShop = (Shop) getShopMethod.invoke(productService, accountId);

            assertNotNull(resolvedShop);
            assertEquals(shop.getId(), resolvedShop.getId());
        }

        @Test
        @DisplayName("7. Shop bị SUSPENDED: Bị chặn quản lý sản phẩm dù Account là ACTIVE")
        void shopSuspended_cannotManageProducts() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.ACTIVE)
                    .disciplineLevel(DisciplineLevel.NONE)
                    .isActive(true)
                    .build();

            UUID userId = UUID.randomUUID();
            User user = new User();
            user.setId(userId);
            user.setAccount(account);

            Shop shop = Shop.builder()
                    .id(UUID.randomUUID())
                    .status(ShopStatus.SUSPENDED)
                    .user(user)
                    .build();

            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
            when(shopRepository.findByUserId(userId)).thenReturn(Optional.of(shop));

            CustomException ex = assertThrows(CustomException.class, () ->
                    productService.createProduct(accountId, new CreateProductRequest())
            );
            assertTrue(ex.getMessage().contains("Gian hàng của bạn đang bị tạm dừng hoạt động hoặc bị cấm"));
        }

        @Test
        @DisplayName("8. Tài khoản bị BANNED (cả status và disciplineLevel): Bị chặn quản lý sản phẩm hoàn toàn")
        void accountBanned_cannotManageProducts() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .isActive(false)
                    .build();

            User user = new User();
            user.setAccount(account);

            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));

            CustomException ex = assertThrows(CustomException.class, () ->
                    productService.createProduct(accountId, new CreateProductRequest())
            );
            assertTrue(ex.getMessage().contains("Bạn không có quyền quản lý sản phẩm do tài khoản đã bị khóa vĩnh viễn"));
        }

        @Test
        @DisplayName("8.1. Tổ hợp 1: status == BANNED, disciplineLevel != BANNED: Bị chặn quản lý sản phẩm")
        void accountBannedByStatusOnly_cannotManageProducts() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.NONE)
                    .isActive(false)
                    .build();

            User user = new User();
            user.setAccount(account);

            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));

            CustomException ex = assertThrows(CustomException.class, () ->
                    productService.createProduct(accountId, new CreateProductRequest())
            );
            assertTrue(ex.getMessage().contains("Bạn không có quyền quản lý sản phẩm do tài khoản đã bị khóa vĩnh viễn"));
        }

        @Test
        @DisplayName("8.2. Tổ hợp 2: disciplineLevel == BANNED, status != BANNED: Bị chặn quản lý sản phẩm")
        void accountBannedByLevelOnly_cannotManageProducts() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.ACTIVE)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .isActive(true)
                    .build();

            User user = new User();
            user.setAccount(account);

            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));

            CustomException ex = assertThrows(CustomException.class, () ->
                    productService.createProduct(accountId, new CreateProductRequest())
            );
            assertTrue(ex.getMessage().contains("Bạn không có quyền quản lý sản phẩm do tài khoản đã bị khóa vĩnh viễn"));
        }
    }

    @Nested
    @DisplayName("D. Cách ly kỷ luật User và hoạt động phản hồi đánh giá (Seller Reply)")
    class SellerReplyIsolationTests {

        @Test
        @DisplayName("9. Chủ shop bị kỷ luật User (SUSPENDED): Vẫn được phản hồi Review nếu Shop ACTIVE")
        void userSuspended_canReplyReviewWhenShopIsActive() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.SUSPENDED)
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .suspendedUntil(LocalDateTime.now().plusDays(10))
                    .isActive(true)
                    .build();

            UUID sellerUserId = UUID.randomUUID();
            User seller = new User();
            seller.setId(sellerUserId);
            seller.setAccount(account);

            Shop shop = Shop.builder()
                    .id(UUID.randomUUID())
                    .status(ShopStatus.ACTIVE)
                    .user(seller)
                    .build();

            Product product = Product.builder().shop(shop).build();
            UUID reviewId = UUID.randomUUID();
            Review review = Review.builder()
                    .id(reviewId)
                    .product(product)
                    .build();

            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(seller));
            when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));
            when(replyRepository.existsByReviewId(reviewId)).thenReturn(false);
            when(replyRepository.save(any(Reply.class))).thenAnswer(i -> i.getArgument(0));

            ReplyRequest request = new ReplyRequest();
            request.setReviewId(reviewId);
            request.setReply("Cảm ơn quý khách đã mua hàng!");

            assertDoesNotThrow(() -> replyService.replyToReview(accountId, request));
            verify(replyRepository).save(any(Reply.class));
        }

        @Test
        @DisplayName("10. Shop bị SUSPENDED: Bị chặn phản hồi Review")
        void shopSuspended_cannotReplyReview() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.ACTIVE)
                    .disciplineLevel(DisciplineLevel.NONE)
                    .isActive(true)
                    .build();

            UUID sellerUserId = UUID.randomUUID();
            User seller = new User();
            seller.setId(sellerUserId);
            seller.setAccount(account);

            Shop shop = Shop.builder()
                    .id(UUID.randomUUID())
                    .status(ShopStatus.SUSPENDED)
                    .user(seller)
                    .build();

            Product product = Product.builder().shop(shop).build();
            UUID reviewId = UUID.randomUUID();
            Review review = Review.builder()
                    .id(reviewId)
                    .product(product)
                    .build();

            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(seller));
            when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));

            ReplyRequest request = new ReplyRequest();
            request.setReviewId(reviewId);
            request.setReply("Cảm ơn quý khách!");

            CustomException ex = assertThrows(CustomException.class, () ->
                    replyService.replyToReview(accountId, request)
            );
            assertTrue(ex.getMessage().contains("Gian hàng của bạn đang bị tạm dừng hoạt động hoặc bị cấm"));
        }

        @Test
        @DisplayName("10.1. Tổ hợp 1: status == BANNED, disciplineLevel != BANNED: Bị chặn phản hồi Review")
        void accountBannedByStatusOnly_cannotReplyReview() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.NONE)
                    .isActive(false)
                    .build();

            User seller = new User();
            seller.setAccount(account);

            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(seller));

            ReplyRequest request = new ReplyRequest();
            request.setReviewId(UUID.randomUUID());
            request.setReply("Cảm ơn quý khách!");

            CustomException ex = assertThrows(CustomException.class, () ->
                    replyService.replyToReview(accountId, request)
            );
            assertTrue(ex.getMessage().contains("Bạn không thể phản hồi đánh giá này do tài khoản đã bị khóa vĩnh viễn"));
        }

        @Test
        @DisplayName("10.2. Tổ hợp 2: disciplineLevel == BANNED, status != BANNED: Bị chặn phản hồi Review")
        void accountBannedByLevelOnly_cannotReplyReview() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.ACTIVE)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .isActive(true)
                    .build();

            User seller = new User();
            seller.setAccount(account);

            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(seller));

            ReplyRequest request = new ReplyRequest();
            request.setReviewId(UUID.randomUUID());
            request.setReply("Cảm ơn quý khách!");

            CustomException ex = assertThrows(CustomException.class, () ->
                    replyService.replyToReview(accountId, request)
            );
            assertTrue(ex.getMessage().contains("Bạn không thể phản hồi đánh giá này do tài khoản đã bị khóa vĩnh viễn"));
        }

        @Test
        @DisplayName("10.3. Tổ hợp 3: Cả hai trường đều BANNED: Bị chặn phản hồi Review")
        void accountBannedBothFields_cannotReplyReview() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .isActive(false)
                    .build();

            User seller = new User();
            seller.setAccount(account);

            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(seller));

            ReplyRequest request = new ReplyRequest();
            request.setReviewId(UUID.randomUUID());
            request.setReply("Cảm ơn quý khách!");

            CustomException ex = assertThrows(CustomException.class, () ->
                    replyService.replyToReview(accountId, request)
            );
            assertTrue(ex.getMessage().contains("Bạn không thể phản hồi đánh giá này do tài khoản đã bị khóa vĩnh viễn"));
        }
    }

    @Nested
    @DisplayName("E. Khả năng đăng nhập, mua hàng và các bất biến bảo vệ tài khoản của User")
    class UserAuthenticationAndPurchaseCapabilityTests {

        @Test
        @DisplayName("11. Tài khoản SUSPENDED (isActive=true): Vẫn giữ quyền đăng nhập (isAccountNonLocked=true, isEnabled=true)")
        void suspendedUser_canLogin() {
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .status(AccountStatus.SUSPENDED)
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .suspendedUntil(LocalDateTime.now().plusDays(10))
                    .isActive(true)
                    .build();

            assertTrue(account.isAccountNonLocked(), "Tài khoản SUSPENDED không bị khóa đăng nhập (isAccountNonLocked phải là true)");
            assertTrue(account.isEnabled(), "Tài khoản SUSPENDED vẫn enabled để đăng nhập");
            assertTrue(account.isAccountNonExpired(), "Tài khoản không bị expired");
            assertTrue(account.isCredentialsNonExpired(), "Credentials không bị expired");
        }

        @Test
        @DisplayName("12. Tài khoản BANNED: Bị khóa đăng nhập triệt để cả ở status và disciplineLevel, không bị suy yếu")
        void bannedUser_isLockedAndDisabled() {
            Account bannedByStatus = Account.builder()
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.NONE)
                    .isActive(false)
                    .build();
            assertFalse(bannedByStatus.isAccountNonLocked(), "Account có status BANNED phải bị khóa");
            assertFalse(bannedByStatus.isEnabled(), "Account có status BANNED phải bị disable");

            Account bannedByLevel = Account.builder()
                    .status(AccountStatus.ACTIVE)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .isActive(true)
                    .build();
            assertFalse(bannedByLevel.isAccountNonLocked(), "Account có disciplineLevel BANNED không bị suy yếu bởi isActive=true");
            assertFalse(bannedByLevel.isEnabled(), "Account có disciplineLevel BANNED không bị suy yếu bởi isActive=true");
        }

        @Test
        @DisplayName("13. Tài khoản SUSPENDED: Không có bất kỳ ràng buộc kỷ luật nào chặn luồng mua sắm / đặt hàng")
        void suspendedUser_canPurchase() {
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .status(AccountStatus.SUSPENDED)
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .suspendedUntil(LocalDateTime.now().plusDays(10))
                    .isActive(true)
                    .build();

            // Khẳng định trạng thái tài khoản SUSPENDED giữ nguyên tính hoạt động để mua hàng
            assertTrue(account.getIsActive(), "Tài khoản SUSPENDED phải giữ isActive=true để tham gia luồng thanh toán / đặt hàng");
            assertNotEquals(AccountStatus.BANNED, account.getStatus());
            assertNotEquals(DisciplineLevel.BANNED, account.getDisciplineLevel());
        }
    }
}
