package com.marketplace.ecommerce.auth.service.impl;

import com.marketplace.ecommerce.auth.dto.request.LoginRequest;
import com.marketplace.ecommerce.auth.dto.response.LoginResponse;
import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.Role;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.RoleRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.service.AccountDisciplineService;
import com.marketplace.ecommerce.auth.service.EmailService;
import com.marketplace.ecommerce.auth.service.TokenService;
import com.marketplace.ecommerce.auth.validate.AuthValidation;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.AuthProvider;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.chat.service.ChatService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.common.ErrorResponse;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.common.exception.InvalidCredentialsException;
import com.marketplace.ecommerce.common.exception.GlobalExceptionHandler;
import com.marketplace.ecommerce.config.JwtFilter;
import com.marketplace.ecommerce.notification.repository.NotificationRepository;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.repository.OrderReturnRepository;
import com.marketplace.ecommerce.order.service.OrderReturnService;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.request.policy.RequestPolicy;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.service.RequestService;
import com.marketplace.ecommerce.request.service.impl.ReportServiceImpl;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopEscrowFundService;
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
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Task 3 Unit Tests: Thực thi Kỷ luật Khóa Vĩnh Viễn (Permanent Ban) và Kiểm soát Ủy quyền")
public class PermanentBanAuthorizationEnforcementTest {

    // ReportService mocks
    @Mock private ReportRepository reportRepository;
    @Mock private RequestRepository requestRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private RequestService requestService;
    @Mock private RequestPolicy requestPolicy;
    @Mock private ProductRepository productRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private ShopRepository shopRepository;
    @Mock private EscrowService escrowService;
    @Mock private EscrowRepository escrowRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private OrderReturnRepository orderReturnRepository;
    @Mock private OrderReturnService orderReturnService;
    @Mock private ShopEscrowFundService shopEscrowFundService;
    @Mock private NotificationRepository notificationRepository;
    @Mock private UserRepository userRepository;
    @Mock private ChatService chatService;
    @Mock private AccountDisciplineService accountDisciplineService;

    // AuthenticationService mocks
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private TokenService tokenService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private AuthValidation validation;
    @Mock private EmailService emailService;
    @Mock private RoleRepository roleRepository;
    @Mock private CartRepository cartRepository;
    @Mock private WalletRepository walletRepository;

    // JwtFilter mocks
    @Mock private HandlerExceptionResolver resolver;
    @Mock private HttpServletRequest httpServletRequest;
    @Mock private HttpServletResponse httpServletResponse;
    @Mock private FilterChain filterChain;

    private ReportServiceImpl reportService;
    private AuthenticationServiceImpl authenticationService;
    private JwtFilter jwtFilter;

    @BeforeEach
    void setUp() {
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
                accountDisciplineService
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
    }

    @Nested
    @DisplayName("A. Ngưỡng Kỷ luật Khóa Vĩnh Viễn (7+ Vi Phạm) và Duy Trì Task 2 trong ReportServiceImpl.punishAccount")
    class PermanentBanThresholdTests {

