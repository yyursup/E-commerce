package com.marketplace.ecommerce.shop.dto.response;

import com.marketplace.ecommerce.request.valueObjects.TargetType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopViolationResponse {
    private UUID reportId;
    private TargetType targetType;
    private UUID targetId;
    private String targetName;
    private String reason;
    private String evidenceUrl;
    private String coverImageUrl;
    private LocalDateTime createdAt;
    private String adminNote;
    private String appealStatus; // NONE, PENDING, APPROVED, REJECTED
    private UUID appealRequestId;
    private String appealResponse;
}
