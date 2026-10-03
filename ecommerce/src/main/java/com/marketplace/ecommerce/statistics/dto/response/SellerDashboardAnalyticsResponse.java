package com.marketplace.ecommerce.statistics.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerDashboardAnalyticsResponse {
    private String shopName;
    private Boolean isKycVerified;

    // 1. Financial Performance KPIs
    private BigDecimal settledNetIncome;        // Thu nhập ròng thực tế
    private BigDecimal pendingEscrowRevenue;    // Doanh thu đang giữ trong escrow
    private BigDecimal totalRevenue;            // Tổng doanh số (đơn thành công)
    private BigDecimal estimatedRevenue;        // Doanh số ước tính (tất cả đơn active)
    private BigDecimal totalCommissionPaid;     // Hoa hồng đã trả sàn
    private BigDecimal averageOrderValue;       // AOV = Doanh thu / Số đơn hoàn thành

    // 2. Fulfillment Metrics
    private Long totalOrders;
    private Long completedOrders;
    private Long returnedOrders;
    private Long cancelledOrders;
    private Double fulfillmentRate;             // Tỷ lệ hoàn tất đơn (%)
    private Double returnRate;                  // Tỷ lệ hoàn trả (%)
    private Map<String, Long> orderCountByStatus;

    // 3. Daily Sales Timeline (14-30 ngày)
    private List<DailySalesPointDTO> salesTimeline;

    // 4. Top Best Selling Tech Products
    private List<TopProductSalesDTO> topProducts;

    // 5. Condition Grade Breakdown (Cơ cấu doanh thu theo tình trạng máy)
    private List<TechConditionBreakdownDTO> conditionSalesBreakdown;

    // 6. Low Stock Alerts (< 3 items)
    private List<LowStockAlertDTO> lowStockAlerts;
}
