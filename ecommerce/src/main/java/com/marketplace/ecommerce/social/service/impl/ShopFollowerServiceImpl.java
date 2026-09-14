package com.marketplace.ecommerce.social.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.social.dto.FollowStatusResponse;
import com.marketplace.ecommerce.social.entity.ShopFollower;
import com.marketplace.ecommerce.social.repository.ShopFollowerRepository;
import com.marketplace.ecommerce.social.service.ShopFollowerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShopFollowerServiceImpl implements ShopFollowerService {

    private final ShopFollowerRepository shopFollowerRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;

    @Override
    @Transactional
    public FollowStatusResponse toggleFollowShop(UUID accountId, UUID shopId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new CustomException("Shop not found"));

        // Don't allow following own shop
        if (shop.getUser() != null && shop.getUser().getId().equals(user.getId())) {
            throw new CustomException("Bạn không thể tự theo dõi cửa hàng của chính mình");
        }

        Optional<ShopFollower> existing = shopFollowerRepository.findByUserIdAndShopId(user.getId(), shop.getId());
        boolean isFollowing;

        if (existing.isPresent()) {
            shopFollowerRepository.delete(existing.get());
            isFollowing = false;
        } else {
            ShopFollower follower = ShopFollower.builder()
                    .user(user)
                    .shop(shop)
                    .build();
            shopFollowerRepository.save(follower);
            isFollowing = true;
        }

        long count = shopFollowerRepository.countByShopId(shop.getId());
        return FollowStatusResponse.builder()
                .following(isFollowing)
                .followerCount(count)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public FollowStatusResponse getFollowStatus(UUID accountId, UUID shopId) {
        long count = shopFollowerRepository.countByShopId(shopId);
        boolean isFollowing = false;

        if (accountId != null) {
            Optional<User> userOpt = userRepository.findByAccountId(accountId);
            if (userOpt.isPresent()) {
                isFollowing = shopFollowerRepository.existsByUserIdAndShopId(userOpt.get().getId(), shopId);
            }
        }

        return FollowStatusResponse.builder()
                .following(isFollowing)
                .followerCount(count)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public long getFollowerCount(UUID shopId) {
        return shopFollowerRepository.countByShopId(shopId);
    }
}
