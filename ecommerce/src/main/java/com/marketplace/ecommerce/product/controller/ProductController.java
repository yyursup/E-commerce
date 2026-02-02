package com.marketplace.ecommerce.product.controller;

import com.marketplace.ecommerce.product.dto.request.PageQueryRequest;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.product.service.QueryProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/product")
@RequiredArgsConstructor
public class ProductController {
    private final QueryProductService queryProductService;

    @GetMapping("/{productId}")
    public ProductResponse getPublishedProductById(@PathVariable UUID productId) {
        return queryProductService.getPublishedProductById(productId);
    }

    @GetMapping
    public Page<ProductResponse> getPublishedProducts(@Valid @ModelAttribute PageQueryRequest req) {
        return queryProductService.getPublishedProducts(req);
    }

}
