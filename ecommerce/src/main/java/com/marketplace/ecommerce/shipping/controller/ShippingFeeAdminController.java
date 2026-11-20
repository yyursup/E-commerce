package com.marketplace.ecommerce.shipping.controller;

import com.marketplace.ecommerce.shipping.dto.response.ShippingFeeRecordResponse;
import com.marketplace.ecommerce.shipping.dto.response.ShippingFeeSummaryResponse;
import com.marketplace.ecommerce.shipping.service.ShippingFeeAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Admin tra cứu phí vận chuyển GHN của từng lần giao (chiều đi do shop tạo, chiều về do người mua tạo). */
@RestController
@RequestMapping(version = "1", path = "/shipping-fees")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ShippingFeeAdminController {

    private final ShippingFeeAdminService shippingFeeAdminService;

    @GetMapping
    public ResponseEntity<Page<ShippingFeeRecordResponse>> list(
            @RequestParam(value = "direction", required = false) String direction,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(shippingFeeAdminService.list(direction, pageable));
    }

    @GetMapping("/summary")
    public ResponseEntity<ShippingFeeSummaryResponse> summary() {
        return ResponseEntity.ok(shippingFeeAdminService.summary());
    }
}
