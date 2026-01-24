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
public class RequestResponse {
    private UUID requestId;
    private RequestType type;
    private RequestStatus status;

    private String description;
    private String coverImageUrl;

    private UUID accountId;

    private UUID reviewedBy;
    private LocalDateTime reviewedAt;
    private String response;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static RequestResponse from(Request request) {
        return RequestResponse.builder()
                .requestId(request.getId())
                .type(request.getType())
                .status(request.getStatus())
                .description(request.getDescription())
                .coverImageUrl(request.getCoverImageUrl())
                .accountId(request.getAccount().getId())
                .reviewedBy(request.getReviewedBy().getId())
                .reviewedAt(request.getReviewedAt())
                .response(request.getResponse())
                .updatedAt(request.getUpdatedAt())
                .build();
    }
}
