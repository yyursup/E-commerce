package com.marketplace.ecommerce.auth.service;

import com.marketplace.ecommerce.auth.entity.Account;

import java.time.LocalDateTime;
import java.util.UUID;

public interface AccountDisciplineService {

    /**
     * Kiểm tra và tự động giải tỏa đình chỉ (reconcile) nếu tài khoản đã hết hạn 14 ngày.
     *
     * @param account Tài khoản cần kiểm tra
     * @param now     Thời điểm hiện tại
     * @return Account đã được reconcile hoặc giữ nguyên nếu chưa hết hạn
     */
    Account checkAndReconcileSuspension(Account account, LocalDateTime now);

    /**
     * Kiểm tra và tự động giải tỏa đình chỉ (reconcile) bằng accountId.
     *
     * @param accountId ID tài khoản cần kiểm tra
     * @param now       Thời điểm hiện tại
     * @return Account đã được reconcile hoặc null nếu không tìm thấy
     */
    Account checkAndReconcileSuspension(UUID accountId, LocalDateTime now);

    /**
     * Quét định kỳ và tự động phục hồi các Account đã hoàn thành thời hạn đình chỉ 14 ngày.
     */
    void processExpiredSuspensions();
}
