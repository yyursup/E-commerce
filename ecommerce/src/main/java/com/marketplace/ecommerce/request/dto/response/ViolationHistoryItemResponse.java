package com.marketplace.ecommerce.request.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViolationHistoryItemResponse {
    private UUID reportId;
    private String displayCode;
    private String targetType;
    private UUID targetId;
    private String targetName;
    private String policyClauseCode;
    private String policyClauseTitle;
    private String description;
    private String moderatorNote;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
}
