package com.marketplace.ecommerce.order.dto.request;

import com.marketplace.ecommerce.order.valueObjects.ReturnConditionStatus;
import jakarta.validation.constraints.NotBlank;
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
public class SellerDisputeReturnRequest {

    @NotNull(message = "Tình trạng hàng hóa không được để trống")
    private ReturnConditionStatus conditionStatus;

    @NotBlank(message = "Lý do khiếu nại không được để trống")
    @Size(max = 1000, message = "Lý do khiếu nại tối đa 1000 ký tự")
    private String conditionNote;

    @Size(max = 2000, message = "Đường dẫn bằng chứng tối đa 2000 ký tự")
    private String sellerEvidenceUrls;
}
