package com.marketplace.ecommerce.product.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.product.dto.request.CreateProductRequest;
import com.marketplace.ecommerce.product.dto.request.UpdateProductRequest;
import com.marketplace.ecommerce.product.dto.response.SellerProductResponse;
import com.marketplace.ecommerce.product.service.ProductService;
import com.marketplace.ecommerce.product.service.QueryProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/seller")
@RequiredArgsConstructor
public class SellerProductController {

    private final ProductService productService;
    private final QueryProductService queryProductService;

    @PostMapping
    public ResponseEntity<SellerProductResponse> createProduct(
            @CurrentUser CurrentUserInfo u,
            @Valid @RequestBody CreateProductRequest request
    ) {
        SellerProductResponse created = productService.createProduct(u.getAccountId(), request);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/{productId}")
    public SellerProductResponse getProductById(@PathVariable UUID productId) {
        return queryProductService.getProductById(productId);
    }


    @GetMapping("/by-shop")
    public List<SellerProductResponse> getProductsByShop(
            @CurrentUser CurrentUserInfo u,
            @RequestParam(required = false) String status
    ) {

        return queryProductService.getProductsByShopAndStatus(u.getAccountId(), status);
    }

    @PutMapping("/{productId}")
    public ResponseEntity<SellerProductResponse> updateProduct(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID productId,
            @Valid @RequestBody UpdateProductRequest request
    ) {
        SellerProductResponse updated = productService.updateProduct(u.getAccountId(), productId, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteProduct(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID productId
    ) {
        productService.deleteProduct(u.getAccountId(), productId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{productId}/featured")
    public ResponseEntity<SellerProductResponse> toggleFeatured(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID productId
    ) {
        SellerProductResponse response = productService.toggleFeatured(u.getAccountId(), productId);
        return ResponseEntity.ok(response);
    }
}
