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
public class BuyerSpendingAnalyticsResponse {
    // 1. Personal Spending Overview
    private BigDecimal totalSpent;
    private Long totalOrders;
    private Long completedOrders;
    private Long deliveringOrders;
    private BigDecimal totalVoucherSaved;
    private BigDecimal estimatedTechSavings; // Tiết kiệm thông minh khi mua Like New / Linh kiện As-is

    // 2. Spending by Category
    private List<CategorySpendingDTO> categorySpending;

    // 3. Purchased Tech Devices & Warranty Tracker
    private List<PurchasedDeviceDTO> purchasedDevices;
}
