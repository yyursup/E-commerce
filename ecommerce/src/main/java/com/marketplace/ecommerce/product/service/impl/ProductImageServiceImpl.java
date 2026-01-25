package com.marketplace.ecommerce.product.service.impl;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.dto.request.CreateProductRequest;
import com.marketplace.ecommerce.product.dto.request.ProductImageRequest;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductImage;
import com.marketplace.ecommerce.product.repository.ProductImageRepository;
import com.marketplace.ecommerce.product.service.ProductImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ProductImageServiceImpl implements ProductImageService {
    @Override
    public void createProductImage(Product product, CreateProductRequest request) {
        if (request.getImages() == null || request.getImages().isEmpty()) return;

        long thumbnailCount = request.getImages().stream()
                .filter(i -> Boolean.TRUE.equals(i.getIsThumbnail()))
                .count();
        if (thumbnailCount > 1) {
            throw new CustomException("Only one thumbnail is allowed");
        }

        for (ProductImageRequest imageRequest : request.getImages()) {
            ProductImage image = ProductImage.builder()
                    .product(product)
                    .imageUrl(imageRequest.getImageUrl())
                    .isThumbnail(Boolean.TRUE.equals(imageRequest.getIsThumbnail()))
                    .createdAt(LocalDateTime.now())
                    .displayOrder(imageRequest.getDisplayOrder() == null ? 0 : imageRequest.getDisplayOrder())
                    .build();

            product.getImages().add(image);
        }
    }
}