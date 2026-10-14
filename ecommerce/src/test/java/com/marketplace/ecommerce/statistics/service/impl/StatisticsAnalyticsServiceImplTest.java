package com.marketplace.ecommerce.statistics.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.order.repository.OrderItemsRepository;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.platform.repository.CommissionRepository;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.statistics.dto.response.SellerDashboardAnalyticsResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatisticsAnalyticsServiceImplTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemsRepository orderItemsRepository;
    @Mock
    private ProductRepository productRepository;
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
    }

    @Test
    @DisplayName("Seller Analytics - Doanh thu Escrow đang chờ tính đúng tiền thực nhận (Net payout) cho các đơn CONFIRMED, PROCESSING, SHIPPING, DELIVERED")
    void getSellerDashboardAnalytics_Success_PendingEscrowRevenueMatchesNetFormula() {
        when(userRepository.findByAccountId(sellerAccountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.of(shop));

        when(orderRepository.getRevenueByShop(eq(shop.getId()), any())).thenReturn(new BigDecimal("5000000"));
        when(orderRepository.getEstimatedRevenueByShop(eq(shop.getId()), any())).thenReturn(new BigDecimal("21490000"));
        when(commissionRepository.getTotalCommissionBySeller(sellerAccountId)).thenReturn(new BigDecimal("100000"));

        // Doanh thu Escrow đang chờ tính theo công thức thực nhận:
        // subtotal - shopDiscountAmount - platformCommission = 16.160.200 VND
        List<OrderStatus> expectedStatuses = List.of(
                OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPING, OrderStatus.DELIVERED);
        BigDecimal expectedPendingEscrow = new BigDecimal("16160200");
        when(orderRepository.getPendingEscrowRevenueByShop(shop.getId(), expectedStatuses)).thenReturn(expectedPendingEscrow);

        when(orderRepository.countByShopId(shop.getId())).thenReturn(10L);
        when(orderRepository.getShopDailySalesSince(eq(shop.getId()), any())).thenReturn(Collections.emptyList());
        when(orderItemsRepository.getTopSellingProductsByShop(eq(shop.getId()), any())).thenReturn(Collections.emptyList());
        when(orderItemsRepository.getConditionGradeBreakdown(shop.getId())).thenReturn(Collections.emptyList());
        when(productRepository.findLowStockProductsByShop(eq(shop.getId()), eq(3), any())).thenReturn(Collections.emptyList());

        SellerDashboardAnalyticsResponse response = statisticsAnalyticsService.getSellerDashboardAnalytics(sellerAccountId);

        assertNotNull(response);
        assertEquals(expectedPendingEscrow, response.getPendingEscrowRevenue(),
                "pendingEscrowRevenue phải trả về đúng giá trị thực nhận từ query getPendingEscrowRevenueByShop");

        verify(orderRepository).getPendingEscrowRevenueByShop(shop.getId(), expectedStatuses);
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
        when(orderRepository.getPendingEscrowRevenueByShop(shop.getId(), expectedStatuses)).thenReturn(null);

        when(orderRepository.countByShopId(shop.getId())).thenReturn(0L);
        when(orderRepository.getShopDailySalesSince(eq(shop.getId()), any())).thenReturn(Collections.emptyList());
        when(orderItemsRepository.getTopSellingProductsByShop(eq(shop.getId()), any())).thenReturn(Collections.emptyList());
        when(orderItemsRepository.getConditionGradeBreakdown(shop.getId())).thenReturn(Collections.emptyList());
        when(productRepository.findLowStockProductsByShop(eq(shop.getId()), eq(3), any())).thenReturn(Collections.emptyList());

        SellerDashboardAnalyticsResponse response = statisticsAnalyticsService.getSellerDashboardAnalytics(sellerAccountId);

        assertNotNull(response);
        assertEquals(BigDecimal.ZERO, response.getPendingEscrowRevenue());
    }
}
