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
public class CreateRequestResponse {
    private UUID requestId;
    private UUID accountId;
    private RequestType type;
    private RequestStatus status;
    private LocalDateTime createdAt;

    public static CreateRequestResponse from(Request request) {
        return CreateRequestResponse.builder()
                .requestId(request.getId())
                .accountId(request.getAccount().getId())
                .type(request.getType())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .build();
    }
}

