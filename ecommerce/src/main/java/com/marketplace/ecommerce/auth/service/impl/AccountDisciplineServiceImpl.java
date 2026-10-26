package com.marketplace.ecommerce.auth.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.service.AccountDisciplineService;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountDisciplineServiceImpl implements AccountDisciplineService {

    private final AccountRepository accountRepository;

    @Override
    @Transactional
    public Account checkAndReconcileSuspension(UUID accountId, LocalDateTime now) {
        if (accountId == null) {
            return null;
        }
        Account account = accountRepository.findById(accountId).orElse(null);
        if (account == null) {
            return null;
        }
        return checkAndReconcileSuspension(account, now);
    }

    @Override
    @Transactional
    public Account checkAndReconcileSuspension(Account account, LocalDateTime now) {
        if (account == null) {
            return null;
        }

        // Chỉ xử lý tài khoản đang ở trạng thái SUSPENDED (status hoặc disciplineLevel)
        if (account.getStatus() == AccountStatus.SUSPENDED || account.getDisciplineLevel() == DisciplineLevel.SUSPENDED) {
            // TUYỆT ĐỐI KHÔNG can thiệp tài khoản BANNED, INACTIVE hoặc DELETED
            if (account.getStatus() == AccountStatus.BANNED || account.getDisciplineLevel() == DisciplineLevel.BANNED
                    || account.getStatus() == AccountStatus.INACTIVE || account.getStatus() == AccountStatus.DELETED) {
                return account;
            }

            // Nếu suspendedUntil == null: Dữ liệu legacy, không tự chế ngày hết hạn, không coi là hết hạn
            if (account.getSuspendedUntil() == null) {
                log.warn("Account suspended without suspendedUntil timestamp: accountId={}", account.getId());
                return account;
            }

            // Nếu now >= suspendedUntil: Đã hết hạn kỷ luật 14 ngày
            if (!account.getSuspendedUntil().isAfter(now)) {
                account.setDisciplineLevel(DisciplineLevel.WARNED);
                account.setStatus(AccountStatus.ACTIVE);
                account.setSuspendedUntil(null);
                // Giữ nguyên violationCount và lastViolationAt, không kích hoạt monthly decay
                account = accountRepository.save(account);
                log.info("Reconciled expired user suspension: accountId={}, newStatus=ACTIVE, newLevel=WARNED, violationCount={}",
                        account.getId(), account.getViolationCount());
            }
        }
        return account;
    }

    @Override
    @Scheduled(cron = "0 */10 * * * *")
    @Transactional
    public void processExpiredSuspensions() {
        LocalDateTime now = LocalDateTime.now();
        List<Account> expiredAccounts = accountRepository.findExpiredSuspensions(
                AccountStatus.SUSPENDED, DisciplineLevel.SUSPENDED, now);
        for (Account a : expiredAccounts) {
            try {
                accountRepository.findByIdForUpdate(a.getId()).ifPresent(acc -> {
                    checkAndReconcileSuspension(acc, now);
                });
            } catch (Exception e) {
                log.error("Failed to reconcile expired suspension for accountId={}: {}", a.getId(), e.getMessage());
            }
        }
    }
}
