package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.dto.request.LoginRequest;
import com.marketplace.ecommerce.auth.dto.response.LoginResponse;
import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.Role;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.RoleRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.service.EmailService;
import com.marketplace.ecommerce.auth.service.TokenService;
import com.marketplace.ecommerce.auth.service.impl.AuthenticationServiceImpl;
import com.marketplace.ecommerce.auth.validate.AuthValidation;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.AuthProvider;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.common.exception.InvalidCredentialsException;
import com.marketplace.ecommerce.config.JwtFilter;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.service.OrderReturnService;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.request.dto.request.SubmitBanReviewRequest;
import com.marketplace.ecommerce.request.dto.response.BanReviewStatusResponse;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.dto.response.RequestResponse;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.request.policy.RequestPolicy;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.repository.SellerRepository;
import com.marketplace.ecommerce.request.valueObjects.ApproveSellerContext;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopEscrowFundService;
import com.marketplace.ecommerce.shop.service.ShopService;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.marketplace.ecommerce.file.response.FileUploadResponse;
import com.marketplace.ecommerce.file.service.FileService;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.mock.web.MockMultipartFile;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import javax.imageio.ImageIO;

import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Task 4B Unit Tests: Kháng nghị Ban Review với Giảm Đúng 1 Gậy (One-Strike Reduction)")
public class BanReviewAuthorizationEnforcementTest {

    // Repositories & Services mocks
    @Mock private RequestRepository requestRepository;
    @Mock private ReportRepository reportRepository;
    @Mock private SellerRepository sellerRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private RequestPolicy requestValidation;
    @Mock private ShopService shopService;
    @Mock private ProductRepository productRepository;
    @Mock private ShopRepository shopRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private EscrowRepository escrowRepository;
    @Mock private OrderReturnService orderReturnService;
    @Mock private ShopEscrowFundService shopEscrowFundService;
    @Mock private FileService fileService;

    // AuthenticationService mocks
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private TokenService tokenService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private AuthValidation validation;
    @Mock private EmailService emailService;
    @Mock private CartRepository cartRepository;
    @Mock private WalletRepository walletRepository;
    @Mock private UserRepository userRepository;

    // JwtFilter mocks
    @Mock private HandlerExceptionResolver resolver;
    @Mock private HttpServletRequest httpServletRequest;
    @Mock private HttpServletResponse httpServletResponse;
    @Mock private FilterChain filterChain;

    private RequestServiceImpl requestService;
    private AuthenticationServiceImpl authenticationService;
    private JwtFilter jwtFilter;

    @BeforeEach
    void setUp() {
        requestService = new RequestServiceImpl(
                requestRepository,
                reportRepository,
                sellerRepository,
                accountRepository,
                userRepository,
                roleRepository,
                requestValidation,
                shopService,
                productRepository,
                shopRepository,
                reviewRepository,
                orderRepository,
                escrowRepository,
                orderReturnService,
                shopEscrowFundService,
                fileService
        );

        authenticationService = new AuthenticationServiceImpl(
                passwordEncoder,
                accountRepository,
                userRepository,
                tokenService,
                authenticationManager,
                validation,
                emailService,
                roleRepository,
                cartRepository,
                walletRepository,
                shopRepository,
                requestRepository
        );

        jwtFilter = new JwtFilter(tokenService, resolver);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    // =========================================================================
    // NHÓM 1: AUTHENTICATION & PHIÊN GIỚI HẠN BAN_REVIEW (Kịch bản 1 - 7)
    // =========================================================================
    @Nested
    @DisplayName("I. Authentication & Giới hạn Quyền Truy cập cho Tài khoản BANNED")
    class AuthenticationAndSessionLimitationTests {

        @Test
        @DisplayName("1. Password sai không được tiết lộ trạng thái BANNED của tài khoản")
        void scenario01_wrongPassword_doesNotRevealBannedStatus() {
            String username = "banned_user_1";
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .username(username)
                    .passwordHash("hashed_pwd")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .isActive(false)
                    .build();

            when(accountRepository.findByUsername(username)).thenReturn(Optional.of(account));
            when(passwordEncoder.matches("WrongPassword", "hashed_pwd")).thenReturn(false);

            LoginRequest req = new LoginRequest();
            req.setUsername(username);
            req.setPassword("WrongPassword");

            InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class, () -> authenticationService.login(req));
            assertTrue(ex.getMessage().contains("Tên đăng nhập hoặc mật khẩu không chính xác"));
            assertFalse(ex.getMessage().contains("khóa") || ex.getMessage().contains("cấm"), "Không được tiết lộ trạng thái ban khi mật khẩu sai");
            verify(tokenService, never()).createToken(any());
            verify(tokenService, never()).createBanReviewToken(any());
        }

        @Test
        @DisplayName("2. Password đúng với tài khoản BANNED: Cấp BAN_REVIEW token, không cấp token marketplace, không có refresh token")
        void scenario02_correctPassword_returnsBanReviewTokenOnly() {
            String username = "banned_user_2";
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .username(username)
                    .passwordHash("hashed_pwd")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(8)
                    .isActive(false)
                    .build();

            when(accountRepository.findByUsername(username)).thenReturn(Optional.of(account));
            when(passwordEncoder.matches("CorrectPassword", "hashed_pwd")).thenReturn(true);
            when(tokenService.createBanReviewToken(account)).thenReturn("jwt-ban-review-token");

            LoginRequest req = new LoginRequest();
            req.setUsername(username);
            req.setPassword("CorrectPassword");

            LoginResponse res = authenticationService.login(req);
            assertNotNull(res);
            assertEquals("jwt-ban-review-token", res.getToken());
            assertNull(res.getRefreshToken(), "Tuyệt đối không cấp refresh token cho tài khoản BANNED");
            assertEquals("ROLE_BAN_REVIEW", res.getRole());
            assertEquals("BANNED", res.getDisciplineLevel());
            verify(tokenService, never()).createToken(any());
            verify(tokenService, never()).refreshToken(any());
        }

        @Test
        @DisplayName("2b. Đồng bộ BANNED: status=BANNED nhưng disciplineLevel=NONE -> login vẫn cấp BAN_REVIEW token")
        void scenario02b_statusBannedOnly_returnsBanReviewToken() {
            String username = "banned_user_marker1";
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .username(username)
                    .passwordHash("hashed_pwd")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.NONE)
                    .violationCount(7)
                    .isActive(false)
                    .build();

            when(accountRepository.findByUsername(username)).thenReturn(Optional.of(account));
            when(passwordEncoder.matches("CorrectPassword", "hashed_pwd")).thenReturn(true);
            when(tokenService.createBanReviewToken(account)).thenReturn("jwt-ban-review-token-1");

            LoginRequest req = new LoginRequest();
            req.setUsername(username);
            req.setPassword("CorrectPassword");

            LoginResponse res = authenticationService.login(req);
            assertNotNull(res);
            assertEquals("jwt-ban-review-token-1", res.getToken());
            assertEquals("ROLE_BAN_REVIEW", res.getRole());
            verify(tokenService, never()).createToken(any());
        }

        @Test
        @DisplayName("2c. Đồng bộ BANNED: status=ACTIVE nhưng disciplineLevel=BANNED -> login vẫn cấp BAN_REVIEW token")
        void scenario02c_disciplineBannedOnly_returnsBanReviewToken() {
            String username = "banned_user_marker2";
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .username(username)
                    .passwordHash("hashed_pwd")
                    .status(AccountStatus.ACTIVE)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(8)
                    .isActive(false)
                    .build();

            when(accountRepository.findByUsername(username)).thenReturn(Optional.of(account));
            when(passwordEncoder.matches("CorrectPassword", "hashed_pwd")).thenReturn(true);
            when(tokenService.createBanReviewToken(account)).thenReturn("jwt-ban-review-token-2");

            LoginRequest req = new LoginRequest();
            req.setUsername(username);
            req.setPassword("CorrectPassword");

            LoginResponse res = authenticationService.login(req);
            assertNotNull(res);
            assertEquals("jwt-ban-review-token-2", res.getToken());
            assertEquals("ROLE_BAN_REVIEW", res.getRole());
            verify(tokenService, never()).createToken(any());
        }

        @Test
        @DisplayName("3. OAuth2 Google/Facebook với tài khoản BANNED: Trả về BAN_REVIEW token sau khi xác minh danh tính")
        void scenario03_oauth2BannedAccount_returnsBanReviewToken() throws Exception {
            String email = "banned_oauth2@gmail.com";
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .email(email)
                    .username(email)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(7)
                    .isActive(false)
                    .build();

            when(accountRepository.findByEmail(email)).thenReturn(Optional.of(account));
            when(tokenService.createBanReviewToken(account)).thenReturn("jwt-oauth2-ban-token");

            Method method = AuthenticationServiceImpl.class.getDeclaredMethod(
                    "processOAuth2User", String.class, String.class, String.class, String.class, AuthProvider.class);
            method.setAccessible(true);

            LoginResponse res = (LoginResponse) method.invoke(authenticationService, email, "Test User", "avatar.png", "sub-123", AuthProvider.GOOGLE);
            assertNotNull(res);
            assertEquals("jwt-oauth2-ban-token", res.getToken());
            assertNull(res.getRefreshToken());
            assertEquals("ROLE_BAN_REVIEW", res.getRole());
            verify(tokenService, never()).createToken(any());
        }

