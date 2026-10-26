package com.marketplace.ecommerce.request.dto.request;

import com.marketplace.ecommerce.request.valueObjects.DisputeSellerAction;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerDisputeRespondRequest {
    @NotNull(message = "Hành động phản hồi không được để trống")
    private DisputeSellerAction action;

    @Size(max = 2000, message = "Nội dung phản hồi không quá 2000 ký tự")
    private String responseNote;

    @Size(max = 2000, message = "URL bằng chứng không quá 2000 ký tự")
    private String evidenceUrl;
}
