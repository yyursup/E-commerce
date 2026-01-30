package com.marketplace.ecommerce.order.service;

import com.marketplace.ecommerce.order.dto.request.CreateOrderRequest;
import com.marketplace.ecommerce.order.dto.request.QuoteRequest;
import com.marketplace.ecommerce.order.dto.response.CheckoutConfirmResponse;
import com.marketplace.ecommerce.order.dto.response.OrderResponse;
import com.marketplace.ecommerce.order.dto.response.QuoteResponse;

import java.util.UUID;

public interface OrderService {

    OrderResponse convertCartToOrder(UUID accountId, CreateOrderRequest request);

    OrderResponse updateOrderStatus(UUID accountId ,UUID orderId, String status);


}