        @Test
        @DisplayName("4. Tài khoản ACTIVE và SUSPENDED vẫn duy trì luồng Task 2 (không bị ép sang BAN_REVIEW)")
        void scenario04_activeAndSuspended_maintainsTask2Flow() {
            String username = "suspended_user";
            Role role = Role.builder().roleName("CUSTOMER").build();
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .username(username)
                    .passwordHash("hashed_pwd")
                    .status(AccountStatus.SUSPENDED)
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .violationCount(5)
                    .suspendedUntil(LocalDateTime.now().plusDays(10))
                    .isActive(true)
                    .role(role)
                    .build();

            when(accountRepository.findByUsername(username)).thenReturn(Optional.of(account));
            Authentication auth = mock(Authentication.class);
            when(auth.getPrincipal()).thenReturn(account);
            when(authenticationManager.authenticate(any())).thenReturn(auth);
            when(tokenService.createToken(account)).thenReturn("active-access-token");
            when(tokenService.refreshToken(account)).thenReturn("active-refresh-token");
            when(accountRepository.findById(account.getId())).thenReturn(Optional.of(account));

            LoginRequest req = new LoginRequest();
            req.setUsername(username);
            req.setPassword("CorrectPassword");

            LoginResponse res = authenticationService.login(req);
            assertEquals("active-access-token", res.getToken());
            assertEquals("active-refresh-token", res.getRefreshToken());
            assertEquals("CUSTOMER", res.getRole());
            verify(tokenService, never()).createBanReviewToken(any());
        }

        @Test
        @DisplayName("5. Refresh token không cấp phiên marketplace cho tài khoản BANNED")
        void scenario05_refreshToken_rejectsBannedAccount() {
            String refreshToken = "some-refresh-token";
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .username("banned_refresh_user")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .isActive(false)
                    .build();

            when(tokenService.getAccountFromToken(refreshToken)).thenReturn(account);

            CustomException ex = assertThrows(CustomException.class, () -> authenticationService.refreshToken(refreshToken));
            assertTrue(ex.getMessage().contains("Tài khoản của bạn đã bị khóa vĩnh viễn"));
            verify(tokenService, never()).createToken(any());
        }

        @Test
        @DisplayName("6. Access token cũ bị JwtFilter chặn tức thì khi Account đang BANNED")
        void scenario06_oldToken_blockedByJwtFilterWhenBanned() throws Exception {
            String token = "old-market-token";
            UUID accountId = UUID.randomUUID();
            Role role = Role.builder().roleName("CUSTOMER").build();

            Account bannedAccount = Account.builder()
                    .id(accountId)
                    .username("banned_in_db")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .isActive(false)
                    .role(role)
                    .build();

            when(httpServletRequest.getHeader("Authorization")).thenReturn("Bearer " + token);
            when(httpServletRequest.getRequestURI()).thenReturn("/api/v1/orders/my-orders");
            when(tokenService.getAccountFromToken(token)).thenReturn(bannedAccount);
            when(tokenService.isBanReviewToken(token)).thenReturn(false);

            jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);

