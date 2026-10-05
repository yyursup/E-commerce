package com.marketplace.ecommerce.shop.service.impl;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.shop.dto.request.TrustLevelConfigRequest;
import com.marketplace.ecommerce.shop.dto.response.TrustLevelConfigResponse;
import com.marketplace.ecommerce.shop.entity.TrustLevelConfig;
import com.marketplace.ecommerce.shop.repository.TrustLevelConfigRepository;
import com.marketplace.ecommerce.shop.service.TrustLevelConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrustLevelConfigServiceImpl implements TrustLevelConfigService {

    private final TrustLevelConfigRepository trustLevelConfigRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TrustLevelConfigResponse> getAllConfigs() {
        return trustLevelConfigRepository.findAllByOrderByStarLevelAsc()
                .stream()
                .map(TrustLevelConfigResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrustLevelConfigResponse> getActiveConfigs() {
        return trustLevelConfigRepository.findAllByIsActiveTrueOrderByStarLevelAsc()
                .stream()
                .map(TrustLevelConfigResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public TrustLevelConfigResponse updateConfig(Integer starLevel, TrustLevelConfigRequest request, UUID adminId) {
        if (starLevel == null || starLevel < 1 || starLevel > 5) {
            throw new CustomException("Cấp bậc sao không hợp lệ (phải từ 1 đến 5 sao)");
        }

        TrustLevelConfig config = trustLevelConfigRepository.findByStarLevel(starLevel)
                .orElseThrow(() -> new CustomException("Không tìm thấy cấu hình cho bậc sao: " + starLevel));

        if (request.getMinDeposit().compareTo(BigDecimal.ZERO) < 0) {
            throw new CustomException("Ngưỡng tiền tối thiểu không được âm");
        }

        if (request.getMaxDeposit() != null && request.getMaxDeposit().compareTo(request.getMinDeposit()) <= 0) {
            throw new CustomException("Ngưỡng tiền tối đa phải lớn hơn ngưỡng tối thiểu");
        }

        config.setTierName(request.getTierName().trim());
        config.setMinDeposit(request.getMinDeposit());
        config.setMaxDeposit(request.getMaxDeposit());
        if (request.getBadgeIconUrl() != null) {
            config.setBadgeIconUrl(request.getBadgeIconUrl());
        }
        if (request.getBenefitsDescription() != null) {
            config.setBenefitsDescription(request.getBenefitsDescription());
        }
        if (request.getCommissionDiscount() != null) {
            if (request.getCommissionDiscount().compareTo(BigDecimal.ZERO) < 0
                    || request.getCommissionDiscount().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new CustomException("Chiết khấu hoa hồng phải từ 0% đến 100%");
            }
            config.setCommissionDiscount(request.getCommissionDiscount());
        }
        if (request.getIsActive() != null) {
            config.setIsActive(request.getIsActive());
        }
        config.setUpdatedAt(LocalDateTime.now());
        config.setUpdatedBy(adminId);

        TrustLevelConfig saved = trustLevelConfigRepository.save(config);
        log.info("Admin {} đã cập nhật cấu hình bậc sao {}: tierName={}, minDeposit={}, maxDeposit={}",
                adminId, starLevel, saved.getTierName(), saved.getMinDeposit(), saved.getMaxDeposit());

        return TrustLevelConfigResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public TrustLevelConfig getConfigByStarLevel(Integer starLevel) {
        return trustLevelConfigRepository.findByStarLevel(starLevel).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public int resolveTrustLevel(BigDecimal depositAmount) {
        if (depositAmount == null || depositAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return 1;
        }

        List<TrustLevelConfig> configs = trustLevelConfigRepository.findAllByIsActiveTrueOrderByStarLevelAsc();
        if (configs.isEmpty()) {
            return 1;
        }

        int resolvedStar = 1;
        // Duyệt từ thấp đến cao, nếu depositAmount >= minDeposit của tier đó thì cập nhật resolvedStar
        for (TrustLevelConfig config : configs) {
            if (config.getMinDeposit() != null && depositAmount.compareTo(config.getMinDeposit()) >= 0) {
                resolvedStar = config.getStarLevel();
            }
        }

        return resolvedStar;
    }

    @Override
    @Transactional
    public List<TrustLevelConfigResponse> resetDefaultConfigs(UUID adminId) {
        log.info("Admin {} đang khôi phục cấu hình bậc sao ký quỹ mặc định...", adminId);
        List<TrustLevelConfig> defaults = List.of(
                buildDefaultConfig(1, "Cơ bản (Chưa ký quỹ)", BigDecimal.ZERO, new BigDecimal("1000000"),
                        "/badges/star-1.png", "Cấp độ cơ bản cho gian hàng không ký quỹ hoặc ký quỹ < 1 triệu. Vẫn được bán hàng nhưng mức độ bảo chứng tối thiểu, áp dụng hoa hồng tiêu chuẩn.", BigDecimal.ZERO, adminId),
                buildDefaultConfig(2, "Tiềm năng", new BigDecimal("1000000"), new BigDecimal("5000000"),
                        "/badges/star-2.png", "Huy hiệu Bảo chứng 2 sao. Có cam kết ký quỹ trách nhiệm từ 1 triệu đến dưới 5 triệu đồng, giảm 0.2% hoa hồng sàn.", new BigDecimal("0.20"), adminId),
                buildDefaultConfig(3, "Uy tín Tiêu chuẩn", new BigDecimal("5000000"), new BigDecimal("20000000"),
                        "/badges/star-3.png", "Huy hiệu Bảo chứng 3 sao. Ưu tiên hiển thị kết quả tìm kiếm, hỗ trợ phân xử khiếu nại nhanh, giảm 0.5% hoa hồng sàn.", new BigDecimal("0.50"), adminId),
                buildDefaultConfig(4, "Đối tác Vàng", new BigDecimal("20000000"), new BigDecimal("50000000"),
                        "/badges/star-4.png", "Huy hiệu Đối tác Vàng 4 sao. Được gắn nhãn Gian hàng Đảm bảo, ưu tiên đẩy top tìm kiếm và livestream, giảm 1.0% hoa hồng sàn.", new BigDecimal("1.00"), adminId),
                buildDefaultConfig(5, "Kim Cương / Cam Kết Tối Đa", new BigDecimal("50000000"), null,
                        "/badges/star-5.png", "Huy hiệu Kim Cương 5 sao danh giá nhất. Cam kết bảo chứng tối đa, ưu tiên nổi bật trên banner sàn, đền bù tức thì nếu có lỗi, giảm 1.5% hoa hồng sàn.", new BigDecimal("1.50"), adminId)
        );

        for (TrustLevelConfig def : defaults) {
            TrustLevelConfig existing = trustLevelConfigRepository.findByStarLevel(def.getStarLevel()).orElse(null);
            if (existing != null) {
                existing.setTierName(def.getTierName());
                existing.setMinDeposit(def.getMinDeposit());
                existing.setMaxDeposit(def.getMaxDeposit());
                existing.setBadgeIconUrl(def.getBadgeIconUrl());
                existing.setBenefitsDescription(def.getBenefitsDescription());
                existing.setCommissionDiscount(def.getCommissionDiscount());
                existing.setIsActive(true);
                existing.setUpdatedAt(LocalDateTime.now());
                existing.setUpdatedBy(adminId);
                trustLevelConfigRepository.save(existing);
            } else {
                trustLevelConfigRepository.save(def);
            }
        }

        return getAllConfigs();
    }

    private TrustLevelConfig buildDefaultConfig(
            int star, String name, BigDecimal min, BigDecimal max,
            String icon, String desc, BigDecimal discount, UUID adminId
    ) {
        return TrustLevelConfig.builder()
                .starLevel(star)
                .tierName(name)
                .minDeposit(min)
                .maxDeposit(max)
                .badgeIconUrl(icon)
                .benefitsDescription(desc)
                .commissionDiscount(discount)
                .isActive(true)
                .updatedAt(LocalDateTime.now())
                .updatedBy(adminId)
                .build();
    }
}
