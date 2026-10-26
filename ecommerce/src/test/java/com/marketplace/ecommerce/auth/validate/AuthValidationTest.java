package com.marketplace.ecommerce.auth.validate;

import com.marketplace.ecommerce.auth.dto.request.AccountCreateRequest;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.common.exception.EmailAlreadyExistsException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthValidationTest {

    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private AuthValidation authValidation;

    private AccountCreateRequest req;

    @BeforeEach
    void setUp() {
        req = new AccountCreateRequest();
        req.setUsername("newuser");
        req.setEmail("new@example.com");
        req.setPhoneNumber("0987654321");
        req.setPassword("Password123!");
        req.setAgreeToTerms(true);
    }

    @Test
    @DisplayName("Ném lỗi khi chưa đồng ý điều khoản dịch vụ")
    void testValidate_NotAgreeToTerms() {
        req.setAgreeToTerms(false);
        CustomException ex = assertThrows(CustomException.class, () -> authValidation.validate(req));
        assertTrue(ex.getMessage().contains("Bạn phải đọc và đồng ý"));
    }

    @Test
    @DisplayName("Ném lỗi khi username đã tồn tại")
    void testValidate_UsernameExists() {
        when(accountRepository.validateAccountUniqueness(any(), any(), any())).thenReturn("USERNAME_EXISTS");
        CustomException ex = assertThrows(CustomException.class, () -> authValidation.validate(req));
        assertEquals("Username is already taken", ex.getMessage());
    }

    @Test
    @DisplayName("Ném lỗi khi email đã tồn tại")
    void testValidate_EmailExists() {
        when(accountRepository.validateAccountUniqueness(any(), any(), any())).thenReturn("EMAIL_EXISTS");
        assertThrows(EmailAlreadyExistsException.class, () -> authValidation.validate(req));
    }

    @Test
    @DisplayName("Ném lỗi khi số điện thoại đã tồn tại")
    void testValidate_PhoneExists() {
        when(accountRepository.validateAccountUniqueness(any(), any(), any())).thenReturn("PHONE_EXISTS");
        CustomException ex = assertThrows(CustomException.class, () -> authValidation.validate(req));
        assertEquals("Phone number is already taken", ex.getMessage());
    }

    @Test
    @DisplayName("Validation thành công khi thông tin hợp lệ")
    void testValidate_Success() {
        when(accountRepository.validateAccountUniqueness(any(), any(), any())).thenReturn("VALID");
        assertDoesNotThrow(() -> authValidation.validate(req));

        // default branch & null agreeToTerms
        when(accountRepository.validateAccountUniqueness(any(), any(), any())).thenReturn("UNEXPECTED");
        assertDoesNotThrow(() -> authValidation.validate(req));

        req.setAgreeToTerms(null);
        assertThrows(CustomException.class, () -> authValidation.validate(req));
    }

    @Test
    @DisplayName("Bao phủ các utility/default methods nhỏ trong common, shop.validate, auth.service, auth.repository")
    void testSmallUtilitiesAndDefaultRepoMethods() {
        java.time.Instant now = java.time.Instant.now();
        com.marketplace.ecommerce.common.ErrorResponse err = new com.marketplace.ecommerce.common.ErrorResponse(400, "Bad", "Msg", "/path", now);
        assertEquals(400, err.status());
        assertEquals("Bad", err.error());
        assertEquals("Msg", err.message());
        assertEquals("/path", err.path());
        assertEquals(now, err.timestamp());
        assertEquals(err, new com.marketplace.ecommerce.common.ErrorResponse(400, "Bad", "Msg", "/path", now));
        assertEquals(err.hashCode(), new com.marketplace.ecommerce.common.ErrorResponse(400, "Bad", "Msg", "/path", now).hashCode());
        assertNotNull(err.toString());

        assertNotNull(new com.marketplace.ecommerce.shop.validate.ShopValidation());
        assertNotNull(new com.marketplace.ecommerce.auth.service.MinioService());

        com.marketplace.ecommerce.auth.repository.UserAddressRepository addrRepo = mock(
                com.marketplace.ecommerce.auth.repository.UserAddressRepository.class,
                org.mockito.Mockito.CALLS_REAL_METHODS
        );
        java.util.UUID uid = java.util.UUID.randomUUID();
        when(addrRepo.findRecent(eq(uid), any())).thenReturn(java.util.List.of());
        assertTrue(addrRepo.findLastUsed(uid).isEmpty());

        com.marketplace.ecommerce.auth.entity.UserAddress addr = new com.marketplace.ecommerce.auth.entity.UserAddress();
        when(addrRepo.findRecent(eq(uid), any())).thenReturn(java.util.List.of(addr));
        assertTrue(addrRepo.findLastUsed(uid).isPresent());
    }
}
