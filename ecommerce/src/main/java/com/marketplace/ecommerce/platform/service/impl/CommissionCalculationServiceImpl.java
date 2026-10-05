package com.marketplace.ecommerce.platform.service.impl;

import com.marketplace.ecommerce.platform.dto.CommissionRateBreakdown;
import com.marketplace.ecommerce.platform.entity.SeniorityPolicyConfig;
import com.marketplace.ecommerce.platform.repository.SeniorityPolicyConfigRepository;
import com.marketplace.ecommerce.platform.service.CommissionCalculationService;
import com.marketplace.ecommerce.platform.service.PlatformSettingService;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.valueObjects.ConditionGrade;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.entity.TrustLevelConfig;
import com.marketplace.ecommerce.shop.repository.ShopEscrowFundRepository;
import com.marketplace.ecommerce.shop.repository.TrustLevelConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommissionCalculationServiceImpl implements CommissionCalculationService {

    private final PlatformSettingService platformSettingService;
    private final TrustLevelConfigRepository trustLevelConfigRepository;
    private final SeniorityPolicyConfigRepository seniorityPolicyConfigRepository;
    private final ShopEscrowFundRepository shopEscrowFundRepository;

    @Override
    public CommissionRateBreakdown calculateRateBreakdown(Shop shop, ProductCategory category, ConditionGrade conditionGrade) {
        // 1. Tỷ lệ sàn tối thiểu động từ Platform Setting (Database)
        BigDecimal floorRate = platformSettingService.getFloorRate();

        // 2. Tỷ lệ cơ bản theo nhóm hàng hoặc cấu hình hàng cũ (Database)
        BigDecimal baseRate = determineBaseRate(category, conditionGrade);

        // 3. Mức ký quỹ & Ưu đãi ký quỹ (Database - TrustLevelConfig)
        BigDecimal depositAmount = getShopDepositAmount(shop);
        BigDecimal depositDiscount = determineDepositDiscount(depositAmount);

        // 4. Thời gian hoạt động & Ưu đãi thâm niên (Database - SeniorityPolicyConfig)
        LocalDateTime createdAt = shop != null && shop.getCreatedAt() != null ? shop.getCreatedAt() : LocalDateTime.now();
        long activeMonths = ChronoUnit.MONTHS.between(createdAt, LocalDateTime.now());
        int violationCount = getShopViolationCount(shop);
        BigDecimal seniorityDiscount = determineSeniorityDiscount(activeMonths, violationCount);

        // 5. Áp dụng công thức GVHD: Phí cuối = Base - Ưu đãi Ký Quỹ - Ưu đãi Thâm Niên
        BigDecimal calculatedRate = baseRate.subtract(depositDiscount).subtract(seniorityDiscount);

        // 6. Ràng buộc Ngưỡng sàn tối thiểu (Floor Rate từ cấu hình động Database)
        BigDecimal finalRate = calculatedRate.compareTo(floorRate) < 0 ? floorRate : calculatedRate;

        String categoryName = category != null ? category.getName() : "Toàn sàn";
        String explanation = String.format(
                "Tỷ lệ cơ bản ngành [%s] (%s%%) - Ưu đãi ký quỹ (%s%%) - Ưu đãi thâm niên %d tháng (%s%%) = %s%% (Ngưỡng sàn: %s%%)",
                categoryName,
                baseRate.setScale(1, RoundingMode.HALF_UP),
                depositDiscount.setScale(1, RoundingMode.HALF_UP),
                activeMonths,
                seniorityDiscount.setScale(1, RoundingMode.HALF_UP),
                finalRate.setScale(2, RoundingMode.HALF_UP),
                floorRate.setScale(1, RoundingMode.HALF_UP)
        );

        return CommissionRateBreakdown.builder()
                .baseRate(baseRate)
                .depositDiscount(depositDiscount)
                .seniorityDiscount(seniorityDiscount)
                .floorRate(floorRate)
                .finalRate(finalRate)
                .categoryName(categoryName)
                .depositAmount(depositAmount)
                .activeMonths(activeMonths)
                .violationCount(violationCount)
                .formulaExplanation(explanation)
                .build();
    }

    @Override
    public BigDecimal calculateFinalRate(Shop shop, ProductCategory category, ConditionGrade conditionGrade) {
        return calculateRateBreakdown(shop, category, conditionGrade).getFinalRate();
    }

    private BigDecimal determineBaseRate(ProductCategory category, ConditionGrade conditionGrade) {
        // Hàng cũ / Đã qua sử dụng: Đọc cấu hình tỷ lệ hoa hồng hàng cũ từ Platform Setting
        if (conditionGrade != null && conditionGrade != ConditionGrade.GRADE_NEW) {
            return platformSettingService.getUsedGoodsCommissionRate();
        }

        // 1. Ưu tiên đọc cấu hình động trực tiếp từ Danh mục trong Database
        if (category != null) {
            if (category.getCommissionRate() != null && category.getCommissionRate().compareTo(BigDecimal.ZERO) > 0) {
                return category.getCommissionRate();
            }
            // Nếu là Danh mục con (Subcategory), kế thừa từ Danh mục cha nếu có
            if (category.getParent() != null && category.getParent().getCommissionRate() != null
                    && category.getParent().getCommissionRate().compareTo(BigDecimal.ZERO) > 0) {
                return category.getParent().getCommissionRate();
            }
        }

        // 2. Không có danh mục hoặc danh mục chưa cấu hình -> Đọc tỷ lệ hoa hồng tiêu chuẩn toàn sàn từ Platform Setting
        return platformSettingService.getCommissionRate();
    }

    private BigDecimal getShopDepositAmount(Shop shop) {
        if (shop == null) return BigDecimal.ZERO;
        if (shop.getEscrowFund() != null && shop.getEscrowFund().getBalance() != null) {
            return shop.getEscrowFund().getBalance();
        }
        if (shop.getId() != null) {
            var fundOpt = shopEscrowFundRepository.findByShopId(shop.getId());
            if (fundOpt.isPresent() && fundOpt.get().getBalance() != null) {
                return fundOpt.get().getBalance();
            }
        }
        if (shop.getDepositBalance() != null) {
            return shop.getDepositBalance();
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal determineDepositDiscount(BigDecimal deposit) {
        if (deposit == null || deposit.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        // Đọc cấu hình động theo Bậc sao Ký quỹ từ Database
        List<TrustLevelConfig> configs = trustLevelConfigRepository.findAllByIsActiveTrueOrderByStarLevelAsc();
        BigDecimal resolvedDiscount = BigDecimal.ZERO;
        if (configs != null) {
            for (TrustLevelConfig config : configs) {
                if (config.getMinDeposit() != null && deposit.compareTo(config.getMinDeposit()) >= 0) {
                    if (config.getCommissionDiscount() != null) {
                        resolvedDiscount = config.getCommissionDiscount();
                    }
                }
            }
        }
        return resolvedDiscount;
    }

    private int getShopViolationCount(Shop shop) {
        if (shop == null) return 0;
        if (shop.getViolationCount() != null && shop.getViolationCount() > 0) {
            return shop.getViolationCount();
        }
        if (shop.getUser() != null && shop.getUser().getAccount() != null) {
            return shop.getUser().getAccount().getViolationCount();
        }
        return 0;
    }

    private BigDecimal determineSeniorityDiscount(long activeMonths, int violationCount) {
        // Nếu Shop có vi phạm hoặc thời gian hoạt động <= 0 -> không áp dụng ưu đãi thâm niên
        if (violationCount > 0 || activeMonths <= 0) {
            return BigDecimal.ZERO;
        }

        // Đọc cấu hình động theo Mốc Thâm Niên từ Database
        List<SeniorityPolicyConfig> policies = seniorityPolicyConfigRepository.findAllByIsActiveTrueOrderByMinMonthsDesc();
        if (policies != null) {
            for (SeniorityPolicyConfig policy : policies) {
                if (policy.getMinMonths() != null && activeMonths >= policy.getMinMonths()) {
                    return policy.getDiscountRate() != null ? policy.getDiscountRate() : BigDecimal.ZERO;
                }
            }
        }
        return BigDecimal.ZERO;
    }
}
