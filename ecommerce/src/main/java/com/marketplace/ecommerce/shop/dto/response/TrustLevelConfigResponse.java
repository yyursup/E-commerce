package com.marketplace.ecommerce.shop.dto.response;

import com.marketplace.ecommerce.shop.entity.TrustLevelConfig;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrustLevelConfigResponse {

    private UUID id;
    private Integer starLevel;
    private String tierName;
    private BigDecimal minDeposit;
    private BigDecimal maxDeposit;
    private String badgeIconUrl;
    private String benefitsDescription;
    private BigDecimal commissionDiscount;
    private Boolean isActive;
    private LocalDateTime updatedAt;

    public static TrustLevelConfigResponse from(TrustLevelConfig config) {
        if (config == null) return null;
        return TrustLevelConfigResponse.builder()
                .id(config.getId())
                .starLevel(config.getStarLevel())
                .tierName(config.getTierName())
                .minDeposit(config.getMinDeposit())
                .maxDeposit(config.getMaxDeposit())
                .badgeIconUrl(config.getBadgeIconUrl())
                .benefitsDescription(config.getBenefitsDescription())
                .commissionDiscount(config.getCommissionDiscount())
                .isActive(config.getIsActive())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
