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
}
