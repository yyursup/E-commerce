package com.marketplace.ecommerce.wallet.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.wallet.dto.request.AdminReviewWithdrawalRequest;
import com.marketplace.ecommerce.wallet.dto.request.BankInfoRequest;
import com.marketplace.ecommerce.wallet.dto.request.CreateWithdrawalRequest;
import com.marketplace.ecommerce.wallet.dto.response.WalletResponse;
import com.marketplace.ecommerce.wallet.dto.response.WithdrawalResponse;
import com.marketplace.ecommerce.wallet.service.WalletService;
import com.marketplace.ecommerce.wallet.valueObjects.WithdrawalStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/me")
    public ResponseEntity<WalletResponse> getMyWallet(
            @CurrentUser CurrentUserInfo u
    ) {
        return ResponseEntity.ok(walletService.getWallet(u.getAccountId()));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WalletResponse> adminGetWallet(
            @RequestParam("userName") String userName
    ) {
        return ResponseEntity.ok(walletService.getWalletByUserName(userName));
    }

    @PutMapping("/bank-info")
    public ResponseEntity<Void> updateBankInfo(
            @CurrentUser CurrentUserInfo u,
            @Valid @RequestBody BankInfoRequest request
    ) {
        walletService.updateBankInfo(u.getAccountId(), request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/withdraw")
    public ResponseEntity<WithdrawalResponse> requestWithdrawal(
            @CurrentUser CurrentUserInfo u,
            @Valid @RequestBody CreateWithdrawalRequest request
    ) {
        return ResponseEntity.ok(walletService.requestWithdrawal(u.getAccountId(), request));
    }

    @GetMapping("/withdrawals")
    public ResponseEntity<Page<WithdrawalResponse>> getMyWithdrawals(
            @CurrentUser CurrentUserInfo u,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(walletService.getMyWithdrawals(u.getAccountId(), pageable));
    }

    @PostMapping("/withdrawals/{id}/cancel")
    public ResponseEntity<WithdrawalResponse> cancelWithdrawal(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(walletService.cancelWithdrawal(u.getAccountId(), id));
    }

    @GetMapping("/admin/withdrawals")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<WithdrawalResponse>> adminGetWithdrawals(
            @RequestParam(value = "status", required = false) WithdrawalStatus status,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(walletService.adminGetWithdrawals(status, pageable));
    }

    @PostMapping("/admin/withdrawals/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WithdrawalResponse> adminApproveWithdrawal(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID id,
            @RequestBody(required = false) AdminReviewWithdrawalRequest request
    ) {
        return ResponseEntity.ok(walletService.adminApproveWithdrawal(u.getAccountId(), id, request));
    }

    @PostMapping("/admin/withdrawals/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WithdrawalResponse> adminRejectWithdrawal(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID id,
            @RequestBody(required = false) AdminReviewWithdrawalRequest request
    ) {
        return ResponseEntity.ok(walletService.adminRejectWithdrawal(u.getAccountId(), id, request));
    }
}
