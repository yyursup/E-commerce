package com.marketplace.ecommerce.order.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitReturnTrackingRequest {

    @Size(max = 100, message = "Tên đơn vị vận chuyển tối đa 100 ký tự")
    private String carrierName;

    @Size(max = 100, message = "Mã vận đơn tối đa 100 ký tự")
    private String returnTrackingCode;

    private BigDecimal shippingFee;

    @Size(max = 2000, message = "Đường dẫn bằng chứng tối đa 2000 ký tự")
    private String buyerEvidenceUrls;
}
