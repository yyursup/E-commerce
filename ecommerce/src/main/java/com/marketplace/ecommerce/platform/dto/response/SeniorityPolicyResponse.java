package com.marketplace.ecommerce.platform.dto.response;

import com.marketplace.ecommerce.platform.entity.SeniorityPolicyConfig;
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
public class SeniorityPolicyResponse {

    private UUID id;
    private Integer minMonths;
    private BigDecimal discountRate;
    private String tierName;
    private String description;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SeniorityPolicyResponse from(SeniorityPolicyConfig config) {
        if (config == null) return null;
        return SeniorityPolicyResponse.builder()
                .id(config.getId())
                .minMonths(config.getMinMonths())
                .discountRate(config.getDiscountRate())
                .tierName(config.getTierName())
                .description(config.getDescription())
                .isActive(config.getIsActive())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
