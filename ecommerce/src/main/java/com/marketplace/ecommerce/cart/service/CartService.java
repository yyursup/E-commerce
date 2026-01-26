package com.marketplace.ecommerce.cart.service;

import com.marketplace.ecommerce.cart.dto.request.AddToCartRequest;
import com.marketplace.ecommerce.cart.dto.response.CartResponse;
import com.marketplace.ecommerce.cart.entity.Cart;

import java.util.UUID;

public interface CartService {

    CartResponse addToCart(UUID accountID, AddToCartRequest request);

    CartResponse add(UUID accountID, UUID cartItemId);

    CartResponse minus(UUID accountID, UUID cartItemId);

    CartResponse getCartByAccountId(UUID accountId);

    CartResponse deleteItem(UUID accountId, UUID cartItemId);
}
