package com.marketplace.ecommerce.platform.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.platform.service.CommissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/commissions")
@PreAuthorize("hasRole('BUSINESS')")
@RequiredArgsConstructor
public class SellerStatisticsController {
    private final CommissionService commissionService;

    @GetMapping("/sellers/total")
    public ResponseEntity<Map<String, BigDecimal>> getTotalCommissionBySeller(
            @CurrentUser CurrentUserInfo u
    ) {
        BigDecimal totalCommission = commissionService.getTotalCommissionBySeller(u.getAccountId());
        return ResponseEntity.ok(Map.of("totalCommission", totalCommission));
    }

    @GetMapping("/sellers/net-income")
    public ResponseEntity<Map<String, BigDecimal>> getTotalNetIncomeBySeller(
            @CurrentUser CurrentUserInfo u
    ) {
        BigDecimal totalNetIncome = commissionService.getTotalNetIncomeBySeller(u.getAccountId());
        return ResponseEntity.ok(Map.of("totalNetIncome", totalNetIncome));
    }
}
