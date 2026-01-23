package com.marketplace.ecommerce.shop.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopService;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
@RequiredArgsConstructor
public class ShopServiceImpl implements ShopService {
    private final ShopRepository shopRepository;

    public Shop createShop(User ownerUser, String shopName, Request req, Seller sellerDetail) {

        Shop shop = Shop.builder()
                .user(ownerUser)
                .name(shopName)
                .description(req.getDescription())
                .coverImageUrl(req.getCoverImageUrl())
                .logoUrl(req.getCoverImageUrl())
                .phoneNumber(sellerDetail.getShopPhone())
                .address(sellerDetail.getAddress())
                .status(ShopStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return shopRepository.save(shop);
    }
}