        @Test
        @DisplayName("1. Vi phạm từ 6 lên 7: Chuyển BANNED, isActive=false, bannedUntil=null, suspendedUntil=null")
        void reach7Violations_SetsPermanentBanFields() throws Exception {
            UUID accountId = UUID.randomUUID();
            LocalDateTime now = LocalDateTime.now();

            Account account = Account.builder()
                    .id(accountId)
                    .violationCount(6)
                    .lastViolationAt(now.minusDays(5)) // Không decay
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .status(AccountStatus.SUSPENDED)
                    .suspendedUntil(now.plusDays(10))
                    .isActive(true)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(accountRepository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            Method method = ReportServiceImpl.class.getDeclaredMethod("punishAccount", UUID.class, LocalDateTime.class);
            method.setAccessible(true);
            DisciplineLevel finalLevel = (DisciplineLevel) method.invoke(reportService, accountId, now);

            assertEquals(DisciplineLevel.BANNED, finalLevel);
            assertEquals(7, account.getViolationCount(), "Số vi phạm phải tăng lên 7");
            assertEquals(DisciplineLevel.BANNED, account.getDisciplineLevel());
            assertEquals(AccountStatus.BANNED, account.getStatus());
            assertFalse(account.getIsActive(), "Tài khoản BANNED phải có isActive = false");
            assertNull(account.getBannedUntil(), "Permanent ban phải có bannedUntil = null (không khóa có thời hạn)");
            assertNull(account.getSuspendedUntil(), "Permanent ban phải xóa suspendedUntil về null");
            verify(accountRepository).save(account);
        }

        @Test
        @DisplayName("2. Vi phạm từ 7 lên 8: Giữ vững BANNED vĩnh viễn, bannedUntil=null, suspendedUntil=null")
        void reach8Violations_PreservesPermanentBan() throws Exception {
            UUID accountId = UUID.randomUUID();
            LocalDateTime now = LocalDateTime.now();

            Account account = Account.builder()
                    .id(accountId)
                    .violationCount(7)
                    .lastViolationAt(now.minusDays(1))
                    .disciplineLevel(DisciplineLevel.WARNED)
                    .status(AccountStatus.ACTIVE)
                    .isActive(true)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(accountRepository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            Method method = ReportServiceImpl.class.getDeclaredMethod("punishAccount", UUID.class, LocalDateTime.class);
            method.setAccessible(true);
            DisciplineLevel finalLevel = (DisciplineLevel) method.invoke(reportService, accountId, now);

            assertEquals(DisciplineLevel.BANNED, finalLevel);
            assertEquals(8, account.getViolationCount());
            assertEquals(DisciplineLevel.BANNED, account.getDisciplineLevel());
            assertEquals(AccountStatus.BANNED, account.getStatus());
            assertFalse(account.getIsActive());
            assertNull(account.getBannedUntil());
            assertNull(account.getSuspendedUntil());
        }

        @Test
        @DisplayName("3. Vi phạm từ 4 lên 5: Chuyển SUSPENDED (14 ngày), isActive=true, phù hợp Task 2")
        void reach5Violations_SuspendedLevel_Sets14Days() throws Exception {
            UUID accountId = UUID.randomUUID();
            LocalDateTime now = LocalDateTime.now();

            Account account = Account.builder()
                    .id(accountId)
                    .violationCount(4)
                    .lastViolationAt(now.minusDays(5))
                    .disciplineLevel(DisciplineLevel.WARNED)
                    .status(AccountStatus.ACTIVE)
                    .isActive(true)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(accountRepository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            Method method = ReportServiceImpl.class.getDeclaredMethod("punishAccount", UUID.class, LocalDateTime.class);
            method.setAccessible(true);
            DisciplineLevel finalLevel = (DisciplineLevel) method.invoke(reportService, accountId, now);

            assertEquals(DisciplineLevel.SUSPENDED, finalLevel);
            assertEquals(5, account.getViolationCount());
            assertEquals(DisciplineLevel.SUSPENDED, account.getDisciplineLevel());
            assertEquals(AccountStatus.SUSPENDED, account.getStatus());
            assertTrue(account.getIsActive(), "Tài khoản SUSPENDED vẫn duy trì isActive = true");
            assertNotNull(account.getSuspendedUntil(), "Tài khoản SUSPENDED phải có hạn suspendedUntil 14 ngày");
            assertEquals(now.plusDays(14), account.getSuspendedUntil());
            assertNull(account.getBannedUntil());
        }

        @Test
        @DisplayName("4. Vi phạm từ 2 lên 3: Chuyển WARNED, isActive=true, không bị khóa, phù hợp Task 2")
        void reach3Violations_WarnedLevel_PreservesActive() throws Exception {
            UUID accountId = UUID.randomUUID();
            LocalDateTime now = LocalDateTime.now();

            Account account = Account.builder()
                    .id(accountId)
                    .violationCount(2)
                    .lastViolationAt(now.minusDays(5))
                    .disciplineLevel(DisciplineLevel.NONE)
                    .status(AccountStatus.ACTIVE)
                    .isActive(true)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(accountRepository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            Method method = ReportServiceImpl.class.getDeclaredMethod("punishAccount", UUID.class, LocalDateTime.class);
            method.setAccessible(true);
            DisciplineLevel finalLevel = (DisciplineLevel) method.invoke(reportService, accountId, now);

            assertEquals(DisciplineLevel.WARNED, finalLevel);
            assertEquals(3, account.getViolationCount());
            assertEquals(DisciplineLevel.WARNED, account.getDisciplineLevel());
            assertEquals(AccountStatus.ACTIVE, account.getStatus());
            assertTrue(account.getIsActive());
            assertNull(account.getSuspendedUntil());
            assertNull(account.getBannedUntil());
        }

        @Test
        @DisplayName("5. Thuật toán hoàn lương 30 ngày (Monthly Decay): Giảm vi phạm trước khi tính hình phạt mới")
        void monthlyDecay_DecrementsViolationsBeforePenalty() throws Exception {
            UUID accountId = UUID.randomUUID();
            LocalDateTime now = LocalDateTime.now();

            // 6 vi phạm nhưng cách đây 65 ngày (được giảm 2 vi phạm: 6 - 2 = 4 vi phạm)
            // Khi phát sinh vi phạm mới: 4 + 1 = 5 vi phạm -> SUSPENDED (thay vì lên 7 -> BANNED)
            Account account = Account.builder()
                    .id(accountId)
                    .violationCount(6)
                    .lastViolationAt(now.minusDays(65))
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .status(AccountStatus.SUSPENDED)
                    .isActive(true)
                    .build();

            when(accountRepository.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
            when(accountRepository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

            Method method = ReportServiceImpl.class.getDeclaredMethod("punishAccount", UUID.class, LocalDateTime.class);
            method.setAccessible(true);
            DisciplineLevel finalLevel = (DisciplineLevel) method.invoke(reportService, accountId, now);

            assertEquals(DisciplineLevel.SUSPENDED, finalLevel);
            assertEquals(5, account.getViolationCount(), "6 vi phạm decay 2 còn 4, thêm 1 thành 5 vi phạm");
            assertEquals(DisciplineLevel.SUSPENDED, account.getDisciplineLevel());
            assertEquals(AccountStatus.SUSPENDED, account.getStatus());
        }
    }

    @Nested
    @DisplayName("B. Kiểm soát Đăng nhập Mật khẩu (Password Login) đối với Tài khoản BANNED và ACTIVE")
    class PasswordLoginBannedEnforcementTests {

        @Test
        @DisplayName("6. Đăng nhập với mật khẩu đúng khi status == BANNED: Cấp BAN_REVIEW token, không cấp token marketplace, không có refresh token")
        void login_bannedByStatus_ReturnsBanReviewToken() {
            String username = "banned_user";
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .username(username)
                    .passwordHash("hashed_pwd")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.NONE)
                    .bannedUntil(LocalDateTime.now().minusDays(10)) // Legacy expired timestamp
                    .isActive(false)
                    .build();

            when(accountRepository.findByUsername(username)).thenReturn(Optional.of(account));
            when(passwordEncoder.matches("Password123@", "hashed_pwd")).thenReturn(true);
            when(tokenService.createBanReviewToken(account)).thenReturn("mock-ban-review-token");

            LoginRequest req = new LoginRequest();
            req.setUsername(username);
            req.setPassword("Password123@");

            LoginResponse res = authenticationService.login(req);
            assertEquals("mock-ban-review-token", res.getToken());
            assertNull(res.getRefreshToken(), "Tài khoản BANNED tuyệt đối không được cấp refresh token");
            assertEquals("ROLE_BAN_REVIEW", res.getRole());
            assertEquals(DisciplineLevel.BANNED.name(), res.getDisciplineLevel());
            verify(accountRepository, never()).save(account); // Không được phép tự động gỡ ban
            verify(tokenService, never()).createToken(any()); // Không cấp marketplace token
            verify(tokenService, never()).refreshToken(any());
        }

        @Test
        @DisplayName("6b. Đăng nhập với mật khẩu SAI khi tài khoản BANNED: Không tiết lộ trạng thái BANNED")
        void login_bannedAccountWrongPassword_DoesNotRevealBanStatus() {
            String username = "banned_user";
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
            assertFalse(ex.getMessage().contains("khóa") || ex.getMessage().contains("cấm"), "Password sai không được tiết lộ trạng thái BANNED");
            verify(tokenService, never()).createToken(any());
            verify(tokenService, never()).createBanReviewToken(any());
        }

        @Test
        @DisplayName("7. Đăng nhập với mật khẩu đúng khi disciplineLevel == BANNED: Cấp BAN_REVIEW token, không cấp token marketplace")
        void login_bannedByLevel_ReturnsBanReviewToken() {
            String username = "banned_by_level";
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .username(username)
                    .passwordHash("hashed_pwd")
                    .status(AccountStatus.ACTIVE)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .isActive(true)
                    .build();

            when(accountRepository.findByUsername(username)).thenReturn(Optional.of(account));
            when(passwordEncoder.matches("Password123@", "hashed_pwd")).thenReturn(true);
            when(tokenService.createBanReviewToken(account)).thenReturn("mock-ban-review-token-level");

            LoginRequest req = new LoginRequest();
            req.setUsername(username);
            req.setPassword("Password123@");

            LoginResponse res = authenticationService.login(req);
            assertEquals("mock-ban-review-token-level", res.getToken());
            assertNull(res.getRefreshToken());
            assertEquals("ROLE_BAN_REVIEW", res.getRole());
            verify(tokenService, never()).createToken(any());
            verify(tokenService, never()).refreshToken(any());
        }

        @Test
        @DisplayName("8. Đăng nhập với bannedUntil == null (Permanent ban chuẩn): Cấp BAN_REVIEW token khi mật khẩu đúng")
        void login_bannedAccountWithNullBannedUntil_ReturnsBanReviewToken() {
            String username = "permanently_banned_user";
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .username(username)
                    .passwordHash("hashed_pwd")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .bannedUntil(null)
                    .suspendedUntil(null)
                    .isActive(false)
                    .build();

            when(accountRepository.findByUsername(username)).thenReturn(Optional.of(account));
            when(passwordEncoder.matches("Password123@", "hashed_pwd")).thenReturn(true);
            when(tokenService.createBanReviewToken(account)).thenReturn("mock-ban-review-token-null-until");

            LoginRequest req = new LoginRequest();
            req.setUsername(username);
            req.setPassword("Password123@");

            LoginResponse res = authenticationService.login(req);
            assertEquals("mock-ban-review-token-null-until", res.getToken());
            assertNull(res.getRefreshToken());
            assertEquals("ROLE_BAN_REVIEW", res.getRole());
            verify(accountRepository, never()).save(any());
            verify(tokenService, never()).createToken(any());
        }

        @Test
        @DisplayName("9. Tài khoản ACTIVE bình thường: Đăng nhập thành công và nhận đủ Access Token, Refresh Token")
        void login_activeUser_AllowedToLogin() {
            String username = "normal_active_user";
            Role role = Role.builder().roleName("CUSTOMER").build();
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .username(username)
                    .status(AccountStatus.ACTIVE)
                    .disciplineLevel(DisciplineLevel.NONE)
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
            req.setPassword("Password123@");

            LoginResponse response = authenticationService.login(req);

            assertNotNull(response);
            assertEquals("active-access-token", response.getToken());
            assertEquals("active-refresh-token", response.getRefreshToken());
            verify(tokenService).createToken(account);
            verify(tokenService).refreshToken(account);
        }

        @Test
        @DisplayName("10. Tài khoản SUSPENDED (5-6 vi phạm): Vẫn đăng nhập bình thường và nhận token")
        void login_suspendedUser_AllowedToLogin() {
            String username = "suspended_user";
            Role role = Role.builder().roleName("CUSTOMER").build();
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .username(username)
                    .status(AccountStatus.SUSPENDED)
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .suspendedUntil(LocalDateTime.now().plusDays(10))
                    .isActive(true)
                    .role(role)
                    .build();

            when(accountRepository.findByUsername(username)).thenReturn(Optional.of(account));
            Authentication auth = mock(Authentication.class);
            when(auth.getPrincipal()).thenReturn(account);
            when(authenticationManager.authenticate(any())).thenReturn(auth);
            when(tokenService.createToken(account)).thenReturn("mock-access-token");
            when(tokenService.refreshToken(account)).thenReturn("mock-refresh-token");
            when(accountRepository.findById(account.getId())).thenReturn(Optional.of(account));

            LoginRequest req = new LoginRequest();
            req.setUsername(username);
            req.setPassword("Password123@");

            LoginResponse response = authenticationService.login(req);

            assertNotNull(response);
            assertEquals("mock-access-token", response.getToken());
            assertEquals("mock-refresh-token", response.getRefreshToken());
        }

        @Test
        @DisplayName("11. Tài khoản INACTIVE: Bị từ chối đăng nhập bởi authenticationManager (DisabledException), không kích hoạt ngoài ý muốn")
        void login_inactiveUser_ThrowsDisabledException() {
            String username = "inactive_user";
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .username(username)
                    .status(AccountStatus.INACTIVE)
                    .disciplineLevel(DisciplineLevel.NONE)
                    .isActive(false)
                    .build();

            when(accountRepository.findByUsername(username)).thenReturn(Optional.of(account));
            when(authenticationManager.authenticate(any())).thenThrow(new DisabledException("Account is disabled"));

            LoginRequest req = new LoginRequest();
            req.setUsername(username);
            req.setPassword("Password123@");

            CustomException ex = assertThrows(CustomException.class, () -> authenticationService.login(req));
            assertTrue(ex.getMessage().contains("Tài khoản chưa được kích hoạt") || ex.getMessage().contains("vô hiệu hóa"));
            verify(accountRepository, never()).save(any());
            verify(tokenService, never()).createToken(any());
        }
    }

    @Nested
    @DisplayName("C. Kiểm soát Đăng nhập OAuth2 đối với Tài khoản BANNED, INACTIVE và SUSPENDED")
    class OAuth2LoginBannedEnforcementTests {

        @Test
        @DisplayName("12. OAuth2 Google: Tài khoản đã tồn tại bị BANNED -> Trả về BAN_REVIEW token, không cấp token marketplace")
        void oauth2_existingBannedAccount_Rejected() throws Exception {
            String email = "banned_oauth2@gmail.com";
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .email(email)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .isActive(false)
                    .build();

            when(accountRepository.findByEmail(email)).thenReturn(Optional.of(account));
            when(tokenService.createBanReviewToken(account)).thenReturn("mock-oauth2-ban-token");

            Method method = AuthenticationServiceImpl.class.getDeclaredMethod(
                    "processOAuth2User", String.class, String.class, String.class, String.class, AuthProvider.class);
            method.setAccessible(true);

            LoginResponse res = (LoginResponse) method.invoke(authenticationService, email, "Test User", "avatar.png", "google-sub-123", AuthProvider.GOOGLE);
            assertEquals("mock-oauth2-ban-token", res.getToken());
            assertNull(res.getRefreshToken());
            assertEquals("ROLE_BAN_REVIEW", res.getRole());
            verify(tokenService, never()).createToken(any());
            verify(tokenService, never()).refreshToken(any());
        }

        @Test
        @DisplayName("13. OAuth2: Tài khoản bị BANNED theo disciplineLevel (status!=BANNED) -> Trả về BAN_REVIEW token")
        void oauth2_existingBannedAccountByDisciplineLevelOnly_Rejected() throws Exception {
            String email = "banned_by_level@gmail.com";
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .email(email)
                    .status(AccountStatus.ACTIVE)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .isActive(true)
                    .build();

            when(accountRepository.findByEmail(email)).thenReturn(Optional.of(account));
            when(tokenService.createBanReviewToken(account)).thenReturn("mock-oauth2-ban-token-level");

            Method method = AuthenticationServiceImpl.class.getDeclaredMethod(
                    "processOAuth2User", String.class, String.class, String.class, String.class, AuthProvider.class);
            method.setAccessible(true);

            LoginResponse res = (LoginResponse) method.invoke(authenticationService, email, "Test User", "avatar.png", "google-sub-789", AuthProvider.GOOGLE);
            assertEquals("mock-oauth2-ban-token-level", res.getToken());
            assertNull(res.getRefreshToken());
            assertEquals("ROLE_BAN_REVIEW", res.getRole());
            verify(tokenService, never()).createToken(any());
        }

        @Test
        @DisplayName("14. OAuth2 Facebook: Tài khoản đã tồn tại bị BANNED -> Trả về BAN_REVIEW token")
        void oauth2_facebookBannedAccount_Rejected() throws Exception {
            String email = "facebook_banned@facebook.com";
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .email(email)
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .isActive(false)
                    .build();

            when(accountRepository.findByEmail(email)).thenReturn(Optional.of(account));
            when(tokenService.createBanReviewToken(account)).thenReturn("mock-fb-ban-token");

            Method method = AuthenticationServiceImpl.class.getDeclaredMethod(
                    "processOAuth2User", String.class, String.class, String.class, String.class, AuthProvider.class);
            method.setAccessible(true);

            LoginResponse res = (LoginResponse) method.invoke(authenticationService, email, "FB User", "avatar.png", "fb-sub-123", AuthProvider.FACEBOOK);
            assertEquals("mock-fb-ban-token", res.getToken());
            assertNull(res.getRefreshToken());
            assertEquals("ROLE_BAN_REVIEW", res.getRole());
            verify(tokenService, never()).createToken(any());
        }

        @Test
        @DisplayName("15. OAuth2: Tài khoản INACTIVE hoặc DELETED -> Bị từ chối và không bao giờ bị kích hoạt ngoài ý muốn")
        void oauth2_inactiveAndDeletedAccount_RejectedWithoutReactivation() throws Exception {
            String email = "inactive_oauth2@gmail.com";
            Account inactiveAccount = Account.builder()
                    .id(UUID.randomUUID())
                    .email(email)
                    .status(AccountStatus.INACTIVE)
                    .disciplineLevel(DisciplineLevel.NONE)
                    .isActive(false)
                    .build();

            when(accountRepository.findByEmail(email)).thenReturn(Optional.of(inactiveAccount));

            Method method = AuthenticationServiceImpl.class.getDeclaredMethod(
                    "processOAuth2User", String.class, String.class, String.class, String.class, AuthProvider.class);
            method.setAccessible(true);

            java.lang.reflect.InvocationTargetException ite = assertThrows(
                    java.lang.reflect.InvocationTargetException.class,
                    () -> method.invoke(authenticationService, email, "Inactive User", "avatar.png", "google-sub-000", AuthProvider.GOOGLE)
            );

            Throwable cause = ite.getCause();
            assertInstanceOf(CustomException.class, cause);
            assertTrue(cause.getMessage().contains("Tài khoản chưa được kích hoạt hoặc đã ngừng hoạt động"));
            verify(accountRepository, never()).save(any());
            verify(tokenService, never()).createToken(any());
        }

        @Test
        @DisplayName("16. OAuth2: Tài khoản đã tồn tại ở trạng thái SUSPENDED -> Đăng nhập thành công và cấp token")
        void oauth2_existingSuspendedAccount_Allowed() throws Exception {
            String email = "suspended_oauth2@gmail.com";
            Role role = Role.builder().roleName("CUSTOMER").build();
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .email(email)
                    .status(AccountStatus.SUSPENDED)
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .suspendedUntil(LocalDateTime.now().plusDays(10))
                    .isActive(true)
                    .role(role)
                    .build();

            when(accountRepository.findByEmail(email)).thenReturn(Optional.of(account));
            when(tokenService.createToken(account)).thenReturn("oauth2-access-token");
            when(tokenService.refreshToken(account)).thenReturn("oauth2-refresh-token");
            when(accountRepository.findById(account.getId())).thenReturn(Optional.of(account));

            Method method = AuthenticationServiceImpl.class.getDeclaredMethod(
                    "processOAuth2User", String.class, String.class, String.class, String.class, AuthProvider.class);
            method.setAccessible(true);

            LoginResponse response = (LoginResponse) method.invoke(
                    authenticationService, email, "Suspended User", "avatar.png", "google-sub-456", AuthProvider.GOOGLE);

            assertNotNull(response);
            assertEquals("oauth2-access-token", response.getToken());
            assertEquals("oauth2-refresh-token", response.getRefreshToken());
        }
    }

    @Nested
    @DisplayName("D. Kiểm soát Cấp mới Token qua Refresh Token đối với Tài khoản BANNED, INACTIVE và SUSPENDED")
    class RefreshTokenBannedEnforcementTests {

        @Test
        @DisplayName("17. Refresh token: Tài khoản BANNED (status == BANNED) -> Từ chối cấp mới access token")
        void refreshToken_bannedAccountByStatus_ThrowsCustomException() {
            String token = "valid-refresh-token";
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.NONE)
                    .isActive(false)
                    .build();

            when(tokenService.getAccountFromToken(token)).thenReturn(account);

            CustomException ex = assertThrows(CustomException.class, () -> authenticationService.refreshToken(token));
            assertTrue(ex.getMessage().contains("Tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm quy định cộng đồng"));
            verify(tokenService, never()).createToken(account);
        }

        @Test
        @DisplayName("18. Refresh token: Tài khoản BANNED (disciplineLevel == BANNED) -> Từ chối cấp mới access token")
        void refreshToken_bannedAccountByLevel_ThrowsCustomException() {
            String token = "valid-refresh-token";
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .status(AccountStatus.ACTIVE)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .isActive(true)
                    .build();

            when(tokenService.getAccountFromToken(token)).thenReturn(account);

            CustomException ex = assertThrows(CustomException.class, () -> authenticationService.refreshToken(token));
            assertTrue(ex.getMessage().contains("Tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm quy định cộng đồng"));
            verify(tokenService, never()).createToken(account);
        }

        @Test
        @DisplayName("19. Refresh token: Tài khoản INACTIVE -> Từ chối với thông báo ngừng hoạt động (phân biệt BANNED)")
        void refreshToken_inactiveAccount_ThrowsDistinctException() {
            String token = "valid-refresh-token";
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .status(AccountStatus.INACTIVE)
                    .disciplineLevel(DisciplineLevel.NONE)
                    .isActive(false)
                    .build();

            when(tokenService.getAccountFromToken(token)).thenReturn(account);

            CustomException ex = assertThrows(CustomException.class, () -> authenticationService.refreshToken(token));
            assertTrue(ex.getMessage().contains("Tài khoản chưa được kích hoạt hoặc đã ngừng hoạt động"));
            verify(tokenService, never()).createToken(any());
        }

        @Test
        @DisplayName("20. Refresh token: Tài khoản DELETED -> Từ chối với thông báo ngừng hoạt động (phân biệt BANNED)")
        void refreshToken_deletedAccount_ThrowsDistinctException() {
            String token = "valid-refresh-token-deleted";
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .status(AccountStatus.DELETED)
                    .disciplineLevel(DisciplineLevel.NONE)
                    .isActive(false)
                    .build();

            when(tokenService.getAccountFromToken(token)).thenReturn(account);

            CustomException ex = assertThrows(CustomException.class, () -> authenticationService.refreshToken(token));
            assertTrue(ex.getMessage().contains("Tài khoản chưa được kích hoạt hoặc đã ngừng hoạt động"));
            verify(tokenService, never()).createToken(any());
        }

        @Test
        @DisplayName("21. Refresh token: Tài khoản SUSPENDED -> Cấp mới access token thành công")
        void refreshToken_suspendedAccount_Allowed() {
            String token = "valid-refresh-token";
            Role role = Role.builder().roleName("CUSTOMER").build();
            Account account = Account.builder()
                    .id(UUID.randomUUID())
                    .email("suspended@gmail.com")
                    .status(AccountStatus.SUSPENDED)
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .suspendedUntil(LocalDateTime.now().plusDays(10))
                    .isActive(true)
                    .role(role)
                    .build();

            when(tokenService.getAccountFromToken(token)).thenReturn(account);
            when(tokenService.createToken(account)).thenReturn("new-access-token");
            when(tokenService.refreshToken(account)).thenReturn("new-refresh-token");
            when(accountRepository.findById(account.getId())).thenReturn(Optional.of(account));

            LoginResponse response = authenticationService.refreshToken(token);

            assertNotNull(response);
            assertEquals("new-access-token", response.getToken());
            assertEquals("new-refresh-token", response.getRefreshToken());
        }
    }

    @Nested
    @DisplayName("E. Vô hiệu hóa Tức thì Access Token đã cấp trước khi bị Ban trong JwtFilter")
    class JwtFilterImmediateBanRevocationTests {

        private final GlobalExceptionHandler globalExceptionHandler = new GlobalExceptionHandler();

        @Test
        @DisplayName("22. [CRITICAL SEQUENCE] Access token cấp lúc ACTIVE -> Bị BAN trong DB -> Gửi token cũ đến protected API -> Bị chặn 403, controller không chạy, SecurityContext null")
        void oldAccessToken_criticalSequence_activeIssuedThenBannedInDb_rejectedWith403OnProtectedApi() throws Exception {
            // Bước 1: Tài khoản ACTIVE ban đầu sở hữu Access Token hợp lệ, chưa hết hạn được cấp trước khi ban
            String oldToken = "valid-unexpired-pre-ban-token";
            UUID accountId = UUID.randomUUID();
            Role role = Role.builder().roleName("CUSTOMER").build();

            // Bước 2: Tài khoản bị kỷ luật trong Database chuyển thành BANNED mà KHÔNG sửa đổi hay cấp lại token cũ
            Account bannedInDbAccount = Account.builder()
                    .id(accountId)
                    .username("active_then_banned_user")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .isActive(false)
                    .bannedUntil(null)
                    .suspendedUntil(null)
                    .role(role)
                    .build();

            // Khi JwtFilter tra cứu token, tokenService lấy Account mới nhất từ Database
            when(tokenService.getAccountFromToken(oldToken)).thenReturn(bannedInDbAccount);

            // Bước 3: Gửi cùng token cũ đó đến Protected API qua JwtFilter pipeline
            when(httpServletRequest.getHeader("Authorization")).thenReturn("Bearer " + oldToken);
            when(httpServletRequest.getRequestURI()).thenReturn("/api/v1/orders/my-orders"); // Protected API

            jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);

            // Bước 4: Request bị từ chối theo chuẩn HTTP Error Convention của dự án (LockedException -> HTTP 403 Forbidden với ErrorResponse)
            ArgumentCaptor<Exception> exceptionCaptor = ArgumentCaptor.forClass(Exception.class);
            verify(resolver).resolveException(
                    eq(httpServletRequest),
                    eq(httpServletResponse),
                    isNull(),
                    exceptionCaptor.capture()
            );

            Exception capturedException = exceptionCaptor.getValue();
            assertInstanceOf(LockedException.class, capturedException);
            assertTrue(capturedException.getMessage().contains("Tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm quy định cộng đồng"));

            // Kiểm chứng khớp chuẩn định dạng lỗi từ GlobalExceptionHandler
            ResponseEntity<ErrorResponse> errorResponse = globalExceptionHandler.handleAccountStatusException(capturedException, httpServletRequest);
            assertEquals(HttpStatus.FORBIDDEN, errorResponse.getStatusCode(), "Mã HTTP trả về phải là 403 Forbidden");
            assertNotNull(errorResponse.getBody());
            assertEquals(403, errorResponse.getBody().status());
            assertEquals("Forbidden", errorResponse.getBody().error());
            assertEquals("/api/v1/orders/my-orders", errorResponse.getBody().path());
            assertTrue(errorResponse.getBody().message().contains("Tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm quy định cộng đồng"));

            // Bước 5: Controller hoặc nghiệp vụ được bảo vệ TUYỆT ĐỐI KHÔNG ĐƯỢC THỰC THI (filterChain không được gọi tiếp)
            verify(filterChain, never()).doFilter(any(), any());

            // Bước 6: SecurityContextHolder KHÔNG bị lưu authentication cho request bị từ chối
            assertNull(SecurityContextHolder.getContext().getAuthentication(), "Security Context phải rỗng (clearContext), không được xác thực");
        }

        @Test
        @DisplayName("23. Token cũ bị từ chối khi status == BANNED ngay cả khi disciplineLevel != BANNED")
        void oldAccessToken_rejectedWhenStatusBannedEvenIfDisciplineLevelNotBanned() throws Exception {
            String token = "old-token-status-banned";
            Role role = Role.builder().roleName("CUSTOMER").build();

            Account statusBannedAccount = Account.builder()
                    .id(UUID.randomUUID())
                    .username("status_banned_user")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.NONE) // disciplineLevel chưa đồng bộ
                    .isActive(false)
                    .role(role)
                    .build();

            when(httpServletRequest.getHeader("Authorization")).thenReturn("Bearer " + token);
            when(httpServletRequest.getRequestURI()).thenReturn("/api/v1/cart"); // Protected
            when(tokenService.getAccountFromToken(token)).thenReturn(statusBannedAccount);

            jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);

            verify(filterChain, never()).doFilter(any(), any());
            assertNull(SecurityContextHolder.getContext().getAuthentication());
            verify(resolver).resolveException(
                    eq(httpServletRequest),
                    eq(httpServletResponse),
                    isNull(),
                    argThat(ex -> ex instanceof LockedException
                            && ex.getMessage().contains("Tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm quy định cộng đồng"))
            );
        }

        @Test
        @DisplayName("24. Token cũ bị từ chối khi disciplineLevel == BANNED ngay cả khi status != BANNED")
        void oldAccessToken_rejectedWhenDisciplineLevelBannedEvenIfStatusNotBanned() throws Exception {
            String token = "old-token-level-banned";
            Role role = Role.builder().roleName("CUSTOMER").build();

            Account levelBannedAccount = Account.builder()
                    .id(UUID.randomUUID())
                    .username("level_banned_user")
                    .status(AccountStatus.ACTIVE) // status chưa đồng bộ
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .isActive(true)
                    .role(role)
                    .build();

            when(httpServletRequest.getHeader("Authorization")).thenReturn("Bearer " + token);
            when(httpServletRequest.getRequestURI()).thenReturn("/api/v1/wallet/balance"); // Protected
            when(tokenService.getAccountFromToken(token)).thenReturn(levelBannedAccount);

            jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);

            verify(filterChain, never()).doFilter(any(), any());
            assertNull(SecurityContextHolder.getContext().getAuthentication());
            verify(resolver).resolveException(
                    eq(httpServletRequest),
                    eq(httpServletResponse),
                    isNull(),
                    argThat(ex -> ex instanceof LockedException
                            && ex.getMessage().contains("Tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm quy định cộng đồng"))
            );
        }

