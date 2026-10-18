package com.marketplace.ecommerce.request.dto.response;

import com.marketplace.ecommerce.request.valueObjects.DisputePolicyClause;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisputePolicyClauseResponse {
    private String code;
    private String title;
    private String description;
    private String category;

    public static DisputePolicyClauseResponse from(DisputePolicyClause clause) {
        return DisputePolicyClauseResponse.builder()
                .code(clause.getCode())
                .title(clause.getTitle())
                .description(clause.getDescription())
                .category(clause.getCategory())
                .build();
    }
}
