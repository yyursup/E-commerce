package com.marketplace.ecommerce.shop.controller;

import com.marketplace.ecommerce.shop.dto.response.ShopProfileResponse;
import com.marketplace.ecommerce.shop.service.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/shop")
@RequiredArgsConstructor
public class ShopController {
    private final ShopService shopService;

    @GetMapping("/{shopId}")
    public ResponseEntity<ShopProfileResponse> getShopProfile(@PathVariable UUID shopId) {
        return ResponseEntity.ok(shopService.getShopProfileById(shopId));
    }

    @GetMapping
    public ResponseEntity<List<ShopProfileResponse>> getAllShops() {
        return ResponseEntity.ok(shopService.getAllActiveShops());
    }
}
