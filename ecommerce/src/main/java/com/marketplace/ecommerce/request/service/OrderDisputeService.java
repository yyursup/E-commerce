package com.marketplace.ecommerce.request.service;

import com.marketplace.ecommerce.request.dto.response.OrderDisputeResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface OrderDisputeService {
    boolean hasActiveDispute(UUID orderId);
    OrderDisputeResponse getDisputeInfo(UUID orderId);
    Map<UUID, OrderDisputeResponse> getDisputeInfoBatch(List<UUID> orderIds);
}
