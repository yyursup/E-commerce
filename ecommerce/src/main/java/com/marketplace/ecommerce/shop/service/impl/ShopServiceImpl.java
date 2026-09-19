package com.marketplace.ecommerce.shop.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopService;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.shop.dto.response.ShopProfileResponse;
import com.marketplace.ecommerce.social.repository.ShopFollowerRepository;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.dto.projection.ShopReviewStatsProjection;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import com.marketplace.ecommerce.chat.repository.ChatThreadRepository;
import com.marketplace.ecommerce.chat.entity.ChatThread;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShopServiceImpl implements ShopService {
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final ShopFollowerRepository shopFollowerRepository;
    private final ReviewRepository reviewRepository;
    private final ChatThreadRepository chatThreadRepository;

    @Override
    public Shop createShop(User ownerUser, String shopName, Request req, Seller sellerDetail) {

        Shop shop = Shop.builder()
                .user(ownerUser)
                .name(shopName)
                .description(req.getDescription())
                .coverImageUrl(req.getCoverImageUrl())
                .logoUrl(req.getCoverImageUrl())
                .phoneNumber(sellerDetail.getShopPhone())
                .address(sellerDetail.getAddress() != null ? sellerDetail.getAddress() : sellerDetail.getPickupAddress())
                .pickupAddress(sellerDetail.getPickupAddress())
                .returnAddress(sellerDetail.getReturnAddress())
                .taxCode(sellerDetail.getTaxCode())
                .invoiceEmail(sellerDetail.getInvoiceEmail())
                .bankName(sellerDetail.getBankName())
                .bankAccountNumber(sellerDetail.getBankAccountNumber())
                .bankAccountName(sellerDetail.getBankAccountName())
                .sellerType(sellerDetail.getSellerType())
                .businessType(sellerDetail.getBusinessType())
                .businessName(sellerDetail.getBusinessName())
                .businessAddress(sellerDetail.getBusinessAddress())
                .businessLicenseUrl(sellerDetail.getBusinessLicenseUrl())
                .status(ShopStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return shopRepository.save(shop);
    }

    private ShopProfileResponse buildShopProfile(Shop s) {
        long productCount = 0L;
        try {
            productCount = productRepository.countByShopIdAndStatusAndDeletedFalse(s.getId(), ProductStatus.PUBLISHED);
        } catch (Throwable t) {
            log.warn("Failed to count products for shop {}: {}", s.getId(), t.getMessage());
        }

        long followerCount = 0L;
        try {
            followerCount = shopFollowerRepository.countByShopId(s.getId());
        } catch (Throwable t) {
            log.warn("Failed to count followers for shop {}: {}", s.getId(), t.getMessage());
        }

        long reviewCount = 0L;
        Float avgRating = (s.getAverageRating() != null && s.getAverageRating() > 0) ? s.getAverageRating() : null;
        try {
            ShopReviewStatsProjection reviewStats = reviewRepository.getShopStats(s.getId(), ReviewStatus.ACTIVE);
            if (reviewStats != null && reviewStats.getTotalReviews() != null && reviewStats.getTotalReviews() > 0) {
                reviewCount = reviewStats.getTotalReviews();
                if (reviewStats.getAvgRating() != null) {
                    avgRating = (float) (Math.round(reviewStats.getAvgRating() * 10.0) / 10.0);
                }
            }
        } catch (Throwable t) {
            log.warn("Failed to fetch review stats for shop {}: {}", s.getId(), t.getMessage());
        }

        String responseRate = "100%";
        try {
            List<ChatThread> threads = chatThreadRepository.findByShopId(s.getId());
            if (threads != null && !threads.isEmpty()) {
                long answered = threads.stream().filter(t -> t.getUnreadAdmin() == 0).count();
                int rate = (int) Math.round((double) answered * 100.0 / threads.size());
                responseRate = rate + "%";
            }
        } catch (Throwable t) {
            log.warn("Failed to compute response rate for shop {}: {}", s.getId(), t.getMessage());
        }

        return ShopProfileResponse.from(s, productCount, followerCount, reviewCount, avgRating, responseRate);
    }

    @Override
    public ShopProfileResponse getShopProfileById(UUID shopId) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin cửa hàng"));
        return buildShopProfile(shop);
    }

    @Override
    public List<ShopProfileResponse> getAllActiveShops() {
        return shopRepository.findAll().stream()
                .filter(s -> s.getStatus() == ShopStatus.ACTIVE)
                .map(this::buildShopProfile)
                .collect(Collectors.toList());
    }
}
