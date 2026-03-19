package com.marketplace.ecommerce.platform.service;


import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.platform.dto.CommissionFilterRequest;
import com.marketplace.ecommerce.platform.dto.response.CommissionDetailResponse;
import com.marketplace.ecommerce.platform.dto.response.CommissionResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface CommissionService {

    List<CommissionResponse> getCommissions(CommissionFilterRequest filter);

    void createCommission(UUID orderId);

    CommissionDetailResponse getByOrderId(UUID orderId);

    BigDecimal getTotalCommissionBySeller(UUID accountId);

    BigDecimal getTotalNetIncomeBySeller(UUID accountId);
}
