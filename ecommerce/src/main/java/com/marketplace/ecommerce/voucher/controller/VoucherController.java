package com.marketplace.ecommerce.voucher.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.voucher.dto.*;
import com.marketplace.ecommerce.voucher.service.VoucherService;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherScope;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    @GetMapping
    public ResponseEntity<Page<VoucherResponse>> listActiveVouchers(
            @CurrentUser CurrentUserInfo c,
            @RequestParam(value = "scope", required = false) VoucherScope scope,
            @RequestParam(value = "shopId", required = false) UUID shopId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        UUID accountId = c != null ? c.getAccountId() : null;
        return ResponseEntity.ok(voucherService.listActiveVouchers(scope, shopId, accountId, pageable));
    }

    @GetMapping("/shop/{shopId}")
    public ResponseEntity<List<VoucherResponse>> getShopVouchers(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID shopId
    ) {
        UUID accountId = c != null ? c.getAccountId() : null;
        return ResponseEntity.ok(voucherService.getShopVouchers(shopId, accountId));
    }

    @GetMapping("/my-vouchers")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserVoucherResponse>> getMyVouchers(
            @CurrentUser CurrentUserInfo c
    ) {
        return ResponseEntity.ok(voucherService.getMyVouchers(c.getAccountId()));
    }

    @PostMapping("/{voucherId}/claim")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserVoucherResponse> claimVoucher(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID voucherId
    ) {
        return ResponseEntity.ok(voucherService.claimVoucher(c.getAccountId(), voucherId));
    }

    @PostMapping("/calculate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<VoucherCalculationResponse> calculateDiscount(
            @CurrentUser CurrentUserInfo c,
            @Valid @RequestBody ApplyVoucherRequest request
    ) {
        UUID accountId = c != null ? c.getAccountId() : null;

        String shopCode = request.getShopVoucherCode();
        String platformCode = request.getPlatformVoucherCode();

        if (shopCode == null && platformCode == null && request.getCode() != null && !request.getCode().isBlank()) {
            return ResponseEntity.ok(voucherService.validateAndCalculate(
                    accountId,
                    request.getCode(),
                    request.getShopId(),
                    request.getSubtotal(),
                    request.getShippingFee()
            ));
        }

        return ResponseEntity.ok(voucherService.validateAndCalculateMulti(
                accountId,
                shopCode,
                platformCode,
                request.getShopId(),
                request.getSubtotal(),
                request.getShippingFee()
        ));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BUSINESS')")
    public ResponseEntity<VoucherResponse> createVoucher(
            @CurrentUser CurrentUserInfo c,
            @Valid @RequestBody CreateVoucherRequest request
    ) {
        return ResponseEntity.ok(voucherService.createVoucher(c.getAccountId(), request));
    }

    @PutMapping("/{voucherId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BUSINESS')")
    public ResponseEntity<VoucherResponse> updateVoucher(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID voucherId,
            @Valid @RequestBody UpdateVoucherRequest request
    ) {
        return ResponseEntity.ok(voucherService.updateVoucher(c.getAccountId(), voucherId, request));
    }

    @DeleteMapping("/{voucherId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BUSINESS')")
    public ResponseEntity<VoucherResponse> deleteVoucher(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID voucherId
    ) {
        return ResponseEntity.ok(voucherService.deleteVoucher(c.getAccountId(), voucherId));
    }

    @GetMapping("/shop-manage")
    @PreAuthorize("hasRole('BUSINESS')")
    public ResponseEntity<List<VoucherResponse>> getShopManageVouchers(
            @CurrentUser CurrentUserInfo c
    ) {
        return ResponseEntity.ok(voucherService.getShopManageVouchers(c.getAccountId()));
    }

    @GetMapping("/platform-manage")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<VoucherResponse>> getPlatformManageVouchers(
            @CurrentUser CurrentUserInfo c
    ) {
        return ResponseEntity.ok(voucherService.getPlatformManageVouchers(c.getAccountId()));
    }
}
