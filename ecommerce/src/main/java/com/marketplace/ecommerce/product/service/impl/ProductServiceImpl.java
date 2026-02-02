package com.marketplace.ecommerce.product.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.dto.request.CreateProductRequest;
import com.marketplace.ecommerce.product.dto.request.UpdateProductRequest;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.repository.ProductCategoryRepository;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.service.ProductImageService;
import com.marketplace.ecommerce.product.service.ProductService;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ProductImageService productImageService;
    private final ProductCategoryRepository productCategoryRepository;

    @Override
    @Transactional
    public void deleteProduct(UUID accountId, UUID productId) {
        int updated = productRepository.softDeleteByAccountId(productId, accountId);
        if (updated == 0) {
            throw new CustomException("Product can not found or you don't have permission to delete this product");
        }
    }

    @Override
    @Transactional
    public ProductResponse createProduct(UUID accountId, CreateProductRequest request) {
        Shop shop = getShopByAccountId(accountId);

        if (productRepository.existsBySkuAndDeletedFalse(request.getSku())) {
            throw new CustomException("SKU already exists: " + request.getSku());
        }

        ProductCategory category = productCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new CustomException("Category not found"));

        Product product = Product.builder()
                .shop(shop)
                .name(request.getName())
                .description(request.getDescription())
                .basePrice(request.getBasePrice())
                .sku(request.getSku())
                .quantity(request.getStockQuantity())
                .status(ProductStatus.PUBLISHED)
                .productCategory(category)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .deleted(false)
                .build();

        productImageService.createProductImage(product, request);

        Product productSaved = productRepository.save(product);

        return ProductResponse.from(productSaved);
    }

    @Override
    public ProductResponse updateProduct(UUID accountId, UUID productId, UpdateProductRequest req) {
        Shop shop = getShopByAccountId(accountId);

        Product product = productRepository.findByIdAndDeletedFalse(productId)
                .orElseThrow(() -> new CustomException("Product not found"));

        assertOwner(shop, product);

        applyBasicFields(product, req);
        applySku(product, req);
        applyStatus(product, req);
        applyCategory(product, req);
        applyImages(product, req);

        return ProductResponse.from(productRepository.save(product));
    }

    private Shop getShopByAccountId(UUID accountId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        return shopRepository.findByUserId(user.getId())
                .orElseThrow(() -> new CustomException("Shop not found"));
    }

    private void assertOwner(Shop shop, Product product) {
        if (!product.getShop().getId().equals(shop.getId())) {
            throw new CustomException("You don't have permission to update this product");
        }
    }

    private void applyBasicFields(Product product, UpdateProductRequest req) {
        if (req.getName() != null && !req.getName().isBlank()) {
            product.setName(req.getName().trim());
        }
        if (req.getDescription() != null) {
            product.setDescription(req.getDescription().trim());
        }
        if (req.getBasePrice() != null) {
            product.setBasePrice(req.getBasePrice());
        }
        product.setUpdatedAt(LocalDateTime.now());
    }

    private void applySku(Product product, UpdateProductRequest req) {
        if (req.getSku() == null || req.getSku().isBlank()) return;

        String newSku = req.getSku().trim();

        if (!newSku.equals(product.getSku())
                && productRepository.existsBySkuAndDeletedFalse(newSku)) {
            throw new CustomException("SKU already exists: " + newSku);
        }

        product.setSku(newSku);
    }

    private void applyStatus(Product product, UpdateProductRequest req) {
        if (req.getStatus() == null || req.getStatus().isBlank()) return;

        try {
            product.setStatus(ProductStatus.valueOf(req.getStatus().trim().toUpperCase()));
        } catch (IllegalArgumentException ex) {
            throw new CustomException("Invalid status: " + req.getStatus());
        }
    }

    private void applyCategory(Product product, UpdateProductRequest req) {
        if (req.getCategoryId() == null) return;

        ProductCategory category = productCategoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new CustomException("Category not found"));

        product.setProductCategory(category);
    }

    private void applyImages(Product product, UpdateProductRequest req) {
        if (req.getImages() == null) return;

        long thumbnailCount = req.getImages().stream()
                .filter(i -> Boolean.TRUE.equals(i.getIsThumbnail()))
                .count();

        if (thumbnailCount > 1) {
            throw new CustomException("Only one thumbnail image is allowed");
        }

        product.getImages().clear();

        req.getImages().forEach(imgReq -> product.getImages().add(
                com.marketplace.ecommerce.product.entity.ProductImage.builder()
                        .product(product)
                        .imageUrl(imgReq.getImageUrl())
                        .isThumbnail(Boolean.TRUE.equals(imgReq.getIsThumbnail()))
                        .displayOrder(imgReq.getDisplayOrder() == null ? 0 : imgReq.getDisplayOrder())
                        .createdAt(LocalDateTime.now())
                        .build()
        ));
    }


}
