package com.marketplace.ecommerce.product.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.QueryUtils;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.dto.request.PageQueryRequest;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QueryProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private ShopRepository shopRepository;
    @Mock
    private QueryUtils queryUtils;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private QueryProductServiceImpl queryProductService;

    private UUID productId;
    private Product product;
    private Shop shop;
    private User user;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();
        product = new Product();
        product.setId(productId);
        product.setName("Test Product");
        product.setImages(new HashSet<>());
        
        shop = new Shop();
        shop.setId(UUID.randomUUID());
        
        user = new User();
        user.setId(UUID.randomUUID());
    }

    @Test
    void getPublishedProducts_Success() {
        PageQueryRequest req = new PageQueryRequest();
        req.setPage(0);
        req.setSize(10);
        
        Page<Product> productPage = new PageImpl<>(Collections.singletonList(product));
        
        when(queryUtils.createSort(any(), any())).thenReturn(Sort.unsorted());
        when(productRepository.findPublishedProductsWithFilters(any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(productPage);

        Page<ProductResponse> result = queryProductService.getPublishedProducts(req);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }

    @Test
    void getPublishedProductById_Success() {
        when(productRepository.findPublishedByIdWithDetails(productId)).thenReturn(Optional.of(product));

        ProductResponse response = queryProductService.getPublishedProductById(productId);

        assertNotNull(response);
    }

    @Test
    void getPublishedProductById_NotFound() {
        when(productRepository.findPublishedByIdWithDetails(productId)).thenReturn(Optional.empty());

        assertThrows(CustomException.class, () -> queryProductService.getPublishedProductById(productId));
    }

    @Test
    void getProductById_Success() {
        when(productRepository.findByIdWithDetails(productId)).thenReturn(Optional.of(product));

        ProductResponse response = queryProductService.getProductById(productId);

        assertNotNull(response);
    }

    @Test
    void getProductsByShopAndStatus_All_Success() {
        UUID accountId = UUID.randomUUID();
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.of(shop));
        when(productRepository.findAllByShopIdWithDetails(shop.getId())).thenReturn(Collections.singletonList(product));

        List<ProductResponse> result = queryProductService.getProductsByShopAndStatus(accountId, null);

        assertFalse(result.isEmpty());
    }

    @Test
    void getProductsByShopAndStatus_WithStatus_Success() {
        UUID accountId = UUID.randomUUID();
        String status = "PUBLISHED";
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.of(shop));
        when(productRepository.findAllByShopIdAndStatusWithDetails(eq(shop.getId()), any(ProductStatus.class)))
                .thenReturn(Collections.singletonList(product));

        List<ProductResponse> result = queryProductService.getProductsByShopAndStatus(accountId, status);

        assertFalse(result.isEmpty());
    }

    @Test
    void parseStatus_Invalid() {
        assertThrows(CustomException.class, () -> queryProductService.parseStatus("INVALID"));
    }
}
