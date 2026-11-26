package com.marketplace.ecommerce.product.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.QueryUtils;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.dto.request.PageQueryRequest;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.product.dto.response.SellerProductResponse;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.valueObjects.ConditionGrade;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.product.valueObjects.WarrantyType;
import com.marketplace.ecommerce.review.dto.projection.ProductReviewStatsProjection;
import com.marketplace.ecommerce.review.dto.projection.ReviewStatsProjection;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Answers;
import org.springframework.data.jpa.domain.Specification;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

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
    @Mock
    private ReviewRepository reviewRepository;

    @InjectMocks
    private QueryProductServiceImpl queryProductService;

    private UUID productId;
    private UUID shopId;
    private UUID accountId;
    private UUID userId;
    private Shop shop;
    private User user;
    private Product product;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();
        shopId = UUID.randomUUID();
        accountId = UUID.randomUUID();
        userId = UUID.randomUUID();

        user = new User();
        user.setId(userId);

        shop = new Shop();
        shop.setId(shopId);
        shop.setUser(user);

        ProductCategory category = new ProductCategory();
        category.setId(UUID.randomUUID());
        category.setName("Điện thoại");

        product = Product.builder()
                .id(productId)
                .name("iPhone 15 Pro")
                .basePrice(BigDecimal.valueOf(25000000))
                .status(ProductStatus.PUBLISHED)
                .productCategory(category)
                .shop(shop)
                .conditionGrade(ConditionGrade.GRADE_LIKE_NEW)
                .warrantyType(WarrantyType.OFFICIAL)
                .warrantyMonths(12)
                .quantity(10)
                .sold(5)
                .deleted(false)
                .build();
    }

    @Test
    @DisplayName("getPublishedProducts phân trang và làm giàu đánh giá (enrichReviewStats)")
    void testGetPublishedProducts() {
        PageQueryRequest req = PageQueryRequest.builder()
                .page(0)
                .size(10)
                .search("iphone")
                .sortBy("basePrice")
                .sortDir("ASC")
                .build();

        when(queryUtils.createSort("basePrice", "ASC")).thenReturn(Sort.by(Sort.Direction.ASC, "basePrice"));
        Page<Product> page = new PageImpl<>(List.of(product));
        when(productRepository.findPublishedProductsWithFilters(any(), any(), any(), any(), any(), any(), eq("iphone"), any(Pageable.class)))
                .thenReturn(page);

        ProductReviewStatsProjection stat = mock(ProductReviewStatsProjection.class);
        when(stat.getProductId()).thenReturn(productId);
        when(stat.getTotalReviews()).thenReturn(15L);
        when(stat.getAvgRating()).thenReturn(4.8);
        when(reviewRepository.getStatsForProducts(List.of(productId), ReviewStatus.ACTIVE))
                .thenReturn(List.of(stat));

        Page<ProductResponse> result = queryProductService.getPublishedProducts(req);
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        ProductResponse res = result.getContent().get(0);
        assertEquals(productId, res.getId());
        assertEquals(4.8, res.getRating());
        assertEquals(15L, res.getReviewCount());
    }

    @Test
    @DisplayName("getPublishedProducts với phân trang ngoài giới hạn và không có đánh giá")
    void testGetPublishedProducts_EdgePagination() {
        PageQueryRequest req = PageQueryRequest.builder()
                .page(-1)
                .size(200)
                .build();

        when(queryUtils.createSort(any(), any())).thenReturn(Sort.unsorted());
        Page<Product> page = new PageImpl<>(List.of(product));
        when(productRepository.findPublishedProductsWithFilters(any(), any(), any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(page);
        when(reviewRepository.getStatsForProducts(List.of(productId), ReviewStatus.ACTIVE))
                .thenReturn(Collections.emptyList());

        Page<ProductResponse> result = queryProductService.getPublishedProducts(req);
        assertNotNull(result);
        assertNull(result.getContent().get(0).getRating());
        assertEquals(0L, result.getContent().get(0).getReviewCount());
    }

    @Test
    @DisplayName("getPublishedProductById thành công và làm giàu đánh giá đơn")
    void testGetPublishedProductById_Success() {
        when(productRepository.findPublishedByIdWithDetails(productId)).thenReturn(Optional.of(product));

        ReviewStatsProjection stats = mock(ReviewStatsProjection.class);
        when(stats.getTotalReviews()).thenReturn(20L);
        when(stats.getAvgRating()).thenReturn(4.9);
        when(reviewRepository.getStats(productId, ReviewStatus.ACTIVE)).thenReturn(stats);

        ProductResponse res = queryProductService.getPublishedProductById(productId);
        assertNotNull(res);
        assertEquals(productId, res.getId());
        assertEquals(4.9, res.getRating());
        assertEquals(20L, res.getReviewCount());
    }

    @Test
    @DisplayName("getPublishedProductById ném ngoại lệ khi sản phẩm không tồn tại")
    void testGetPublishedProductById_NotFound() {
        when(productRepository.findPublishedByIdWithDetails(productId)).thenReturn(Optional.empty());

        assertThrows(CustomException.class, () -> queryProductService.getPublishedProductById(productId));
    }

    @Test
    @DisplayName("getProductById cho Seller thành công và ném ngoại lệ khi không tìm thấy")
    void testGetProductById() {
        when(productRepository.findByIdWithDetails(productId)).thenReturn(Optional.of(product));
        SellerProductResponse res = queryProductService.getProductById(productId);
        assertNotNull(res);
        assertEquals(productId, res.getId());

        when(productRepository.findByIdWithDetails(productId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> queryProductService.getProductById(productId));
    }

    @Test
    @DisplayName("getPublishedProductsByIds lấy danh sách sản phẩm theo IDs")
    void testGetPublishedProductsByIds() {
        List<ProductResponse> empty = queryProductService.getPublishedProductsByIds(null);
        assertTrue(empty.isEmpty());

        when(productRepository.findPublishedByIdWithDetails(productId)).thenReturn(Optional.of(product));
        when(reviewRepository.getStatsForProducts(any(), eq(ReviewStatus.ACTIVE))).thenReturn(List.of());

        List<ProductResponse> res = queryProductService.getPublishedProductsByIds(List.of(productId, productId));
        assertEquals(1, res.size());
    }

    @Test
    @DisplayName("getFeaturedProductsByShop lấy sản phẩm nổi bật của shop")
    void testGetFeaturedProductsByShop() {
        when(shopRepository.existsById(shopId)).thenReturn(true);
        when(productRepository.findFeaturedByShopIdWithDetails(shopId)).thenReturn(List.of(product));
        when(reviewRepository.getStatsForProducts(any(), eq(ReviewStatus.ACTIVE))).thenReturn(List.of());

        List<ProductResponse> res = queryProductService.getFeaturedProductsByShop(shopId);
        assertEquals(1, res.size());

        when(shopRepository.existsById(shopId)).thenReturn(false);
        assertThrows(CustomException.class, () -> queryProductService.getFeaturedProductsByShop(shopId));
    }

    @Test
    @DisplayName("parseStatus hợp lệ và không hợp lệ")
    void testParseStatus() {
        assertEquals(ProductStatus.PUBLISHED, queryProductService.parseStatus("published"));
        assertThrows(CustomException.class, () -> queryProductService.parseStatus("INVALID_STATUS"));
    }

    @Test
    @DisplayName("getProductsByShop trả về trang sản phẩm của shop, giữ tổng số bản ghi")
    @SuppressWarnings("unchecked")
    void getProductsByShop_returnsPage() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(userId)).thenReturn(Optional.of(shop));
        when(productRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(product), PageRequest.of(1, 1), 12));

        Page<SellerProductResponse> page = queryProductService.getProductsByShop(accountId, "PUBLISHED", "iphone", PageRequest.of(1, 1));

        assertEquals(1, page.getContent().size());
        assertEquals(12, page.getTotalElements());
        assertEquals(productId, page.getContent().get(0).getId());
    }

    @Test
    @DisplayName("getProductsByShop báo lỗi khi status không hợp lệ")
    void getProductsByShop_invalidStatus() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(userId)).thenReturn(Optional.of(shop));
        assertThrows(CustomException.class,
                () -> queryProductService.getProductsByShop(accountId, "ABC", null, PageRequest.of(0, 10)));
    }

    @Test
    @DisplayName("safeProductPageable: nổi bật lên đầu, bỏ cột sort lạ")
    void safeProductPageable_whitelist() {
        Pageable fixed = QueryProductServiceImpl.safeProductPageable(PageRequest.of(0, 10, Sort.by("shop.user.password")));
        assertEquals(Sort.by(Sort.Direction.DESC, "featured").and(Sort.by(Sort.Direction.DESC, "createdAt")), fixed.getSort());
        assertEquals(Sort.by(Sort.Direction.DESC, "featured").and(Sort.by("name")),
                QueryProductServiceImpl.safeProductPageable(PageRequest.of(0, 10, Sort.by("name"))).getSort());
    }

    @Test
    @DisplayName("shopProductFilter escape ký tự đặc biệt khi tìm kiếm")
    @SuppressWarnings("unchecked")
    void shopProductFilter_escapesLike() {
        Root<Product> root = mock(Root.class, Answers.RETURNS_DEEP_STUBS);
        CriteriaQuery<?> query = mock(CriteriaQuery.class, Answers.RETURNS_DEEP_STUBS);
        CriteriaBuilder cb = mock(CriteriaBuilder.class, Answers.RETURNS_DEEP_STUBS);

        QueryProductServiceImpl.shopProductFilter(shopId, null, false, "a_b").toPredicate(root, query, cb);

        verify(cb, atLeastOnce()).like(any(), eq("%a\\_b%"), eq('\\'));
    }

    @Test
    @DisplayName("countFeaturedProducts đếm sản phẩm nổi bật của shop")
    void countFeaturedProducts() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(userId)).thenReturn(Optional.of(shop));
        when(productRepository.countByShopIdAndFeaturedTrueAndDeletedFalse(shopId)).thenReturn(3L);
        assertEquals(3L, queryProductService.countFeaturedProducts(accountId));
    }
}
