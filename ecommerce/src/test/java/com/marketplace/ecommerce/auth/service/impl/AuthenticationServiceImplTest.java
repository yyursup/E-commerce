package com.marketplace.ecommerce.auth.service.impl;

import com.marketplace.ecommerce.auth.dto.request.AccountCreateRequest;
import com.marketplace.ecommerce.auth.dto.request.LoginRequest;
import com.marketplace.ecommerce.auth.dto.request.VerifyRequest;
import com.marketplace.ecommerce.auth.dto.response.AccountCreateResponse;
import com.marketplace.ecommerce.auth.dto.response.LoginResponse;
import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.Role;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.RoleRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.service.EmailService;
import com.marketplace.ecommerce.auth.service.TokenService;
import com.marketplace.ecommerce.auth.validate.AuthValidation;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.common.exception.AccountLockedException;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.common.exception.InvalidCredentialsException;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.test.util.ReflectionTestUtils;
import com.marketplace.ecommerce.auth.valueObjects.AuthProvider;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.marketplace.ecommerce.auth.dto.request.OAuth2Request;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import org.springframework.security.authentication.AccountStatusException;
import java.util.Map;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthenticationServiceImplTest {

    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AccountRepository accountRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TokenService tokenService;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private AuthValidation validation;
    @Mock
    private EmailService emailService;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private CartRepository cartRepository;
    @Mock
    private WalletRepository walletRepository;
    @Mock
    private ShopRepository shopRepository;
    @Mock
    private RequestRepository requestRepository;

    @InjectMocks
    private AuthenticationServiceImpl authenticationService;

    private Role customerRole;
    private Role adminRole;
    private Account sampleAccount;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        customerRole = new Role();
        customerRole.setRoleName("CUSTOMER");

        adminRole = new Role();
        adminRole.setRoleName("ADMIN");

        sampleAccount = Account.builder()
                .id(UUID.randomUUID())
                .username("cuongtest")
                .email("cuong@example.com")
                .phoneNumber("0987654321")
                .passwordHash("hashed_pw")
                .role(customerRole)
                .status(AccountStatus.ACTIVE)
                .isActive(true)
                .accountVerified(true)
                .disciplineLevel(DisciplineLevel.NONE)
                .build();

        sampleUser = User.builder()
                .id(UUID.randomUUID())
                .email(sampleAccount.getEmail())
                .phoneNumber(sampleAccount.getPhoneNumber())
                .account(sampleAccount)
                .build();
    }

    @Test
    @DisplayName("register tạo tài khoản INACTIVE và gửi OTP qua email")
    void testRegister_Success() {
        AccountCreateRequest req = new AccountCreateRequest();
        req.setUsername("newuser");
        req.setEmail("new@example.com");
        req.setPassword("Password123!");
        req.setPhoneNumber("0911223344");
        req.setAgreeToTerms(true);

        when(emailService.generateOTP()).thenReturn("123456");
        when(roleRepository.findByRoleName("CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode(req.getPassword())).thenReturn("encoded_pass");
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> {
            Account acc = inv.getArgument(0);
            acc.setId(UUID.randomUUID());
            return acc;
        });

        AccountCreateResponse res = authenticationService.register(req);
        assertNotNull(res);
        assertEquals("newuser", res.getUsername());
        verify(validation).validate(req);
        verify(emailService).sendOtpForVerifyAccount(any(), eq("123456"));
    }

    @Test
    @DisplayName("verifyAccount kích hoạt tài khoản, tạo User, Wallet và Cart")
    void testVerifyAccount_Success() {
        VerifyRequest req = new VerifyRequest();
        req.setEmail("cuong@example.com");
        req.setOtp("123456");

        when(emailService.verifyOtp(req.getEmail(), req.getOtp())).thenReturn(true);
        sampleAccount.setStatus(AccountStatus.INACTIVE);
        when(accountRepository.findByEmail(req.getEmail())).thenReturn(Optional.of(sampleAccount));
        when(accountRepository.save(sampleAccount)).thenReturn(sampleAccount);
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        AccountCreateResponse res = authenticationService.verifyAccount(req);
        assertNotNull(res);
        assertEquals(AccountStatus.ACTIVE, sampleAccount.getStatus());
        verify(walletRepository).save(any());
        verify(cartRepository).save(any());
        verify(emailService).clearOtp(req.getEmail());
    }

    @Test
    @DisplayName("verifyAccount ném lỗi khi OTP không hợp lệ")
    void testVerifyAccount_InvalidOtp() {
        VerifyRequest req = new VerifyRequest();
        req.setEmail("cuong@example.com");
        req.setOtp("000000");

        when(emailService.verifyOtp(req.getEmail(), req.getOtp())).thenReturn(false);

        CustomException ex = assertThrows(CustomException.class, () -> authenticationService.verifyAccount(req));
        assertTrue(ex.getMessage().contains("OTP is not valid"));
    }

    @Test
    @DisplayName("login thành công cho CUSTOMER và chặn ADMIN truy cập Buyer Portal")
    void testLogin_SuccessAndPortalCheck() {
        LoginRequest req = new LoginRequest();
        req.setUsername("cuongtest");
        req.setPassword("password");
        req.setClientType("CUSTOMER");

        when(accountRepository.findByUsername(req.getUsername())).thenReturn(Optional.of(sampleAccount));
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(sampleAccount, null, sampleAccount.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(authToken);

        when(tokenService.createToken(sampleAccount)).thenReturn("jwt_access_token");
        when(tokenService.refreshToken(sampleAccount)).thenReturn("jwt_refresh_token");

        LoginResponse res = authenticationService.login(req);
        assertNotNull(res);
        assertEquals("jwt_access_token", res.getToken());
        assertEquals("jwt_refresh_token", res.getRefreshToken());
        assertEquals("CUSTOMER", res.getRole());

        // Test chặn ADMIN truy cập cổng CUSTOMER
        sampleAccount.setRole(adminRole);
        CustomException adminEx = assertThrows(CustomException.class, () -> authenticationService.login(req));
        assertTrue(adminEx.getMessage().contains("Cổng Quản Trị"));
    }

    @Test
    @DisplayName("login ném InvalidCredentialsException khi sai mật khẩu")
    void testLogin_BadCredentials() {
        LoginRequest req = new LoginRequest();
        req.setUsername("cuongtest");
        req.setPassword("wrong");

        when(accountRepository.findByUsername(req.getUsername())).thenReturn(Optional.of(sampleAccount));
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad creds"));

        assertThrows(InvalidCredentialsException.class, () -> authenticationService.login(req));
    }

    @Test
    @DisplayName("login ném AccountLockedException kèm appealToken khi tài khoản bị khóa có thời hạn")
    void testLogin_LockedAccountWithAppealToken() {
        LoginRequest req = new LoginRequest();
        req.setUsername("cuongtest");
        req.setPassword("password");

        sampleAccount.setStatus(AccountStatus.BANNED);
        sampleAccount.setDisciplineLevel(DisciplineLevel.BANNED);
        sampleAccount.setBannedUntil(LocalDateTime.now().plusDays(3));

        when(accountRepository.findByUsername(req.getUsername())).thenReturn(Optional.of(sampleAccount));
        when(authenticationManager.authenticate(any())).thenThrow(new LockedException("Locked"));
        when(tokenService.createAppealToken(sampleAccount)).thenReturn("appeal_token_xyz");

        AccountLockedException ex = assertThrows(AccountLockedException.class, () -> authenticationService.login(req));
        assertEquals("appeal_token_xyz", ex.getAppealToken());
        assertTrue(ex.getMessage().contains("Tài khoản của bạn đã bị khóa"));
    }

    @Test
    @DisplayName("forgotPasswordSendOtp và forgotPasswordReset hoạt động chuẩn")
    void testForgotPasswordFlow() {
        when(accountRepository.findByEmail("cuong@example.com")).thenReturn(Optional.of(sampleAccount));
        when(emailService.generateOTP()).thenReturn("999111");

        authenticationService.forgotPasswordSendOtp("cuong@example.com");
        verify(emailService).sendOtpForForgotPassword(any(), eq("999111"));

        when(emailService.verifyOtp("cuong@example.com", "999111")).thenReturn(true);
        when(passwordEncoder.encode("new_pass")).thenReturn("hashed_new_pass");

        authenticationService.forgotPasswordReset("cuong@example.com", "999111", "new_pass");
        assertEquals("hashed_new_pass", sampleAccount.getPasswordHash());
        verify(accountRepository).save(sampleAccount);
    }

    @Test
    @DisplayName("getMyProfile và getAllUsers trả về đúng dữ liệu")
    void testGetMyProfileAndAllUsers() {
        when(accountRepository.findById(sampleAccount.getId())).thenReturn(Optional.of(sampleAccount));
        LoginResponse profile = authenticationService.getMyProfile(sampleAccount.getId());
        assertNotNull(profile);
        assertEquals("cuongtest", profile.getUsername());

        when(userRepository.findAll()).thenReturn(List.of(sampleUser));
        List<LoginResponse> all = authenticationService.getAllUsers();
        assertEquals(1, all.size());
    }

    @Test
    @DisplayName("login tự động gỡ ban khi thời hạn bannedUntil đã qua")
    void testLogin_AutoUnban() {
        sampleAccount.setStatus(AccountStatus.BANNED);
        sampleAccount.setDisciplineLevel(DisciplineLevel.BANNED);
        sampleAccount.setBannedUntil(LocalDateTime.now().minusDays(1)); // Quá hạn

        when(accountRepository.findByUsername("cuongtest")).thenReturn(Optional.of(sampleAccount));
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(sampleAccount, null, sampleAccount.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(authToken);

        LoginRequest req = new LoginRequest();
        req.setUsername("cuongtest");
        req.setPassword("pass");

        LoginResponse res = authenticationService.login(req);
        assertNotNull(res);
        assertEquals(AccountStatus.ACTIVE, sampleAccount.getStatus());
        assertNull(sampleAccount.getBannedUntil());
        verify(accountRepository).save(sampleAccount);
    }

    @Test
    @DisplayName("login kiểm tra các điều kiện clientType (ADMIN, BUSINESS, SELLER, CUSTOMER)")
    void testLogin_ClientType_Restrictions() {
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(sampleAccount, null, sampleAccount.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(authToken);
        when(accountRepository.findByUsername("cuongtest")).thenReturn(Optional.of(sampleAccount));

        // 1. ClientType = ADMIN nhưng user là CUSTOMER -> lỗi
        LoginRequest req1 = new LoginRequest();
        req1.setUsername("cuongtest");
        req1.setPassword("pass");
        req1.setClientType("ADMIN");
        CustomException ex1 = assertThrows(CustomException.class, () -> authenticationService.login(req1));
        assertTrue(ex1.getMessage().contains("không có đặc quyền Quản trị viên"));

        // 2. ClientType = BUSINESS/SELLER nhưng user là ADMIN -> lỗi
        sampleAccount.setRole(adminRole);
        LoginRequest req2 = new LoginRequest();
        req2.setUsername("cuongtest");
        req2.setPassword("pass");
        req2.setClientType("SELLER");
        CustomException ex2 = assertThrows(CustomException.class, () -> authenticationService.login(req2));
        assertTrue(ex2.getMessage().contains("Cổng Quản Trị"));
    }

    @Test
    @DisplayName("login xử lý tài khoản bị ban vĩnh viễn")
    void testLogin_PermanentBan() {
        LoginRequest req = new LoginRequest();
        req.setUsername("cuongtest");
        req.setPassword("pass");

        sampleAccount.setStatus(AccountStatus.BANNED);
        sampleAccount.setDisciplineLevel(DisciplineLevel.BANNED);
        sampleAccount.setBannedUntil(null);
        when(accountRepository.findByUsername("cuongtest")).thenReturn(Optional.of(sampleAccount));
        when(authenticationManager.authenticate(any())).thenThrow(new LockedException("Locked"));

        CustomException ex1 = assertThrows(CustomException.class, () -> authenticationService.login(req));
        assertTrue(ex1.getMessage().contains("khóa vĩnh viễn"));
    }

    @Test
    @DisplayName("login xử lý tài khoản inactive bị DisabledException")
    void testLogin_DisabledAccount() {
        LoginRequest req = new LoginRequest();
        req.setUsername("cuongtest");
        req.setPassword("pass");

        sampleAccount.setStatus(AccountStatus.INACTIVE);
        when(accountRepository.findByUsername("cuongtest")).thenReturn(Optional.of(sampleAccount));
        when(authenticationManager.authenticate(any())).thenThrow(new DisabledException("Disabled"));

        CustomException ex2 = assertThrows(CustomException.class, () -> authenticationService.login(req));
        assertTrue(ex2.getMessage().contains("chưa được kích hoạt"));
    }

    @Test
    @DisplayName("refreshToken cấp lại JWT mới hoặc ném lỗi khi token không hợp lệ")
    void testRefreshToken_Flows() {
        // Token null / blank
        assertThrows(InvalidCredentialsException.class, () -> authenticationService.refreshToken("   "));

        // Token hợp lệ
        when(tokenService.getAccountFromToken("valid_refresh")).thenReturn(sampleAccount);
        when(tokenService.createToken(sampleAccount)).thenReturn("new_access_token");
        when(tokenService.refreshToken(sampleAccount)).thenReturn("new_refresh_token");

        LoginResponse res = authenticationService.refreshToken("valid_refresh");
        assertNotNull(res);
        assertEquals("new_access_token", res.getToken());

        // Token trỏ tới account bị BANNED hoặc không active
        sampleAccount.setStatus(AccountStatus.BANNED);
        assertThrows(CustomException.class, () -> authenticationService.refreshToken("valid_refresh"));

        // TokenService ném lỗi
        when(tokenService.getAccountFromToken("corrupt_token")).thenThrow(new RuntimeException("Bad JWT"));
        assertThrows(InvalidCredentialsException.class, () -> authenticationService.refreshToken("corrupt_token"));
    }

    @Test
    @DisplayName("populateShopAndSellerStatus các trường hợp có Shop hoặc đơn đăng ký Seller")
    void testPopulateShopAndSellerStatus() {
        UUID accId = sampleAccount.getId();
        when(accountRepository.findById(accId)).thenReturn(Optional.of(sampleAccount));

        // Trường hợp chưa có shop, có đơn đăng ký SELLER_REGISTRATION PENDING
        when(userRepository.findByAccountId(accId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());

        com.marketplace.ecommerce.request.entity.Request regReq = com.marketplace.ecommerce.request.entity.Request.builder()
                .id(UUID.randomUUID())
                .status(com.marketplace.ecommerce.request.valueObjects.RequestStatus.PENDING)
                .build();
        when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(eq(accId), any()))
                .thenReturn(List.of(regReq));

        LoginResponse res = authenticationService.getMyProfile(accId);
        assertNotNull(res);
        assertFalse(res.getHasShop());
        assertEquals("PENDING", res.getSellerStatus());

        // Trường hợp có Shop ACTIVE
        Shop shop = Shop.builder()
                .id(UUID.randomUUID())
                .name("Cửa Hàng Xanh")
                .status(com.marketplace.ecommerce.shop.valueObjects.ShopStatus.ACTIVE)
                .build();
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(shop));

        LoginResponse res2 = authenticationService.getMyProfile(accId);
        assertTrue(res2.getHasShop());
        assertEquals("Cửa Hàng Xanh", res2.getShopName());
        assertEquals("APPROVED", res2.getSellerStatus());
    }

    @Test
    @DisplayName("forgotPassword và verifyAccount các trường hợp lỗi email không tìm thấy")
    void testEmailNotFoundErrors() {
        when(accountRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

        assertThrows(CustomException.class, () -> authenticationService.forgotPasswordSendOtp("notfound@example.com"));

        VerifyRequest vReq = new VerifyRequest();
        vReq.setEmail("notfound@example.com");
        vReq.setOtp("123456");
        when(emailService.verifyOtp("notfound@example.com", "123456")).thenReturn(true);
        assertThrows(CustomException.class, () -> authenticationService.verifyAccount(vReq));
    }

    @Test
    @DisplayName("OAuth2 login Google và Facebook ném CustomException khi token sai")
    void testOAuth2_Errors() {
        com.marketplace.ecommerce.auth.dto.request.OAuth2Request req = new com.marketplace.ecommerce.auth.dto.request.OAuth2Request();
        req.setToken("invalid_oauth_token");

        assertThrows(CustomException.class, () -> authenticationService.oauth2LoginGoogle(req));
        assertThrows(CustomException.class, () -> authenticationService.oauth2LoginFacebook(req));
    }

    
    @Test
    @DisplayName("processOAuth2User: Tạo mới tài khoản, ví, giỏ hàng khi người dùng lần đầu đăng nhập Google/Facebook")
    void testProcessOAuth2User_NewUser() {
        String email = "oauth_new@gmail.com";
        when(accountRepository.findByEmail(email)).thenReturn(Optional.empty());
        when(roleRepository.findByRoleName("CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_random_pwd");
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(tokenService.createToken(any())).thenReturn("oauth_jwt_token");
        when(tokenService.refreshToken(any())).thenReturn("oauth_refresh_token");

        LoginResponse res = ReflectionTestUtils.invokeMethod(
                authenticationService,
                "processOAuth2User",
                email,
                "OAuth User",
                "https://avatar.com/img.jpg",
                "google-sub-999",
                AuthProvider.GOOGLE
        );

        assertNotNull(res);
        assertEquals(email, res.getEmail());
        assertEquals("oauth_jwt_token", res.getToken());
        verify(walletRepository).save(any());
        verify(cartRepository).save(any());
        verify(accountRepository).save(any(Account.class));
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("processOAuth2User: Liên kết tài khoản LOCAL sang OAuth2 thành công")
    void testProcessOAuth2User_LinkExistingLocalAccount() {
        String email = "local_user@gmail.com";
        Account localAcc = Account.builder()
                .id(UUID.randomUUID())
                .email(email)
                .authProvider(AuthProvider.LOCAL)
                .role(customerRole)
                .status(AccountStatus.ACTIVE)
                .build();

        when(accountRepository.findByEmail(email)).thenReturn(Optional.of(localAcc));
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));
        when(tokenService.createToken(any())).thenReturn("oauth_jwt_token");
        when(tokenService.refreshToken(any())).thenReturn("oauth_refresh_token");

        LoginResponse res = ReflectionTestUtils.invokeMethod(
                authenticationService,
                "processOAuth2User",
                email,
                "Local User",
                null,
                "fb-id-888",
                AuthProvider.FACEBOOK
        );

        assertNotNull(res);
        assertEquals(AuthProvider.FACEBOOK, localAcc.getAuthProvider());
        assertEquals("fb-id-888", localAcc.getProviderId());
        assertTrue(localAcc.getAccountVerified());
        verify(accountRepository).save(localAcc);
    }

    @Test
    @DisplayName("createMailBody: Gửi email OTP xác thực tài khoản")
    void testCreateMailBody() {
        authenticationService.createMailBody(sampleAccount, "123456");
        verify(emailService).sendOtpForVerifyAccount(any(), eq("123456"));
    }

    @Test
    @DisplayName("forgotPasswordReset: Lỗi OTP không hợp lệ")
    void testForgotPasswordReset_InvalidOtp() {
        when(emailService.verifyOtp("test@example.com", "wrong_otp")).thenReturn(false);

        CustomException ex = assertThrows(CustomException.class,
                () -> authenticationService.forgotPasswordReset("test@example.com", "wrong_otp", "NewPass123"));
        assertTrue(ex.getMessage().contains("OTP"));
    }

    @Test
    @DisplayName("register: Lỗi trùng username hoặc email khi validation ném ngoại lệ")
    void testRegister_DuplicateErrors() {
        AccountCreateRequest req1 = new AccountCreateRequest();
        req1.setUsername("testuser");
        doThrow(new CustomException("Username is already taken")).when(validation).validate(req1);
        assertThrows(CustomException.class, () -> authenticationService.register(req1));

        AccountCreateRequest req2 = new AccountCreateRequest();
        req2.setUsername("newuser");
        doThrow(new CustomException("Email is already taken")).when(validation).validate(req2);
        assertThrows(CustomException.class, () -> authenticationService.register(req2));
    }

    @Test
    @DisplayName("oauth2LoginGoogle: Thành công và các nhánh lỗi token")
    void testOauth2LoginGoogle_AllBranches() {
        ReflectionTestUtils.setField(authenticationService, "googleClientId", "google-client-id-123");
        OAuth2Request req = new OAuth2Request();
        req.setToken("google-token");

        Map<String, Object> tokenInfo = Map.of("aud", "google-client-id-123");
        Map<String, Object> userInfo = Map.of(
                "email", "google_test@gmail.com",
                "name", "Google Tester",
                "picture", "http://google.com/avatar.jpg",
                "sub", "google-sub-456"
        );

        when(roleRepository.findByRoleName("CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(accountRepository.findByEmail("google_test@gmail.com")).thenReturn(Optional.empty());
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(tokenService.createToken(any())).thenReturn("google_jwt_token");
        when(tokenService.refreshToken(any())).thenReturn("google_refresh_token");

        // 1. Success
        try (org.mockito.MockedConstruction<org.springframework.web.client.RestTemplate> mocked = mockConstruction(
                org.springframework.web.client.RestTemplate.class,
                (mock, context) -> {
                    when(mock.getForObject(contains("tokeninfo"), eq(Map.class))).thenReturn(tokenInfo);
                    when(mock.getForObject(contains("userinfo"), eq(Map.class))).thenReturn(userInfo);
                })) {

            LoginResponse resp = authenticationService.oauth2LoginGoogle(req);
            assertNotNull(resp);
            assertEquals("google_test@gmail.com", resp.getEmail());
        }

        // 2. tokenInfo null or no aud
        try (org.mockito.MockedConstruction<org.springframework.web.client.RestTemplate> mocked = mockConstruction(
                org.springframework.web.client.RestTemplate.class,
                (mock, context) -> {
                    when(mock.getForObject(contains("tokeninfo"), eq(Map.class))).thenReturn(Map.of());
                })) {
            assertThrows(CustomException.class, () -> authenticationService.oauth2LoginGoogle(req));
        }

        // 3. googleClientId mismatch
        try (org.mockito.MockedConstruction<org.springframework.web.client.RestTemplate> mocked = mockConstruction(
                org.springframework.web.client.RestTemplate.class,
                (mock, context) -> {
                    when(mock.getForObject(contains("tokeninfo"), eq(Map.class))).thenReturn(Map.of("aud", "wrong-aud"));
                })) {
            assertThrows(CustomException.class, () -> authenticationService.oauth2LoginGoogle(req));
        }

        // 4. userInfo null or no email
        try (org.mockito.MockedConstruction<org.springframework.web.client.RestTemplate> mocked = mockConstruction(
                org.springframework.web.client.RestTemplate.class,
                (mock, context) -> {
                    when(mock.getForObject(contains("tokeninfo"), eq(Map.class))).thenReturn(tokenInfo);
                    when(mock.getForObject(contains("userinfo"), eq(Map.class))).thenReturn(Map.of());
                })) {
            assertThrows(CustomException.class, () -> authenticationService.oauth2LoginGoogle(req));
        }
    }

    @Test
    @DisplayName("oauth2LoginFacebook: Thành công và các nhánh lỗi token")
    void testOauth2LoginFacebook_AllBranches() {
        ReflectionTestUtils.setField(authenticationService, "facebookClientId", "fb-client-id-123");
        ReflectionTestUtils.setField(authenticationService, "facebookClientSecret", "fb-secret-456");
        OAuth2Request req = new OAuth2Request();
        req.setToken("fb-token");

        Map<String, Object> debugInfo = Map.of(
                "data", Map.of("is_valid", true, "app_id", "fb-client-id-123")
        );
        Map<String, Object> userInfo = Map.of(
                "email", "fb_test@gmail.com",
                "name", "Facebook Tester",
                "id", "fb-id-789",
                "picture", Map.of("data", Map.of("url", "http://fb.com/pic.jpg"))
        );

        when(roleRepository.findByRoleName("CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(accountRepository.findByEmail("fb_test@gmail.com")).thenReturn(Optional.empty());
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(tokenService.createToken(any())).thenReturn("fb_jwt_token");
        when(tokenService.refreshToken(any())).thenReturn("fb_refresh_token");

        // 1. Success
        try (org.mockito.MockedConstruction<org.springframework.web.client.RestTemplate> mocked = mockConstruction(
                org.springframework.web.client.RestTemplate.class,
                (mock, context) -> {
                    when(mock.getForObject(contains("debug_token"), eq(Map.class))).thenReturn(debugInfo);
                    when(mock.getForObject(contains("graph.facebook.com/me"), eq(Map.class))).thenReturn(userInfo);
                })) {

            LoginResponse resp = authenticationService.oauth2LoginFacebook(req);
            assertNotNull(resp);
            assertEquals("fb_test@gmail.com", resp.getEmail());
        }

        // 2. debugInfo invalid or app_id mismatch
        try (org.mockito.MockedConstruction<org.springframework.web.client.RestTemplate> mocked = mockConstruction(
                org.springframework.web.client.RestTemplate.class,
                (mock, context) -> {
                    when(mock.getForObject(contains("debug_token"), eq(Map.class))).thenReturn(
                            Map.of("data", Map.of("is_valid", false, "app_id", "fb-client-id-123"))
                    );
                })) {
            assertThrows(CustomException.class, () -> authenticationService.oauth2LoginFacebook(req));
        }

        // 3. userInfo null or no email
        try (org.mockito.MockedConstruction<org.springframework.web.client.RestTemplate> mocked = mockConstruction(
                org.springframework.web.client.RestTemplate.class,
                (mock, context) -> {
                    when(mock.getForObject(contains("debug_token"), eq(Map.class))).thenReturn(debugInfo);
                    when(mock.getForObject(contains("graph.facebook.com/me"), eq(Map.class))).thenReturn(Map.of());
                })) {
            assertThrows(CustomException.class, () -> authenticationService.oauth2LoginFacebook(req));
        }
    }

    @Test
    @DisplayName("login: Kiểm tra clientType và các trường hợp ngoại lệ tài khoản bị khóa")
    void testLogin_ClientTypeValidationAndExceptions() {
        LoginRequest req = new LoginRequest();
        req.setUsername("admin_user");
        req.setPassword("Password123@");

        Role adminRole = Role.builder().id(UUID.randomUUID()).roleName("ADMIN").build();
        Account adminAcc = Account.builder()
                .id(UUID.randomUUID())
                .username("admin_user")
                .role(adminRole)
                .status(AccountStatus.ACTIVE)
                .build();

        UsernamePasswordAuthenticationToken authAdmin = new UsernamePasswordAuthenticationToken(adminAcc, null, List.of());
        when(authenticationManager.authenticate(any())).thenReturn(authAdmin);

        // 1. clientType CUSTOMER blocking ADMIN
        req.setClientType("CUSTOMER");
        assertThrows(CustomException.class, () -> authenticationService.login(req));

        // 2. clientType BUSINESS blocking ADMIN
        req.setClientType("BUSINESS");
        assertThrows(CustomException.class, () -> authenticationService.login(req));

        // 3. clientType ADMIN blocking non-admin
        Account custAcc = Account.builder()
                .id(UUID.randomUUID())
                .username("cust_user")
                .role(customerRole)
                .status(AccountStatus.ACTIVE)
                .build();
        UsernamePasswordAuthenticationToken authCust = new UsernamePasswordAuthenticationToken(custAcc, null, List.of());
        when(authenticationManager.authenticate(any())).thenReturn(authCust);
        req.setClientType("ADMIN");
        assertThrows(CustomException.class, () -> authenticationService.login(req));

        // 4. LockedException when account banned permanently (bannedUntil is null)
        Account permBanned = Account.builder()
                .id(UUID.randomUUID())
                .username("banned")
                .status(AccountStatus.BANNED)
                .bannedUntil(null)
                .build();
        when(accountRepository.findByUsername("banned")).thenReturn(Optional.of(permBanned));
        doThrow(new LockedException("Locked")).when(authenticationManager).authenticate(any());
        req.setUsername("banned");
        req.setClientType(null);
        CustomException exPerm = assertThrows(CustomException.class, () -> authenticationService.login(req));
        assertTrue(exPerm.getMessage().contains("vĩnh viễn"));

        // 5. LockedException when account is null
        when(accountRepository.findByUsername("unknown")).thenReturn(Optional.empty());
        req.setUsername("unknown");
        CustomException exLockGen = assertThrows(CustomException.class, () -> authenticationService.login(req));
        assertTrue(exLockGen.getMessage().contains("liên hệ quản trị viên"));

        // 6. DisabledException when account is null
        doThrow(new DisabledException("Disabled")).when(authenticationManager).authenticate(any());
        CustomException exDis = assertThrows(CustomException.class, () -> authenticationService.login(req));
        assertTrue(exDis.getMessage().contains("vô hiệu hóa"));

        // 7. AccountStatusException
        doThrow(new org.springframework.security.authentication.CredentialsExpiredException("Expired")).when(authenticationManager).authenticate(any());
        assertThrows(CustomException.class, () -> authenticationService.login(req));
    }

    @Test
    @DisplayName("getMyProfile: Lỗi không tìm thấy tài khoản và vai trò mặc định")
    void testGetMyProfile_Branches() {
        UUID unknownId = UUID.randomUUID();
        when(accountRepository.findById(unknownId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> authenticationService.getMyProfile(unknownId));

        // account with null role defaults to CUSTOMER
        UUID validId = UUID.randomUUID();
        Account noRoleAcc = Account.builder().id(validId).username("norole").email("norole@test.com").role(null).build();
        when(accountRepository.findById(validId)).thenReturn(Optional.of(noRoleAcc));
        when(userRepository.findByAccountId(validId)).thenReturn(Optional.empty());
        when(tokenService.createToken(any())).thenReturn("token_123");

        LoginResponse resp = authenticationService.getMyProfile(validId);
        assertNotNull(resp);
        assertEquals("CUSTOMER", resp.getRole());
    }

    @Test
    @DisplayName("populateShopAndSellerStatus: Các trạng thái PENDING, REJECTED, APPROVED của đơn đăng ký bán hàng")
    void testPopulateShopAndSellerStatus_RegistrationStates() {
        UUID accId = UUID.randomUUID();
        when(userRepository.findByAccountId(accId)).thenReturn(Optional.empty());

        // 1. PENDING
        Request reqPending = Request.builder().status(RequestStatus.PENDING).build();
        when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accId, RequestType.SELLER_REGISTRATION))
                .thenReturn(List.of(reqPending));
        LoginResponse resp1 = LoginResponse.builder().build();
        ReflectionTestUtils.invokeMethod(authenticationService, "populateShopAndSellerStatus", resp1, accId);
        assertEquals("PENDING", resp1.getSellerStatus());

        // 2. REJECTED
        Request reqRejected = Request.builder().status(RequestStatus.REJECTED).build();
        when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accId, RequestType.SELLER_REGISTRATION))
                .thenReturn(List.of(reqRejected));
        LoginResponse resp2 = LoginResponse.builder().build();
        ReflectionTestUtils.invokeMethod(authenticationService, "populateShopAndSellerStatus", resp2, accId);
        assertEquals("REJECTED", resp2.getSellerStatus());

        // 3. APPROVED
        Request reqApproved = Request.builder().status(RequestStatus.APPROVED).build();
        when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accId, RequestType.SELLER_REGISTRATION))
                .thenReturn(List.of(reqApproved));
        LoginResponse resp3 = LoginResponse.builder().build();
        ReflectionTestUtils.invokeMethod(authenticationService, "populateShopAndSellerStatus", resp3, accId);
        assertEquals("APPROVED", resp3.getSellerStatus());
    }

}
