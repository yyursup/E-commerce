package com.marketplace.ecommerce.request.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReportRequest {
    @Size(max = 5000)
    private String description;

    @Size(max = 255)
    private String coverImageUrl;

    @NotNull
    private UUID targetId;

    @Size(max = 255)
    private String evidenceUrl;
}
