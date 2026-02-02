package com.marketplace.ecommerce.wallet.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.wallet.dto.response.WalletResponse;
import com.marketplace.ecommerce.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping("/admin/{accountId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WalletResponse> adminGetWallet(
            @PathVariable UUID accountId
    ) {
        return ResponseEntity.ok(walletService.getWallet(accountId));
    }
}
