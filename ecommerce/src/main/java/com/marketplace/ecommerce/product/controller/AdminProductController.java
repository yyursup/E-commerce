package com.marketplace.ecommerce.product.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.product.dto.request.RejectProductRequest;
import com.marketplace.ecommerce.product.dto.response.SellerProductResponse;
import com.marketplace.ecommerce.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SellerProductResponse>> getPendingProducts() {
        return ResponseEntity.ok(productService.getPendingProducts());
    }

    @PostMapping("/{productId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SellerProductResponse> approveProduct(
            @CurrentUser CurrentUserInfo admin,
            @PathVariable UUID productId
    ) {
        return ResponseEntity.ok(productService.approveProduct(admin.getAccountId(), productId));
    }

    @PostMapping("/{productId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SellerProductResponse> rejectProduct(
            @CurrentUser CurrentUserInfo admin,
            @PathVariable UUID productId,
            @Valid @RequestBody(required = false) RejectProductRequest request
    ) {
        String reason = request != null ? request.getReason() : null;
        return ResponseEntity.ok(productService.rejectProduct(admin.getAccountId(), productId, reason));
    }
}
