package com.marketplace.ecommerce.auth.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Tests kiểm tra vòng đời hết hạn kỷ luật User (AccountDisciplineServiceImpl)")
class AccountDisciplineServiceImplTest {

    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private AccountDisciplineServiceImpl accountDisciplineService;

    @Test
    @DisplayName("1. Hết hạn 14 ngày (now >= suspendedUntil): Tự động reconcile sang WARNED, ACTIVE, xóa suspendedUntil và bảo lưu violationCount")
    void checkAndReconcileSuspension_Expired_ReconcilesSuccessfully() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime pastExpiry = now.minusMinutes(1);
        LocalDateTime lastViolation = now.minusDays(14);

        Account account = Account.builder()
                .id(UUID.randomUUID())
                .status(AccountStatus.SUSPENDED)
                .disciplineLevel(DisciplineLevel.SUSPENDED)
                .suspendedUntil(pastExpiry)
                .violationCount(5)
                .lastViolationAt(lastViolation)
                .isActive(true)
                .build();

        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Account result = accountDisciplineService.checkAndReconcileSuspension(account, now);

        assertNotNull(result);
        assertEquals(AccountStatus.ACTIVE, result.getStatus(), "Status phải được phục hồi sang ACTIVE");
        assertEquals(DisciplineLevel.WARNED, result.getDisciplineLevel(), "DisciplineLevel phải chuyển sang WARNED");
        assertNull(result.getSuspendedUntil(), "suspendedUntil phải được xóa về null");
        assertEquals(5, result.getViolationCount(), "violationCount phải được BẢO LƯU nguyên vẹn 5 gậy, không được giảm");
        assertEquals(lastViolation, result.getLastViolationAt(), "lastViolationAt phải được bảo lưu nguyên vẹn");
        verify(accountRepository).save(account);
    }

    @Test
    @DisplayName("2. Chưa hết hạn 14 ngày (now < suspendedUntil): Giữ nguyên trạng thái SUSPENDED")
    void checkAndReconcileSuspension_NotYetExpired_RemainsSuspended() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime futureExpiry = now.plusDays(7);

        Account account = Account.builder()
                .id(UUID.randomUUID())
                .status(AccountStatus.SUSPENDED)
                .disciplineLevel(DisciplineLevel.SUSPENDED)
                .suspendedUntil(futureExpiry)
                .violationCount(5)
                .isActive(true)
                .build();

        Account result = accountDisciplineService.checkAndReconcileSuspension(account, now);

        assertEquals(AccountStatus.SUSPENDED, result.getStatus());
        assertEquals(DisciplineLevel.SUSPENDED, result.getDisciplineLevel());
        assertEquals(futureExpiry, result.getSuspendedUntil());
        verify(accountRepository, never()).save(any());
    }

    @Test
    @DisplayName("3. Dữ liệu legacy có SUSPENDED nhưng suspendedUntil == null: Không tự ý gỡ hoặc chế ngày")
    void checkAndReconcileSuspension_NullSuspendedUntil_PreservesState() {
        LocalDateTime now = LocalDateTime.now();

        Account account = Account.builder()
                .id(UUID.randomUUID())
                .status(AccountStatus.SUSPENDED)
                .disciplineLevel(DisciplineLevel.SUSPENDED)
                .suspendedUntil(null)
                .violationCount(5)
                .isActive(true)
                .build();

        Account result = accountDisciplineService.checkAndReconcileSuspension(account, now);

        assertEquals(AccountStatus.SUSPENDED, result.getStatus());
        assertNull(result.getSuspendedUntil());
        verify(accountRepository, never()).save(any());
    }

    @Test
    @DisplayName("4. Tài khoản BANNED: Tuyệt đối không bao giờ bị reconcile mở khóa")
    void checkAndReconcileSuspension_BannedAccount_NeverReconciled() {
        LocalDateTime now = LocalDateTime.now();

        Account bannedAccount = Account.builder()
                .id(UUID.randomUUID())
                .status(AccountStatus.BANNED)
                .disciplineLevel(DisciplineLevel.BANNED)
                .suspendedUntil(now.minusDays(1))
                .violationCount(7)
                .isActive(false)
                .build();

        Account result = accountDisciplineService.checkAndReconcileSuspension(bannedAccount, now);

        assertEquals(AccountStatus.BANNED, result.getStatus());
        assertEquals(DisciplineLevel.BANNED, result.getDisciplineLevel());
        verify(accountRepository, never()).save(any());
    }

    @Test
    @DisplayName("5. Tài khoản INACTIVE hoặc DELETED: Tuyệt đối không bị can thiệp")
    void checkAndReconcileSuspension_InactiveOrDeletedAccount_NotModified() {
        LocalDateTime now = LocalDateTime.now();

        Account inactiveAccount = Account.builder()
                .id(UUID.randomUUID())
                .status(AccountStatus.INACTIVE)
                .disciplineLevel(DisciplineLevel.SUSPENDED)
                .suspendedUntil(now.minusDays(1))
                .build();

        Account result = accountDisciplineService.checkAndReconcileSuspension(inactiveAccount, now);

        assertEquals(AccountStatus.INACTIVE, result.getStatus());
        verify(accountRepository, never()).save(any());
    }

    @Test
    @DisplayName("6. Scheduled processExpiredSuspensions: Quét và giải tỏa đúng các tài khoản hết hạn")
    void processExpiredSuspensions_ProcessesOnlyEligibleAccounts() {
        LocalDateTime now = LocalDateTime.now();
        UUID accId = UUID.randomUUID();

        Account expiredAccount = Account.builder()
                .id(accId)
                .status(AccountStatus.SUSPENDED)
                .disciplineLevel(DisciplineLevel.SUSPENDED)
                .suspendedUntil(now.minusMinutes(5))
                .violationCount(5)
                .build();

        when(accountRepository.findExpiredSuspensions(eq(AccountStatus.SUSPENDED), eq(DisciplineLevel.SUSPENDED), any(LocalDateTime.class)))
                .thenReturn(List.of(expiredAccount));
        when(accountRepository.findByIdForUpdate(accId))
                .thenReturn(Optional.of(expiredAccount));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        accountDisciplineService.processExpiredSuspensions();

        assertEquals(AccountStatus.ACTIVE, expiredAccount.getStatus());
        assertEquals(DisciplineLevel.WARNED, expiredAccount.getDisciplineLevel());
        assertNull(expiredAccount.getSuspendedUntil());
        assertEquals(5, expiredAccount.getViolationCount());
        verify(accountRepository).save(expiredAccount);
    }

    @Test
    @DisplayName("6.1. Scheduled processExpiredSuspensions: Quét và giải tỏa thành công tài khoản bất đối xứng (status=ACTIVE, disciplineLevel=SUSPENDED)")
    void processExpiredSuspensions_InconsistentStatusActive_LevelSuspended_ScheduledProcessing_Reconciles() {
        LocalDateTime now = LocalDateTime.now();
        UUID accId = UUID.randomUUID();

        Account expiredAccount = Account.builder()
                .id(accId)
                .status(AccountStatus.ACTIVE)
                .disciplineLevel(DisciplineLevel.SUSPENDED)
                .suspendedUntil(now.minusMinutes(5))
                .violationCount(5)
                .build();

        when(accountRepository.findExpiredSuspensions(eq(AccountStatus.SUSPENDED), eq(DisciplineLevel.SUSPENDED), any(LocalDateTime.class)))
                .thenReturn(List.of(expiredAccount));
        when(accountRepository.findByIdForUpdate(accId))
                .thenReturn(Optional.of(expiredAccount));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        accountDisciplineService.processExpiredSuspensions();

        assertEquals(AccountStatus.ACTIVE, expiredAccount.getStatus(), "Status vẫn là ACTIVE");
        assertEquals(DisciplineLevel.WARNED, expiredAccount.getDisciplineLevel(), "disciplineLevel phải được chuyển về WARNED");
        assertNull(expiredAccount.getSuspendedUntil(), "suspendedUntil phải bị xóa về null");
        assertEquals(5, expiredAccount.getViolationCount(), "violationCount phải được bảo lưu");
        verify(accountRepository).save(expiredAccount);
    }

    @Test
    @DisplayName("7. Chính xác tại mốc biên (now == suspendedUntil): Kỷ luật phải hết hạn")
    void checkAndReconcileSuspension_ExactBoundary_Expires() {
        LocalDateTime exactMoment = LocalDateTime.now();

        Account account = Account.builder()
                .id(UUID.randomUUID())
                .status(AccountStatus.SUSPENDED)
                .disciplineLevel(DisciplineLevel.SUSPENDED)
                .suspendedUntil(exactMoment)
                .violationCount(5)
                .isActive(true)
                .build();

        when(accountRepository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

        Account result = accountDisciplineService.checkAndReconcileSuspension(account, exactMoment);

        assertEquals(AccountStatus.ACTIVE, result.getStatus(), "Tại mốc now == suspendedUntil, status phải là ACTIVE");
        assertEquals(DisciplineLevel.WARNED, result.getDisciplineLevel(), "disciplineLevel phải là WARNED");
        assertNull(result.getSuspendedUntil(), "suspendedUntil phải bị xóa về null");
        assertEquals(5, result.getViolationCount(), "violationCount phải được bảo lưu");
        verify(accountRepository).save(account);
    }

    @Test
    @DisplayName("8. Bất đối xứng: status == SUSPENDED, disciplineLevel != SUSPENDED và suspendedUntil hết hạn: Phục hồi thành công")
    void checkAndReconcileSuspension_InconsistentStatusSuspended_LevelWarned_Expired_Reconciles() {
        LocalDateTime now = LocalDateTime.now();
        Account account = Account.builder()
                .id(UUID.randomUUID())
                .status(AccountStatus.SUSPENDED)
                .disciplineLevel(DisciplineLevel.WARNED) // Lệch với status
                .suspendedUntil(now.minusDays(1))
                .violationCount(5)
                .isActive(true)
                .build();

        when(accountRepository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

        Account result = accountDisciplineService.checkAndReconcileSuspension(account, now);

        assertEquals(AccountStatus.ACTIVE, result.getStatus());
        assertEquals(DisciplineLevel.WARNED, result.getDisciplineLevel());
        assertNull(result.getSuspendedUntil());
        verify(accountRepository).save(account);
    }

    @Test
    @DisplayName("9. Bất đối xứng: status == ACTIVE, disciplineLevel == SUSPENDED và suspendedUntil hết hạn: Phục hồi thành công")
    void checkAndReconcileSuspension_InconsistentStatusActive_LevelSuspended_Expired_Reconciles() {
        LocalDateTime now = LocalDateTime.now();
        Account account = Account.builder()
                .id(UUID.randomUUID())
                .status(AccountStatus.ACTIVE) // Lệch với disciplineLevel
                .disciplineLevel(DisciplineLevel.SUSPENDED)
                .suspendedUntil(now.minusDays(1))
                .violationCount(5)
                .isActive(true)
                .build();

        when(accountRepository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

        Account result = accountDisciplineService.checkAndReconcileSuspension(account, now);

        assertEquals(AccountStatus.ACTIVE, result.getStatus());
        assertEquals(DisciplineLevel.WARNED, result.getDisciplineLevel());
        assertNull(result.getSuspendedUntil());
        verify(accountRepository).save(account);
    }

    @Test
    @DisplayName("10. checkAndReconcileSuspension(UUID): accountId là null trả về null")
    void checkAndReconcileSuspension_ByUUID_NullId_ReturnsNull() {
        assertNull(accountDisciplineService.checkAndReconcileSuspension((UUID) null, LocalDateTime.now()));
        verify(accountRepository, never()).findById(any());
    }

    @Test
    @DisplayName("11. checkAndReconcileSuspension(UUID): Không tìm thấy Account trong DB trả về null")
    void checkAndReconcileSuspension_ByUUID_NotFound_ReturnsNull() {
        UUID id = UUID.randomUUID();
        when(accountRepository.findById(id)).thenReturn(Optional.empty());

        assertNull(accountDisciplineService.checkAndReconcileSuspension(id, LocalDateTime.now()));
        verify(accountRepository).findById(id);
    }

    @Test
    @DisplayName("12. checkAndReconcileSuspension(UUID): Tìm thấy Account hợp lệ thì thực hiện reconcile")
    void checkAndReconcileSuspension_ByUUID_Found_Reconciles() {
        UUID id = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        Account acc = Account.builder()
                .id(id)
                .status(AccountStatus.SUSPENDED)
                .disciplineLevel(DisciplineLevel.SUSPENDED)
                .suspendedUntil(now.minusDays(1))
                .build();

        when(accountRepository.findById(id)).thenReturn(Optional.of(acc));
        when(accountRepository.save(any(Account.class))).thenAnswer(i -> i.getArgument(0));

        Account res = accountDisciplineService.checkAndReconcileSuspension(id, now);

        assertNotNull(res);
        assertEquals(AccountStatus.ACTIVE, res.getStatus());
        assertEquals(DisciplineLevel.WARNED, res.getDisciplineLevel());
    }

    @Test
    @DisplayName("13. checkAndReconcileSuspension(Account): account là null trả về null")
    void checkAndReconcileSuspension_NullAccount_ReturnsNull() {
        assertNull(accountDisciplineService.checkAndReconcileSuspension((Account) null, LocalDateTime.now()));
    }

    @Test
    @DisplayName("14. checkAndReconcileSuspension: Account đang ACTIVE và NONE (không bị SUSPENDED) thì giữ nguyên")
    void checkAndReconcileSuspension_NotSuspended_ReturnsSame() {
        Account normalAcc = Account.builder()
                .id(UUID.randomUUID())
                .status(AccountStatus.ACTIVE)
                .disciplineLevel(DisciplineLevel.NONE)
                .build();

        Account res = accountDisciplineService.checkAndReconcileSuspension(normalAcc, LocalDateTime.now());

        assertSame(normalAcc, res);
        verify(accountRepository, never()).save(any());
    }

    @Test
    @DisplayName("15. checkAndReconcileSuspension: Account có status DELETED thì không can thiệp")
    void checkAndReconcileSuspension_DeletedAccount_ReturnsSame() {
        Account deletedAcc = Account.builder()
                .id(UUID.randomUUID())
                .status(AccountStatus.DELETED)
                .disciplineLevel(DisciplineLevel.SUSPENDED)
                .suspendedUntil(LocalDateTime.now().minusDays(1))
                .build();

        Account res = accountDisciplineService.checkAndReconcileSuspension(deletedAcc, LocalDateTime.now());

        assertSame(deletedAcc, res);
        verify(accountRepository, never()).save(any());
    }

    @Test
    @DisplayName("16. processExpiredSuspensions: Xử lý ngoại lệ trong vòng lặp an toàn, không làm crash daemon")
    void processExpiredSuspensions_ExceptionInLoop_HandledGracefully() {
        UUID accId = UUID.randomUUID();
        Account expiredAcc = Account.builder().id(accId).build();

        when(accountRepository.findExpiredSuspensions(eq(AccountStatus.SUSPENDED), eq(DisciplineLevel.SUSPENDED), any(LocalDateTime.class)))
                .thenReturn(List.of(expiredAcc));
        when(accountRepository.findByIdForUpdate(accId)).thenThrow(new RuntimeException("DB Connection Timeout"));

        assertDoesNotThrow(() -> accountDisciplineService.processExpiredSuspensions());
    }
}
