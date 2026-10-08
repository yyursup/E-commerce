package com.marketplace.ecommerce.order.dto.request;

import com.marketplace.ecommerce.order.valueObjects.ReturnConditionStatus;
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
public class SellerCompleteReturnRequest {

    @NotNull(message = "Tình trạng hàng hóa không được để trống")
    private ReturnConditionStatus conditionStatus;

    @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
    private String conditionNote;

    @NotNull(message = "Cần chỉ định có nhập lại kho hay không")
    private Boolean isRestocked;
}
