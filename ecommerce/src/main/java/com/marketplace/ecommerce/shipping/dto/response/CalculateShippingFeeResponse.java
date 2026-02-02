package com.marketplace.ecommerce.shipping.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalculateShippingFeeResponse {
    private BigDecimal shippingFee;      // Phí vận chuyển (VNĐ)
    private Integer estimatedDays;        // Số ngày dự kiến giao hàng (nếu có)
    private String message;               // Thông báo (nếu có lỗi)
    private boolean success;              // Thành công hay không
}
