package com.marketplace.ecommerce.platform.controller;

import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.platform.dto.CommissionFilterRequest;
import com.marketplace.ecommerce.platform.dto.response.*;
import com.marketplace.ecommerce.platform.service.CommissionService;
import com.marketplace.ecommerce.platform.service.CommissionStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/commissions")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class CommissionStatisticsController {

    private final CommissionStatisticsService commissionStatisticsService;
    private final CommissionService commissionService;
    @GetMapping("/overview")
    public ResponseEntity<CommissionOverviewResponse> getOverview() {
        return ResponseEntity.ok(commissionStatisticsService.getOverview());
    }

    @GetMapping("/by-month")
    public ResponseEntity<List<CommissionByMonthResponse>> getByMonth() {
        return ResponseEntity.ok(commissionStatisticsService.getByMonth());
    }

    @GetMapping("/top-sellers")
    public ResponseEntity<List<TopSellerCommissionResponse>> getTopSellers(
            @RequestParam(defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(commissionStatisticsService.getTopSellers(limit));
    }

    @GetMapping
    public ResponseEntity<List<CommissionResponse>> getCommissions(
            @ModelAttribute CommissionFilterRequest filter
    ) {
        return ResponseEntity.ok(commissionService.getCommissions(filter));
    }

    @PostMapping("/orders/{orderId}")
    public ResponseEntity<Map<String, Object>> createCommission(
            @PathVariable UUID orderId
    ) {
        commissionService.createCommission(orderId);

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "Commission created successfully",
                "orderId", orderId
        ));
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<CommissionDetailResponse> getByOrderId(
            @PathVariable UUID orderId
    ) {
        return ResponseEntity.ok(commissionService.getByOrderId(orderId));
    }

    @GetMapping("/sellers/{sellerId}/total")
    public ResponseEntity<Map<String, BigDecimal>> getTotalCommissionBySeller(
            @PathVariable UUID sellerId
    ) {
        BigDecimal totalCommission = commissionService.getTotalCommissionBySeller(sellerId);
        return ResponseEntity.ok(Map.of("totalCommission", totalCommission));
    }

    @GetMapping("/sellers/{sellerId}/net-income")
    public ResponseEntity<Map<String, BigDecimal>> getTotalNetIncomeBySeller(
            @PathVariable UUID sellerId
    ) {
        BigDecimal totalNetIncome = commissionService.getTotalNetIncomeBySeller(sellerId);
        return ResponseEntity.ok(Map.of("totalNetIncome", totalNetIncome));
    }
}
