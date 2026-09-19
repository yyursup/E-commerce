package com.marketplace.ecommerce.product.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
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
import com.marketplace.ecommerce.product.service.InventoryHistoryService;
import com.marketplace.ecommerce.product.valueObjects.InventoryActionType;


@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ProductImageService productImageService;
    private final ProductCategoryRepository productCategoryRepository;
    private final InventoryHistoryService inventoryHistoryService;

    @Override
    @Transactional
    public void deleteProduct(UUID accountId, UUID productId) {
        Shop shop = getShopByAccountId(accountId);
        int updated = productRepository.softDeleteByAccountId(productId, shop.getUser().getAccount().getId());
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

        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            request.getVariants().forEach(variantReq -> product.getVariants().add(
                    com.marketplace.ecommerce.product.entity.ProductVariant.builder()
                            .product(product)
                            .color(variantReq.getColor())
                            .size(variantReq.getSize())
                            .price(variantReq.getPrice())
                            .stock(variantReq.getStock())
                            .createdAt(LocalDateTime.now())
                            .deleted(false)
                            .build()
            ));
        }

        productImageService.createProductImage(product, request);

        Product productSaved = productRepository.save(product);

        inventoryHistoryService.logInventoryChange(shop, productSaved, null, 0, productSaved.getQuantity(), InventoryActionType.PRODUCT_CREATED, null, "Khởi tạo sản phẩm");
        if (productSaved.getVariants() != null && !productSaved.getVariants().isEmpty()) {
            productSaved.getVariants().forEach(v -> {
                inventoryHistoryService.logInventoryChange(shop, productSaved, v, 0, v.getStock(), InventoryActionType.PRODUCT_CREATED, null, "Khởi tạo biến thể");
            });
        }

        return ProductResponse.from(productSaved);
    }

    @Override
    public ProductResponse updateProduct(UUID accountId, UUID productId, UpdateProductRequest req) {
        Shop shop = getShopByAccountId(accountId);

        Product product = productRepository.findByIdAndDeletedFalse(productId)
                .orElseThrow(() -> new CustomException("Product not found"));

        assertOwner(shop, product);

        Integer oldStock = product.getQuantity();

        applyBasicFields(product, req);
        
        Integer newStock = product.getQuantity();
        if (oldStock != null && !oldStock.equals(newStock)) {
            inventoryHistoryService.logInventoryChange(shop, product, null, oldStock, newStock, InventoryActionType.STOCK_UPDATED, null, "Người bán cập nhật kho");
        }

        applySku(product, req);
        applyStatus(product, req);
        applyCategory(product, req);
        applyImages(product, req);
        
        // save product once to persist new variants if any, to avoid TransientPropertyValueException
        product = productRepository.save(product); 
        applyVariants(product, req, shop);

        return ProductResponse.from(productRepository.save(product));
    }

    private Shop getShopByAccountId(UUID accountId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        if (user.getAccount().getDisciplineLevel() == DisciplineLevel.SUSPENDED || user.getAccount().getDisciplineLevel() == DisciplineLevel.BANNED) {
            throw new CustomException("You do not have permission to manage products because your account is suspended or banned.");
        }

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
        if( req.getStockQuantity() != null){
            product.setQuantity(req.getStockQuantity());
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

    private void applyVariants(Product product, UpdateProductRequest req, Shop shop) {
        if (req.getVariants() == null) return;
        
        // Mark all existing as deleted
        if (product.getVariants() != null) {
            product.getVariants().forEach(v -> v.setDeleted(true));
        }

        for (com.marketplace.ecommerce.product.dto.request.ProductVariantRequest variantReq : req.getVariants()) {
            com.marketplace.ecommerce.product.entity.ProductVariant existing = null;
            if (variantReq.getId() != null) {
                existing = product.getVariants().stream()
                        .filter(v -> v.getId().equals(variantReq.getId()))
                        .findFirst()
                        .orElse(null);
            }

            if (existing != null) {
                Integer oldStock = existing.getStock();
                existing.setColor(variantReq.getColor());
                existing.setSize(variantReq.getSize());
                existing.setPrice(variantReq.getPrice());
                existing.setStock(variantReq.getStock());
                existing.setDeleted(false);
                existing.setUpdatedAt(LocalDateTime.now());
                if (oldStock != null && !oldStock.equals(variantReq.getStock())) {
                    inventoryHistoryService.logInventoryChange(shop, product, existing, oldStock, variantReq.getStock(), InventoryActionType.STOCK_UPDATED, null, "Người bán cập nhật kho");
                }
            } else {
                com.marketplace.ecommerce.product.entity.ProductVariant newVariant = com.marketplace.ecommerce.product.entity.ProductVariant.builder()
                                .product(product)
                                .color(variantReq.getColor())
                                .size(variantReq.getSize())
                                .price(variantReq.getPrice())
                                .stock(variantReq.getStock())
                                .createdAt(LocalDateTime.now())
                                .deleted(false)
                                .build();
                product.getVariants().add(newVariant);
                inventoryHistoryService.logInventoryChange(shop, product, newVariant, 0, variantReq.getStock(), InventoryActionType.STOCK_UPDATED, null, "Thêm biến thể mới");
            }
        }
    }
    @Override
    @Transactional
    public ProductResponse toggleFeatured(UUID accountId, UUID productId) {
        Shop shop = getShopByAccountId(accountId);

        Product product = productRepository.findByIdAndDeletedFalse(productId)
                .orElseThrow(() -> new CustomException("Sản phẩm không tồn tại"));

        assertOwner(shop, product);

        if (!product.isFeatured()) {
            // Check limit: max 5 featured products per shop
            long currentFeaturedCount = productRepository.countByShopIdAndFeaturedTrueAndDeletedFalse(shop.getId());
            if (currentFeaturedCount >= 5) {
                throw new CustomException("Bạn chỉ có thể đẩy nổi bật tối đa 5 sản phẩm. Hãy bỏ đẩy một sản phẩm khác trước.");
            }
        }

        product.setFeatured(!product.isFeatured());
        product.setUpdatedAt(java.time.LocalDateTime.now());
        return ProductResponse.from(productRepository.save(product));
    }

}
