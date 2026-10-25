package com.marketplace.ecommerce.platform.policy.dto;

import com.marketplace.ecommerce.platform.policy.entity.PlatformPolicy;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformPolicyResponse {

    private UUID id;
    private String policyKey;
    private String title;
    private String summary;
    private String content;
    private String category;
    private String targetAudience;
    private String version;
    private Integer displayOrder;
    private Boolean isActive;
    private LocalDateTime effectiveDate;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PlatformPolicyResponse from(PlatformPolicy entity) {
        if (entity == null) return null;
        return PlatformPolicyResponse.builder()
                .id(entity.getId())
                .policyKey(entity.getPolicyKey())
                .title(entity.getTitle())
                .summary(entity.getSummary())
                .content(entity.getContent())
                .category(entity.getCategory())
                .targetAudience(entity.getTargetAudience())
                .version(entity.getVersion())
                .displayOrder(entity.getDisplayOrder())
                .isActive(entity.getIsActive())
                .effectiveDate(entity.getEffectiveDate())
                .updatedBy(entity.getUpdatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
