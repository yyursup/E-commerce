package com.marketplace.ecommerce.order.service;

import com.marketplace.ecommerce.order.dto.request.CreateOrderRequest;
import com.marketplace.ecommerce.order.dto.response.OrderResponse;
import com.marketplace.ecommerce.order.dto.response.ShopRankingItem;
import com.marketplace.ecommerce.order.entity.Order;

import java.util.List;
import java.util.UUID;

public interface OrderService {

    OrderResponse convertCartToOrder(UUID accountId, CreateOrderRequest request);

    OrderResponse updateOrderStatus(UUID accountId ,UUID orderId, String status);

    void markReceivedByBuyer(UUID orderId, UUID accountId);

    void autoMarkReceivedOrders();

    void autoReceiveAndRelease(UUID orderId);

    OrderResponse retryCreateGhnOrder(UUID orderId, UUID accountId);

    OrderResponse setGhnOrderCodeManually(UUID orderId, String ghnOrderCode, UUID accountId);

    void tryCreateGHNOrder(Order order);

    List<ShopRankingItem> getShopRanking();
}
