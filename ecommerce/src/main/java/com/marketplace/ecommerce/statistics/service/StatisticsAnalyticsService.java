package com.marketplace.ecommerce.statistics.service;

import com.marketplace.ecommerce.statistics.dto.response.AdminDashboardAnalyticsResponse;
import com.marketplace.ecommerce.statistics.dto.response.BuyerSpendingAnalyticsResponse;
import com.marketplace.ecommerce.statistics.dto.response.SellerDashboardAnalyticsResponse;

import java.util.UUID;

public interface StatisticsAnalyticsService {

    AdminDashboardAnalyticsResponse getAdminDashboardAnalytics();

    SellerDashboardAnalyticsResponse getSellerDashboardAnalytics(UUID sellerAccountId);

    BuyerSpendingAnalyticsResponse getBuyerSpendingAnalytics(UUID buyerAccountId);
}
