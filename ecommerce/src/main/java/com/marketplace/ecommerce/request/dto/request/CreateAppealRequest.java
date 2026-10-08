package com.marketplace.ecommerce.request.dto.request;

import com.marketplace.ecommerce.request.valueObjects.TargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAppealRequest {

    @NotNull(message = "targetId is required")
    private UUID targetId;

    @NotNull(message = "targetType is required")
    private TargetType targetType;

    private UUID reportId;

    @NotBlank(message = "description is required")
    private String description;

    private String evidenceUrl;
}
