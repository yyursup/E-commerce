package com.marketplace.ecommerce.wishlist.service;

import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.wishlist.dto.WishlistStatusResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface WishlistService {
    WishlistStatusResponse toggleWishlist(UUID accountId, UUID productId);

    WishlistStatusResponse getWishlistStatus(UUID accountId, UUID productId);

    Page<ProductResponse> getMyWishlist(UUID accountId, Pageable pageable);
}
