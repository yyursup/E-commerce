package com.marketplace.ecommerce.recommendation.service.impl;

import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.service.QueryProductService;
import com.marketplace.ecommerce.product.valueObjects.ConditionGrade;
import com.marketplace.ecommerce.product.valueObjects.WarrantyType;
import com.marketplace.ecommerce.recommendation.entity.ProductView;
import com.marketplace.ecommerce.recommendation.entity.SearchHistory;
import com.marketplace.ecommerce.recommendation.repository.ProductViewRepository;
import com.marketplace.ecommerce.recommendation.repository.SearchHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceImplTest {

    @Mock
    private SearchHistoryRepository searchHistoryRepository;
    @Mock
    private ProductViewRepository productViewRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private QueryProductService queryProductService;

    @InjectMocks
    private RecommendationServiceImpl recommendationService;

    private UUID productId;
    private Product sourceProduct;
    private ProductCategory category;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();

        category = new ProductCategory();
        category.setId(UUID.randomUUID());
        category.setName("Smartphone");

        sourceProduct = Product.builder()
                .id(productId)
                .name("iPhone 14")
                .productCategory(category)
                .basePrice(BigDecimal.valueOf(15000000))
                .conditionGrade(ConditionGrade.GRADE_LIKE_NEW)
                .warrantyType(WarrantyType.OFFICIAL)
                .featured(true)
                .build();
    }

    @Test
    @DisplayName("recordSearch và recordProductView ghi nhận lịch sử an toàn")
    void testRecordHistory() {
        assertDoesNotThrow(() -> recommendationService.recordSearch("session123", UUID.randomUUID(), "iPhone", category.getId(), BigDecimal.ZERO, BigDecimal.TEN));
        verify(searchHistoryRepository).save(any(SearchHistory.class));

        assertDoesNotThrow(() -> recommendationService.recordProductView("session123", UUID.randomUUID(), productId));
        verify(productViewRepository).save(any(ProductView.class));
    }

    @Test
    @DisplayName("getSimilarProducts tính điểm kỹ thuật và xếp hạng ứng viên chuẩn xác")
    void testGetSimilarProducts() {
        Product candidate1 = Product.builder()
                .id(UUID.randomUUID())
                .name("iPhone 13")
                .productCategory(category) // cùng category -> +40
                .basePrice(BigDecimal.valueOf(14000000)) // giá gần -> cao
                .conditionGrade(ConditionGrade.GRADE_LIKE_NEW) // cùng grade -> +15
                .warrantyType(WarrantyType.OFFICIAL) // cùng bảo hành -> +10
                .featured(false)
                .build();

        Product candidate2 = Product.builder()
                .id(UUID.randomUUID())
                .name("Tai nghe Bluetooth")
                .productCategory(new ProductCategory()) // khác category
                .basePrice(BigDecimal.valueOf(200000))
                .conditionGrade(ConditionGrade.GRADE_NEW)
                .warrantyType(WarrantyType.SHOP)
                .featured(false)
                .build();

        when(productRepository.findPublishedByIdWithDetails(productId)).thenReturn(Optional.of(sourceProduct));
        when(productRepository.findPublishedByCategoryExcludingId(eq(productId), eq(category.getId()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(candidate1, candidate2)));

        ProductResponse r1 = new ProductResponse();
        r1.setId(candidate1.getId());
        r1.setName("iPhone 13");

        ProductResponse r2 = new ProductResponse();
        r2.setId(candidate2.getId());
        r2.setName("Tai nghe Bluetooth");

        when(queryProductService.getPublishedProductsByIds(anyList())).thenReturn(List.of(r1, r2));

        List<ProductResponse> result = recommendationService.getSimilarProducts(productId, 5);
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(candidate1.getId(), result.get(0).getId()); // candidate 1 điểm cao hơn phải đứng đầu
    }

    @Test
    @DisplayName("getRecommendationsForUser kích hoạt Cold Start Fallback khi user chưa có lịch sử")
    void testRecommendations_ColdStart() {
        when(searchHistoryRepository.findRecentBySessionOrUser(any(), any(), any())).thenReturn(List.of());
        when(productViewRepository.findRecentBySessionOrUser(any(), any(), any())).thenReturn(List.of());

        Product topProduct = Product.builder().id(UUID.randomUUID()).build();
        when(productRepository.findTopPublishedForRecommendation(any())).thenReturn(List.of(topProduct));

        ProductResponse r = new ProductResponse();
        r.setId(topProduct.getId());
        when(queryProductService.getPublishedProductsByIds(List.of(topProduct.getId()))).thenReturn(List.of(r));

        List<ProductResponse> recommendations = recommendationService.getRecommendationsForUser("session_new", null, 4);
        assertNotNull(recommendations);
        assertEquals(1, recommendations.size());
    }

    @Test
    @DisplayName("recordSearch và recordProductView xử lý null/blank và exception an toàn")
    void testRecordHistory_EdgeCases() {
        // null / blank sessionId
        recommendationService.recordSearch(null, UUID.randomUUID(), "iPhone", null, null, null);
        recommendationService.recordSearch("  ", UUID.randomUUID(), "iPhone", null, null, null);
        recommendationService.recordProductView(null, UUID.randomUUID(), productId);
        recommendationService.recordProductView("session", UUID.randomUUID(), null);

        // exception during save
        doThrow(new RuntimeException("DB error")).when(searchHistoryRepository).save(any());
        assertDoesNotThrow(() -> recommendationService.recordSearch("session", null, "test", null, null, null));

        doThrow(new RuntimeException("DB error")).when(productViewRepository).save(any());
        assertDoesNotThrow(() -> recommendationService.recordProductView("session", null, productId));
    }

    @Test
    @DisplayName("getCompatibleAccessories trả về danh sách phụ kiện tương thích thành công")
    void testGetCompatibleAccessories() {
        // limit <= 0
        assertEquals(List.of(), recommendationService.getCompatibleAccessories(productId, 0));

        // accessories found
        UUID accId = UUID.randomUUID();
        Product accProduct = Product.builder().id(accId).name("Củ sạc 20W").build();
        when(productRepository.findPotentialAccessories(eq(productId), any())).thenReturn(List.of(accProduct));

        ProductResponse accResp = new ProductResponse();
        accResp.setId(accId);
        accResp.setName("Củ sạc 20W");
        when(queryProductService.getPublishedProductsByIds(List.of(accId))).thenReturn(List.of(accResp));

        List<ProductResponse> result = recommendationService.getCompatibleAccessories(productId, 5);
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Củ sạc 20W", result.get(0).getName());
    }

    @Test
    @DisplayName("getSimilarProducts các nhánh mở rộng: category trống, sản phẩm không tồn tại")
    void testGetSimilarProducts_EdgeCases() {
        // 1. source product not found
        when(productRepository.findPublishedByIdWithDetails(productId)).thenReturn(Optional.empty());
        List<ProductResponse> emptyRes = recommendationService.getSimilarProducts(productId, -1);
        assertTrue(emptyRes.isEmpty());

        // 2. category trống, fallback sang findTopPublishedForRecommendation
        when(productRepository.findPublishedByIdWithDetails(productId)).thenReturn(Optional.of(sourceProduct));
        when(productRepository.findPublishedByCategoryExcludingId(eq(productId), eq(category.getId()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        Product topCand = Product.builder()
                .id(UUID.randomUUID())
                .name("Samsung Galaxy")
                .productCategory(null)
                .basePrice(BigDecimal.valueOf(12000000))
                .conditionGrade(ConditionGrade.GRADE_LIKE_NEW)
                .warrantyType(WarrantyType.NONE)
                .featured(false)
                .build();
        Product sameProduct = Product.builder().id(productId).build(); // bị filter out

        when(productRepository.findTopPublishedForRecommendation(any())).thenReturn(List.of(topCand, sameProduct));

        ProductResponse topResp = new ProductResponse();
        topResp.setId(topCand.getId());
        topResp.setName("Samsung Galaxy");
        when(queryProductService.getPublishedProductsByIds(List.of(topCand.getId()))).thenReturn(List.of(topResp));

        List<ProductResponse> fallbackRes = recommendationService.getSimilarProducts(productId, 5);
        assertNotNull(fallbackRes);
        assertEquals(1, fallbackRes.size());

        // 3. cả fallback cũng rỗng
        when(productRepository.findTopPublishedForRecommendation(any())).thenReturn(List.of(sameProduct));
        List<ProductResponse> noneRes = recommendationService.getSimilarProducts(productId, 5);
        assertTrue(noneRes.isEmpty());
    }

    @Test
    @DisplayName("getRecommendationsForUser bao phủ luồng từ search history và product view")
    void testRecommendations_FromSearchAndViews() {
        // 1. Recent searches
        SearchHistory sh1 = SearchHistory.builder()
                .keyword("Laptop")
                .categoryId(UUID.randomUUID())
                .minPrice(BigDecimal.ZERO)
                .maxPrice(BigDecimal.valueOf(10000000))
                .build();
        SearchHistory shEmpty = SearchHistory.builder().build(); // all null -> continue
        when(searchHistoryRepository.findRecentBySessionOrUser(any(), any(), any()))
                .thenReturn(List.of(sh1, shEmpty));

        ProductResponse p1 = new ProductResponse();
        p1.setId(UUID.randomUUID());
        p1.setName("Laptop Dell");
        when(queryProductService.getPublishedProducts(any(com.marketplace.ecommerce.product.dto.request.PageQueryRequest.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(p1)));

        // 2. Recent views & guestRecentIds
        UUID viewProdId = UUID.randomUUID();
        ProductView pv = ProductView.builder().productId(viewProdId).build();
        when(productViewRepository.findRecentBySessionOrUser(any(), any(), any()))
                .thenReturn(List.of(pv));

        // Mock similar product cho viewProdId
        Product viewProd = Product.builder()
                .id(viewProdId)
                .productCategory(category)
                .build();
        when(productRepository.findPublishedByIdWithDetails(viewProdId)).thenReturn(Optional.of(viewProd));
        Product simProd = Product.builder().id(UUID.randomUUID()).build();
        when(productRepository.findPublishedByCategoryExcludingId(eq(viewProdId), any(), any()))
                .thenReturn(new PageImpl<>(List.of(simProd)));
        ProductResponse simResp = new ProductResponse();
        simResp.setId(simProd.getId());
        when(queryProductService.getPublishedProductsByIds(List.of(simProd.getId()))).thenReturn(List.of(simResp));

        UUID guestId = UUID.randomUUID();
        List<ProductResponse> recs = recommendationService.getRecommendationsForUser("sess", UUID.randomUUID(), List.of(guestId), 2);
        assertNotNull(recs);
        assertTrue(recs.size() >= 1);
    }

    @Test
    @DisplayName("calculateTechSimilarityScore bao phủ toàn bộ các nhánh điều kiện")
    void testCalculateTechSimilarityScore_Branches() throws Exception {
        java.lang.reflect.Method m = RecommendationServiceImpl.class.getDeclaredMethod("calculateTechSimilarityScore", Product.class, Product.class);
        m.setAccessible(true);

        Product s = Product.builder()
                .id(UUID.randomUUID())
                .productCategory(category)
                .basePrice(BigDecimal.valueOf(10000000))
                .conditionGrade(ConditionGrade.GRADE_LIKE_NEW)
                .warrantyType(WarrantyType.OFFICIAL)
                .featured(false)
                .build();

        // 1. Both non-GRADE_NEW condition (Like New vs Used Good) -> +8
        Product t1 = Product.builder()
                .id(UUID.randomUUID())
                .productCategory(category)
                .basePrice(BigDecimal.valueOf(10000000))
                .conditionGrade(ConditionGrade.GRADE_FAIR)
                .warrantyType(WarrantyType.OFFICIAL)
                .featured(true) // +5
                .build();
        double score1 = (double) m.invoke(recommendationService, s, t1);
        // category match (40) + price match (30) + non-grade-new (8) + warranty match (10) + featured (5) = 93.0
        assertEquals(93.0, score1, 0.01);

        // 2. Null attributes
        Product sNull = new Product();
        sNull.setId(UUID.randomUUID());
        sNull.setConditionGrade(null);
        sNull.setWarrantyType(null);
        Product tNull = new Product();
        tNull.setId(UUID.randomUUID());
        tNull.setConditionGrade(null);
        tNull.setWarrantyType(null);
        double scoreNull = (double) m.invoke(recommendationService, sNull, tNull);
        assertEquals(0.0, scoreNull, 0.01);

        // 3. Different categories, zero price
        ProductCategory otherCat = new ProductCategory();
        otherCat.setId(UUID.randomUUID());
        Product sZero = new Product();
        sZero.setId(UUID.randomUUID());
        sZero.setProductCategory(category);
        sZero.setBasePrice(BigDecimal.ZERO);
        sZero.setConditionGrade(null);
        sZero.setWarrantyType(null);

        Product tZero = new Product();
        tZero.setId(UUID.randomUUID());
        tZero.setProductCategory(otherCat);
        tZero.setBasePrice(BigDecimal.ZERO);
        tZero.setConditionGrade(null);
        tZero.setWarrantyType(null);

        double scoreZero = (double) m.invoke(recommendationService, sZero, tZero);
        assertEquals(0.0, scoreZero, 0.01);
    }

}
