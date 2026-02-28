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
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
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

    @InjectMocks
    private AuthenticationServiceImpl authenticationService;

    private Account account;
    private Role role;

    @BeforeEach
    void setUp() {
        role = new Role();
        role.setRoleName("CUSTOMER");

        account = new Account();
        account.setEmail("test@example.com");
        account.setUsername("testuser");
        account.setRole(role);
        account.setStatus(AccountStatus.INACTIVE);
    }

    @Test
    void verifyAccount_Success() {
        VerifyRequest request = new VerifyRequest();
        request.setEmail("test@example.com");
        request.setOtp("123456");

        when(emailService.verifyOtp(anyString(), anyString())).thenReturn(true);
        when(accountRepository.findByEmail(anyString())).thenReturn(Optional.of(account));
        when(accountRepository.save(any(Account.class))).thenReturn(account);
        when(userRepository.save(any(User.class))).thenReturn(new User());

        AccountCreateResponse response = authenticationService.verifyAccount(request);

        assertNotNull(response);
        assertEquals(AccountStatus.ACTIVE, account.getStatus());
        verify(emailService).clearOtp(anyString());
    }

    @Test
    void verifyAccount_InvalidOtp_ThrowsException() {
        VerifyRequest request = new VerifyRequest();
        when(emailService.verifyOtp(any(), any())).thenReturn(false);

        assertThrows(CustomException.class, () -> authenticationService.verifyAccount(request));
    }

    @Test
    void register_Success() {
        AccountCreateRequest request = new AccountCreateRequest();
        request.setUsername("newuser");
        request.setEmail("new@example.com");
        request.setPassword("password");

        when(emailService.generateOTP()).thenReturn("123456");
        when(roleRepository.findByRoleName("CUSTOMER")).thenReturn(Optional.of(role));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(accountRepository.save(any(Account.class))).thenReturn(account);

        AccountCreateResponse response = authenticationService.register(request);

        assertNotNull(response);
        verify(validation).validate(request);
        verify(accountRepository).save(any(Account.class));
    }

    @Test
    void login_Success() {
        LoginRequest request = new LoginRequest();
        request.setUsername("user");
        request.setPassword("pass");

        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(account);
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(tokenService.createToken(any())).thenReturn("token123");

        LoginResponse response = authenticationService.login(request);

        assertNotNull(response);
        assertEquals("token123", response.getToken());
    }

    @Test
    void login_Failure_ThrowsException() {
        LoginRequest request = new LoginRequest();
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException(""));

        assertThrows(BadCredentialsException.class, () -> authenticationService.login(request));
    }
}
