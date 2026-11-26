package com.marketplace.ecommerce.order.service;

import com.marketplace.ecommerce.order.dto.response.OrderResponse;
import com.marketplace.ecommerce.order.dto.response.OrderStatusSummary;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface QueryOrderService {

    OrderResponse getOrderForUser(UUID orderId, UUID accountId);

    OrderResponse getOrderByIdAndShop(UUID orderId, UUID accountShopId);

    List<OrderResponse> listOrdersForUser(UUID accountId, OrderStatus status);

    List<OrderResponse> listOrdersForShop(UUID accountShopId, OrderStatus status);

    OrderResponse adminGetOrder(UUID orderId, UUID accountId);

    List<OrderResponse> adminListOrders(UUID accountId, OrderStatus statusOpt);

    List<OrderResponse> adminListOrders(UUID accountId, OrderStatus statusOpt, UUID shopId);

    // Bản phân trang: statuses rỗng = mọi trạng thái; q tìm theo mã đơn, tên/SĐT người nhận, mã GHN, tên sản phẩm
    Page<OrderResponse> pageOrdersForUser(UUID accountId, List<OrderStatus> statuses, String q, Pageable pageable);

    Page<OrderResponse> pageOrdersForShop(UUID accountShopId, List<OrderStatus> statuses, String q, Pageable pageable);

    Page<OrderResponse> adminPageOrders(UUID accountId, List<OrderStatus> statuses, UUID shopId, String q, Pageable pageable);

    List<OrderStatusSummary> summarizeForUser(UUID accountId);

    List<OrderStatusSummary> summarizeForShop(UUID accountShopId);
}
