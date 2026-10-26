package com.marketplace.ecommerce.platform.policy.dto;

import com.marketplace.ecommerce.platform.policy.entity.DisputePolicyClauseEntity;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisputePolicyClauseResponse {

    private UUID id;
    private String code;
    private String title;
    private String description;
    private String category;
    private Integer displayOrder;
    private Boolean isActive;

    public static DisputePolicyClauseResponse from(DisputePolicyClauseEntity entity) {
        if (entity == null) return null;
        return DisputePolicyClauseResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .category(entity.getCategory())
                .displayOrder(entity.getDisplayOrder())
                .isActive(entity.getIsActive())
                .build();
    }
}
