package com.marketplace.ecommerce.platform.service;


import com.marketplace.ecommerce.platform.dto.response.CommissionByMonthResponse;
import com.marketplace.ecommerce.platform.dto.response.CommissionOverviewResponse;
import com.marketplace.ecommerce.platform.dto.response.SellerStatisticsResponse;
import com.marketplace.ecommerce.platform.dto.response.TopSellerCommissionResponse;

import java.util.List;
import java.util.UUID;

public interface CommissionStatisticsService {

    CommissionOverviewResponse getOverview();

    List<CommissionByMonthResponse> getByMonth();

    List<TopSellerCommissionResponse> getTopSellers(int limit);

    SellerStatisticsResponse getStatistics(UUID accountId);
}
