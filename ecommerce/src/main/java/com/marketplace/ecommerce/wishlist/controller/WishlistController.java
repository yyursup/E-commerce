package com.marketplace.ecommerce.wishlist.controller;

import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.wishlist.dto.WishlistStatusResponse;
import com.marketplace.ecommerce.wishlist.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @PostMapping("/toggle/{productId}")
    public ResponseEntity<WishlistStatusResponse> toggleWishlist(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable UUID productId
    ) {
        if (currentUser == null || currentUser.getAccountId() == null) {
            return ResponseEntity.status(401).build();
        }
        WishlistStatusResponse response = wishlistService.toggleWishlist(currentUser.getAccountId(), productId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{productId}")
    public ResponseEntity<WishlistStatusResponse> getWishlistStatus(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable UUID productId
    ) {
        UUID accountId = (currentUser != null) ? currentUser.getAccountId() : null;
        WishlistStatusResponse response = wishlistService.getWishlistStatus(accountId, productId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my")
    public ResponseEntity<Page<ProductResponse>> getMyWishlist(
            @CurrentUser CurrentUserInfo currentUser,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        if (currentUser == null || currentUser.getAccountId() == null) {
            return ResponseEntity.status(401).build();
        }
        Page<ProductResponse> response = wishlistService.getMyWishlist(currentUser.getAccountId(), pageable);
        return ResponseEntity.ok(response);
    }
}