        @Test
        @DisplayName("25. Token của tài khoản ACTIVE bình thường: Vẫn hoạt động hoàn hảo và xác thực thành công")
        void token_activeAccount_passesThroughFilterAndAuthenticates() throws Exception {
            String token = "active-user-valid-token";
            UUID accountId = UUID.randomUUID();
            Role role = Role.builder().roleName("CUSTOMER").build();

            Account activeAccount = Account.builder()
                    .id(accountId)
                    .username("normal_customer")
                    .status(AccountStatus.ACTIVE)
                    .disciplineLevel(DisciplineLevel.NONE)
                    .isActive(true)
                    .role(role)
                    .build();

            when(httpServletRequest.getHeader("Authorization")).thenReturn("Bearer " + token);
            when(httpServletRequest.getRequestURI()).thenReturn("/api/v1/orders"); // Protected
            when(tokenService.getAccountFromToken(token)).thenReturn(activeAccount);

            jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);

            // FilterChain phải được tiếp tục gọi
            verify(filterChain).doFilter(httpServletRequest, httpServletResponse);
            // SecurityContext phải được thiết lập đúng thông tin
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            assertNotNull(auth, "Tài khoản ACTIVE phải được xác thực trong SecurityContext");
            assertInstanceOf(CurrentUserInfo.class, auth.getPrincipal());
            CurrentUserInfo userInfo = (CurrentUserInfo) auth.getPrincipal();
            assertEquals(accountId, userInfo.getAccountId());
            assertEquals("normal_customer", userInfo.getUsername());
            assertEquals("CUSTOMER", userInfo.getRole());
            // Resolver không bao giờ được gọi
            verify(resolver, never()).resolveException(any(), any(), any(), any());
        }

