package com.marketplace.ecommerce.social.service;

import com.marketplace.ecommerce.social.dto.FollowStatusResponse;

import java.util.UUID;

public interface ShopFollowerService {
    FollowStatusResponse toggleFollowShop(UUID accountId, UUID shopId);

    FollowStatusResponse getFollowStatus(UUID accountId, UUID shopId);

    long getFollowerCount(UUID shopId);
}
