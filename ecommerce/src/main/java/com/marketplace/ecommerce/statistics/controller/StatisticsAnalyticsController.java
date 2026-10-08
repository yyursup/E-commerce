package com.marketplace.ecommerce.statistics.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.statistics.dto.response.AdminDashboardAnalyticsResponse;
import com.marketplace.ecommerce.statistics.dto.response.BuyerSpendingAnalyticsResponse;
import com.marketplace.ecommerce.statistics.dto.response.SellerDashboardAnalyticsResponse;
import com.marketplace.ecommerce.statistics.service.StatisticsAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(version = "1", path = "/statistics")
@RequiredArgsConstructor
public class StatisticsAnalyticsController {

    private final StatisticsAnalyticsService statisticsAnalyticsService;

    @GetMapping("/admin/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardAnalyticsResponse> getAdminDashboardAnalytics() {
        return ResponseEntity.ok(statisticsAnalyticsService.getAdminDashboardAnalytics());
    }

    @GetMapping("/seller/dashboard")
    @PreAuthorize("hasAnyRole('BUSINESS', 'ADMIN')")
    public ResponseEntity<SellerDashboardAnalyticsResponse> getSellerDashboardAnalytics(
            @CurrentUser CurrentUserInfo currentUser
    ) {
        return ResponseEntity.ok(
                statisticsAnalyticsService.getSellerDashboardAnalytics(currentUser.getAccountId())
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
