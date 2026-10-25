package com.marketplace.ecommerce.auth.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.Role;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TokenServiceImplTest {

    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private TokenServiceImpl tokenService;

    private static final String SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private Account sampleAccount;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(tokenService, "SECRET_KEY", SECRET);

        Role role = new Role();
        role.setRoleName("CUSTOMER");

        sampleAccount = Account.builder()
                .id(UUID.randomUUID())
                .username("testuser")
                .email("test@example.com")
                .role(role)
                .accountVerified(true)
                .status(AccountStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("createToken tạo JWT hợp lệ và getAccountFromToken giải mã đúng")
    void testCreateTokenAndGetAccount() {
        String token = tokenService.createToken(sampleAccount);
        assertNotNull(token);
        assertFalse(token.isBlank());

        when(accountRepository.findByUsername("testuser")).thenReturn(Optional.of(sampleAccount));

        Account extracted = tokenService.getAccountFromToken(token);
        assertNotNull(extracted);
        assertEquals("testuser", extracted.getUsername());
        verify(accountRepository).findByUsername("testuser");
    }

    @Test
    @DisplayName("getAccountFromToken ném ngoại lệ khi không tìm thấy tài khoản trong DB")
    void testGetAccountFromToken_NotFound() {
        String token = tokenService.createToken(sampleAccount);
        when(accountRepository.findByUsername("testuser")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> tokenService.getAccountFromToken(token));
    }

    @Test
    @DisplayName("refreshToken tạo token hợp lệ có claim type=REFRESH")
    void testRefreshToken() {
        String refreshToken = tokenService.refreshToken(sampleAccount);
        assertNotNull(refreshToken);
        assertFalse(refreshToken.isBlank());
    }

    @Test
    @DisplayName("createAppealToken tạo token phạm vi APPEAL_ONLY và getAccountFromAppealToken thành công")
    void testAppealToken_Success() {
        String appealToken = tokenService.createAppealToken(sampleAccount);
        assertNotNull(appealToken);

        when(accountRepository.findByUsername("testuser")).thenReturn(Optional.of(sampleAccount));

        Account extracted = tokenService.getAccountFromAppealToken(appealToken);
        assertNotNull(extracted);
        assertEquals("testuser", extracted.getUsername());
    }

    @Test
    @DisplayName("getAccountFromAppealToken ném ngoại lệ nếu dùng token thường (sai scope)")
    void testGetAccountFromAppealToken_InvalidScope() {
        String normalToken = tokenService.createToken(sampleAccount);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> tokenService.getAccountFromAppealToken(normalToken));
        assertEquals("Invalid token scope", ex.getMessage());
    }
}
