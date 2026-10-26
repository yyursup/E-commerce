package com.marketplace.ecommerce.config.seed;

import com.marketplace.ecommerce.platform.constant.PlatformConstant;
import com.marketplace.ecommerce.platform.entity.PlatformSetting;
import com.marketplace.ecommerce.platform.entity.SeniorityPolicyConfig;
import com.marketplace.ecommerce.platform.repository.PlatformSettingRepository;
import com.marketplace.ecommerce.platform.repository.SeniorityPolicyConfigRepository;
import com.marketplace.ecommerce.shop.entity.TrustLevelConfig;
import com.marketplace.ecommerce.shop.repository.TrustLevelConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class PlatformSettingSeeder {

    private final PlatformSettingRepository platformSettingRepository;
    private final TrustLevelConfigRepository trustLevelConfigRepository;
    private final SeniorityPolicyConfigRepository seniorityPolicyConfigRepository;

    public void seed() {
        log.info("Seeding platform settings, trust level tiers, and seniority policies...");

        // 1. Core Commission Rates
        initializePlatformSetting(PlatformConstant.KEY_COMMISSION_RATE, "5.0");
        initializePlatformSetting(PlatformConstant.KEY_COMMISSION_FLOOR_RATE, "1.50");
        initializePlatformSetting(PlatformConstant.KEY_COMMISSION_USED_GOODS_RATE, "6.00");

        // 2. 5 Star Trust Level Tiers with Escrow Deposit Thresholds and Commission Discounts
        initializeTrustLevels();

        // 3. Seniority Discount Policies
        initializeSeniorityPolicies();

        log.info("Platform settings, trust levels, and seniority policies seeded successfully.");
    }

    private PlatformSetting initializePlatformSetting(String key, String value) {
        return platformSettingRepository.findByKey(key)
                .orElseGet(() -> {
                    LocalDateTime now = LocalDateTime.now();
                    PlatformSetting setting = new PlatformSetting();
                    setting.setKey(key);
                    setting.setValue(value);
                    setting.setUpdatedAt(now);
                    PlatformSetting saved = platformSettingRepository.save(setting);
                    log.info("Created platform setting: {} = {}", key, value);
                    return saved;
                });
    }

    private void initializeTrustLevels() {
        initializeSingleTrustLevel(1, "Cơ bản (Chưa ký quỹ)", BigDecimal.ZERO, new BigDecimal("1000000"), BigDecimal.ZERO,
                "Cấp độ cơ bản cho gian hàng không ký quỹ hoặc ký quỹ < 1 triệu. Vẫn được bán hàng nhưng mức độ bảo chứng tối thiểu, áp dụng hoa hồng tiêu chuẩn.");
        initializeSingleTrustLevel(2, "Tiềm năng", new BigDecimal("1000000"), new BigDecimal("5000000"), new BigDecimal("0.20"),
                "Huy hiệu Bảo chứng 2 sao. Có cam kết ký quỹ trách nhiệm từ 1 triệu đến dưới 5 triệu đồng, giảm 0.2% hoa hồng sàn.");
        initializeSingleTrustLevel(3, "Uy tín Tiêu chuẩn", new BigDecimal("5000000"), new BigDecimal("20000000"), new BigDecimal("0.50"),
                "Huy hiệu Bảo chứng 3 sao. Ưu tiên hiển thị kết quả tìm kiếm, hỗ trợ phân xử khiếu nại nhanh, giảm 0.5% hoa hồng sàn.");
        initializeSingleTrustLevel(4, "Đối tác Vàng", new BigDecimal("20000000"), new BigDecimal("50000000"), new BigDecimal("1.00"),
                "Huy hiệu Đối tác Vàng 4 sao. Được gắn nhãn Gian hàng Đảm bảo, ưu tiên đẩy top tìm kiếm và livestream, giảm 1.0% hoa hồng sàn.");
        initializeSingleTrustLevel(5, "Kim Cương / Cam Kết Tối Đa", new BigDecimal("50000000"), null, new BigDecimal("1.50"),
                "Huy hiệu Kim Cương 5 sao danh giá nhất. Cam kết bảo chứng tối đa, ưu tiên nổi bật trên banner sàn, đền bù tức thì nếu có lỗi, giảm 1.5% hoa hồng sàn.");
    }

    private void initializeSingleTrustLevel(int star, String name, BigDecimal min, BigDecimal max, BigDecimal discount, String desc) {
        var existingOpt = trustLevelConfigRepository.findByStarLevel(star);
        if (existingOpt.isEmpty()) {
            TrustLevelConfig config = TrustLevelConfig.builder()
                    .starLevel(star)
                    .tierName(name)
                    .minDeposit(min)
                    .maxDeposit(max)
                    .commissionDiscount(discount)
                    .benefitsDescription(desc)
                    .isActive(true)
                    .build();
            trustLevelConfigRepository.save(config);
        } else {
            // Update discount default if 0 or null
            TrustLevelConfig config = existingOpt.get();
            if (config.getCommissionDiscount() == null || (config.getCommissionDiscount().compareTo(BigDecimal.ZERO) == 0 && discount.compareTo(BigDecimal.ZERO) > 0)) {
                config.setCommissionDiscount(discount);
                if (config.getBenefitsDescription() == null || config.getBenefitsDescription().isBlank()) {
                    config.setBenefitsDescription(desc);
                }
                trustLevelConfigRepository.save(config);
            }
        }
    }

    private void initializeSeniorityPolicies() {
        initializeSingleSeniorityPolicy(3, new BigDecimal("0.20"), "Đồng hành 3 tháng", "Áp dụng cho shop hoạt động liên tục trên 3 tháng không có vi phạm");
        initializeSingleSeniorityPolicy(6, new BigDecimal("0.50"), "Đồng hành 6 tháng", "Áp dụng cho shop hoạt động liên tục trên 6 tháng không có vi phạm");
        initializeSingleSeniorityPolicy(12, new BigDecimal("1.00"), "Thân thiết 1 năm", "Áp dụng cho shop hoạt động liên tục trên 1 năm không có vi phạm");
    }

    private void initializeSingleSeniorityPolicy(int minMonths, BigDecimal discount, String name, String desc) {
        seniorityPolicyConfigRepository.findByMinMonths(minMonths)
                .map(existing -> {
                    existing.setDiscountRate(discount);
                    existing.setTierName(name);
                    existing.setDescription(desc);
                    existing.setIsActive(true);
                    return seniorityPolicyConfigRepository.save(existing);
                })
                .orElseGet(() -> {
                    SeniorityPolicyConfig policy = SeniorityPolicyConfig.builder()
                            .minMonths(minMonths)
                            .discountRate(discount)
                            .tierName(name)
                            .description(desc)
                            .isActive(true)
                            .build();
                    return seniorityPolicyConfigRepository.save(policy);
                });
    }
}
