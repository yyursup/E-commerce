package com.marketplace.ecommerce.request.dto.response;

import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestDetailsResponse {
    private UUID requestId;
    private RequestType type;
    private RequestStatus status;

    private String description;
    private String coverImageUrl;

    private UUID accountId;

    private UUID reviewedBy;
    private LocalDateTime reviewedAt;
    private String rejectionReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Object detail;


    public static RequestDetailsResponse from(Request r, Object detail) {
        return RequestDetailsResponse.builder()
                .requestId(r.getId())
                .type(r.getType())
                .status(r.getStatus())
                .description(r.getDescription())
                .coverImageUrl(r.getCoverImageUrl())
                .accountId(r.getAccount() != null ? r.getAccount().getId() : null)
                .reviewedBy(r.getReviewedBy() != null ? r.getReviewedBy().getId() : null)
                .reviewedAt(r.getReviewedAt())
                .rejectionReason(r.getResponse())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .detail(detail)
                .build();
    }

}
