package com.marketplace.ecommerce.order.dto.response;

import com.marketplace.ecommerce.order.valueObjects.OrderStatus;

import java.math.BigDecimal;

/** Số đơn và tổng tiền theo từng trạng thái (dùng cho tab đếm / thẻ số liệu khi danh sách đã phân trang). */
public record OrderStatusSummary(OrderStatus status, Long count, BigDecimal total) {
    public OrderStatusSummary {
        if (count == null) count = 0L;
        if (total == null) total = BigDecimal.ZERO;
    }
}
