package com.marketplace.ecommerce.product.controller;

import com.marketplace.ecommerce.product.dto.response.CategoryResponse;
import com.marketplace.ecommerce.product.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(version = "1", path = "/category")
@RequiredArgsConstructor
public class CategoriesController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @PutMapping("/{id}/commission-rate")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryResponse> updateCommissionRate(
            @PathVariable java.util.UUID id,
            @jakarta.validation.Valid @RequestBody com.marketplace.ecommerce.product.dto.request.UpdateCategoryCommissionRequest request) {
        return ResponseEntity.ok(categoryService.updateCommissionRate(id, request.getCommissionRate()));
    }
}

