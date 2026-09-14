package com.marketplace.ecommerce.shop.service;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.shop.entity.Shop;

import com.marketplace.ecommerce.shop.dto.response.ShopProfileResponse;

import java.util.List;
import java.util.UUID;

public interface ShopService {
    Shop createShop(User ownerUser, String shopName, Request req, Seller sellerDetail);
    ShopProfileResponse getShopProfileById(UUID shopId);
    List<ShopProfileResponse> getAllActiveShops();
}
