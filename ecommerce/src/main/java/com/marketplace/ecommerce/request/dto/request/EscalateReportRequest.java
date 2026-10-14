package com.marketplace.ecommerce.request.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EscalateReportRequest {
    @Size(max = 2000, message = "Lý do yêu cầu can thiệp không quá 2000 ký tự")
    private String reason;
}
