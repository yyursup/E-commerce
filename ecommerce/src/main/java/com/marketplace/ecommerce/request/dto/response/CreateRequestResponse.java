package com.marketplace.ecommerce.request.dto.response;

import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.valueObjects.ReportStage;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRequestResponse {
    private UUID requestId;
    private UUID accountId;
    private RequestType type;
    private RequestStatus status;
    private String description;
    private String coverImageUrl;
    private String response;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private String displayCode;
    private TargetType targetType;
    private ReportStage stage;

    public static CreateRequestResponse from(Request request) {
        return CreateRequestResponse.builder()
                .requestId(request.getId())
                .accountId(request.getAccount() != null ? request.getAccount().getId() : null)
                .type(request.getType())
                .status(request.getStatus())
                .description(request.getDescription())
                .coverImageUrl(request.getCoverImageUrl())
                .response(request.getResponse())
                .reviewedAt(request.getReviewedAt())
                .createdAt(request.getCreatedAt())
                .displayCode(request.getDisplayCode())
                .build();
    }

    public static CreateRequestResponse from(Request request, Report report) {
        CreateRequestResponse res = from(request);
        if (report != null) {
            res.setTargetType(report.getTargetType());
            res.setStage(report.getStage());
        }
        return res;
    }
}

