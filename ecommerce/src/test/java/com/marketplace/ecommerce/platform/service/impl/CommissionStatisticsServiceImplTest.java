package com.marketplace.ecommerce.platform.service.impl;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.marketplace.ecommerce.platform.dto.response.*;
import com.marketplace.ecommerce.platform.repository.CommissionRepository;
import com.marketplace.ecommerce.platform.service.CommissionService;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CommissionStatisticsServiceImplTest {

    @Mock
    private CommissionRepository commissionRepository;
    @Mock
    private ShopRepository shopRepository;
    @Mock
    private CommissionService commissionService;

    @InjectMocks
    private CommissionStatisticsServiceImpl statisticsService;

    @Test
    @DisplayName("getOverview thống kê tổng quan hoa hồng")
    void testGetOverview() {
        Object[] row = new Object[]{new BigDecimal("50000000"), 120L, new BigDecimal("5.0")};
        when(commissionRepository.getOverviewStatistics()).thenReturn(Collections.singletonList(row));

        CommissionOverviewResponse res = statisticsService.getOverview();
        assertNotNull(res);
        assertEquals(new BigDecimal("50000000"), res.getTotalCommission());
        assertEquals(120L, res.getTotalOrders());
        assertEquals(new BigDecimal("5.0"), res.getAverageCommissionRate());

        // Test khi rows rỗng
        when(commissionRepository.getOverviewStatistics()).thenReturn(Collections.emptyList());
        CommissionOverviewResponse emptyRes = statisticsService.getOverview();
        assertEquals(BigDecimal.ZERO, emptyRes.getTotalCommission());
        assertEquals(0L, emptyRes.getTotalOrders());

        // Test khi rows null
        when(commissionRepository.getOverviewStatistics()).thenReturn(null);
        CommissionOverviewResponse nullRes = statisticsService.getOverview();
        assertEquals(BigDecimal.ZERO, nullRes.getTotalCommission());
        assertEquals(0L, nullRes.getTotalOrders());
    }

    @Test
    @DisplayName("getOverview với các kiểu dữ liệu Number, String, null để kích hoạt cast helper")
    void testGetOverview_VariousTypes() {
        // row chứa Number (Double, Integer) và String
        Object[] row1 = new Object[]{50000.5, 150, "4.5"};
        when(commissionRepository.getOverviewStatistics()).thenReturn(Collections.singletonList(row1));

        CommissionOverviewResponse res1 = statisticsService.getOverview();
        assertNotNull(res1);
        assertEquals(150L, res1.getTotalOrders());
        assertEquals(new BigDecimal("4.5"), res1.getAverageCommissionRate());

        // row chứa String ("100"), String ("200"), Long
        Object[] row2 = new Object[]{"1000000", "200", 5L};
        when(commissionRepository.getOverviewStatistics()).thenReturn(Collections.singletonList(row2));

        CommissionOverviewResponse res2 = statisticsService.getOverview();
        assertNotNull(res2);
        assertEquals(new BigDecimal("1000000"), res2.getTotalCommission());
        assertEquals(200L, res2.getTotalOrders());

        // row chứa null
        Object[] row3 = new Object[]{null, null, null};
        when(commissionRepository.getOverviewStatistics()).thenReturn(Collections.singletonList(row3));

        CommissionOverviewResponse res3 = statisticsService.getOverview();
        assertNotNull(res3);
        assertEquals(BigDecimal.ZERO, res3.getTotalCommission());
        assertEquals(0L, res3.getTotalOrders());
    }

    @Test
    @DisplayName("getByMonth thống kê hoa hồng theo tháng với các kiểu dữ liệu")
    void testGetByMonth() {
        Object[] row = new Object[]{2026, 10, new BigDecimal("12000000")};
        when(commissionRepository.getCommissionByMonth()).thenReturn(Collections.singletonList(row));

        List<CommissionByMonthResponse> list = statisticsService.getByMonth();
        assertEquals(1, list.size());
        assertEquals(2026, list.get(0).getYear());
        assertEquals(10, list.get(0).getMonth());
        assertEquals(new BigDecimal("12000000"), list.get(0).getTotalCommission());

        // Test với String, Double, null
        Object[] row2 = new Object[]{"2025", 11.0, "5000000"};
        Object[] row3 = new Object[]{null, null, null};
        when(commissionRepository.getCommissionByMonth()).thenReturn(List.of(row2, row3));

        List<CommissionByMonthResponse> list2 = statisticsService.getByMonth();
        assertEquals(2, list2.size());
        assertEquals(2025, list2.get(0).getYear());
        assertEquals(11, list2.get(0).getMonth());
        assertEquals(0, list2.get(1).getYear());
        assertEquals(BigDecimal.ZERO, list2.get(1).getTotalCommission());
    }

    @Test
    @DisplayName("getTopSellers lấy danh sách người bán với limit <= 0 và shop không tồn tại")
    void testGetTopSellers() {
        UUID sellerId1 = UUID.randomUUID();
        UUID sellerId2 = UUID.randomUUID();
        Object[] row1 = new Object[]{sellerId1, new BigDecimal("8000000")};
        Object[] row2 = new Object[]{sellerId2, "5000000"};
        when(commissionRepository.getTopSellerCommission(any(Pageable.class))).thenReturn(List.of(row1, row2));

        Shop shop = new Shop();
        shop.setName("Gadget Hub");
        when(shopRepository.findByUserId(sellerId1)).thenReturn(Optional.of(shop));
        when(shopRepository.findByUserId(sellerId2)).thenReturn(Optional.empty()); // Shop null

        // Test limit <= 0 (nhánh limit <= 0 -> safeLimit = 5)
        List<TopSellerCommissionResponse> top = statisticsService.getTopSellers(0);
        assertEquals(2, top.size());
        assertEquals("Gadget Hub", top.get(0).getShopName());
        assertEquals(new BigDecimal("8000000"), top.get(0).getTotalCommission());
        assertNull(top.get(1).getShopName());
        assertEquals(new BigDecimal("5000000"), top.get(1).getTotalCommission());
    }

    @Test
    @DisplayName("getByCategory thống kê hoa hồng theo danh mục sản phẩm")
    void testGetByCategory() {
        UUID catId = UUID.randomUUID();
        Object[] row = new Object[]{catId, "Laptop", new BigDecimal("25000000")};
        when(commissionRepository.getCommissionByCategory()).thenReturn(Collections.singletonList(row));

        List<CommissionByCategoryResponse> list = statisticsService.getByCategory();
        assertEquals(1, list.size());
        assertEquals("Laptop", list.get(0).getCategoryName());
        assertEquals(new BigDecimal("25000000"), list.get(0).getTotalCommission());
    }
}
