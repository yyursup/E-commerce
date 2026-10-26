package com.marketplace.ecommerce.request.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitBanReviewRequest {

    @NotBlank(message = "Lý do giải trình không được để trống")
    @Size(max = 2000, message = "Lý do giải trình tối đa 2000 ký tự")
    private String description;

    @Size(max = 2000, message = "URL bằng chứng tối đa 2000 ký tự")
    private String coverImageUrl;
}
