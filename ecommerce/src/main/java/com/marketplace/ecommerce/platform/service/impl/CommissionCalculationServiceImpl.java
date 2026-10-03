package com.marketplace.ecommerce.platform.service.impl;

import com.marketplace.ecommerce.platform.dto.CommissionRateBreakdown;
import com.marketplace.ecommerce.platform.service.CommissionCalculationService;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.valueObjects.ConditionGrade;
import com.marketplace.ecommerce.shop.entity.Shop;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommissionCalculationServiceImpl implements CommissionCalculationService {

    public static final BigDecimal FLOOR_RATE = new BigDecimal("1.50"); // Tỷ lệ sàn tối thiểu 1.5%

    @Override
    public CommissionRateBreakdown calculateRateBreakdown(Shop shop, ProductCategory category, ConditionGrade conditionGrade) {
        // 1. Tỷ lệ cơ bản theo nhóm hàng (và tình trạng New vs Used)
        BigDecimal baseRate = determineBaseRate(category, conditionGrade);

        // 2. Mức ký quỹ & Ưu đãi ký quỹ
        BigDecimal depositAmount = getShopDepositAmount(shop);
        BigDecimal depositDiscount = determineDepositDiscount(depositAmount);

        // 3. Thời gian hoạt động & Ưu đãi thâm niên
        LocalDateTime createdAt = shop != null && shop.getCreatedAt() != null ? shop.getCreatedAt() : LocalDateTime.now();
        long activeMonths = ChronoUnit.MONTHS.between(createdAt, LocalDateTime.now());
        int violationCount = getShopViolationCount(shop);
        BigDecimal seniorityDiscount = determineSeniorityDiscount(activeMonths, violationCount);

        // 4. Áp dụng công thức GVHD: Phí cuối = Base - Ưu đãi Ký Quỹ - Ưu đãi Thâm Niên
        BigDecimal calculatedRate = baseRate.subtract(depositDiscount).subtract(seniorityDiscount);

        // 5. Ràng buộc Ngưỡng sàn tối thiểu (Floor Rate)
        BigDecimal finalRate = calculatedRate.compareTo(FLOOR_RATE) < 0 ? FLOOR_RATE : calculatedRate;

        String categoryName = category != null ? category.getName() : "Mặc định";
        String explanation = String.format(
                "Tỷ lệ cơ bản ngành [%s] (%s%%) - Ưu đãi ký quỹ (%s%%) - Ưu đãi thâm niên %d tháng (%s%%) = %s%% (Ngưỡng sàn: %s%%)",
                categoryName,
                baseRate.setScale(1, RoundingMode.HALF_UP),
                depositDiscount.setScale(1, RoundingMode.HALF_UP),
                activeMonths,
                seniorityDiscount.setScale(1, RoundingMode.HALF_UP),
                finalRate.setScale(2, RoundingMode.HALF_UP),
                FLOOR_RATE.setScale(1, RoundingMode.HALF_UP)
        );

        return CommissionRateBreakdown.builder()
                .baseRate(baseRate)
                .depositDiscount(depositDiscount)
                .seniorityDiscount(seniorityDiscount)
                .floorRate(FLOOR_RATE)
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
        // Hàng cũ / Đã qua sử dụng: 6.0%
        if (conditionGrade != null && conditionGrade != ConditionGrade.GRADE_NEW) {
            return new BigDecimal("6.00");
        }

        if (category == null || category.getName() == null) {
            return new BigDecimal("5.00");
        }

        String name = category.getName().toLowerCase();
        if (name.contains("điện thoại") || name.contains("máy tính bảng")) {
            return new BigDecimal("3.50"); // 3.5%
        } else if (name.contains("laptop") || name.contains("máy tính")) {
            return new BigDecimal("4.00"); // 4.0%
        } else if (name.contains("linh kiện") || name.contains("pc build")) {
            return new BigDecimal("4.50"); // 4.5%
        } else if (name.contains("máy ảnh") || name.contains("quay phim")) {
            return new BigDecimal("5.00"); // 5.0%
        } else if (name.contains("âm thanh") || name.contains("đồng hồ") || name.contains("đeo")) {
            return new BigDecimal("7.00"); // 7.0%
        } else if (name.contains("phụ kiện") || name.contains("gaming gear")) {
            return new BigDecimal("9.00"); // 9.0%
        }

        return new BigDecimal("5.00");
    }

    private BigDecimal getShopDepositAmount(Shop shop) {
        if (shop == null) return BigDecimal.ZERO;
        if (shop.getEscrowFund() != null && shop.getEscrowFund().getBalance() != null) {
            return shop.getEscrowFund().getBalance();
        }
        if (shop.getDepositBalance() != null) {
            return shop.getDepositBalance();
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal determineDepositDiscount(BigDecimal deposit) {
        if (deposit == null) return BigDecimal.ZERO;
        // >= 50 triệu -> giảm 1.5%
        if (deposit.compareTo(new BigDecimal("50000000")) >= 0) {
            return new BigDecimal("1.50");
        }
        // >= 30 triệu -> giảm 1.0%
        if (deposit.compareTo(new BigDecimal("30000000")) >= 0) {
            return new BigDecimal("1.00");
        }
        // >= 10 triệu -> giảm 0.5%
        if (deposit.compareTo(new BigDecimal("10000000")) >= 0) {
            return new BigDecimal("0.50");
        }
        return BigDecimal.ZERO;
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
        // Nếu Shop có vi phạm -> không áp dụng ưu đãi thâm niên
        if (violationCount > 0) {
            return BigDecimal.ZERO;
        }

        // >= 12 tháng -> giảm 1.0%
        if (activeMonths >= 12) {
            return new BigDecimal("1.00");
        }
        // >= 6 tháng -> giảm 0.5%
        if (activeMonths >= 6) {
            return new BigDecimal("0.50");
        }
        // >= 3 tháng -> giảm 0.2%
        if (activeMonths >= 3) {
            return new BigDecimal("0.20");
        }
        return BigDecimal.ZERO;
    }
}
