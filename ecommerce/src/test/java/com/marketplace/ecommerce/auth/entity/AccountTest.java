package com.marketplace.ecommerce.auth.entity;

import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Unit Tests kiểm tra bất biến thực thể Account và Permanent Ban")
class AccountTest {

    @Test
    @DisplayName("1. Account BANNED với bannedUntil == null: Bị khóa vĩnh viễn và không kích hoạt")
    void bannedAccount_withNullBannedUntil_isPermanentlyLockedAndDisabled() {
        Account account = Account.builder()
                .id(UUID.randomUUID())
                .status(AccountStatus.BANNED)
                .disciplineLevel(DisciplineLevel.BANNED)
                .bannedUntil(null)
                .isActive(true)
                .build();

        assertFalse(account.isAccountNonLocked(), "Tài khoản BANNED với bannedUntil == null phải bị khóa (isAccountNonLocked = false)");
        assertFalse(account.isEnabled(), "Tài khoản BANNED với bannedUntil == null phải bị vô hiệu hóa (isEnabled = false)");
    }

    @Test
    @DisplayName("2. Account BANNED với bannedUntil đã hết hạn trong quá khứ: Vẫn bị khóa vĩnh viễn")
    void bannedAccount_withExpiredBannedUntil_remainsPermanentlyLockedAndDisabled() {
        Account account = Account.builder()
                .id(UUID.randomUUID())
                .status(AccountStatus.BANNED)
                .disciplineLevel(DisciplineLevel.BANNED)
                .bannedUntil(LocalDateTime.now().minusDays(5)) // Ngày hết hạn cũ trong quá khứ
                .isActive(true)
                .build();

        assertFalse(account.isAccountNonLocked(), "Tài khoản BANNED dù bannedUntil trong quá khứ vẫn không được tự mở khóa (isAccountNonLocked = false)");
        assertFalse(account.isEnabled(), "Tài khoản BANNED dù bannedUntil trong quá khứ vẫn không được phép đăng nhập (isEnabled = false)");
    }

    @Test
    @DisplayName("3. Account BANNED với bannedUntil còn hạn trong tương lai: Vẫn bị khóa vĩnh viễn")
    void bannedAccount_withFutureBannedUntil_remainsLockedAndDisabled() {
        Account account = Account.builder()
                .id(UUID.randomUUID())
                .status(AccountStatus.BANNED)
                .disciplineLevel(DisciplineLevel.BANNED)
                .bannedUntil(LocalDateTime.now().plusDays(7))
                .isActive(true)
                .build();

        assertFalse(account.isAccountNonLocked(), "Tài khoản BANNED với bannedUntil trong tương lai phải bị khóa (isAccountNonLocked = false)");
        assertFalse(account.isEnabled(), "Tài khoản BANNED với bannedUntil trong tương lai phải bị vô hiệu hóa (isEnabled = false)");
    }

    @Test
    @DisplayName("4. Account có disciplineLevel == BANNED: Bị khóa vĩnh viễn dù status chưa đồng bộ")
    void disciplineLevelBanned_remainsPermanentlyLockedAndDisabled() {
        Account account = Account.builder()
                .id(UUID.randomUUID())
                .status(AccountStatus.ACTIVE)
                .disciplineLevel(DisciplineLevel.BANNED)
                .bannedUntil(null)
                .isActive(true)
                .build();

        assertFalse(account.isAccountNonLocked(), "Tài khoản có disciplineLevel BANNED phải bị khóa (isAccountNonLocked = false)");
        assertFalse(account.isEnabled(), "Tài khoản có disciplineLevel BANNED phải bị vô hiệu hóa (isEnabled = false)");
    }

    @Test
    @DisplayName("5. Account SUSPENDED có isActive == true: Không bị coi là BANNED, semantics login được giữ nguyên")
    void suspendedAccount_withIsActiveTrue_canLoginAndIsNotLocked() {
        LocalDateTime suspensionExpiry = LocalDateTime.now().plusDays(14);
        Account account = Account.builder()
                .id(UUID.randomUUID())
                .status(AccountStatus.SUSPENDED)
                .disciplineLevel(DisciplineLevel.SUSPENDED)
                .suspendedUntil(suspensionExpiry)
                .isActive(true)
                .build();

        assertTrue(account.isAccountNonLocked(), "Tài khoản SUSPENDED với isActive=true không bị coi là locked đối với login");
        assertTrue(account.isEnabled(), "Tài khoản SUSPENDED với isActive=true được phép đăng nhập (isEnabled = true)");
        assertEquals(suspensionExpiry, account.getSuspendedUntil(), "Trường suspendedUntil phải lưu và đọc đúng giá trị");
    }

    @Test
    @DisplayName("6. Account ACTIVE hợp lệ: Hoạt động bình thường, không bị ảnh hưởng")
    void activeAccount_valid_isNonLockedAndEnabled() {
        Account account = Account.builder()
                .id(UUID.randomUUID())
                .status(AccountStatus.ACTIVE)
                .disciplineLevel(DisciplineLevel.NONE)
                .isActive(true)
                .build();

        assertTrue(account.isAccountNonLocked(), "Tài khoản ACTIVE hợp lệ phải non-locked (true)");
        assertTrue(account.isEnabled(), "Tài khoản ACTIVE hợp lệ phải enabled (true)");
    }

    @Test
    @DisplayName("7. Account INACTIVE: Giữ nguyên hành vi cũ (isEnabled = false)")
    void inactiveAccount_remainsDisabled() {
        Account account = Account.builder()
                .id(UUID.randomUUID())
                .status(AccountStatus.INACTIVE)
                .disciplineLevel(DisciplineLevel.NONE)
                .isActive(true)
                .build();

        assertFalse(account.isEnabled(), "Tài khoản INACTIVE phải bị disable (isEnabled = false)");
        assertTrue(account.isAccountNonLocked(), "Tài khoản INACTIVE không thuộc diện khóa kỷ luật BANNED");
    }

    @Test
    @DisplayName("8. Account DELETED: Giữ nguyên hành vi cũ (isAccountNonLocked = false, isEnabled = false)")
    void deletedAccount_isLockedAndDisabled() {
        Account account = Account.builder()
                .id(UUID.randomUUID())
                .status(AccountStatus.DELETED)
                .isActive(true)
                .build();

        assertFalse(account.isAccountNonLocked(), "Tài khoản DELETED phải bị locked (false)");
        assertFalse(account.isEnabled(), "Tài khoản DELETED phải bị disable (false)");
    }

    @Test
    @DisplayName("9. Thao tác setter/getter và Builder với suspendedUntil")
    void suspendedUntil_setterGetterAndBuilderMapping() {
        LocalDateTime now = LocalDateTime.now();
        Account account = new Account();
        assertNull(account.getSuspendedUntil(), "Giá trị ban đầu của suspendedUntil phải là null");

        account.setSuspendedUntil(now.plusDays(14));
        assertNotNull(account.getSuspendedUntil(), "suspendedUntil sau khi set không được null");
        assertEquals(now.plusDays(14), account.getSuspendedUntil(), "suspendedUntil phải khớp với giá trị đã set");

        Account builtAccount = Account.builder()
                .suspendedUntil(now.plusDays(7))
                .build();
        assertEquals(now.plusDays(7), builtAccount.getSuspendedUntil(), "Builder phải map đúng trường suspendedUntil");
    }
}
