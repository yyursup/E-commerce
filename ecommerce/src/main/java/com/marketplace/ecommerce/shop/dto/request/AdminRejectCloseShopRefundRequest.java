package com.marketplace.ecommerce.shop.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminRejectCloseShopRefundRequest {

    @NotBlank(message = "Lý do từ chối yêu cầu đóng gian hàng không được để trống")
    private String reason;
}
