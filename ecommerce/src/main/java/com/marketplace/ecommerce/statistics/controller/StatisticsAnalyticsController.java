package com.marketplace.ecommerce.statistics.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.statistics.dto.response.AdminDashboardAnalyticsResponse;
import com.marketplace.ecommerce.statistics.dto.response.BuyerSpendingAnalyticsResponse;
import com.marketplace.ecommerce.statistics.dto.response.SellerDashboardAnalyticsResponse;
import com.marketplace.ecommerce.statistics.service.StatisticsAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping(version = "1", path = "/statistics")
@RequiredArgsConstructor
public class StatisticsAnalyticsController {

    private final StatisticsAnalyticsService statisticsAnalyticsService;

    @GetMapping("/admin/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardAnalyticsResponse> getAdminDashboardAnalytics(
            @RequestParam(required = false, defaultValue = "14d") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(statisticsAnalyticsService.getAdminDashboardAnalytics(period, startDate, endDate));
    }

    @GetMapping("/admin/shops/performance")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.List<com.marketplace.ecommerce.statistics.dto.response.AdminShopPerformanceDTO>> getAdminShopsPerformance(
            @RequestParam(required = false, defaultValue = "14d") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(statisticsAnalyticsService.getAdminShopsPerformance(period, startDate, endDate, search));
    }

    @GetMapping("/admin/shops/{shopId}/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SellerDashboardAnalyticsResponse> getAdminShopAnalytics(
            @PathVariable java.util.UUID shopId,
            @RequestParam(required = false, defaultValue = "14d") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(statisticsAnalyticsService.getAdminShopAnalytics(shopId, period, startDate, endDate));
    }

    @GetMapping("/seller/dashboard")
    @PreAuthorize("hasAnyRole('BUSINESS', 'ADMIN')")
    public ResponseEntity<SellerDashboardAnalyticsResponse> getSellerDashboardAnalytics(
            @CurrentUser CurrentUserInfo currentUser,
            @RequestParam(required = false, defaultValue = "14d") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(
                statisticsAnalyticsService.getSellerDashboardAnalytics(currentUser.getAccountId(), period, startDate, endDate)
        );
    }

    @GetMapping("/buyer/spending")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BuyerSpendingAnalyticsResponse> getBuyerSpendingAnalytics(
            @CurrentUser CurrentUserInfo currentUser
    ) {
        return ResponseEntity.ok(
                statisticsAnalyticsService.getBuyerSpendingAnalytics(currentUser.getAccountId())
        );
    }
}
