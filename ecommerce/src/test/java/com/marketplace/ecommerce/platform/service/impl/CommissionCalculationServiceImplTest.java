package com.marketplace.ecommerce.platform.service.impl;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.platform.dto.CommissionRateBreakdown;
import com.marketplace.ecommerce.platform.entity.SeniorityPolicyConfig;
import com.marketplace.ecommerce.platform.repository.SeniorityPolicyConfigRepository;
import com.marketplace.ecommerce.platform.service.PlatformSettingService;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.valueObjects.ConditionGrade;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.entity.ShopEscrowFund;
import com.marketplace.ecommerce.shop.entity.TrustLevelConfig;
import com.marketplace.ecommerce.shop.repository.ShopEscrowFundRepository;
import com.marketplace.ecommerce.shop.repository.TrustLevelConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CommissionCalculationServiceImplTest {

    @Mock
    private PlatformSettingService platformSettingService;
    @Mock
    private TrustLevelConfigRepository trustLevelConfigRepository;
    @Mock
    private SeniorityPolicyConfigRepository seniorityPolicyConfigRepository;
    @Mock
    private ShopEscrowFundRepository shopEscrowFundRepository;

    @InjectMocks
    private CommissionCalculationServiceImpl commissionCalculationService;

    @BeforeEach
    void setUp() {
        lenient().when(platformSettingService.getFloorRate()).thenReturn(new BigDecimal("1.50"));
        lenient().when(platformSettingService.getCommissionRate()).thenReturn(new BigDecimal("5.00"));
        lenient().when(platformSettingService.getUsedGoodsCommissionRate()).thenReturn(new BigDecimal("6.00"));
    }

    @Test
    @DisplayName("Tỷ lệ cơ bản lấy theo danh mục động trong Database")
    void testDetermineBaseRate_FromCategory() {
        ProductCategory parent = new ProductCategory();
        parent.setId(UUID.randomUUID());
        parent.setName("Điện Thoại & Tablet");
        parent.setCommissionRate(new BigDecimal("3.50"));

        ProductCategory child = new ProductCategory();
        child.setId(UUID.randomUUID());
        child.setName("Smartphone");
        child.setParent(parent);

        CommissionRateBreakdown breakdownChild = commissionCalculationService.calculateRateBreakdown(
                null, child, ConditionGrade.GRADE_NEW);
        assertEquals(new BigDecimal("3.50"), breakdownChild.getBaseRate());

        CommissionRateBreakdown breakdownParent = commissionCalculationService.calculateRateBreakdown(
                null, parent, ConditionGrade.GRADE_NEW);
        assertEquals(new BigDecimal("3.50"), breakdownParent.getBaseRate());
    }

    @Test
    @DisplayName("Hàng cũ 2nd-hand lấy theo tỷ lệ Used Goods cấu hình từ Platform Setting")
    void testDetermineBaseRate_UsedGoods() {
        ProductCategory cat = new ProductCategory();
        cat.setName("Laptop Gaming");
        cat.setCommissionRate(new BigDecimal("4.00"));

        CommissionRateBreakdown breakdown = commissionCalculationService.calculateRateBreakdown(
                null, cat, ConditionGrade.GRADE_LIKE_NEW);
        assertEquals(new BigDecimal("6.00"), breakdown.getBaseRate());
    }

    @Test
    @DisplayName("Ưu đãi ký quỹ và thâm niên thuần túy từ Database, không có hardcoded fallback")
    void testDataDrivenDiscounts_WithActivePolicies() {
        Shop shop = new Shop();
        shop.setCreatedAt(LocalDateTime.now().minusMonths(7));
        shop.setDepositBalance(new BigDecimal("25000000")); // 25tr -> Tier 4 (1.00%)
        shop.setViolationCount(0);

        List<TrustLevelConfig> trustConfigs = List.of(
                TrustLevelConfig.builder().starLevel(1).minDeposit(BigDecimal.ZERO).commissionDiscount(BigDecimal.ZERO).build(),
                TrustLevelConfig.builder().starLevel(2).minDeposit(new BigDecimal("1000000")).commissionDiscount(new BigDecimal("0.20")).build(),
                TrustLevelConfig.builder().starLevel(3).minDeposit(new BigDecimal("5000000")).commissionDiscount(new BigDecimal("0.50")).build(),
                TrustLevelConfig.builder().starLevel(4).minDeposit(new BigDecimal("20000000")).commissionDiscount(new BigDecimal("1.00")).build(),
                TrustLevelConfig.builder().starLevel(5).minDeposit(new BigDecimal("50000000")).commissionDiscount(new BigDecimal("1.50")).build()
        );
        when(trustLevelConfigRepository.findAllByIsActiveTrueOrderByStarLevelAsc()).thenReturn(trustConfigs);

        List<SeniorityPolicyConfig> seniorityConfigs = List.of(
                SeniorityPolicyConfig.builder().minMonths(12).discountRate(new BigDecimal("1.00")).build(),
                SeniorityPolicyConfig.builder().minMonths(6).discountRate(new BigDecimal("0.50")).build(),
                SeniorityPolicyConfig.builder().minMonths(3).discountRate(new BigDecimal("0.20")).build()
        );
        when(seniorityPolicyConfigRepository.findAllByIsActiveTrueOrderByMinMonthsDesc()).thenReturn(seniorityConfigs);

        ProductCategory cat = new ProductCategory();
        cat.setName("Laptop");
        cat.setCommissionRate(new BigDecimal("4.00"));

        CommissionRateBreakdown breakdown = commissionCalculationService.calculateRateBreakdown(shop, cat, ConditionGrade.GRADE_NEW);

        // Base 4.00% - Deposit 1.00% - Seniority 0.50% = 2.50% (> Floor 1.50%)
        assertEquals(new BigDecimal("4.00"), breakdown.getBaseRate());
        assertEquals(new BigDecimal("1.00"), breakdown.getDepositDiscount());
        assertEquals(new BigDecimal("0.50"), breakdown.getSeniorityDiscount());
        assertEquals(new BigDecimal("2.50"), breakdown.getFinalRate());

        // Test calculateFinalRate trực tiếp
        BigDecimal directFinalRate = commissionCalculationService.calculateFinalRate(shop, cat, ConditionGrade.GRADE_NEW);
        assertEquals(new BigDecimal("2.50"), directFinalRate);
    }

    @Test
    @DisplayName("Nếu không có cấu hình trong DB, chiết khấu là 0% thay vì rơi vào fallback hardcode")
    void testZeroDiscountsWhenNoConfigInDatabase() {
        Shop shop = new Shop();
        shop.setCreatedAt(LocalDateTime.now().minusMonths(12));
        shop.setDepositBalance(new BigDecimal("50000000"));
        shop.setViolationCount(0);

        when(trustLevelConfigRepository.findAllByIsActiveTrueOrderByStarLevelAsc()).thenReturn(Collections.emptyList());
        when(seniorityPolicyConfigRepository.findAllByIsActiveTrueOrderByMinMonthsDesc()).thenReturn(Collections.emptyList());

        CommissionRateBreakdown breakdown = commissionCalculationService.calculateRateBreakdown(shop, null, ConditionGrade.GRADE_NEW);

        // Base default 5.00% - 0% - 0% = 5.00%
        assertEquals(new BigDecimal("5.00"), breakdown.getBaseRate());
        assertEquals(BigDecimal.ZERO, breakdown.getDepositDiscount());
        assertEquals(BigDecimal.ZERO, breakdown.getSeniorityDiscount());
        assertEquals(new BigDecimal("5.00"), breakdown.getFinalRate());
    }

    @Test
    @DisplayName("Ngưỡng sàn (Floor Rate) ràng buộc phí cuối cùng không thể thấp hơn cấu hình sàn")
    void testFloorRateConstraint() {
        Shop shop = new Shop();
        shop.setCreatedAt(LocalDateTime.now().minusMonths(24));
        shop.setDepositBalance(new BigDecimal("100000000"));
        shop.setViolationCount(0);

        List<TrustLevelConfig> trustConfigs = List.of(
                TrustLevelConfig.builder().starLevel(5).minDeposit(new BigDecimal("50000000")).commissionDiscount(new BigDecimal("2.50")).build()
        );
        when(trustLevelConfigRepository.findAllByIsActiveTrueOrderByStarLevelAsc()).thenReturn(trustConfigs);

        List<SeniorityPolicyConfig> seniorityConfigs = List.of(
                SeniorityPolicyConfig.builder().minMonths(12).discountRate(new BigDecimal("2.00")).build()
        );
        when(seniorityPolicyConfigRepository.findAllByIsActiveTrueOrderByMinMonthsDesc()).thenReturn(seniorityConfigs);

        ProductCategory cat = new ProductCategory();
        cat.setName("Smartphone");
        cat.setCommissionRate(new BigDecimal("3.50"));

        // Base 3.50% - Deposit 2.50% - Seniority 2.00% = -1.00% -> Floor: 1.50%
        CommissionRateBreakdown breakdown = commissionCalculationService.calculateRateBreakdown(shop, cat, ConditionGrade.GRADE_NEW);
        assertEquals(new BigDecimal("1.50"), breakdown.getFinalRate());
        assertEquals(new BigDecimal("1.50"), breakdown.getFloorRate());
    }

    @Test
    @DisplayName("getShopDepositAmount: lấy từ EscrowFund entity, repo findByShopId, hoặc mặc định 0")
    void testDepositAmountBranches() {
        // 1. EscrowFund trực tiếp từ shop
        Shop shop1 = new Shop();
        ShopEscrowFund fund1 = new ShopEscrowFund();
        fund1.setBalance(new BigDecimal("15000000"));
        shop1.setEscrowFund(fund1);

        CommissionRateBreakdown b1 = commissionCalculationService.calculateRateBreakdown(shop1, null, null);
        assertEquals(new BigDecimal("15000000"), b1.getDepositAmount());

        // 2. EscrowFund từ repo findByShopId
        Shop shop2 = new Shop();
        shop2.setId(UUID.randomUUID());
        ShopEscrowFund fund2 = new ShopEscrowFund();
        fund2.setBalance(new BigDecimal("8000000"));
        when(shopEscrowFundRepository.findByShopId(shop2.getId())).thenReturn(Optional.of(fund2));

        CommissionRateBreakdown b2 = commissionCalculationService.calculateRateBreakdown(shop2, null, null);
        assertEquals(new BigDecimal("8000000"), b2.getDepositAmount());

        // 3. Shop null
        CommissionRateBreakdown bNull = commissionCalculationService.calculateRateBreakdown(null, null, null);
        assertEquals(BigDecimal.ZERO, bNull.getDepositAmount());
    }

    @Test
    @DisplayName("Shop vi phạm hoặc thời gian hoạt động <= 0 không nhận ưu đãi thâm niên")
    void testSeniorityDiscount_ViolationAndNewShop() {
        // Shop vi phạm trực tiếp
        Shop shopViolated = new Shop();
        shopViolated.setCreatedAt(LocalDateTime.now().minusMonths(12));
        shopViolated.setViolationCount(2);

        CommissionRateBreakdown bViolated = commissionCalculationService.calculateRateBreakdown(shopViolated, null, null);
        assertEquals(BigDecimal.ZERO, bViolated.getSeniorityDiscount());
        assertEquals(2, bViolated.getViolationCount());

        // Shop vi phạm qua Account
        Shop shopUserViolated = new Shop();
        shopUserViolated.setCreatedAt(LocalDateTime.now().minusMonths(12));
        shopUserViolated.setViolationCount(0);
        Account acc = new Account();
        acc.setViolationCount(1);
        User u = new User();
        u.setAccount(acc);
        shopUserViolated.setUser(u);

        CommissionRateBreakdown bUserViolated = commissionCalculationService.calculateRateBreakdown(shopUserViolated, null, null);
        assertEquals(BigDecimal.ZERO, bUserViolated.getSeniorityDiscount());
        assertEquals(1, bUserViolated.getViolationCount());

        // Shop mới tạo (activeMonths <= 0)
        Shop shopNew = new Shop();
        shopNew.setCreatedAt(LocalDateTime.now());
        CommissionRateBreakdown bNew = commissionCalculationService.calculateRateBreakdown(shopNew, null, null);
        assertEquals(BigDecimal.ZERO, bNew.getSeniorityDiscount());

        // Policy có minMonths null hoặc discountRate null
        Shop shopEligible = new Shop();
        shopEligible.setCreatedAt(LocalDateTime.now().minusMonths(10));
        SeniorityPolicyConfig pNullRate = SeniorityPolicyConfig.builder().minMonths(6).discountRate(null).build();
        SeniorityPolicyConfig pNullMin = SeniorityPolicyConfig.builder().minMonths(null).discountRate(new BigDecimal("0.50")).build();
        when(seniorityPolicyConfigRepository.findAllByIsActiveTrueOrderByMinMonthsDesc()).thenReturn(List.of(pNullMin, pNullRate));

        CommissionRateBreakdown bNullRate = commissionCalculationService.calculateRateBreakdown(shopEligible, null, null);
        assertEquals(BigDecimal.ZERO, bNullRate.getSeniorityDiscount());
    }

    @Test
    @DisplayName("determineDepositDiscount: config có minDeposit null hoặc commissionDiscount null")
    void testDepositDiscount_NullConfigs() {
        Shop shop = new Shop();
        shop.setDepositBalance(new BigDecimal("10000000"));

        TrustLevelConfig cNullMin = TrustLevelConfig.builder().minDeposit(null).commissionDiscount(new BigDecimal("0.50")).build();
        TrustLevelConfig cNullDiscount = TrustLevelConfig.builder().minDeposit(new BigDecimal("5000000")).commissionDiscount(null).build();
        when(trustLevelConfigRepository.findAllByIsActiveTrueOrderByStarLevelAsc()).thenReturn(List.of(cNullMin, cNullDiscount));

        CommissionRateBreakdown b = commissionCalculationService.calculateRateBreakdown(shop, null, null);
        assertEquals(BigDecimal.ZERO, b.getDepositDiscount());
    }
}
