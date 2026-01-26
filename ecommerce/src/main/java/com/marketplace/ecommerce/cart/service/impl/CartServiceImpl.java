package com.marketplace.ecommerce.cart.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.cart.dto.request.AddToCartRequest;
import com.marketplace.ecommerce.cart.dto.response.CartResponse;
import com.marketplace.ecommerce.cart.entity.Cart;
import com.marketplace.ecommerce.cart.entity.CartItem;
import com.marketplace.ecommerce.cart.repository.CartItemRepository;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.cart.service.CartService;
import com.marketplace.ecommerce.cart.validate.CartValidation;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final CartValidation cartValidation;

    @Override
    @Transactional
    public CartResponse deleteItem(UUID accountId, UUID cartItemId) {
        User user = getUserByAccountId(accountId);

        CartItem cartItem = getActiveCartItemOfUser(user.getId(), cartItemId);

        cartItem.setDeleted(true);
        cartItem.setQuantity(0); // optional
        cartItemRepository.save(cartItem);

        Cart cart = cartRepository.findByUserIdWithItems(user.getId())
                .orElseThrow(() -> new CustomException("Cart not found"));

        return CartResponse.fromCart(cart);
    }


    @Override
    @Transactional(readOnly = true)
    public CartResponse getCartByAccountId(UUID accountId) {
        User user = getUserByAccountId(accountId);
        Cart cart = getCartWithItemsByUserId(user.getId());
        return CartResponse.fromCart(cart);
    }


    @Override
    @Transactional
    public CartResponse minus(UUID accountID, UUID cartItemId) {
        User user = getUserByAccountId(accountID);
        CartItem cartItem = getActiveCartItemOfUser(user.getId(), cartItemId);

        int newQty = cartItem.getQuantity() - 1;
        if (newQty <= 0) {
            cartItem.setDeleted(true);
            cartItem.setQuantity(0);
        } else {
            cartItem.setQuantity(newQty);
        }

        cartItemRepository.save(cartItem);

        return CartResponse.fromCart(getCartWithItemsByUserId(user.getId()));
    }

    @Override
    @Transactional
    public CartResponse add(UUID accountID, UUID cartItemId) {
        User user = getUserByAccountId(accountID);
        CartItem cartItem = getActiveCartItemOfUser(user.getId(), cartItemId);

        Product product = getPublishedProduct(cartItem.getProduct().getId());

        int newQty = cartItem.getQuantity() + 1;
        cartValidation.ensureStock(product, newQty, "Out of stock");

        cartItem.setQuantity(newQty);
        cartItemRepository.save(cartItem);

        return CartResponse.fromCart(getCartWithItemsByUserId(user.getId()));
    }

    @Override
    @Transactional
    public CartResponse addToCart(UUID accountID, AddToCartRequest request) {
        User user = getUserByAccountId(accountID);

        int reqQty = cartValidation.normalizeAndValidateQuantity(request.getQuantity());

        Product product = getPublishedProduct(request.getProductId());

        Cart cart = getCartWithItemsByUserId(user.getId());

        CartItem existing = findActiveItemByProduct(cart, product.getId());

        if (existing != null) {
            int newQty = existing.getQuantity() + reqQty;
            cartValidation.ensureStock(product, newQty, "Not enough quantity");
            existing.setQuantity(newQty);
        } else {
            cartValidation.ensureStock(product, reqQty, "Not enough quantity");

            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProduct(product);
            newItem.setQuantity(reqQty);
            newItem.setUnitPrice(product.getBasePrice());
            newItem.setCreatedAt(LocalDateTime.now());
            cart.getItems().add(newItem);
        }

        cartRepository.save(cart);

        return CartResponse.fromCart(getCartWithItemsByUserId(user.getId()));
    }


    private User getUserByAccountId(UUID accountId) {
        return userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Product getPublishedProduct(UUID productId) {
        return productRepository.findPublishedByIdWithDetails(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    private Cart getCartByUserId(UUID userId) {
        return cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found"));
    }

    private Cart getCartWithItemsByUserId(UUID userId) {
        return cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new CustomException("Cart not found"));
    }

    private CartItem getActiveCartItemOfUser(UUID userId, UUID cartItemId) {
        return cartItemRepository.findActiveByIdAndUserId(userId, cartItemId)
                .orElseThrow(() -> new CustomException("CartItem not found"));
    }

    private CartItem findActiveItemByProduct(Cart cart, UUID productId) {
        return cart.getActiveCartDetails().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .findFirst()
                .orElse(null);
    }


}
