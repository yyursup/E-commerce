package com.marketplace.ecommerce.statistics.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.order.repository.OrderItemsRepository;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.platform.repository.CommissionRepository;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductImage;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.valueObjects.ConditionGrade;
import com.marketplace.ecommerce.product.valueObjects.WarrantyType;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.statistics.dto.response.AdminDashboardAnalyticsResponse;
import com.marketplace.ecommerce.statistics.dto.response.BuyerSpendingAnalyticsResponse;
import com.marketplace.ecommerce.statistics.dto.response.SellerDashboardAnalyticsResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class StatisticsAnalyticsServiceImplTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemsRepository orderItemsRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private EscrowRepository escrowRepository;
    @Mock
    private CommissionRepository commissionRepository;
    @Mock
    private ShopRepository shopRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private StatisticsAnalyticsServiceImpl statisticsAnalyticsService;

    private UUID sellerAccountId;
    private User user;
    private Shop shop;

    @BeforeEach
    void setUp() {
        sellerAccountId = UUID.randomUUID();
        user = new User();
        user.setId(UUID.randomUUID());
        user.setIdentityCardNumber("012345678901");

        shop = Shop.builder()
                .name("TechStore Official")
                .build();
        shop.setId(UUID.randomUUID());
        shop.setUser(user);
    }

    @Test
    @DisplayName("Admin Dashboard Analytics - Thống kê đầy đủ tài chính, tỷ lệ hoàn tất, tranh chấp, biểu đồ GMV")
    void testGetAdminDashboardAnalytics_Success() {
        when(orderRepository.getPlatformTotalGmv()).thenReturn(new BigDecimal("100000000"));
        when(orderRepository.getPlatformSettledRevenue()).thenReturn(new BigDecimal("80000000"));
        when(escrowRepository.sumAmountByStatus(EscrowStatus.HELD)).thenReturn(new BigDecimal("15000000"));

        Object[] commRow = new Object[]{new BigDecimal("5000000")};
        when(commissionRepository.getOverviewStatistics()).thenReturn(Collections.singletonList(commRow));

        when(orderRepository.count()).thenReturn(100L);
        when(orderRepository.countByStatus(OrderStatus.COMPLETED)).thenReturn(70L);
        when(orderRepository.countByStatus(OrderStatus.DELIVERED)).thenReturn(15L);
        when(orderRepository.countByStatus(OrderStatus.CANCELLED)).thenReturn(10L);
        when(orderRepository.countByStatus(OrderStatus.REFUNDED)).thenReturn(5L);
        when(escrowRepository.countByStatus(EscrowStatus.DISPUTED)).thenReturn(2L);

        when(userRepository.count()).thenReturn(200L);
        when(shopRepository.count()).thenReturn(20L);
        when(shopRepository.findAll()).thenReturn(List.of(shop));

        String todayStr = LocalDate.now().toString();
        Object[] timelineRow = new Object[]{todayStr, new BigDecimal("10000000"), 5L};
        when(orderRepository.getDailyPlatformGmvSince(any(LocalDateTime.class))).thenReturn(Collections.singletonList(timelineRow));

        // condition breakdown
        Object[] condRow = new Object[]{ConditionGrade.GRADE_NEW, 10L, 5L, new BigDecimal("20000000")};
        when(orderItemsRepository.getConditionGradeBreakdown(null)).thenReturn(Collections.singletonList(condRow));

        // top shops
        Object[] shopRow = new Object[]{shop.getId(), shop.getName(), new BigDecimal("40000000"), 30L};
        when(orderRepository.getShopRankingByRevenue()).thenReturn(Collections.singletonList(shopRow));

        // top categories
        Object[] catRow = new Object[]{UUID.randomUUID(), "Điện thoại", 25L};
        when(productRepository.getTopCategoriesByProductCount(any(Pageable.class))).thenReturn(Collections.singletonList(catRow));

        AdminDashboardAnalyticsResponse res = statisticsAnalyticsService.getAdminDashboardAnalytics();

        assertNotNull(res);
        assertEquals(new BigDecimal("100000000"), res.getTotalGmv());
        assertEquals(new BigDecimal("80000000"), res.getSettledRevenue());
        assertEquals(85.0, res.getFulfillmentRate());
        assertEquals(5.0, res.getReturnRate());
        assertEquals(2.0, res.getDisputeRate());
        assertEquals(200L, res.getTotalBuyers());
        assertEquals(1, res.getTopShops().size());
        assertEquals(1, res.getTopCategories().size());
        assertFalse(res.getDailyTimeline().isEmpty());
    }

    @Test
    @DisplayName("Seller Analytics - Doanh thu Escrow đang chờ tính đúng tiền thực nhận cho các đơn hợp lệ")
    void getSellerDashboardAnalytics_Success_PendingEscrowRevenueMatchesNetFormula() {
        when(userRepository.findByAccountId(sellerAccountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.of(shop));

        when(orderRepository.getRevenueByShop(eq(shop.getId()), any())).thenReturn(new BigDecimal("5000000"));
        when(orderRepository.getEstimatedRevenueByShop(eq(shop.getId()), any())).thenReturn(new BigDecimal("21490000"));
        when(commissionRepository.getTotalCommissionBySeller(sellerAccountId)).thenReturn(new BigDecimal("100000"));

        List<OrderStatus> expectedStatuses = List.of(
                OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPING, OrderStatus.DELIVERED);
        BigDecimal expectedPendingEscrow = new BigDecimal("16160200");
        

        when(orderRepository.countByShopId(shop.getId())).thenReturn(10L);
        when(orderRepository.countByShopIdAndStatus(shop.getId(), OrderStatus.COMPLETED)).thenReturn(4L);
        when(orderRepository.countByShopIdAndStatus(shop.getId(), OrderStatus.DELIVERED)).thenReturn(2L);
        when(orderRepository.countByShopIdAndStatus(shop.getId(), OrderStatus.REFUNDED)).thenReturn(1L);
        when(orderRepository.countByShopIdAndStatus(shop.getId(), OrderStatus.CANCELLED)).thenReturn(1L);

        // Daily sales timeline
        String todayStr = LocalDate.now().toString();
        Object[] salesPoint = new Object[]{todayStr, new BigDecimal("2000000"), 3L};
        when(orderRepository.getShopDailySalesSince(eq(shop.getId()), any())).thenReturn(Collections.singletonList(salesPoint));

        // Top products
        UUID pId = UUID.randomUUID();
        Object[] topP = new Object[]{pId, "iPhone 13", ConditionGrade.GRADE_LIKE_NEW, new BigDecimal("12000000"), 5L, new BigDecimal("60000000"), 8};
        when(orderItemsRepository.getTopSellingProductsByShop(eq(shop.getId()), any())).thenReturn(Collections.singletonList(topP));

        Product prod = Product.builder()
                .id(pId)
                .name("iPhone 13")
                .images(Set.of(ProductImage.builder().imageUrl("http://img.jpg").build()))
                .build();
        when(productRepository.findById(pId)).thenReturn(Optional.of(prod));

        when(orderItemsRepository.getConditionGradeBreakdown(shop.getId())).thenReturn(Collections.emptyList());

        // Low stock products
        Product lowStockProd = Product.builder()
                .id(UUID.randomUUID())
                .name("Tai nghe AirPods")
                .sku("AP-01")
                .conditionGrade(ConditionGrade.GRADE_NEW)
                .quantity(1)
                .basePrice(new BigDecimal("3500000"))
                .images(Set.of(ProductImage.builder().imageUrl("http://airpods.jpg").build()))
                .build();
        when(productRepository.findLowStockProductsByShop(eq(shop.getId()), eq(3), any()))
                .thenReturn(List.of(lowStockProd));

        SellerDashboardAnalyticsResponse response = statisticsAnalyticsService.getSellerDashboardAnalytics(sellerAccountId);

        assertNotNull(response);
        assertEquals(new BigDecimal("16490000"), response.getPendingEscrowRevenue());
        assertEquals(1, response.getTopProducts().size());
        assertEquals("iPhone 13", response.getTopProducts().get(0).getProductName());
        assertEquals(1, response.getLowStockAlerts().size());
        assertEquals("Tai nghe AirPods", response.getLowStockAlerts().get(0).getProductName());
        assertTrue(response.getIsKycVerified());

        
    }

    @Test
    @DisplayName("Seller Analytics - Khi getPendingEscrowRevenueByShop trả về null hoặc âm thì pendingEscrowRevenue mặc định là ZERO")
    void getSellerDashboardAnalytics_WhenPendingEscrowNull_ReturnsZero() {
        when(userRepository.findByAccountId(sellerAccountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.of(shop));

        when(orderRepository.getRevenueByShop(eq(shop.getId()), any())).thenReturn(BigDecimal.ZERO);
        when(orderRepository.getEstimatedRevenueByShop(eq(shop.getId()), any())).thenReturn(BigDecimal.ZERO);
        when(commissionRepository.getTotalCommissionBySeller(sellerAccountId)).thenReturn(BigDecimal.ZERO);

        List<OrderStatus> expectedStatuses = List.of(
                OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPING, OrderStatus.DELIVERED);
        

        when(orderRepository.countByShopId(shop.getId())).thenReturn(0L);
        when(orderRepository.getShopDailySalesSince(eq(shop.getId()), any())).thenReturn(Collections.emptyList());
        when(orderItemsRepository.getTopSellingProductsByShop(eq(shop.getId()), any())).thenReturn(Collections.emptyList());
        when(orderItemsRepository.getConditionGradeBreakdown(shop.getId())).thenReturn(Collections.emptyList());
        when(productRepository.findLowStockProductsByShop(eq(shop.getId()), eq(3), any())).thenReturn(Collections.emptyList());

        SellerDashboardAnalyticsResponse response = statisticsAnalyticsService.getSellerDashboardAnalytics(sellerAccountId);

        assertNotNull(response);
        assertEquals(BigDecimal.ZERO, response.getPendingEscrowRevenue());
    }

    @Test
    @DisplayName("Seller Analytics - Ném ngoại lệ khi user hoặc shop không tồn tại")
    void getSellerDashboardAnalytics_NotFound() {
        when(userRepository.findByAccountId(sellerAccountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> statisticsAnalyticsService.getSellerDashboardAnalytics(sellerAccountId));

        when(userRepository.findByAccountId(sellerAccountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> statisticsAnalyticsService.getSellerDashboardAnalytics(sellerAccountId));
    }

    @Test
    @DisplayName("Buyer Analytics - Thống kê chi tiêu của người mua, danh mục chi tiêu và thiết bị bảo hành")
    void testGetBuyerSpendingAnalytics_Success() {
        UUID buyerAccountId = UUID.randomUUID();
        when(userRepository.findByAccountId(buyerAccountId)).thenReturn(Optional.of(user));

        when(orderRepository.getBuyerTotalSpent(user.getId())).thenReturn(new BigDecimal("25000000"));

        Order completedOrder = Order.builder()
                .id(UUID.randomUUID())
                .orderNumber("ORD-BUY-01")
                .status(OrderStatus.COMPLETED)
                .build();
        Order shippingOrder = Order.builder()
                .id(UUID.randomUUID())
                .orderNumber("ORD-BUY-02")
                .status(OrderStatus.SHIPPING)
                .build();
        when(orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())).thenReturn(List.of(completedOrder, shippingOrder));
        when(orderRepository.getBuyerTotalVoucherSaved(user.getId())).thenReturn(new BigDecimal("500000"));

        // spending by category
        Object[] catSpend = new Object[]{UUID.randomUUID(), "Laptop", new BigDecimal("20000000"), 1L};
        when(orderItemsRepository.getBuyerCategorySpending(user.getId())).thenReturn(Collections.singletonList(catSpend));

        // devices tracker
        Product device = Product.builder()
                .id(UUID.randomUUID())
                .name("MacBook Pro M1")
                .conditionGrade(ConditionGrade.GRADE_LIKE_NEW)
                .warrantyType(WarrantyType.SHOP)
                .images(Set.of(ProductImage.builder().imageUrl("http://mac.jpg").build()))
                .build();

        OrderItem item = OrderItem.builder()
                .id(UUID.randomUUID())
                .order(completedOrder)
                .product(device)
                .productName(device.getName())
                .unitPrice(new BigDecimal("20000000"))
                .totalPrice(new BigDecimal("20000000"))
                .quantity(1)
                .createdAt(LocalDateTime.now().minusMonths(1))
                .build();

        when(orderItemsRepository.findPurchasedDevicesByUser(eq(user.getId()), any(Pageable.class)))
                .thenReturn(List.of(item));

        BuyerSpendingAnalyticsResponse res = statisticsAnalyticsService.getBuyerSpendingAnalytics(buyerAccountId);

        assertNotNull(res);
        assertEquals(new BigDecimal("25000000"), res.getTotalSpent());
        assertEquals(2, res.getTotalOrders());
        assertEquals(1, res.getCompletedOrders());
        assertEquals(1, res.getDeliveringOrders());
        assertEquals(1, res.getCategorySpending().size());
        assertEquals(1, res.getPurchasedDevices().size());
        assertEquals("ACTIVE", res.getPurchasedDevices().get(0).getWarrantyStatus());
    }

    @Test
    @DisplayName("Buyer Analytics - Ném ngoại lệ khi không tìm thấy tài khoản người mua")
    void testGetBuyerSpendingAnalytics_NotFound() {
        UUID buyerAccountId = UUID.randomUUID();
        when(userRepository.findByAccountId(buyerAccountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> statisticsAnalyticsService.getBuyerSpendingAnalytics(buyerAccountId));
    }

    @Test
    @DisplayName("Buyer Analytics - Chi nhánh bảo hành NONE, EXPIRED, thiết bị FAIR, OPEN_BOX, AS_IS và hình ảnh null")
    void testGetBuyerSpendingAnalytics_VariousConditions() {
        UUID buyerAccountId = UUID.randomUUID();
        when(userRepository.findByAccountId(buyerAccountId)).thenReturn(Optional.of(user));

        when(orderRepository.getBuyerTotalSpent(user.getId())).thenReturn(null);
        when(orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())).thenReturn(List.of());
        when(orderRepository.getBuyerTotalVoucherSaved(user.getId())).thenReturn(null);

        // Category spending with sum == 0 (percentage = 0.0)
        // Dùng String, Double, Long, null để kích hoạt castBigDecimal, castLong, castInteger
        Object[] catSpendZero = new Object[]{UUID.randomUUID(), "Phụ kiện", "0", 0};
        when(orderItemsRepository.getBuyerCategorySpending(user.getId())).thenReturn(Collections.singletonList(catSpendZero));

        // Devices with ConditionGrade & WarrantyType
        Order mockOrder = Order.builder().id(UUID.randomUUID()).orderNumber("ORD-VAR-01").build();

        // 1. OPEN_BOX, Warranty NONE
        Product pOpenBox = Product.builder().id(UUID.randomUUID()).name("P1").conditionGrade(ConditionGrade.GRADE_OPEN_BOX).warrantyType(WarrantyType.NONE).images(Collections.emptySet()).build();
        OrderItem item1 = OrderItem.builder().id(UUID.randomUUID()).order(mockOrder).product(pOpenBox).productName("P1").unitPrice(new BigDecimal("1000")).totalPrice(new BigDecimal("1000")).createdAt(LocalDateTime.now()).build();

        // 2. FAIR, Warranty SHOP, expired (> 6 months ago)
        Product pFair = Product.builder().id(UUID.randomUUID()).name("P2").conditionGrade(ConditionGrade.GRADE_FAIR).warrantyType(WarrantyType.SHOP).images(null).build();
        OrderItem item2 = OrderItem.builder().id(UUID.randomUUID()).order(mockOrder).product(pFair).productName("P2").unitPrice(new BigDecimal("2000")).totalPrice(new BigDecimal("2000")).createdAt(LocalDateTime.now().minusMonths(7)).build();

        // 3. AS_IS, Warranty OFFICIAL
        Product pAsIs = Product.builder().id(UUID.randomUUID()).name("P3").conditionGrade(ConditionGrade.GRADE_AS_IS).warrantyType(WarrantyType.OFFICIAL).build();
        OrderItem item3 = OrderItem.builder().id(UUID.randomUUID()).order(mockOrder).product(pAsIs).productName("P3").unitPrice(new BigDecimal("3000")).totalPrice(new BigDecimal("3000")).createdAt(LocalDateTime.now()).build();

        // 4. Product null
        OrderItem item4 = OrderItem.builder().id(UUID.randomUUID()).order(mockOrder).product(null).productName("P4").unitPrice(new BigDecimal("500")).totalPrice(new BigDecimal("500")).createdAt(null).build();

        when(orderItemsRepository.findPurchasedDevicesByUser(eq(user.getId()), any(Pageable.class)))
                .thenReturn(List.of(item1, item2, item3, item4));

        BuyerSpendingAnalyticsResponse res = statisticsAnalyticsService.getBuyerSpendingAnalytics(buyerAccountId);

        assertNotNull(res);
        assertEquals(BigDecimal.ZERO, res.getTotalSpent());
        assertEquals(0, res.getTotalOrders());
        assertEquals(BigDecimal.ZERO, res.getTotalVoucherSaved());
        assertEquals(1, res.getCategorySpending().size());
        assertEquals(0.0, res.getCategorySpending().get(0).getPercentage());
        assertEquals(4, res.getPurchasedDevices().size());
        assertEquals("NOT_APPLICABLE", res.getPurchasedDevices().get(0).getWarrantyStatus());
        assertEquals("EXPIRED", res.getPurchasedDevices().get(1).getWarrantyStatus());
        assertEquals("ACTIVE", res.getPurchasedDevices().get(2).getWarrantyStatus());
    }

    @Test
    @DisplayName("Admin Dashboard Analytics - Zero orders và các kiểu dữ liệu cast")
    void testGetAdminDashboardAnalytics_ZeroOrders_CastCoverage() {
        when(orderRepository.getPlatformTotalGmv()).thenReturn(null);
        when(orderRepository.getPlatformSettledRevenue()).thenReturn(null);
        when(escrowRepository.sumAmountByStatus(EscrowStatus.HELD)).thenReturn(null);
        when(commissionRepository.getOverviewStatistics()).thenReturn(Collections.emptyList());

        when(orderRepository.count()).thenReturn(0L);
        when(orderRepository.countByStatus(any())).thenReturn(0L);
        when(escrowRepository.countByStatus(any())).thenReturn(0L);
        when(userRepository.count()).thenReturn(0L);
        when(shopRepository.count()).thenReturn(0L);

        // Shop with null user
        Shop shopNoUser = Shop.builder().name("Shop No User").build();
        shopNoUser.setId(UUID.randomUUID());
        when(shopRepository.findAll()).thenReturn(List.of(shopNoUser));

        // timeline with Number/Double, String
        Object[] timelineRow = new Object[]{LocalDate.now().toString(), 150000.5, "10"};
        when(orderRepository.getDailyPlatformGmvSince(any(LocalDateTime.class))).thenReturn(Collections.singletonList(timelineRow));

        // condition breakdown with Integer, String
        Object[] condRow = new Object[]{ConditionGrade.GRADE_LIKE_NEW, 5, "2", "500000"};
        when(orderItemsRepository.getConditionGradeBreakdown(null)).thenReturn(Collections.singletonList(condRow));

        // top shops with String, Integer
        Object[] shopRow = new Object[]{UUID.randomUUID(), "Shop ABC", "1000000", 5};
        when(orderRepository.getShopRankingByRevenue()).thenReturn(Collections.singletonList(shopRow));

        // top categories with Integer
        Object[] catRow = new Object[]{UUID.randomUUID(), "Linh kiện", 10};
        when(productRepository.getTopCategoriesByProductCount(any(Pageable.class))).thenReturn(Collections.singletonList(catRow));

        AdminDashboardAnalyticsResponse res = statisticsAnalyticsService.getAdminDashboardAnalytics();
        assertNotNull(res);
        assertNull(res.getTotalGmv());
        assertEquals(0.0, res.getFulfillmentRate());
        assertEquals(0.0, res.getReturnRate());
        assertEquals(0.0, res.getDisputeRate());
    }

    @Test
    @DisplayName("Seller Analytics - Top product and low stock with null images and null sku")
    void testGetSellerDashboardAnalytics_NullImagesAndSku() {
        when(userRepository.findByAccountId(sellerAccountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.of(shop));

        when(orderRepository.getRevenueByShop(eq(shop.getId()), any())).thenReturn(new BigDecimal("1000"));
        when(orderRepository.getEstimatedRevenueByShop(eq(shop.getId()), any())).thenReturn(new BigDecimal("500"));
        when(commissionRepository.getTotalCommissionBySeller(sellerAccountId)).thenReturn(new BigDecimal("50"));
        

        when(orderRepository.countByShopId(shop.getId())).thenReturn(2L);
        when(orderRepository.countByShopIdAndStatus(eq(shop.getId()), any())).thenReturn(1L);

        // Daily timeline with String, Double
        Object[] salesPoint = new Object[]{LocalDate.now().toString(), "5000", 2};
        when(orderRepository.getShopDailySalesSince(eq(shop.getId()), any())).thenReturn(Collections.singletonList(salesPoint));

        UUID pId = UUID.randomUUID();
        Object[] topP = new Object[]{pId, "Chuột gaming", ConditionGrade.GRADE_NEW, 1000.0, "3", 3000.0, 5};
        when(orderItemsRepository.getTopSellingProductsByShop(eq(shop.getId()), any())).thenReturn(Collections.singletonList(topP));

        Product prod = Product.builder().id(pId).name("Chuột gaming").images(null).build();
        when(productRepository.findById(pId)).thenReturn(Optional.of(prod));

        Object[] condRow = new Object[]{ConditionGrade.GRADE_NEW, "2", 1L, 2000.0};
        when(orderItemsRepository.getConditionGradeBreakdown(shop.getId())).thenReturn(Collections.singletonList(condRow));

        Product lowStockProd = Product.builder()
                .id(UUID.randomUUID())
                .name("Bàn phím cơ")
                .sku(null)
                .conditionGrade(null)
                .quantity(0)
                .basePrice(null)
                .images(Collections.emptySet())
                .build();
        when(productRepository.findLowStockProductsByShop(eq(shop.getId()), eq(3), any()))
                .thenReturn(List.of(lowStockProd));

        SellerDashboardAnalyticsResponse res = statisticsAnalyticsService.getSellerDashboardAnalytics(sellerAccountId);
        assertNotNull(res);
        assertEquals(BigDecimal.ZERO, res.getPendingEscrowRevenue());
        assertEquals(1, res.getTopProducts().size());
        assertNull(res.getTopProducts().get(0).getImageUrl());
        assertEquals(1, res.getLowStockAlerts().size());
        assertNull(res.getLowStockAlerts().get(0).getImageUrl());
        assertNull(res.getLowStockAlerts().get(0).getSku());
    }
}
