package com.marketplace.ecommerce.product.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.dto.request.CreateProductRequest;
import com.marketplace.ecommerce.product.dto.request.ProductImageRequest;
import com.marketplace.ecommerce.product.dto.request.UpdateProductRequest;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.repository.ProductCategoryRepository;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.service.ProductImageService;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ShopRepository shopRepository;
    @Mock
    private ProductImageService productImageService;
    @Mock
    private ProductCategoryRepository productCategoryRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private UUID accountId;
    private UUID productId;
    private User user;
    private Shop shop;
    private ProductCategory category;
    private Product product;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        productId = UUID.randomUUID();
        user = new User();
        user.setId(UUID.randomUUID());
        
        shop = new Shop();
        shop.setId(UUID.randomUUID());
        
        category = new ProductCategory();
        category.setId(UUID.randomUUID());
        category.setName("Electronics");

        product = Product.builder()
                .id(productId)
                .name("Test Product")
                .sku("SKU123")
                .basePrice(BigDecimal.valueOf(100.0))
                .shop(shop)
                .productCategory(category)
                .status(ProductStatus.PUBLISHED)
                .deleted(false)
                .images(new HashSet<>())
                .build();
    }

    @Test
    void deleteProduct_Success() {
        when(productRepository.softDeleteByAccountId(productId, accountId)).thenReturn(1);
        
        assertDoesNotThrow(() -> productService.deleteProduct(accountId, productId));
        verify(productRepository).softDeleteByAccountId(productId, accountId);
    }

    @Test
    void deleteProduct_NotFound_ThrowsException() {
        when(productRepository.softDeleteByAccountId(productId, accountId)).thenReturn(0);
        
        CustomException exception = assertThrows(CustomException.class, 
                () -> productService.deleteProduct(accountId, productId));
        assertEquals("Product can not found or you don't have permission to delete this product", exception.getMessage());
    }

    @Test
    void createProduct_Success() {
        CreateProductRequest request = new CreateProductRequest();
        request.setName("New Product");
        request.setSku("SKU456");
        request.setCategoryId(category.getId());
        request.setBasePrice(BigDecimal.valueOf(200.0));
        request.setStockQuantity(10);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.of(shop));
        when(productRepository.existsBySkuAndDeletedFalse(request.getSku())).thenReturn(false);
        when(productCategoryRepository.findById(category.getId())).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        ProductResponse response = productService.createProduct(accountId, request);

        assertNotNull(response);
        verify(productImageService).createProductImage(any(Product.class), eq(request));
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void createProduct_SkuExists_ThrowsException() {
        CreateProductRequest request = new CreateProductRequest();
        request.setSku("SKU_EXIST");

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.of(shop));
        when(productRepository.existsBySkuAndDeletedFalse(request.getSku())).thenReturn(true);

        CustomException exception = assertThrows(CustomException.class, 
                () -> productService.createProduct(accountId, request));
        assertTrue(exception.getMessage().contains("SKU already exists"));
    }

    @Test
    void createProduct_CategoryNotFound_ThrowsException() {
        CreateProductRequest request = new CreateProductRequest();
        request.setSku("SKU456");
        request.setCategoryId(UUID.randomUUID());

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.of(shop));
        when(productRepository.existsBySkuAndDeletedFalse(request.getSku())).thenReturn(false);
        when(productCategoryRepository.findById(any())).thenReturn(Optional.empty());

        CustomException exception = assertThrows(CustomException.class, 
                () -> productService.createProduct(accountId, request));
        assertEquals("Category not found", exception.getMessage());
    }

    @Test
    void updateProduct_Success() {
        UpdateProductRequest req = new UpdateProductRequest();
        req.setName("Updated Name");
        req.setStatus("DRAFT");

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.of(shop));
        when(productRepository.findByIdAndDeletedFalse(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArguments()[0]);

        ProductResponse response = productService.updateProduct(accountId, productId, req);

        assertEquals("Updated Name", response.getName());
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void updateProduct_NotOwner_ThrowsException() {
        Shop otherShop = new Shop();
        otherShop.setId(UUID.randomUUID());
        product.setShop(otherShop);

        UpdateProductRequest req = new UpdateProductRequest();

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.of(shop));
        when(productRepository.findByIdAndDeletedFalse(productId)).thenReturn(Optional.of(product));

        CustomException exception = assertThrows(CustomException.class, 
                () -> productService.updateProduct(accountId, productId, req));
        assertEquals("You don't have permission to update this product", exception.getMessage());
    }

    @Test
    void updateProduct_InvalidStatus_ThrowsException() {
        UpdateProductRequest req = new UpdateProductRequest();
        req.setStatus("INVALID_STATUS");

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.of(shop));
        when(productRepository.findByIdAndDeletedFalse(productId)).thenReturn(Optional.of(product));

        CustomException exception = assertThrows(CustomException.class, 
                () -> productService.updateProduct(accountId, productId, req));
        assertTrue(exception.getMessage().contains("Invalid status"));
    }

    @Test
    void updateProduct_MultipleThumbnails_ThrowsException() {
        UpdateProductRequest req = new UpdateProductRequest();
        ProductImageRequest img1 = new ProductImageRequest();
        img1.setIsThumbnail(true);
        ProductImageRequest img2 = new ProductImageRequest();
        img2.setIsThumbnail(true);
        req.setImages(Arrays.asList(img1, img2));

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.of(shop));
        when(productRepository.findByIdAndDeletedFalse(productId)).thenReturn(Optional.of(product));

        CustomException exception = assertThrows(CustomException.class, 
                () -> productService.updateProduct(accountId, productId, req));
        assertEquals("Only one thumbnail image is allowed", exception.getMessage());
    }

    @Test
    void getShopByAccountId_UserNotFound_ThrowsException() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        
        CustomException exception = assertThrows(CustomException.class, 
                () -> productService.createProduct(accountId, new CreateProductRequest()));
        assertEquals("User not found", exception.getMessage());
    }

    @Test
    void getShopByAccountId_ShopNotFound_ThrowsException() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.empty());
        
        CustomException exception = assertThrows(CustomException.class, 
                () -> productService.createProduct(accountId, new CreateProductRequest()));
        assertEquals("Shop not found", exception.getMessage());
    }
}
