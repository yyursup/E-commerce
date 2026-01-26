package com.marketplace.ecommerce.cart.controller;

import com.marketplace.ecommerce.cart.dto.request.AddToCartRequest;
import com.marketplace.ecommerce.cart.dto.response.CartResponse;
import com.marketplace.ecommerce.cart.service.CartService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartResponse> getMyCart(@CurrentUser CurrentUserInfo u) {
        return ResponseEntity.ok(cartService.getCartByAccountId(u.getAccountId()));
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponse> addToCart(
            @CurrentUser CurrentUserInfo u,
            @RequestBody AddToCartRequest request
    ) {
        return ResponseEntity.ok(cartService.addToCart(u.getAccountId(), request));
    }

    @PostMapping("/items/{cartItemId}/plus")
    public ResponseEntity<CartResponse> plus(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID cartItemId
    ) {
        return ResponseEntity.ok(cartService.add(u.getAccountId(), cartItemId));
    }

    @PostMapping("/items/{cartItemId}/minus")
    public ResponseEntity<CartResponse> minus(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID cartItemId
    ) {
        return ResponseEntity.ok(cartService.minus(u.getAccountId(), cartItemId));
    }

    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponse> deleteItem(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID cartItemId
    ) {
        return ResponseEntity.ok(cartService.deleteItem(u.getAccountId(), cartItemId));
    }
}
