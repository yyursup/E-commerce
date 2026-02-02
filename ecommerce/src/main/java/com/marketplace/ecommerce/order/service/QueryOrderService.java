package com.marketplace.ecommerce.order.service;

import com.marketplace.ecommerce.order.dto.response.OrderResponse;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;

import java.util.List;
import java.util.UUID;

public interface QueryOrderService {

    OrderResponse getOrderForUser(UUID orderId, UUID accountId);

    OrderResponse getOrderByIdAndShop(UUID orderId, UUID accountShopId);

    List<OrderResponse> listOrdersForUser(UUID accountId, OrderStatus status);

    List<OrderResponse> listOrdersForShop(UUID accountShopId, OrderStatus status);

    OrderResponse adminGetOrder(UUID orderId, UUID accountId);

    List<OrderResponse> adminListOrders(UUID accountId, OrderStatus statusOpt);
}
