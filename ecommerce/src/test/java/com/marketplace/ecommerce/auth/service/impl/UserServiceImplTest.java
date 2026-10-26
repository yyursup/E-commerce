package com.marketplace.ecommerce.auth.service.impl;

import com.marketplace.ecommerce.auth.dto.request.ChangePasswordRequest;
import com.marketplace.ecommerce.auth.dto.request.UpdateUserProfileRequest;
import com.marketplace.ecommerce.auth.dto.response.UserProfileResponse;
import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.Role;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.valueObjects.GenderType;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.file.service.FileService;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileService fileService;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ShopRepository shopRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private UUID accountId;
    private User sampleUser;
    private Shop sampleShop;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        sampleUser = new User();
        sampleUser.setId(UUID.randomUUID());
        sampleUser.setFullName("Nguyen Van B");
        sampleUser.setPhoneNumber("0912345678");

        Account account = new Account();
        account.setId(accountId);
        account.setEmail("test@gmail.com");
        account.setAccountVerified(true);
        Role role = new Role();
        role.setRoleName("ROLE_USER");
        account.setRole(role);
        sampleUser.setAccount(account);

        sampleShop = new Shop();
        sampleShop.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("getUserProfile trả về thông tin profile kèm shopId nếu có")
    void testGetUserProfile_WithShop() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));

        UserProfileResponse res = userService.getUserProfile(accountId);
        assertNotNull(res);
        assertEquals("Nguyen Van B", res.getFullName());
        assertEquals(sampleShop.getId(), res.getShopId());
    }

    @Test
    @DisplayName("updateProfile cập nhật họ tên, số điện thoại, ngày sinh và tải avatar")
    void testUpdateProfile_WithAvatar() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        MockMultipartFile avatar = new MockMultipartFile("avatarFile", "avatar.png", "image/png", "fake".getBytes());
        when(fileService.uploadFile(eq(avatar), eq("avatars"))).thenReturn("avatar.png");
        when(fileService.getFileUrl("avatar.png")).thenReturn("http://localhost:9000/ecommerce/avatar.png");

        UpdateUserProfileRequest req = new UpdateUserProfileRequest();
        req.setFullName("Nguyen Van Updated");
        req.setPhoneNumber("0988888888");
        req.setGender(GenderType.MALE);
        req.setDateOfBirth(LocalDate.of(1995, 5, 20));
        req.setAvatarFile(avatar);

        UserProfileResponse res = userService.updateProfile(accountId, req);
        assertNotNull(res);
        assertEquals("Nguyen Van Updated", res.getFullName());
        assertEquals("http://localhost:9000/ecommerce/avatar.png", res.getAvatarUrl());
    }

    @Test
    @DisplayName("changePassword thành công khi mật khẩu cũ chính xác")
    void testChangePassword_Success() {
        Account account = new Account();
        account.setId(accountId);
        account.setPasswordHash("encoded_old_pw");

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("old_pw", "encoded_old_pw")).thenReturn(true);
        when(passwordEncoder.encode("new_pw")).thenReturn("encoded_new_pw");

        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setOldPassword("old_pw");
        req.setNewPassword("new_pw");

        userService.changePassword(accountId, req);

        assertEquals("encoded_new_pw", account.getPasswordHash());
        verify(accountRepository).save(account);
    }

    @Test
    @DisplayName("changePassword ném lỗi nếu mật khẩu cũ không khớp")
    void testChangePassword_WrongOldPassword() {
        Account account = new Account();
        account.setId(accountId);
        account.setPasswordHash("encoded_old_pw");

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("wrong_pw", "encoded_old_pw")).thenReturn(false);

        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setOldPassword("wrong_pw");
        req.setNewPassword("new_pw");

        CustomException ex = assertThrows(CustomException.class, () -> userService.changePassword(accountId, req));
        assertEquals("Mật khẩu cũ không chính xác.", ex.getMessage());
    }
}
