package com.marketplace.ecommerce.statistics.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardAnalyticsResponse {
    // 1. Financial Metrics
    private BigDecimal totalGmv;
    private BigDecimal settledRevenue;
    private BigDecimal activeEscrowBalance;
    private BigDecimal totalPlatformCommission;
    private Double gmvGrowthRate;

    // 2. Operational & Risk Metrics
    private Long totalOrders;
    private Long completedOrders;
    private Long cancelledOrders;
    private Long returnedOrders;
    private Double fulfillmentRate;
    private Double returnRate;
    private Double disputeRate;
    private Long pendingDisputesCount;

    // 3. User & Merchant Growth
    private Long totalBuyers;
    private Long totalShops;
    private Long verifiedKycShops;
    private Double kycVerificationRate;

    // 4. Breakdown & Timelines
    private List<TechConditionBreakdownDTO> conditionBreakdown;
    private List<DailyPlatformTimelineDTO> dailyTimeline;
    private List<TopShopAnalyticsDTO> topShops;
    private List<TopCategoryAnalyticsDTO> topCategories;
}
