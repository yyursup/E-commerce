package com.marketplace.ecommerce.shop.service;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.shop.entity.Shop;

public interface ShopService {
    Shop createShop(User ownerUser, String shopName, Request req, Seller sellerDetail);
}
