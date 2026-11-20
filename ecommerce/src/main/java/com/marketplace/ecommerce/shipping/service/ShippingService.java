package com.marketplace.ecommerce.shipping.service;

import com.marketplace.ecommerce.cart.entity.CartItem;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.shipping.dto.request.GHNCreateOrderRequest;
import com.marketplace.ecommerce.shop.entity.Shop;

import java.math.BigDecimal;
import java.util.List;

public interface ShippingService {

    BigDecimal quoteFee(Shop shop, List<CartItem> cartItems, Integer toDistrictId, String toWardCode);

    GHNCreateOrderRequest build(Order order);

    /**
     * Báo giá cước GHN cho chiều trả hàng (ngược chiều giao): từ địa chỉ người mua về kho/địa chỉ của shop.
     *
     * @return cước GHN báo, hoặc null nếu thiếu dữ liệu địa chỉ / GHN lỗi (người gọi tự quyết định phương án thay thế)
     */
    BigDecimal quoteReturnFee(Order order);

    /**
     * Tạo đơn GHN thật cho chiều trả hàng (người mua -> shop).
     * @return mã đơn GHN, hoặc null nếu thiếu địa chỉ / GHN lỗi (caller dùng mã dự phòng).
     */
    String createReturnShipment(Order order);
}
