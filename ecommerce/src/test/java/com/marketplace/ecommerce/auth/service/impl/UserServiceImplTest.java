package com.marketplace.ecommerce.auth.service.impl;

import com.marketplace.ecommerce.auth.dto.request.ChangePasswordRequest;
import com.marketplace.ecommerce.auth.dto.request.UpdateUserProfileRequest;
import com.marketplace.ecommerce.auth.dto.response.UserProfileResponse;
import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.Role;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.auth.valueObjects.GenderType;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.file.service.FileService;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Tests toàn diện cho UserServiceImpl - Phủ tối đa Line & Branch Coverage")
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
    private Account sampleAccount;
    private Shop sampleShop;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();

        sampleAccount = new Account();
        sampleAccount.setId(accountId);
        sampleAccount.setEmail("test@gmail.com");
        sampleAccount.setAccountVerified(true);
        sampleAccount.setViolationCount(0);
        sampleAccount.setDisciplineLevel(DisciplineLevel.NONE);
        Role role = new Role();
        role.setRoleName("ROLE_USER");
        sampleAccount.setRole(role);

        sampleUser = new User();
        sampleUser.setId(UUID.randomUUID());
        sampleUser.setFullName("Nguyen Van B");
        sampleUser.setPhoneNumber("0912345678");
        sampleUser.setAccount(sampleAccount);

        sampleShop = new Shop();
        sampleShop.setId(UUID.randomUUID());
    }

    @Nested
    @DisplayName("Tests cho getUserProfile & reconcileAccountDecay")
    class GetUserProfileTests {

        @Test
        @DisplayName("Ném CustomException khi không tìm thấy User theo accountId")
        void getUserProfile_UserNotFound_ThrowsException() {
            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());

            CustomException ex = assertThrows(CustomException.class, () -> userService.getUserProfile(accountId));
            assertEquals("User not found", ex.getMessage());
        }

        @Test
        @DisplayName("Lấy profile thành công khi User có Shop liên kết")
        void getUserProfile_WithShop_Success() {
            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
            when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));

            UserProfileResponse res = userService.getUserProfile(accountId);

            assertNotNull(res);
            assertEquals("Nguyen Van B", res.getFullName());
            assertEquals(sampleShop.getId(), res.getShopId());
            verify(shopRepository).findByUserId(sampleUser.getId());
        }

        @Test
        @DisplayName("Lấy profile thành công khi User không có Shop (shopId là null)")
        void getUserProfile_WithoutShop_Success() {
            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
            when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());

            UserProfileResponse res = userService.getUserProfile(accountId);

            assertNotNull(res);
            assertNull(res.getShopId());
        }

        @Test
        @DisplayName("User không có Account liên kết: Bỏ qua reconcileAccountDecay")
        void getUserProfile_NullAccount_SkipsDecay() {
            sampleUser.setAccount(null);
            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
            when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());

            UserProfileResponse res = userService.getUserProfile(accountId);

            assertNotNull(res);
            verify(accountRepository, never()).save(any());
        }

        @Test
        @DisplayName("Account có violationCount <= 0: Bỏ qua decay")
        void getUserProfile_ViolationCountZero_SkipsDecay() {
            sampleAccount.setViolationCount(0);
            sampleAccount.setLastViolationAt(LocalDateTime.now().minusDays(60));
            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
            when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());

            UserProfileResponse res = userService.getUserProfile(accountId);

            assertNotNull(res);
            verify(accountRepository, never()).save(any());
        }

        @Test
        @DisplayName("Account có lastViolationAt là null: Bỏ qua decay")
        void getUserProfile_NullLastViolationAt_SkipsDecay() {
            sampleAccount.setViolationCount(3);
            sampleAccount.setLastViolationAt(null);
            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
            when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());

            UserProfileResponse res = userService.getUserProfile(accountId);

            assertNotNull(res);
            verify(accountRepository, never()).save(any());
        }

        @Test
        @DisplayName("Chưa đủ 30 ngày (decayCycles == 0): Không trừ gậy vi phạm")
        void getUserProfile_LessThan30Days_NoDecay() {
            sampleAccount.setViolationCount(3);
            sampleAccount.setLastViolationAt(LocalDateTime.now().minusDays(15));
            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
            when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());

            UserProfileResponse res = userService.getUserProfile(accountId);

            assertNotNull(res);
            assertEquals(3, sampleAccount.getViolationCount());
            verify(accountRepository, never()).save(any());
        }

        @Test
        @DisplayName("Đủ 60 ngày (2 chu kỳ decay): newCount < 3 và WARNED -> chuyển về NONE")
        void getUserProfile_DecayCyclesToNone_Success() {
            sampleAccount.setViolationCount(4);
            sampleAccount.setDisciplineLevel(DisciplineLevel.WARNED);
            sampleAccount.setLastViolationAt(LocalDateTime.now().minusDays(65)); // 2 chu kỳ -> 4 - 2 = 2
            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
            when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());

            UserProfileResponse res = userService.getUserProfile(accountId);

            assertNotNull(res);
            assertEquals(2, sampleAccount.getViolationCount());
            assertEquals(DisciplineLevel.NONE, sampleAccount.getDisciplineLevel());
            verify(accountRepository).save(sampleAccount);
        }

        @Test
        @DisplayName("Đủ 30 ngày (1 chu kỳ decay): newCount < 5 và SUSPENDED -> chuyển về WARNED")
        void getUserProfile_DecayCyclesToWarned_Success() {
            sampleAccount.setViolationCount(5);
            sampleAccount.setDisciplineLevel(DisciplineLevel.SUSPENDED);
            sampleAccount.setLastViolationAt(LocalDateTime.now().minusDays(35)); // 1 chu kỳ -> 5 - 1 = 4
            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
            when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());

            UserProfileResponse res = userService.getUserProfile(accountId);

            assertNotNull(res);
            assertEquals(4, sampleAccount.getViolationCount());
            assertEquals(DisciplineLevel.WARNED, sampleAccount.getDisciplineLevel());
            verify(accountRepository).save(sampleAccount);
        }

        @Test
        @DisplayName("Đủ 30 ngày nhưng newCount >= 5: Giữ nguyên mức kỷ luật")
        void getUserProfile_DecayCyclesHighViolation_LevelUnchanged() {
            sampleAccount.setViolationCount(7);
            sampleAccount.setDisciplineLevel(DisciplineLevel.SUSPENDED);
            sampleAccount.setLastViolationAt(LocalDateTime.now().minusDays(32)); // 1 chu kỳ -> 7 - 1 = 6
            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
            when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());

            UserProfileResponse res = userService.getUserProfile(accountId);

            assertNotNull(res);
            assertEquals(6, sampleAccount.getViolationCount());
            assertEquals(DisciplineLevel.SUSPENDED, sampleAccount.getDisciplineLevel());
            verify(accountRepository).save(sampleAccount);
        }
    }

    @Nested
    @DisplayName("Tests cho updateProfile")
    class UpdateProfileTests {

        @Test
        @DisplayName("Ném CustomException khi không tìm thấy User theo accountId")
        void updateProfile_UserNotFound_ThrowsException() {
            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());

            UpdateUserProfileRequest req = new UpdateUserProfileRequest();
            CustomException ex = assertThrows(CustomException.class, () -> userService.updateProfile(accountId, req));
            assertEquals("User not found", ex.getMessage());
        }

        @Test
        @DisplayName("Cập nhật đầy đủ họ tên, số điện thoại, giới tính, ngày sinh và avatar")
        void updateProfile_AllFieldsProvided_Success() {
            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));

            MockMultipartFile avatar = new MockMultipartFile("avatarFile", "avatar.png", "image/png", "fake-bytes".getBytes());
            when(fileService.uploadFile(eq(avatar), eq("avatars"))).thenReturn("avatar.png");
            when(fileService.getFileUrl("avatar.png")).thenReturn("http://localhost:9000/ecommerce/avatar.png");

            UpdateUserProfileRequest req = new UpdateUserProfileRequest();
            req.setFullName("  Nguyen Van Updated  ");
            req.setPhoneNumber("  0988888888  ");
            req.setGender(GenderType.MALE);
            req.setDateOfBirth(LocalDate.of(1995, 5, 20));
            req.setAvatarFile(avatar);

            UserProfileResponse res = userService.updateProfile(accountId, req);

            assertNotNull(res);
            assertEquals("Nguyen Van Updated", sampleUser.getFullName());
            assertEquals("0988888888", sampleUser.getPhoneNumber());
            assertEquals(GenderType.MALE, sampleUser.getGender());
            assertEquals(LocalDate.of(1995, 5, 20), sampleUser.getDateOfBirth());
            assertEquals("http://localhost:9000/ecommerce/avatar.png", sampleUser.getAvatarUrl());
            assertEquals(sampleShop.getId(), res.getShopId());
            verify(fileService).uploadFile(avatar, "avatars");
        }

        @Test
        @DisplayName("Các trường null hoặc rỗng/trắng: Giữ nguyên dữ liệu cũ và bỏ qua upload avatar")
        void updateProfile_BlankAndNullFields_RetainsOldValues() {
            sampleUser.setFullName("Nguyen Van B");
            sampleUser.setPhoneNumber("0912345678");
            sampleUser.setGender(GenderType.FEMALE);
            sampleUser.setDateOfBirth(LocalDate.of(1990, 1, 1));
            sampleUser.setAvatarUrl("http://old-avatar.png");

            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());

            // Avatar file rỗng (0 bytes)
            MockMultipartFile emptyAvatar = new MockMultipartFile("avatarFile", "", "image/png", new byte[0]);

            UpdateUserProfileRequest req = new UpdateUserProfileRequest();
            req.setFullName("   "); // Trắng
            req.setPhoneNumber("");  // Rỗng
            req.setGender(null);
            req.setDateOfBirth(null);
            req.setAvatarFile(emptyAvatar);

            UserProfileResponse res = userService.updateProfile(accountId, req);

            assertNotNull(res);
            assertEquals("Nguyen Van B", sampleUser.getFullName());
            assertEquals("0912345678", sampleUser.getPhoneNumber());
            assertEquals(GenderType.FEMALE, sampleUser.getGender());
            assertEquals(LocalDate.of(1990, 1, 1), sampleUser.getDateOfBirth());
            assertEquals("http://old-avatar.png", sampleUser.getAvatarUrl());
            verify(fileService, never()).uploadFile(any(), any());
        }

        @Test
        @DisplayName("AvatarFile là null: Không gọi uploadFile")
        void updateProfile_NullAvatarFile_NoUpload() {
            when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());

            UpdateUserProfileRequest req = new UpdateUserProfileRequest();
            req.setAvatarFile(null);

            UserProfileResponse res = userService.updateProfile(accountId, req);

            assertNotNull(res);
            verify(fileService, never()).uploadFile(any(), any());
        }
    }

    @Nested
    @DisplayName("Tests cho changePassword")
    class ChangePasswordTests {

        @Test
        @DisplayName("Ném CustomException khi không tìm thấy Account")
        void changePassword_AccountNotFound_ThrowsException() {
            when(accountRepository.findById(accountId)).thenReturn(Optional.empty());

            ChangePasswordRequest req = new ChangePasswordRequest();
            req.setOldPassword("old_pw");
            req.setNewPassword("new_pw");

            CustomException ex = assertThrows(CustomException.class, () -> userService.changePassword(accountId, req));
            assertEquals("Account not found", ex.getMessage());
        }

        @Test
        @DisplayName("Ném CustomException khi mật khẩu cũ không khớp")
        void changePassword_WrongOldPassword_ThrowsException() {
            sampleAccount.setPasswordHash("hash_old");
            when(accountRepository.findById(accountId)).thenReturn(Optional.of(sampleAccount));
            when(passwordEncoder.matches("wrong_old", "hash_old")).thenReturn(false);

            ChangePasswordRequest req = new ChangePasswordRequest();
            req.setOldPassword("wrong_old");
            req.setNewPassword("new_pw");

            CustomException ex = assertThrows(CustomException.class, () -> userService.changePassword(accountId, req));
            assertEquals("Mật khẩu cũ không chính xác.", ex.getMessage());
            verify(accountRepository, never()).save(any());
        }

        @Test
        @DisplayName("Đổi mật khẩu thành công khi mật khẩu cũ khớp")
        void changePassword_Success() {
            sampleAccount.setPasswordHash("hash_old");
            when(accountRepository.findById(accountId)).thenReturn(Optional.of(sampleAccount));
            when(passwordEncoder.matches("correct_old", "hash_old")).thenReturn(true);
            when(passwordEncoder.encode("brand_new_pw")).thenReturn("hash_brand_new");

            ChangePasswordRequest req = new ChangePasswordRequest();
            req.setOldPassword("correct_old");
            req.setNewPassword("brand_new_pw");

            userService.changePassword(accountId, req);

            assertEquals("hash_brand_new", sampleAccount.getPasswordHash());
            verify(accountRepository).save(sampleAccount);
        }
    }
}

