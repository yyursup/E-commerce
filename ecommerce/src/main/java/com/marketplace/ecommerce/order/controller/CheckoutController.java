package com.marketplace.ecommerce.order.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.order.dto.request.QuoteRequest;
import com.marketplace.ecommerce.order.dto.response.CheckoutConfirmResponse;
import com.marketplace.ecommerce.order.dto.response.QuoteResponse;
import com.marketplace.ecommerce.order.service.CheckoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/checkout")
@RequiredArgsConstructor
public class CheckoutController {
    private final CheckoutService checkoutService;


    @GetMapping("/confirm")
    public ResponseEntity<CheckoutConfirmResponse> confirm(
            @CurrentUser CurrentUserInfo c,
            @RequestParam("shopId") UUID shopId
    ) {
        return ResponseEntity.ok(checkoutService.confirm(c.getAccountId(), shopId));
    }

    @PostMapping("/quote")
    public ResponseEntity<QuoteResponse> quote(
            @CurrentUser CurrentUserInfo c,
            @RequestBody QuoteRequest req
    ) {
        return ResponseEntity.ok(checkoutService.quote(c.getAccountId(), req));
    }
}
