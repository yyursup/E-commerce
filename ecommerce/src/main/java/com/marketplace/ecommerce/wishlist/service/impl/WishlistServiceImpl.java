package com.marketplace.ecommerce.wishlist.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.wishlist.dto.WishlistStatusResponse;
import com.marketplace.ecommerce.wishlist.entity.Wishlist;
import com.marketplace.ecommerce.wishlist.repository.WishlistRepository;
import com.marketplace.ecommerce.wishlist.service.WishlistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional
    public WishlistStatusResponse toggleWishlist(UUID accountId, UUID productId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new CustomException("Product not found"));

        Optional<Wishlist> existing = wishlistRepository.findByUserIdAndProductId(user.getId(), product.getId());
        boolean isWishlisted;

        if (existing.isPresent()) {
            wishlistRepository.delete(existing.get());
            isWishlisted = false;
        } else {
            Wishlist wishlist = Wishlist.builder()
                    .user(user)
                    .product(product)
                    .build();
            wishlistRepository.save(wishlist);
            isWishlisted = true;
        }

        long count = wishlistRepository.countByProductId(product.getId());
        return WishlistStatusResponse.builder()
                .wishlisted(isWishlisted)
                .wishlistCount(count)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public WishlistStatusResponse getWishlistStatus(UUID accountId, UUID productId) {
        long count = wishlistRepository.countByProductId(productId);
        boolean isWishlisted = false;

        if (accountId != null) {
            Optional<User> userOpt = userRepository.findByAccountId(accountId);
            if (userOpt.isPresent()) {
                isWishlisted = wishlistRepository.existsByUserIdAndProductId(userOpt.get().getId(), productId);
            }
        }

        return WishlistStatusResponse.builder()
                .wishlisted(isWishlisted)
                .wishlistCount(count)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getMyWishlist(UUID accountId, Pageable pageable) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        return wishlistRepository.findByUserId(user.getId(), pageable)
                .map(w -> ProductResponse.from(w.getProduct()));
    }
}
