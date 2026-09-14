package com.marketplace.ecommerce.voucher.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.voucher.dto.*;
import com.marketplace.ecommerce.voucher.service.VoucherService;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherScope;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    @GetMapping
    public ResponseEntity<List<VoucherResponse>> listActiveVouchers(
            @CurrentUser CurrentUserInfo c,
            @RequestParam(value = "scope", required = false) VoucherScope scope,
            @RequestParam(value = "shopId", required = false) UUID shopId
    ) {
        UUID accountId = c != null ? c.getAccountId() : null;
        return ResponseEntity.ok(voucherService.listActiveVouchers(scope, shopId, accountId));
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
    public ResponseEntity<List<UserVoucherResponse>> getMyVouchers(
            @CurrentUser CurrentUserInfo c
    ) {
        return ResponseEntity.ok(voucherService.getMyVouchers(c.getAccountId()));
    }

    @PostMapping("/{voucherId}/claim")
    public ResponseEntity<UserVoucherResponse> claimVoucher(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID voucherId
    ) {
        return ResponseEntity.ok(voucherService.claimVoucher(c.getAccountId(), voucherId));
    }

    @PostMapping("/calculate")
    public ResponseEntity<VoucherCalculationResponse> calculateDiscount(
            @CurrentUser CurrentUserInfo c,
            @Valid @RequestBody ApplyVoucherRequest request
    ) {
        UUID accountId = c != null ? c.getAccountId() : null;
        return ResponseEntity.ok(voucherService.validateAndCalculate(
                accountId,
                request.getCode(),
                request.getShopId(),
                request.getSubtotal(),
                request.getShippingFee()
        ));
    }

    @PostMapping
    public ResponseEntity<VoucherResponse> createVoucher(
            @CurrentUser CurrentUserInfo c,
            @Valid @RequestBody CreateVoucherRequest request
    ) {
        return ResponseEntity.ok(voucherService.createVoucher(c.getAccountId(), request));
    }

    @GetMapping("/shop-manage")
    public ResponseEntity<List<VoucherResponse>> getShopManageVouchers(
            @CurrentUser CurrentUserInfo c
    ) {
        return ResponseEntity.ok(voucherService.getShopManageVouchers(c.getAccountId()));
    }
}
