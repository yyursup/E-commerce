package com.marketplace.ecommerce.statistics.service;

import com.marketplace.ecommerce.statistics.dto.response.AdminDashboardAnalyticsResponse;
import com.marketplace.ecommerce.statistics.dto.response.BuyerSpendingAnalyticsResponse;
import com.marketplace.ecommerce.statistics.dto.response.SellerDashboardAnalyticsResponse;

import java.time.LocalDate;
import java.util.UUID;

public interface StatisticsAnalyticsService {

    AdminDashboardAnalyticsResponse getAdminDashboardAnalytics();

    AdminDashboardAnalyticsResponse getAdminDashboardAnalytics(String period, LocalDate startDate, LocalDate endDate);

    SellerDashboardAnalyticsResponse getSellerDashboardAnalytics(UUID sellerAccountId);

    SellerDashboardAnalyticsResponse getSellerDashboardAnalytics(UUID sellerAccountId, String period, LocalDate startDate, LocalDate endDate);

    BuyerSpendingAnalyticsResponse getBuyerSpendingAnalytics(UUID buyerAccountId);
}