            verify(resolver, times(1)).resolveException(
                    eq(httpServletRequest),
                    eq(httpServletResponse),
                    isNull(),
                    argThat(ex -> ex instanceof org.springframework.security.authentication.LockedException
                            && ex.getMessage().contains("khóa vĩnh viễn"))
            );
            verify(filterChain, never()).doFilter(httpServletRequest, httpServletResponse);
        }

        @Test
        @DisplayName("7. Phiên BAN_REVIEW token chỉ được gọi đúng allowlist method + exact route; bị chặn trên /files/upload chung và marketplace")
        void scenario07_banReviewToken_onlyAllowedOnBanReviewEndpoints() throws Exception {
            String banToken = "ban-review-jwt-token";
            UUID accountId = UUID.randomUUID();
            Account bannedAccount = Account.builder()
                    .id(accountId)
                    .username("banned_user")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .isActive(false)
                    .build();

            when(httpServletRequest.getHeader("Authorization")).thenReturn("Bearer " + banToken);
            when(tokenService.getAccountFromToken(banToken)).thenReturn(bannedAccount);
            when(tokenService.isBanReviewToken(banToken)).thenReturn(true);

            // A. Gọi API marketplace (ví dụ /api/v1/orders/checkout) -> Bị chặn qua resolver LockedException
            when(httpServletRequest.getMethod()).thenReturn("POST");
            when(httpServletRequest.getRequestURI()).thenReturn("/api/v1/orders/checkout");

            jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);

            verify(resolver, times(1)).resolveException(
                    eq(httpServletRequest),
                    eq(httpServletResponse),
                    isNull(),
                    argThat(ex -> ex instanceof org.springframework.security.authentication.LockedException)
            );
            verify(filterChain, never()).doFilter(httpServletRequest, httpServletResponse);

            // B. Gọi /files/upload chung -> BỊ CHẶN (Không cho upload vượt phạm vi)
            reset(resolver, filterChain);
            when(httpServletRequest.getMethod()).thenReturn("POST");
            when(httpServletRequest.getRequestURI()).thenReturn("/files/upload");

            jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);

            verify(resolver, times(1)).resolveException(
                    eq(httpServletRequest),
                    eq(httpServletResponse),
                    isNull(),
                    argThat(ex -> ex instanceof org.springframework.security.authentication.LockedException)
            );
            verify(filterChain, never()).doFilter(httpServletRequest, httpServletResponse);

            // C. Gọi GET /api/v1/request/ban-review/status -> Được qua
            reset(resolver, filterChain);
            when(httpServletRequest.getMethod()).thenReturn("GET");
            when(httpServletRequest.getRequestURI()).thenReturn("/api/v1/request/ban-review/status");

            jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);
            verify(filterChain, times(1)).doFilter(httpServletRequest, httpServletResponse);
            assertNotNull(SecurityContextHolder.getContext().getAuthentication());

            // D. Gọi POST /api/v1/request/ban-review -> Được qua
            reset(resolver, filterChain);
            SecurityContextHolder.clearContext();
            when(httpServletRequest.getMethod()).thenReturn("POST");
            when(httpServletRequest.getRequestURI()).thenReturn("/api/v1/request/ban-review");

            jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);
            verify(filterChain, times(1)).doFilter(httpServletRequest, httpServletResponse);

            // E. Gọi POST /api/v1/request/ban-review/upload -> BÂY GIỜ BỊ CHẶN (Không còn endpoint upload độc lập)
            reset(resolver, filterChain);
            SecurityContextHolder.clearContext();
            when(httpServletRequest.getMethod()).thenReturn("POST");
            when(httpServletRequest.getRequestURI()).thenReturn("/api/v1/request/ban-review/upload");

            jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);
            verify(resolver, times(1)).resolveException(
                    eq(httpServletRequest),
                    eq(httpServletResponse),
                    isNull(),
                    argThat(ex -> ex instanceof org.springframework.security.authentication.LockedException)
            );
            verify(filterChain, never()).doFilter(httpServletRequest, httpServletResponse);

            // F. Gọi GET /api/v1/request/ban-review (sai method) -> BỊ CHẶN
            reset(resolver, filterChain);
            SecurityContextHolder.clearContext();
            when(httpServletRequest.getMethod()).thenReturn("GET");
            when(httpServletRequest.getRequestURI()).thenReturn("/api/v1/request/ban-review");

            jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);
            verify(resolver, times(1)).resolveException(
                    eq(httpServletRequest),
                    eq(httpServletResponse),
                    isNull(),
                    argThat(ex -> ex instanceof org.springframework.security.authentication.LockedException)
            );
            verify(filterChain, never()).doFilter(httpServletRequest, httpServletResponse);
        }
    }

    // =========================================================================
    // NHÓM 2: NỘP ĐƠN APPEAL & QUY TẮC RE-SUBMISSION (Kịch bản 8 - 12)
    // =========================================================================
    @Nested
    @DisplayName("II. Nộp đơn APPEAL và Quy tắc Gửi lại đơn (Re-submission)")
    class SubmitBanReviewTests {

        @Test
        @DisplayName("8. Nộp APPEAL thành công: Lưu Request PENDING, không tự ý mở khóa tài khoản hay thay đổi số gậy")
        void scenario08_submitBanReview_successDoesNotUnlockAccount() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .username("banned_submitter")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(7)
                    .isActive(false)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accountId, RequestType.APPEAL))
                    .thenReturn(Collections.emptyList());
            when(requestRepository.save(any(Request.class))).thenAnswer(i -> {
                Request r = i.getArgument(0);
                r.setId(UUID.randomUUID());
                return r;
            });

            CreateRequestResponse res = requestService.submitBanReview(accountId, "Tôi xin giải trình về các vi phạm trước đó", null);
            assertNotNull(res);
            assertEquals(RequestType.APPEAL, res.getType());
            assertEquals(RequestStatus.PENDING, res.getStatus());
            assertTrue(res.getDisplayCode().startsWith("APP-"));

            // Verify Account không bị thay đổi trạng thái hay số gậy
            assertEquals(AccountStatus.BANNED, account.getStatus());
            assertEquals(DisciplineLevel.BANNED, account.getDisciplineLevel());
            assertEquals(7, account.getViolationCount());
            assertFalse(account.getIsActive());
            verify(accountRepository, never()).save(account);
        }

        @Test
        @DisplayName("9. Không thể gửi hai đơn APPEAL PENDING đồng thời (Race-condition / Concurrent guard)")
        void scenario09_submitBanReview_blocksIfAlreadyPending() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(7)
                    .build();

            Request existingPending = Request.builder()
                    .id(UUID.randomUUID())
                    .account(account)
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.PENDING)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accountId, RequestType.APPEAL))
                    .thenReturn(List.of(existingPending));

            CustomException ex = assertThrows(CustomException.class, () -> requestService.submitBanReview(accountId, "Đơn thứ hai gửi đè", null));
            assertTrue(ex.getMessage().contains("đang có một yêu cầu xem xét đang chờ xử lý"));
            verify(requestRepository, never()).save(any());
        }

        @Test
        @DisplayName("10. Payload nộp đơn chỉ nhận giải trình và bằng chứng, không nhận accountId/status/violationCount")
        void scenario10_submitBanReview_ignoresClientDecisionFields() {
            // SubmitBanReviewRequest chỉ có 2 trường: description và coverImageUrl
            SubmitBanReviewRequest req = new SubmitBanReviewRequest();
            req.setDescription("Giải trình hợp lệ");
            req.setCoverImageUrl("https://minio.com/img.jpg");

            // Kiểm tra reflection: không có getter/setter cho các trường can thiệp nghiệp vụ
            assertNull(getFieldValueQuietly(req, "accountId"));
            assertNull(getFieldValueQuietly(req, "status"));
            assertNull(getFieldValueQuietly(req, "violationCount"));
            assertNull(getFieldValueQuietly(req, "newViolationCount"));
        }

        @Test
        @DisplayName("11. Một APPEAL đã bị REJECTED chặn vĩnh viễn mọi đơn khiếu nại tiếp theo")
        void scenario11_submitBanReview_permanentlyBlockedIfAnyRejected() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(7)
                    .build();

            Request rejectedAppeal = Request.builder()
                    .id(UUID.randomUUID())
                    .account(account)
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.REJECTED)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accountId, RequestType.APPEAL))
                    .thenReturn(List.of(rejectedAppeal));

            CustomException ex = assertThrows(CustomException.class, () -> requestService.submitBanReview(accountId, "Xin gửi lại đơn sau khi bị từ chối", null));
            assertTrue(ex.getMessage().contains("đã bị từ chối") && ex.getMessage().contains("không thể khiếu nại thêm"));

            // Kiểm tra cả getBanReviewStatus: canSubmit phải là false, blockReason = PERMANENTLY_BLOCKED_REJECTED
            when(accountRepository.findById(accountId)).thenReturn(Optional.of(account));
            BanReviewStatusResponse statusRes = requestService.getBanReviewStatus(accountId);
            assertFalse(statusRes.isCanSubmit());
            assertEquals("PERMANENTLY_BLOCKED_REJECTED", statusRes.getBlockReason());
        }

        @Test
        @DisplayName("12. Sau khi APPEAL được APPROVED, nếu tài khoản vẫn BANNED (do số gậy >= 7) thì được phép nộp tiếp")
        void scenario12_submitBanReview_allowedAfterApprovedIfStillBanned() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .username("still_banned_user")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(7)
                    .isActive(false)
                    .build();

            Request approvedAppeal = Request.builder()
                    .id(UUID.randomUUID())
                    .account(account)
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.APPROVED)
                    .oldViolationCount(8)
                    .newViolationCount(7)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accountId, RequestType.APPEAL))
                    .thenReturn(List.of(approvedAppeal));
            when(requestRepository.save(any(Request.class))).thenAnswer(i -> {
                Request r = i.getArgument(0);
                r.setId(UUID.randomUUID());
                return r;
            });

            CreateRequestResponse res = requestService.submitBanReview(accountId, "Xin xem xét tiếp lần 2", null);
            assertNotNull(res);
            assertEquals(RequestStatus.PENDING, res.getStatus());
        }

        @Test
        @DisplayName("12b. Tài khoản không ở trạng thái BANNED nộp đơn -> Bị từ chối")
        void scenario12b_submitBanReview_rejectsIfAccountNotBanned() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.ACTIVE)
                    .disciplineLevel(DisciplineLevel.NONE)
                    .violationCount(0)
                    .isActive(true)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));

            CustomException ex = assertThrows(CustomException.class, () -> requestService.submitBanReview(accountId, "Tôi không bị ban nhưng muốn nộp", null));
            assertTrue(ex.getMessage().contains("Chỉ tài khoản đang bị khóa vĩnh viễn"));
        }

        @Test
        @DisplayName("12c. Đồng bộ BANNED: status=BANNED nhưng disciplineLevel=NONE -> submitBanReview được chấp nhận")
        void scenario12c_submitBanReview_statusBannedOnly_allowed() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .username("marker1_user")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.NONE)
                    .violationCount(7)
                    .isActive(false)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accountId, RequestType.APPEAL))
                    .thenReturn(Collections.emptyList());
            when(requestRepository.save(any(Request.class))).thenAnswer(i -> {
                Request r = i.getArgument(0);
                r.setId(UUID.randomUUID());
                return r;
            });

            CreateRequestResponse res = requestService.submitBanReview(accountId, "Giải trình marker 1", null);
            assertNotNull(res);
            assertEquals(RequestStatus.PENDING, res.getStatus());
        }

        @Test
        @DisplayName("12d. Đồng bộ BANNED: status=ACTIVE nhưng disciplineLevel=BANNED -> submitBanReview được chấp nhận")
        void scenario12d_submitBanReview_disciplineBannedOnly_allowed() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .username("marker2_user")
                    .status(AccountStatus.ACTIVE)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(8)
                    .isActive(false)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accountId, RequestType.APPEAL))
                    .thenReturn(Collections.emptyList());
            when(requestRepository.save(any(Request.class))).thenAnswer(i -> {
                Request r = i.getArgument(0);
                r.setId(UUID.randomUUID());
                return r;
            });

            CreateRequestResponse res = requestService.submitBanReview(accountId, "Giải trình marker 2", null);
            assertNotNull(res);
            assertEquals(RequestStatus.PENDING, res.getStatus());
        }
    }

    // =========================================================================
    // NHÓM 3: ADMIN XỬ LÝ (APPROVE / REJECT) & GIẢM ĐÚNG 1 GẬY (Kịch bản 13 - 23)
    // =========================================================================
    @Nested
    @DisplayName("III. Admin Xử lý Kháng nghị và Quy tắc Giảm Đúng 1 Gậy")
    class AdminApproveAndRejectTests {

        @Test
        @DisplayName("13. Chỉ ADMIN có thể approve/reject (Bảo vệ qua @PreAuthorize trong controller)")
        void scenario13_adminOnlyEnforcement() {
            // Kiểm tra annotation @PreAuthorize trên RequestController
            try {
                Method approveMethod = com.marketplace.ecommerce.request.controller.RequestController.class
                        .getMethod("approve", CurrentUserInfo.class, UUID.class, String.class);
                org.springframework.security.access.prepost.PreAuthorize preApprove =
                        approveMethod.getAnnotation(org.springframework.security.access.prepost.PreAuthorize.class);
                assertNotNull(preApprove);
                assertTrue(preApprove.value().contains("hasRole('ADMIN')"));

                Method rejectMethod = com.marketplace.ecommerce.request.controller.RequestController.class
                        .getMethod("reject", CurrentUserInfo.class, UUID.class, String.class);
                org.springframework.security.access.prepost.PreAuthorize preReject =
                        rejectMethod.getAnnotation(org.springframework.security.access.prepost.PreAuthorize.class);
                assertNotNull(preReject);
                assertTrue(preReject.value().contains("hasRole('ADMIN')"));
            } catch (NoSuchMethodException e) {
                fail("Controller method not found: " + e.getMessage());
            }
        }

        @Test
        @DisplayName("14. REJECTED: Giữ nguyên toàn bộ trạng thái BANNED và số gậy, lưu reviewer và response")
        void scenario14_rejectRequest_maintainsFullBanAndStrikes() {
            UUID adminId = UUID.randomUUID();
            UUID requestId = UUID.randomUUID();
            UUID targetAccountId = UUID.randomUUID();

            Account admin = Account.builder().id(adminId).username("admin").build();
            Account target = Account.builder()
                    .id(targetAccountId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(8)
                    .isActive(false)
                    .build();

            Request appeal = Request.builder()
                    .id(requestId)
                    .account(target)
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.PENDING)
                    .build();

            when(accountRepository.findById(adminId)).thenReturn(Optional.of(admin));
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(appeal));

            RequestResponse res = requestService.rejectRequest(adminId, requestId, "Bằng chứng không đủ cơ sở để giảm án.");
            assertNotNull(res);
            assertEquals(RequestStatus.REJECTED, appeal.getStatus());
            assertEquals("Bằng chứng không đủ cơ sở để giảm án.", appeal.getResponse());
            assertEquals(admin, appeal.getReviewedBy());
            assertNotNull(appeal.getReviewedAt());

            // Target Account vẫn BANNED vĩnh viễn, số gậy nguyên vẹn 8
            assertEquals(8, target.getViolationCount());
            assertEquals(AccountStatus.BANNED, target.getStatus());
            assertEquals(DisciplineLevel.BANNED, target.getDisciplineLevel());
            assertFalse(target.getIsActive());
            verify(accountRepository, never()).save(target);
        }

        @Test
        @DisplayName("15. APPROVED tự động đưa tài khoản về 6 gậy ở mức SUSPENDED trong 14 ngày, không nhận số gậy từ Admin")
        void scenario15_approveBanReview_reducesTo6StrikesSuspended() {
            UUID adminId = UUID.randomUUID();
            UUID requestId = UUID.randomUUID();
            UUID targetId = UUID.randomUUID();

            Account admin = Account.builder().id(adminId).username("admin").build();
            Account target = Account.builder()
                    .id(targetId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(9)
                    .isActive(false)
                    .build();

            Request appeal = Request.builder()
                    .id(requestId)
                    .account(target)
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.PENDING)
                    .build();

            when(accountRepository.findById(adminId)).thenReturn(Optional.of(admin));
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(appeal));
            when(accountRepository.findByIdForUpdate(targetId)).thenReturn(Optional.of(target));

            requestService.approveRequest(requestId, adminId, "Chấp thuận ân xá về 6 gậy.");

            assertEquals(6, target.getViolationCount(), "Tài khoản BANNED khi được duyệt luôn đưa về 6 gậy SUSPENDED");
            assertEquals(AccountStatus.SUSPENDED, target.getStatus());
            assertEquals(DisciplineLevel.SUSPENDED, target.getDisciplineLevel());
            assertTrue(target.getIsActive());
            assertNotNull(target.getSuspendedUntil());
            assertEquals(9, appeal.getOldViolationCount());
            assertEquals(6, appeal.getNewViolationCount());
            assertEquals(RequestStatus.APPROVED, appeal.getStatus());
        }

        @Test
        @DisplayName("16. Từ 7 gậy xuống 6 gậy: Chuyển sang SUSPENDED 14 ngày theo đúng quy tắc Task 2")
        void scenario16_approveBanReview_7to6_becomesSuspended14Days() {
            UUID adminId = UUID.randomUUID();
            UUID requestId = UUID.randomUUID();
            UUID targetId = UUID.randomUUID();

            Account admin = Account.builder().id(adminId).build();
            Account target = Account.builder()
                    .id(targetId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(7)
                    .isActive(false)
                    .bannedUntil(null)
                    .suspendedUntil(null)
                    .build();

            Request appeal = Request.builder()
                    .id(requestId)
                    .account(target)
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.PENDING)
                    .build();

            when(accountRepository.findById(adminId)).thenReturn(Optional.of(admin));
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(appeal));
            when(accountRepository.findByIdForUpdate(targetId)).thenReturn(Optional.of(target));

            requestService.approveRequest(requestId, adminId, "Giảm từ 7 xuống 6 gậy");

            assertEquals(6, target.getViolationCount());
            assertEquals(AccountStatus.SUSPENDED, target.getStatus());
            assertEquals(DisciplineLevel.SUSPENDED, target.getDisciplineLevel());
            assertTrue(target.getIsActive(), "Tài khoản SUSPENDED có isActive = true");
            assertNull(target.getBannedUntil());
            assertNotNull(target.getSuspendedUntil(), "Phải có hạn tạm ngưng 14 ngày");
            assertTrue(target.getSuspendedUntil().isAfter(LocalDateTime.now().plusDays(13)));
            assertTrue(target.getSuspendedUntil().isBefore(LocalDateTime.now().plusDays(15)));
        }

        @Test
        @DisplayName("17. Từ 8 gậy khi duyệt: Luôn chuyển sang SUSPENDED 14 ngày (về 6 gậy)")
        void scenario17_approveBanReview_8to6_becomesSuspended() {
            UUID adminId = UUID.randomUUID();
            UUID requestId = UUID.randomUUID();
            UUID targetId = UUID.randomUUID();

            Account admin = Account.builder().id(adminId).build();
            Account target = Account.builder()
                    .id(targetId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(8)
                    .isActive(false)
                    .build();

            Request appeal = Request.builder()
                    .id(requestId)
                    .account(target)
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.PENDING)
                    .build();

            when(accountRepository.findById(adminId)).thenReturn(Optional.of(admin));
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(appeal));
            when(accountRepository.findByIdForUpdate(targetId)).thenReturn(Optional.of(target));

            requestService.approveRequest(requestId, adminId, "Giảm từ 8 xuống 6 gậy SUSPENDED");

            assertEquals(6, target.getViolationCount());
            assertEquals(AccountStatus.SUSPENDED, target.getStatus(), "8 gậy khi duyệt được ân xá về SUSPENDED");
            assertEquals(DisciplineLevel.SUSPENDED, target.getDisciplineLevel());
            assertTrue(target.getIsActive());
            assertNotNull(target.getSuspendedUntil());
            assertEquals(8, appeal.getOldViolationCount());
            assertEquals(6, appeal.getNewViolationCount());
        }

        @Test
        @DisplayName("18. Với số gậy lớn hơn 7 (ví dụ 10 gậy): Khi duyệt đưa về 6 gậy SUSPENDED")
        void scenario18_approveBanReview_highStrikes_reducesTo6StrikesSuspended() {
            UUID adminId = UUID.randomUUID();
            UUID requestId = UUID.randomUUID();
            UUID targetId = UUID.randomUUID();

            Account admin = Account.builder().id(adminId).build();
            Account target = Account.builder()
                    .id(targetId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(10)
                    .isActive(false)
                    .build();

            Request appeal = Request.builder()
                    .id(requestId)
                    .account(target)
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.PENDING)
                    .build();

            when(accountRepository.findById(adminId)).thenReturn(Optional.of(admin));
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(appeal));
            when(accountRepository.findByIdForUpdate(targetId)).thenReturn(Optional.of(target));

            requestService.approveRequest(requestId, adminId, "Giảm từ 10 xuống 6 gậy SUSPENDED");

            assertEquals(6, target.getViolationCount());
            assertEquals(AccountStatus.SUSPENDED, target.getStatus());
            assertEquals(DisciplineLevel.SUSPENDED, target.getDisciplineLevel());
            assertTrue(target.getIsActive());
            assertNotNull(target.getSuspendedUntil());
            assertEquals(10, appeal.getOldViolationCount());
            assertEquals(6, appeal.getNewViolationCount());
        }

        @Test
        @DisplayName("19. Request đã xử lý (APPROVED hoặc REJECTED) không được approve/reject lần hai")
        void scenario19_alreadyProcessedRequest_cannotBeDecidedAgain() {
            UUID adminId = UUID.randomUUID();
            UUID requestId = UUID.randomUUID();

            Request alreadyApproved = Request.builder()
                    .id(requestId)
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.APPROVED)
                    .build();

            when(accountRepository.findById(adminId)).thenReturn(Optional.of(Account.builder().id(adminId).build()));
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(alreadyApproved));

            CustomException ex1 = assertThrows(CustomException.class, () -> requestService.approveRequest(requestId, adminId, "Thử approve lại"));
            assertTrue(ex1.getMessage().contains("đã được xử lý trước đó"));

            alreadyApproved.setStatus(RequestStatus.REJECTED);
            CustomException ex2 = assertThrows(CustomException.class, () -> requestService.rejectRequest(adminId, requestId, "Thử reject lại"));
            assertTrue(ex2.getMessage().contains("đã được xử lý trước đó"));
        }

        @Test
        @DisplayName("20. Kiểm tra audit history: Lưu oldViolationCount, newViolationCount, reviewedBy, reviewedAt, response")
        void scenario20_auditHistory_persistedAccurately() {
            UUID adminId = UUID.randomUUID();
            UUID requestId = UUID.randomUUID();
            UUID targetId = UUID.randomUUID();

            Account admin = Account.builder().id(adminId).username("super_admin").build();
            Account target = Account.builder()
                    .id(targetId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(7)
                    .isActive(false)
                    .build();

            Request appeal = Request.builder()
                    .id(requestId)
                    .account(target)
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.PENDING)
                    .build();

            when(accountRepository.findById(adminId)).thenReturn(Optional.of(admin));
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(appeal));
            when(accountRepository.findByIdForUpdate(targetId)).thenReturn(Optional.of(target));

            requestService.approveRequest(requestId, adminId, "Giải trình trung thực, giảm 1 gậy.");

            assertEquals(Integer.valueOf(7), appeal.getOldViolationCount());
            assertEquals(Integer.valueOf(6), appeal.getNewViolationCount());
            assertEquals(admin, appeal.getReviewedBy());
            assertNotNull(appeal.getReviewedAt());
            assertEquals("Giải trình trung thực, giảm 1 gậy.", appeal.getResponse());
            assertEquals(RequestStatus.APPROVED, appeal.getStatus());
        }

        @Test
        @DisplayName("21. Lỗi xảy ra trong transaction rollback toàn bộ cập nhật, không để Account và Request lệch trạng thái")
        void scenario21_transactionError_rollsBackCleanly() {
            UUID adminId = UUID.randomUUID();
            UUID requestId = UUID.randomUUID();
            UUID targetId = UUID.randomUUID();

            Account admin = Account.builder().id(adminId).build();
            Account target = Account.builder()
                    .id(targetId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(7)
                    .isActive(false)
                    .build();

            Request appeal = Request.builder()
                    .id(requestId)
                    .account(target)
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.PENDING)
                    .build();

            when(accountRepository.findById(adminId)).thenReturn(Optional.of(admin));
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(appeal));
            when(accountRepository.findByIdForUpdate(targetId)).thenReturn(Optional.of(target));
            // Giả lập lỗi database khi lưu tài khoản
            when(accountRepository.save(any(Account.class))).thenThrow(new RuntimeException("DB Connection Timeout"));

            assertThrows(RuntimeException.class, () -> requestService.approveRequest(requestId, adminId, "Duyệt đơn"));

            // Verification: Request tuyệt đối không được lưu nếu Account thất bại
            verify(requestRepository, never()).save(any());
        }

        @Test
        @DisplayName("22. Ban review không tác động đến Shop discipline, Report Order, Escrow, ví tiền, settlement hoặc refund")
        void scenario22_banReview_doesNotTouchShopOrEscrow() {
            UUID adminId = UUID.randomUUID();
            UUID requestId = UUID.randomUUID();
            UUID targetId = UUID.randomUUID();

            Account admin = Account.builder().id(adminId).build();
            Account target = Account.builder()
                    .id(targetId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(7)
                    .isActive(false)
                    .build();

            Request appeal = Request.builder()
                    .id(requestId)
                    .account(target)
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.PENDING)
                    .build();

            when(accountRepository.findById(adminId)).thenReturn(Optional.of(admin));
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(appeal));
            when(accountRepository.findByIdForUpdate(targetId)).thenReturn(Optional.of(target));

            requestService.approveRequest(requestId, adminId, "Duyệt");

            // Xác nhận hoàn toàn không tương tác với các service/repo ngoài phạm vi
            verifyNoInteractions(shopRepository);
            verifyNoInteractions(escrowRepository);
            verifyNoInteractions(shopEscrowFundService);
            verifyNoInteractions(orderReturnService);
            verifyNoInteractions(orderRepository);
        }

        @Test
        @DisplayName("23. Regression: SELLER_REGISTRATION vẫn hoạt động chuẩn xác qua approveRequest và không bị ảnh hưởng")
        void scenario23_regression_sellerRegistration_unaffected() {
            UUID adminId = UUID.randomUUID();
            UUID requestId = UUID.randomUUID();
            UUID ownerAccountId = UUID.randomUUID();

            Account admin = Account.builder().id(adminId).build();
            Account ownerAccount = Account.builder().id(ownerAccountId).username("seller_owner").build();
            User ownerUser = User.builder().id(UUID.randomUUID()).account(ownerAccount).build();

            Seller sellerDetail = Seller.builder()
                    .id(UUID.randomUUID())
                    .isEscrowParticipated(true)
                    .initialDepositAmount(BigDecimal.valueOf(5000000))
                    .build();

            Request sellerReq = Request.builder()
                    .id(requestId)
                    .account(ownerAccount)
                    .type(RequestType.SELLER_REGISTRATION)
                    .status(RequestStatus.PENDING)
                    .displayCode("REG-12345678")
                    .build();

            ApproveSellerContext ctx = new ApproveSellerContext(ownerUser, sellerDetail, "Shop Official");

            Shop savedShop = Shop.builder().id(UUID.randomUUID()).name("Shop Official").build();
            Role businessRole = Role.builder().roleName("BUSINESS").build();

            when(accountRepository.findById(adminId)).thenReturn(Optional.of(admin));
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(sellerReq));
            when(requestValidation.validateApproveSellerRequest(sellerReq, requestId)).thenReturn(ctx);
            when(shopService.createShop(eq(ownerUser), eq("Shop Official"), eq(sellerReq), eq(sellerDetail))).thenReturn(savedShop);
            when(roleRepository.findByRoleName("BUSINESS")).thenReturn(Optional.of(businessRole));

            RequestResponse res = requestService.approveRequest(requestId, adminId, "Duyệt hồ sơ mở shop");

            assertNotNull(res);
            assertEquals(RequestStatus.APPROVED, sellerReq.getStatus());
            assertEquals(admin, sellerReq.getReviewedBy());
            assertEquals(businessRole, ownerAccount.getRole(), "Role được nâng cấp thành BUSINESS");
            verify(shopEscrowFundService, times(1)).createInitialFund(eq(savedShop), eq(BigDecimal.valueOf(5000000)), anyString());
        }
    }

    // =========================================================================
    // NHÓM 4: GIỚI HẠN UPLOAD NGUYÊN TỬ & XÁC MINH FILE ẢNH THỰC TẾ (Task 4B.3)
    // =========================================================================
    @Nested
    @DisplayName("IV. Giới hạn Upload Nguyên Tử & Xác Minh File Ảnh Thực Tế (Task 4B.3)")
    class BanReviewUploadEvidenceTests {

        @Test
        @DisplayName("24. Upload thành công kèm đơn 0-4 ảnh hợp lệ: Lưu namespace evidence/ban-review và liên kết URL")
        void scenario24_submitBanReview_withValidImages_success() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .username("banned_uploader")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(7)
                    .isActive(false)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accountId, RequestType.APPEAL))
                    .thenReturn(Collections.emptyList());

            MockMultipartFile file1 = createValidPngFile("files", "shot1.png");
            MockMultipartFile file2 = createValidJpegFile("files", "shot2.jpg");

            when(fileService.uploadFile(eq(file1), eq("evidence/ban-review"))).thenReturn("uuid_shot1.png");
            when(fileService.getFileUrl("uuid_shot1.png")).thenReturn("https://minio.local/evidence/ban-review/uuid_shot1.png");
            when(fileService.uploadFile(eq(file2), eq("evidence/ban-review"))).thenReturn("uuid_shot2.jpg");
            when(fileService.getFileUrl("uuid_shot2.jpg")).thenReturn("https://minio.local/evidence/ban-review/uuid_shot2.jpg");

            when(requestRepository.save(any(Request.class))).thenAnswer(i -> {
                Request r = i.getArgument(0);
                r.setId(UUID.randomUUID());
                return r;
            });

            CreateRequestResponse res = requestService.submitBanReview(
                    accountId, "Giải trình hợp lệ kèm 2 ảnh minh chứng", List.of(file1, file2));

            assertNotNull(res);
            assertEquals(RequestStatus.PENDING, res.getStatus());
            verify(fileService, times(1)).uploadFile(eq(file1), eq("evidence/ban-review"));
            verify(fileService, times(1)).uploadFile(eq(file2), eq("evidence/ban-review"));
            verify(requestRepository, times(1)).save(argThat(r ->
                    r.getCoverImageUrl() != null
                            && r.getCoverImageUrl().contains("uuid_shot1.png")
                            && r.getCoverImageUrl().contains("uuid_shot2.jpg")
            ));
        }

        @Test
        @DisplayName("24b. Nộp đơn 0 ảnh thành công: Không upload file nào, Request coverImageUrl là null")
        void scenario24b_submitBanReview_zeroImages_success() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .username("banned_uploader_no_img")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(7)
                    .isActive(false)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accountId, RequestType.APPEAL))
                    .thenReturn(Collections.emptyList());
            when(requestRepository.save(any(Request.class))).thenAnswer(i -> {
                Request r = i.getArgument(0);
                r.setId(UUID.randomUUID());
                return r;
            });

            CreateRequestResponse res = requestService.submitBanReview(
                    accountId, "Giải trình không kèm ảnh minh chứng", null);

            assertNotNull(res);
            assertEquals(RequestStatus.PENDING, res.getStatus());
            verify(fileService, never()).uploadFile(any(), any());
            verify(requestRepository, times(1)).save(argThat(r -> r.getCoverImageUrl() == null));
        }

        @Test
        @DisplayName("25. Từ chối khi gửi quá 4 ảnh (gửi 5 ảnh bị từ chối ngay trước khi upload)")
        void scenario25_submitBanReview_rejectedWhenMoreThan4Images() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accountId, RequestType.APPEAL))
                    .thenReturn(Collections.emptyList());

            List<MultipartFile> fiveFiles = List.of(
                    createValidPngFile("files", "img1.png"),
                    createValidPngFile("files", "img2.png"),
                    createValidPngFile("files", "img3.png"),
                    createValidPngFile("files", "img4.png"),
                    createValidPngFile("files", "img5.png")
            );

            CustomException ex = assertThrows(CustomException.class, () ->
                    requestService.submitBanReview(accountId, "Giải trình 5 ảnh", fiveFiles));
            assertTrue(ex.getMessage().contains("tối đa 4 ảnh minh chứng"));
            verify(fileService, never()).uploadFile(any(), any());
            verify(requestRepository, never()).save(any());
        }

        @Test
        @DisplayName("26. Từ chối file upload vượt quá 10MB")
        void scenario26_submitBanReview_rejectedWhenOversized() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accountId, RequestType.APPEAL))
                    .thenReturn(Collections.emptyList());

            byte[] bigContent = new byte[10 * 1024 * 1024 + 10]; // > 10MB
            MockMultipartFile oversized = new MockMultipartFile("files", "huge.jpg", "image/jpeg", bigContent);

            CustomException ex = assertThrows(CustomException.class, () ->
                    requestService.submitBanReview(accountId, "Giải trình ảnh to", List.of(oversized)));
            assertTrue(ex.getMessage().contains("vượt quá dung lượng tối đa 10MB"));
            verify(fileService, never()).uploadFile(any(), any());
            verify(requestRepository, never()).save(any());
        }

        @Test
        @DisplayName("27. Từ chối file không phải định dạng ảnh, giả mạo chữ ký, WEBP không có decoder, mismatched Content-Type, hoặc pixel bomb")
        void scenario27_submitBanReview_rejectedWhenFakeImageOrExtension() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accountId, RequestType.APPEAL))
                    .thenReturn(Collections.emptyList());

            // A. Đuôi .mp4
            MockMultipartFile video = new MockMultipartFile("files", "clip.mp4", "video/mp4", "video".getBytes());
            CustomException ex1 = assertThrows(CustomException.class, () ->
                    requestService.submitBanReview(accountId, "Đính kèm video", List.of(video)));
            assertTrue(ex1.getMessage().contains("không phải là ảnh hợp lệ hoặc định dạng không được hỗ trợ"));

            // B. Đuôi .exe giả mạo Content-Type image/jpeg
            MockMultipartFile executable = new MockMultipartFile("files", "script.exe", "image/jpeg", "fake".getBytes());
            CustomException ex2 = assertThrows(CustomException.class, () ->
                    requestService.submitBanReview(accountId, "Đính kèm exe", List.of(executable)));
            assertTrue(ex2.getMessage().contains("không phải là ảnh hợp lệ hoặc định dạng không được hỗ trợ"));

            // C. Đuôi .png và Content-Type image/png nhưng nội dung là chuỗi text (fake magic bytes)
            MockMultipartFile fakePng = createFakeImageFile("files", "fake.png");
            CustomException ex3 = assertThrows(CustomException.class, () ->
                    requestService.submitBanReview(accountId, "Đính kèm fake png", List.of(fakePng)));
            assertTrue(ex3.getMessage().contains("không phải là ảnh hợp lệ hoặc định dạng không được hỗ trợ"));

            // D. Tệp WEBP (kể cả có RIFF header) -> Bị từ chối vì hệ thống không có decoder chuyên dụng an toàn
            MockMultipartFile webpFile = createWebpFile("files", "evidence.webp");
            CustomException ex4 = assertThrows(CustomException.class, () ->
                    requestService.submitBanReview(accountId, "Đính kèm file webp", List.of(webpFile)));
            assertTrue(ex4.getMessage().contains("không phải là ảnh hợp lệ hoặc định dạng không được hỗ trợ"));

            // E. Tệp khai Content-Type không khớp nội dung (Nội dung PNG nhưng khai image/jpeg và đuôi .jpg)
            MockMultipartFile mismatched = createMismatchedTypeFile("files", "mismatch.jpg");
            CustomException ex5 = assertThrows(CustomException.class, () ->
                    requestService.submitBanReview(accountId, "Đính kèm file mismatched type", List.of(mismatched)));
            assertTrue(ex5.getMessage().contains("không phải là ảnh hợp lệ hoặc định dạng không được hỗ trợ"));

            // F. Tệp khai báo width vượt giới hạn (width = 8001 > 8000 pixel MAX_DIMENSION) -> Bị từ chối từ metadata trước khi giải mã raster
            MockMultipartFile widthBomb = createCustomDimensionPngFile("files", "bomb_width.png", 8001, 100);
            CustomException ex6 = assertThrows(CustomException.class, () ->
                    requestService.submitBanReview(accountId, "Đính kèm ảnh width bomb", List.of(widthBomb)));
            assertTrue(ex6.getMessage().contains("không phải là ảnh hợp lệ hoặc định dạng không được hỗ trợ"));

            // G. Tệp có width và height <= 8000 nhưng tổng số pixel vượt 25 triệu (6000x5000 = 30M pixels) -> Bị từ chối chống Decompression Bomb
            MockMultipartFile totalPixelsBomb = createCustomDimensionPngFile("files", "bomb_total.png", 6000, 5000);
            CustomException ex7 = assertThrows(CustomException.class, () ->
                    requestService.submitBanReview(accountId, "Đính kèm ảnh total pixels bomb", List.of(totalPixelsBomb)));
            assertTrue(ex7.getMessage().contains("không phải là ảnh hợp lệ hoặc định dạng không được hỗ trợ"));

            // H. Tệp hỏng / cụt file (malformed / truncated) -> Bị từ chối an toàn không làm crash ứng dụng
            MockMultipartFile malformed = createMalformedPngFile("files", "broken.png");
            CustomException ex8 = assertThrows(CustomException.class, () ->
                    requestService.submitBanReview(accountId, "Đính kèm ảnh hỏng", List.of(malformed)));
            assertTrue(ex8.getMessage().contains("không phải là ảnh hợp lệ hoặc định dạng không được hỗ trợ"));

            verify(fileService, never()).uploadFile(any(), any());
            verify(requestRepository, never()).save(any());
        }

        @Test
        @DisplayName("28. Xử lý cleanup an toàn: Khi lưu DB thất bại sau khi upload file, dọn sạch file đã tạo trên MinIO")
        void scenario28_submitBanReview_cleanupUploadedFilesOnDatabaseFailure() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .username("banned_cleanup_test")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(7)
                    .isActive(false)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accountId, RequestType.APPEAL))
                    .thenReturn(Collections.emptyList());

            MockMultipartFile file1 = createValidPngFile("files", "cleanup1.png");
            MockMultipartFile file2 = createValidPngFile("files", "cleanup2.png");

            when(fileService.uploadFile(eq(file1), eq("evidence/ban-review"))).thenReturn("stored_cleanup1.png");
            when(fileService.getFileUrl("stored_cleanup1.png")).thenReturn("https://minio/stored_cleanup1.png");
            when(fileService.uploadFile(eq(file2), eq("evidence/ban-review"))).thenReturn("stored_cleanup2.png");
            when(fileService.getFileUrl("stored_cleanup2.png")).thenReturn("https://minio/stored_cleanup2.png");

            // Giả lập lưu Database bị lỗi
            when(requestRepository.save(any(Request.class))).thenThrow(new RuntimeException("Database connection failed"));

            RuntimeException thrown = assertThrows(RuntimeException.class, () ->
                    requestService.submitBanReview(accountId, "Giải trình bị lỗi DB", List.of(file1, file2)));
            assertEquals("Database connection failed", thrown.getMessage());

            // Đảm bảo FileService.deleteFile được gọi cho cả 2 file đã upload lên MinIO để chống rác
            verify(fileService, times(1)).deleteFile("stored_cleanup1.png");
            verify(fileService, times(1)).deleteFile("stored_cleanup2.png");
        }

        @Test
        @DisplayName("28b. Cleanup khi DB commit rollback sau khi service method trả về (TransactionSynchronization)")
        void scenario28b_submitBanReview_transactionSynchronizationCleanupOnCommitRollback() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .username("banned_sync_test")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(7)
                    .isActive(false)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accountId, RequestType.APPEAL))
                    .thenReturn(Collections.emptyList());

            MockMultipartFile file1 = createValidPngFile("files", "sync1.png");
            MockMultipartFile file2 = createValidJpegFile("files", "sync2.jpg");

            when(fileService.uploadFile(eq(file1), eq("evidence/ban-review"))).thenReturn("stored_sync1.png");
            when(fileService.getFileUrl("stored_sync1.png")).thenReturn("https://minio/stored_sync1.png");
            when(fileService.uploadFile(eq(file2), eq("evidence/ban-review"))).thenReturn("stored_sync2.jpg");
            when(fileService.getFileUrl("stored_sync2.jpg")).thenReturn("https://minio/stored_sync2.jpg");

            when(requestRepository.save(any(Request.class))).thenAnswer(i -> {
                Request r = i.getArgument(0);
                r.setId(UUID.randomUUID());
                return r;
            });

            // Kích hoạt Spring TransactionSynchronizationManager để mô phỏng môi trường transaction thực
            TransactionSynchronizationManager.initSynchronization();
            try {
                CreateRequestResponse res = requestService.submitBanReview(
                        accountId, "Giải trình hợp lệ nhưng commit bị rollback sau đó", List.of(file1, file2));
                assertNotNull(res);

                // Service method trả về thành công -> Lúc này MinIO CHƯA bị dọn dẹp
                verify(fileService, never()).deleteFile(anyString());

                // Lấy synchronization callback đã được đăng ký
                List<TransactionSynchronization> synchronizations = TransactionSynchronizationManager.getSynchronizations();
                assertFalse(synchronizations.isEmpty(), "Callback TransactionSynchronization phải được đăng ký");

                // Giả lập Spring commit thất bại và trigger rollback sau khi method trả về
                for (TransactionSynchronization sync : synchronizations) {
                    sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
                }

                // Verify: Toàn bộ file đã upload lên MinIO được dọn dẹp sạch sẽ
                verify(fileService, times(1)).deleteFile("stored_sync1.png");
                verify(fileService, times(1)).deleteFile("stored_sync2.jpg");

                // Thử trigger rollback lần thứ 2: Đảm bảo tính Idempotency (AtomicBoolean cleanedUp ngăn xóa trùng lặp)
                for (TransactionSynchronization sync : synchronizations) {
                    sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
                }
                verify(fileService, times(1)).deleteFile("stored_sync1.png");
                verify(fileService, times(1)).deleteFile("stored_sync2.jpg");
            } finally {
                TransactionSynchronizationManager.clearSynchronization();
            }
        }

        @Test
        @DisplayName("29. Upload kèm đơn bị từ chối khi tài khoản đang có đơn PENDING")
        void scenario29_submitBanReview_rejectedWhenPendingAppeal() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .build();

            Request pending = Request.builder()
                    .id(UUID.randomUUID())
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.PENDING)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accountId, RequestType.APPEAL))
                    .thenReturn(List.of(pending));

            MockMultipartFile file = createValidPngFile("files", "shot.png");

            CustomException ex = assertThrows(CustomException.class, () ->
                    requestService.submitBanReview(accountId, "Giải trình bị trùng", List.of(file)));
            assertTrue(ex.getMessage().contains("đang có một yêu cầu xem xét đang chờ xử lý"));
            verify(fileService, never()).uploadFile(any(), any());
        }

        @Test
        @DisplayName("30. Upload kèm đơn bị từ chối khi Account không phải BANNED (ACTIVE)")
        void scenario30_submitBanReview_rejectedWhenNotBanned() {
            UUID accountId = UUID.randomUUID();
            Account account = Account.builder()
                    .id(accountId)
                    .status(AccountStatus.ACTIVE)
                    .disciplineLevel(DisciplineLevel.NONE)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));

            MockMultipartFile file = createValidPngFile("files", "shot.png");
            CustomException ex = assertThrows(CustomException.class, () ->
                    requestService.submitBanReview(accountId, "Giải trình account active", List.of(file)));
            assertTrue(ex.getMessage().contains("Chỉ tài khoản đang bị khóa vĩnh viễn"));
            verify(fileService, never()).uploadFile(any(), any());
        }
    }

    // =========================================================================
    // NHÓM 5: KHẮC PHỤC FALLBACK SỐ GẬY KHÔNG AN TOÀN (Task 4B.2)
    // =========================================================================
    @Nested
    @DisplayName("V. Khắc phục Fallback Số Gậy Không An Toàn (Task 4B.2)")
    class InconsistentStrikeFallbackRemediationTests {

        @Test
        @DisplayName("31. Số gậy cũ bằng 0 nhưng Account BANNED: Từ chối duyệt, không sửa dữ liệu")
        void scenario31_zeroStrikesOnBannedAccount_rejectedSafely() {
            UUID adminId = UUID.randomUUID();
            UUID requestId = UUID.randomUUID();
            UUID targetId = UUID.randomUUID();

            Account admin = Account.builder().id(adminId).build();
            Account target = Account.builder()
                    .id(targetId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(0) // Bất nhất: BANNED nhưng 0 gậy
                    .isActive(false)
                    .build();

            Request appeal = Request.builder()
                    .id(requestId)
                    .account(target)
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.PENDING)
                    .build();

            when(accountRepository.findById(adminId)).thenReturn(Optional.of(admin));
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(appeal));
            when(accountRepository.findByIdForUpdate(targetId)).thenReturn(Optional.of(target));

            CustomException ex = assertThrows(CustomException.class, () -> requestService.approveRequest(requestId, adminId, "Duyệt"));
            assertTrue(ex.getMessage().contains("Dữ liệu tài khoản không hợp lệ"));
            assertTrue(ex.getMessage().contains("nhỏ hơn 7 (0)"));

            // Dữ liệu nguyên vẹn
            assertEquals(0, target.getViolationCount());
            assertEquals(AccountStatus.BANNED, target.getStatus());
            assertEquals(RequestStatus.PENDING, appeal.getStatus());
            verify(accountRepository, never()).save(any());
            verify(requestRepository, never()).save(any());
        }

        @Test
        @DisplayName("32. Số gậy cũ âm nhưng Account BANNED: Từ chối duyệt, không sửa dữ liệu")
        void scenario32_negativeStrikesOnBannedAccount_rejectedSafely() {
            UUID adminId = UUID.randomUUID();
            UUID requestId = UUID.randomUUID();
            UUID targetId = UUID.randomUUID();

            Account admin = Account.builder().id(adminId).build();
            Account target = Account.builder()
                    .id(targetId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(-2) // Số gậy âm
                    .isActive(false)
                    .build();

            Request appeal = Request.builder()
                    .id(requestId)
                    .account(target)
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.PENDING)
                    .build();

            when(accountRepository.findById(adminId)).thenReturn(Optional.of(admin));
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(appeal));
            when(accountRepository.findByIdForUpdate(targetId)).thenReturn(Optional.of(target));

            CustomException ex = assertThrows(CustomException.class, () -> requestService.approveRequest(requestId, adminId, "Duyệt"));
            assertTrue(ex.getMessage().contains("Dữ liệu tài khoản không hợp lệ"));
            assertTrue(ex.getMessage().contains("nhỏ hơn 7 (-2)"));

            assertEquals(RequestStatus.PENDING, appeal.getStatus());
            verify(accountRepository, never()).save(any());
            verify(requestRepository, never()).save(any());
        }

        @Test
        @DisplayName("33. Số gậy cũ nhỏ hơn 7 (ví dụ 5 hoặc 6) nhưng Account BANNED: Từ chối duyệt")
        void scenario33_strikesLessThan7OnBannedAccount_rejectedSafely() {
            UUID adminId = UUID.randomUUID();
            UUID requestId = UUID.randomUUID();
            UUID targetId = UUID.randomUUID();

            Account admin = Account.builder().id(adminId).build();
            Account target = Account.builder()
                    .id(targetId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(5) // Nhỏ hơn 7
                    .isActive(false)
                    .build();

            Request appeal = Request.builder()
                    .id(requestId)
                    .account(target)
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.PENDING)
                    .build();

            when(accountRepository.findById(adminId)).thenReturn(Optional.of(admin));
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(appeal));
            when(accountRepository.findByIdForUpdate(targetId)).thenReturn(Optional.of(target));

            CustomException ex = assertThrows(CustomException.class, () -> requestService.approveRequest(requestId, adminId, "Duyệt"));
            assertTrue(ex.getMessage().contains("Dữ liệu tài khoản không hợp lệ"));
            assertTrue(ex.getMessage().contains("nhỏ hơn 7 (5)"));

            assertEquals(RequestStatus.PENDING, appeal.getStatus());
            verify(accountRepository, never()).save(any());
            verify(requestRepository, never()).save(any());
        }

        @Test
        @DisplayName("33b. Chứng minh kiểu dữ liệu primitive int của Account.violationCount và ràng buộc nullable=false")
        void scenario33b_accountViolationCount_primitiveTypeCheck() throws NoSuchFieldException {
            java.lang.reflect.Field field = Account.class.getDeclaredField("violationCount");
            assertEquals(int.class, field.getType(), "violationCount bắt buộc là kiểu primitive int trong Entity");
            jakarta.persistence.Column col = field.getAnnotation(jakarta.persistence.Column.class);
            assertNotNull(col);
            assertFalse(col.nullable(), "violationCount có ràng buộc database nullable = false, không thể null trong runtime");
        }

        @Test
        @DisplayName("34. Phép trừ chính xác 7 - 1 = 6 gậy: Không dùng Math.max, chuyển SUSPENDED 14 ngày")
        void scenario34_exactReduction_7to6_becomesSuspended() {
            UUID adminId = UUID.randomUUID();
            UUID requestId = UUID.randomUUID();
            UUID targetId = UUID.randomUUID();

            Account admin = Account.builder().id(adminId).build();
            Account target = Account.builder()
                    .id(targetId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(7)
                    .isActive(false)
                    .build();

            Request appeal = Request.builder()
                    .id(requestId)
                    .account(target)
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.PENDING)
                    .build();

            when(accountRepository.findById(adminId)).thenReturn(Optional.of(admin));
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(appeal));
            when(accountRepository.findByIdForUpdate(targetId)).thenReturn(Optional.of(target));

            requestService.approveRequest(requestId, adminId, "Giảm 1 gậy");

            assertEquals(6, target.getViolationCount(), "7 - 1 phải bằng đúng 6");
            assertEquals(AccountStatus.SUSPENDED, target.getStatus());
            assertEquals(DisciplineLevel.SUSPENDED, target.getDisciplineLevel());
            assertTrue(target.getIsActive());
            assertNotNull(target.getSuspendedUntil());
            verify(accountRepository, times(1)).save(target);
            verify(requestRepository, times(1)).save(appeal);
        }

        @Test
        @DisplayName("35. Tài khoản 8 gậy khi Admin duyệt: Đưa về 6 gậy SUSPENDED trong 14 ngày")
        void scenario35_exactReduction_8to6_becomesSuspended() {
            UUID adminId = UUID.randomUUID();
            UUID requestId = UUID.randomUUID();
            UUID targetId = UUID.randomUUID();

            Account admin = Account.builder().id(adminId).build();
            Account target = Account.builder()
                    .id(targetId)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .violationCount(8)
                    .isActive(false)
                    .build();

            Request appeal = Request.builder()
                    .id(requestId)
                    .account(target)
                    .type(RequestType.APPEAL)
                    .status(RequestStatus.PENDING)
                    .build();

            when(accountRepository.findById(adminId)).thenReturn(Optional.of(admin));
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(appeal));
            when(accountRepository.findByIdForUpdate(targetId)).thenReturn(Optional.of(target));

            requestService.approveRequest(requestId, adminId, "Duyệt đơn ân xá về 6 gậy");

            assertEquals(6, target.getViolationCount(), "Khi duyệt đơn tài khoản BANNED luôn về 6 gậy SUSPENDED");
            assertEquals(AccountStatus.SUSPENDED, target.getStatus());
            assertEquals(DisciplineLevel.SUSPENDED, target.getDisciplineLevel());
            assertTrue(target.getIsActive());
            assertNotNull(target.getSuspendedUntil());
            verify(accountRepository, times(1)).save(target);
            verify(requestRepository, times(1)).save(appeal);
        }
    }

    // =========================================================================
    // NHÓM 6: CÔ LẬP TOKEN BAN_REVIEW KHI TRẠNG THÁI ACCOUNT THAY ĐỔI (Task 4B.2)
    // =========================================================================
    @Nested
    @DisplayName("VI. Cô lập BAN_REVIEW Token Khi Trạng thái Account Thay đổi (Task 4B.2)")
    class BanReviewTokenIsolationAcrossAccountStatesTests {

        @Test
        @DisplayName("36. Token BAN_REVIEW bị chặn hoàn toàn trên marketplace khi Account vẫn BANNED")
        void scenario36_banReviewToken_blockedOnMarketplace_whenAccountBanned() throws Exception {
            String token = "ban-jwt-token";
            Account bannedAcc = Account.builder()
                    .id(UUID.randomUUID())
                    .username("banned_user")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .isActive(false)
                    .build();

            when(httpServletRequest.getHeader("Authorization")).thenReturn("Bearer " + token);
            when(tokenService.isBanReviewToken(token)).thenReturn(true);
            when(tokenService.getAccountFromToken(token)).thenReturn(bannedAcc);

            List<String> forbiddenMarketEndpoints = List.of(
                    "/api/v1/orders/checkout",
                    "/api/v1/cart/items",
                    "/api/v1/products",
                    "/api/v1/review/create",
                    "/api/v1/wallet/balance",
                    "/api/v1/chat/rooms",
                    "/api/v1/admin/requests"
            );

            for (String uri : forbiddenMarketEndpoints) {
                reset(resolver, filterChain);
                when(httpServletRequest.getMethod()).thenReturn("POST");
                when(httpServletRequest.getRequestURI()).thenReturn(uri);

                jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);

                verify(resolver, times(1)).resolveException(
                        eq(httpServletRequest),
                        eq(httpServletResponse),
                        isNull(),
                        argThat(ex -> ex instanceof org.springframework.security.authentication.LockedException)
                );
                verify(filterChain, never()).doFilter(httpServletRequest, httpServletResponse);
            }
        }

        @Test
        @DisplayName("37. Token BAN_REVIEW vẫn bị chặn trên marketplace sau khi Account đã chuyển sang SUSPENDED")
        void scenario37_banReviewToken_stillBlockedOnMarketplace_whenAccountSuspended() throws Exception {
            String token = "ban-jwt-token-after-suspension";
            // Account đã được approve và chuyển từ BANNED sang SUSPENDED trong DB
            Account suspendedAcc = Account.builder()
                    .id(UUID.randomUUID())
                    .username("now_suspended_user")
                    .status(AccountStatus.SUSPENDED)
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .violationCount(6)
                    .isActive(true)
                    .build();

            when(httpServletRequest.getHeader("Authorization")).thenReturn("Bearer " + token);
            when(tokenService.isBanReviewToken(token)).thenReturn(true);
            when(tokenService.getAccountFromToken(token)).thenReturn(suspendedAcc);

            // Thử dùng token BAN_REVIEW cũ để gọi API marketplace
            when(httpServletRequest.getMethod()).thenReturn("GET");
            when(httpServletRequest.getRequestURI()).thenReturn("/api/v1/cart");

            jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);

            // Bắt buộc vẫn bị chặn 403 Forbidden (LockedException)
            verify(resolver, times(1)).resolveException(
                    eq(httpServletRequest),
                    eq(httpServletResponse),
                    isNull(),
                    argThat(ex -> ex instanceof org.springframework.security.authentication.LockedException
                            && ex.getMessage().contains("không có quyền truy cập"))
            );
            verify(filterChain, never()).doFilter(httpServletRequest, httpServletResponse);
        }

        @Test
        @DisplayName("38. Token BAN_REVIEW vẫn bị chặn trên marketplace sau khi Account đã chuyển sang ACTIVE")
        void scenario38_banReviewToken_stillBlockedOnMarketplace_whenAccountActive() throws Exception {
            String token = "ban-jwt-token-after-active";
            Account activeAcc = Account.builder()
                    .id(UUID.randomUUID())
                    .username("now_active_user")
                    .status(AccountStatus.ACTIVE)
                    .disciplineLevel(DisciplineLevel.WARNED)
                    .violationCount(4)
                    .isActive(true)
                    .build();

            when(httpServletRequest.getHeader("Authorization")).thenReturn("Bearer " + token);
            when(tokenService.isBanReviewToken(token)).thenReturn(true);
            when(tokenService.getAccountFromToken(token)).thenReturn(activeAcc);

            when(httpServletRequest.getMethod()).thenReturn("POST");
            when(httpServletRequest.getRequestURI()).thenReturn("/api/v1/orders/create");

            jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);

            verify(resolver, times(1)).resolveException(
                    eq(httpServletRequest),
                    eq(httpServletResponse),
                    isNull(),
                    argThat(ex -> ex instanceof org.springframework.security.authentication.LockedException)
            );
            verify(filterChain, never()).doFilter(httpServletRequest, httpServletResponse);
        }

        @Test
        @DisplayName("39. Đăng nhập bình thường sau khi Account chuyển sang SUSPENDED cấp token marketplace thông thường")
        void scenario39_loginAfterRestoredToSuspended_issuesMarketplaceToken() {
            String username = "restored_suspended_user";
            Role role = Role.builder().roleName("CUSTOMER").build();
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .username(username)
                    .passwordHash("hashed_pwd")
                    .status(AccountStatus.SUSPENDED)
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .violationCount(6)
                    .suspendedUntil(LocalDateTime.now().plusDays(14))
                    .isActive(true)
                    .role(role)
                    .build();

            when(accountRepository.findByUsername(username)).thenReturn(Optional.of(account));
            Authentication auth = mock(Authentication.class);
            when(auth.getPrincipal()).thenReturn(account);
            when(authenticationManager.authenticate(any())).thenReturn(auth);
            when(tokenService.createToken(account)).thenReturn("new-regular-access-token");
            when(tokenService.refreshToken(account)).thenReturn("new-regular-refresh-token");
            when(accountRepository.findById(account.getId())).thenReturn(Optional.of(account));

            LoginRequest req = new LoginRequest();
            req.setUsername(username);
            req.setPassword("CorrectPassword");

            LoginResponse res = authenticationService.login(req);

            assertEquals("new-regular-access-token", res.getToken());
            assertEquals("new-regular-refresh-token", res.getRefreshToken());
            assertEquals("CUSTOMER", res.getRole());
            verify(tokenService, times(1)).createToken(account);
            verify(tokenService, never()).createBanReviewToken(any());
        }

        @Test
        @DisplayName("40. Token marketplace thông thường của Account SUSPENDED qua JwtFilter hợp lệ cho marketplace")
        void scenario40_regularTokenOfSuspendedAccount_allowedThroughFilter() throws Exception {
            String regularToken = "valid-regular-token";
            Role role = Role.builder().roleName("CUSTOMER").build();
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .username("suspended_market_buyer")
                    .status(AccountStatus.SUSPENDED)
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .violationCount(6)
                    .isActive(true)
                    .role(role)
                    .build();

            when(httpServletRequest.getHeader("Authorization")).thenReturn("Bearer " + regularToken);
            when(tokenService.isBanReviewToken(regularToken)).thenReturn(false);
            when(tokenService.getAccountFromToken(regularToken)).thenReturn(account);
            when(httpServletRequest.getMethod()).thenReturn("GET");
            when(httpServletRequest.getRequestURI()).thenReturn("/api/v1/orders/my-orders");

            jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);

            verify(filterChain, times(1)).doFilter(httpServletRequest, httpServletResponse);
            verify(resolver, never()).resolveException(any(), any(), any(), any());
            assertNotNull(SecurityContextHolder.getContext().getAuthentication());
            assertEquals("CUSTOMER", ((CurrentUserInfo) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getRole());
        }
    }

    private static Object getFieldValueQuietly(Object target, String fieldName) {
        try {
            java.lang.reflect.Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            return field.get(target);
        } catch (NoSuchFieldException | IllegalAccessException e) {
            return null;
        }
    }

    private static MockMultipartFile createValidPngFile(String paramName, String fileName) {
        try {
            BufferedImage img = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "png", baos);
            return new MockMultipartFile(paramName, fileName, "image/png", baos.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo ảnh PNG giả lập", e);
        }
    }

    private static MockMultipartFile createFakeImageFile(String paramName, String fileName) {
        return new MockMultipartFile(
                paramName,
                fileName,
                "image/png",
                "This is not a real image binary - fake header".getBytes(StandardCharsets.UTF_8)
        );
    }

    private static MockMultipartFile createValidJpegFile(String paramName, String fileName) {
        try {
            BufferedImage img = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "jpg", baos);
            return new MockMultipartFile(paramName, fileName, "image/jpeg", baos.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo ảnh JPEG giả lập", e);
        }
    }

    private static MockMultipartFile createWebpFile(String paramName, String fileName) {
        byte[] webpBytes = "RIFF\u0024\u0000\u0000\u0000WEBPVP8 \u0018\u0000\u0000\u0000".getBytes(StandardCharsets.US_ASCII);
        return new MockMultipartFile(paramName, fileName, "image/webp", webpBytes);
    }

    private static MockMultipartFile createCustomDimensionPngFile(String paramName, String fileName, int width, int height) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            // PNG signature (8 bytes)
            baos.write(new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A});

            // IHDR length: 13 bytes
            baos.write(new byte[]{0, 0, 0, 13});

            ByteArrayOutputStream ihdr = new ByteArrayOutputStream();
            ihdr.write("IHDR".getBytes(StandardCharsets.US_ASCII));
            ihdr.write((width >> 24) & 0xFF);
            ihdr.write((width >> 16) & 0xFF);
            ihdr.write((width >> 8) & 0xFF);
            ihdr.write(width & 0xFF);

            ihdr.write((height >> 24) & 0xFF);
            ihdr.write((height >> 16) & 0xFF);
            ihdr.write((height >> 8) & 0xFF);
            ihdr.write(height & 0xFF);

            // Bit depth 8, Color type 2 (RGB), Compression 0, Filter 0, Interlace 0
            ihdr.write(new byte[]{8, 2, 0, 0, 0});

            byte[] ihdrBytes = ihdr.toByteArray();
            baos.write(ihdrBytes);

            java.util.zip.CRC32 crc = new java.util.zip.CRC32();
            crc.update(ihdrBytes);
            long crcVal = crc.getValue();
            baos.write((int) ((crcVal >> 24) & 0xFF));
            baos.write((int) ((crcVal >> 16) & 0xFF));
            baos.write((int) ((crcVal >> 8) & 0xFF));
            baos.write((int) (crcVal & 0xFF));

            // IEND chunk
            baos.write(new byte[]{0, 0, 0, 0});
            baos.write("IEND".getBytes(StandardCharsets.US_ASCII));
            java.util.zip.CRC32 endCrc = new java.util.zip.CRC32();
            endCrc.update("IEND".getBytes(StandardCharsets.US_ASCII));
            long endCrcVal = endCrc.getValue();
            baos.write((int) ((endCrcVal >> 24) & 0xFF));
            baos.write((int) ((endCrcVal >> 16) & 0xFF));
            baos.write((int) ((endCrcVal >> 8) & 0xFF));
            baos.write((int) (endCrcVal & 0xFF));

            return new MockMultipartFile(paramName, fileName, "image/png", baos.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo ảnh PNG tùy chỉnh kích thước", e);
        }
    }

    private static MockMultipartFile createMalformedPngFile(String paramName, String fileName) {
        byte[] malformed = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x12, 0x34};
        return new MockMultipartFile(paramName, fileName, "image/png", malformed);
    }

    private static MockMultipartFile createMismatchedTypeFile(String paramName, String fileName) {
        try {
            // Nội dung thực tế là PNG nhưng khai báo đuôi .jpg và Content-Type image/jpeg
            BufferedImage img = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "png", baos);
            return new MockMultipartFile(paramName, fileName, "image/jpeg", baos.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo ảnh mismatched type", e);
        }
    }
}