        @Test
        @DisplayName("26. Token của tài khoản SUSPENDED: Cho phép tiếp tục và cài đặt SecurityContext (không bị chặn chỉ vì suspended)")
        void token_suspendedAccount_allowedThroughFilter() throws Exception {
            String token = "suspended-user-token";
            Role role = Role.builder().roleName("CUSTOMER").build();

            Account suspendedAccount = Account.builder()
                    .id(UUID.randomUUID())
                    .username("suspended_user")
                    .status(AccountStatus.SUSPENDED)
                    .disciplineLevel(DisciplineLevel.SUSPENDED)
                    .suspendedUntil(LocalDateTime.now().plusDays(10))
                    .isActive(true)
                    .role(role)
                    .build();

            when(httpServletRequest.getHeader("Authorization")).thenReturn("Bearer " + token);
            when(httpServletRequest.getRequestURI()).thenReturn("/api/v1/orders"); // Protected
            when(tokenService.getAccountFromToken(token)).thenReturn(suspendedAccount);

            jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);

            verify(filterChain).doFilter(httpServletRequest, httpServletResponse);
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            assertNotNull(auth, "Tài khoản SUSPENDED phải được thiết lập Authentication trong SecurityContext");
            assertInstanceOf(CurrentUserInfo.class, auth.getPrincipal());
            CurrentUserInfo userInfo = (CurrentUserInfo) auth.getPrincipal();
            assertEquals(suspendedAccount.getId(), userInfo.getAccountId());
            assertEquals("CUSTOMER", userInfo.getRole());
        }

        @Test
        @DisplayName("27. Token của tài khoản INACTIVE: Bị chặn với DisabledException (phân biệt rạch ròi với BANNED)")
        void token_inactiveAccount_rejectedWithDisabledException() throws Exception {
            String token = "inactive-user-token";
            Role role = Role.builder().roleName("CUSTOMER").build();

            Account inactiveAccount = Account.builder()
                    .id(UUID.randomUUID())
                    .username("inactive_user")
                    .status(AccountStatus.INACTIVE)
                    .disciplineLevel(DisciplineLevel.NONE)
                    .isActive(false)
                    .role(role)
                    .build();

            when(httpServletRequest.getHeader("Authorization")).thenReturn("Bearer " + token);
            when(httpServletRequest.getRequestURI()).thenReturn("/api/v1/profile"); // Protected
            when(tokenService.getAccountFromToken(token)).thenReturn(inactiveAccount);

            jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);

            verify(filterChain, never()).doFilter(any(), any());
            assertNull(SecurityContextHolder.getContext().getAuthentication());
            verify(resolver).resolveException(
                    eq(httpServletRequest),
                    eq(httpServletResponse),
                    isNull(),
                    argThat(ex -> ex instanceof DisabledException
                            && ex.getMessage().contains("Tài khoản chưa được kích hoạt hoặc đã ngừng hoạt động"))
            );
        }

        @Test
        @DisplayName("28. Token của tài khoản DELETED: Bị chặn với DisabledException (phân biệt rạch ròi với BANNED)")
        void token_deletedAccount_rejectedWithDisabledException() throws Exception {
            String token = "deleted-user-token";
            Role role = Role.builder().roleName("CUSTOMER").build();

            Account deletedAccount = Account.builder()
                    .id(UUID.randomUUID())
                    .username("deleted_user")
                    .status(AccountStatus.DELETED)
                    .disciplineLevel(DisciplineLevel.NONE)
                    .isActive(false)
                    .role(role)
                    .build();

            when(httpServletRequest.getHeader("Authorization")).thenReturn("Bearer " + token);
            when(httpServletRequest.getRequestURI()).thenReturn("/api/v1/profile"); // Protected
            when(tokenService.getAccountFromToken(token)).thenReturn(deletedAccount);

            jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);

            verify(filterChain, never()).doFilter(any(), any());
            assertNull(SecurityContextHolder.getContext().getAuthentication());
            verify(resolver).resolveException(
                    eq(httpServletRequest),
                    eq(httpServletResponse),
                    isNull(),
                    argThat(ex -> ex instanceof DisabledException
                            && ex.getMessage().contains("Tài khoản chưa được kích hoạt hoặc đã ngừng hoạt động"))
            );
        }

        @Test
        @DisplayName("29. Endpoint Public: Token của tài khoản BANNED vẫn cho phép đi qua filterChain để xem tài nguyên công khai")
        void token_bannedAccountOnPublicApi_passesThroughWithoutAuth() throws Exception {
            String token = "banned-token-public-req";
            Role role = Role.builder().roleName("CUSTOMER").build();

            Account bannedAccount = Account.builder()
                    .id(UUID.randomUUID())
                    .username("banned_viewer")
                    .status(AccountStatus.BANNED)
                    .disciplineLevel(DisciplineLevel.BANNED)
                    .isActive(false)
                    .role(role)
                    .build();

            when(httpServletRequest.getHeader("Authorization")).thenReturn("Bearer " + token);
            when(httpServletRequest.getRequestURI()).thenReturn("/api/v1/product/sample-product-id"); // Public API
            when(tokenService.getAccountFromToken(token)).thenReturn(bannedAccount);

            jwtFilter.doFilter(httpServletRequest, httpServletResponse, filterChain);

            // filterChain vẫn được gọi để trả về tài nguyên công khai
            verify(filterChain).doFilter(httpServletRequest, httpServletResponse);
            // Nhưng resolver không ném ngoại lệ và SecurityContextHolder không có authentication
            verify(resolver, never()).resolveException(any(), any(), any(), any());
            assertNull(SecurityContextHolder.getContext().getAuthentication());
        }
    }
}
