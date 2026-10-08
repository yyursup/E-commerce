package com.marketplace.ecommerce.request.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePublicAppealRequest {

    @NotBlank(message = "description is required")
    private String description;

    private String evidenceUrl;
}
