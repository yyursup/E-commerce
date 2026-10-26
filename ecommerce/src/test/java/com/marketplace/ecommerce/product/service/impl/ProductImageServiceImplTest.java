package com.marketplace.ecommerce.product.service.impl;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.dto.request.CreateProductRequest;
import com.marketplace.ecommerce.product.dto.request.ProductImageRequest;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductImage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ProductImageServiceImplTest {

    private ProductImageServiceImpl service;
    private Product product;

    @BeforeEach
    void setUp() {
        service = new ProductImageServiceImpl();
        product = new Product();
        product.setImages(new HashSet<>());
    }

    @Test
    @DisplayName("createProductImage không làm gì khi request.getImages rỗng hoặc null")
    void testCreateProductImage_Empty() {
        CreateProductRequest req1 = new CreateProductRequest();
        req1.setImages(null);
        service.createProductImage(product, req1);
        assertTrue(product.getImages().isEmpty());

        CreateProductRequest req2 = new CreateProductRequest();
        req2.setImages(List.of());
        service.createProductImage(product, req2);
        assertTrue(product.getImages().isEmpty());
    }

    @Test
    @DisplayName("createProductImage ném ngoại lệ khi có nhiều hơn 1 thumbnail")
    void testCreateProductImage_MultipleThumbnails() {
        ProductImageRequest img1 = new ProductImageRequest();
        img1.setImageUrl("http://img1.jpg");
        img1.setIsThumbnail(true);

        ProductImageRequest img2 = new ProductImageRequest();
        img2.setImageUrl("http://img2.jpg");
        img2.setIsThumbnail(true);

        CreateProductRequest req = new CreateProductRequest();
        req.setImages(List.of(img1, img2));

        CustomException ex = assertThrows(CustomException.class, () -> service.createProductImage(product, req));
        assertTrue(ex.getMessage().contains("Only one thumbnail is allowed"));
    }

    @Test
    @DisplayName("createProductImage gán đúng danh sách ảnh vào product khi hợp lệ")
    void testCreateProductImage_Success() {
        ProductImageRequest img1 = new ProductImageRequest();
        img1.setImageUrl("http://img1.jpg");
        img1.setIsThumbnail(true);
        img1.setDisplayOrder(0);

        ProductImageRequest img2 = new ProductImageRequest();
        img2.setImageUrl("http://img2.jpg");
        img2.setIsThumbnail(false);
        img2.setDisplayOrder(1);

        CreateProductRequest req = new CreateProductRequest();
        req.setImages(List.of(img1, img2));

        service.createProductImage(product, req);
        assertEquals(2, product.getImages().size());

        assertTrue(product.getImages().stream().anyMatch(i ->
                "http://img1.jpg".equals(i.getImageUrl()) && Boolean.TRUE.equals(i.getIsThumbnail())));
        assertTrue(product.getImages().stream().anyMatch(i ->
                "http://img2.jpg".equals(i.getImageUrl()) && Boolean.FALSE.equals(i.getIsThumbnail())));
    }
}
