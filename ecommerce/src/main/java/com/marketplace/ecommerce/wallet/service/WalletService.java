package com.marketplace.ecommerce.wallet.service;

import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.payment.entity.Payment;
import com.marketplace.ecommerce.wallet.dto.request.AdminReviewWithdrawalRequest;
import com.marketplace.ecommerce.wallet.dto.request.BankInfoRequest;
import com.marketplace.ecommerce.wallet.dto.request.CreateWithdrawalRequest;
import com.marketplace.ecommerce.wallet.dto.response.WalletResponse;
import com.marketplace.ecommerce.wallet.dto.response.WithdrawalResponse;
import com.marketplace.ecommerce.wallet.valueObjects.WithdrawalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface WalletService {
    void recordPaymentAndHoldEscrow(Payment payment);
    void payOrderWithWallet(Order order);
    WalletResponse getWallet(UUID accountId);

    WalletResponse getWalletByUserName(String username);

    void updateBankInfo(UUID accountId, BankInfoRequest request);

    WithdrawalResponse requestWithdrawal(UUID accountId, CreateWithdrawalRequest request);

    WithdrawalResponse cancelWithdrawal(UUID accountId, UUID withdrawalId);

    Page<WithdrawalResponse> getMyWithdrawals(UUID accountId, Pageable pageable);

    Page<WithdrawalResponse> adminGetWithdrawals(WithdrawalStatus status, Pageable pageable);

    WithdrawalResponse adminApproveWithdrawal(UUID adminAccountId, UUID withdrawalId, AdminReviewWithdrawalRequest request);

    WithdrawalResponse adminRejectWithdrawal(UUID adminAccountId, UUID withdrawalId, AdminReviewWithdrawalRequest request);
}
