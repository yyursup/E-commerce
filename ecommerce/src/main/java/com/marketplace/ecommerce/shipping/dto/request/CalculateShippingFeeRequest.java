package com.marketplace.ecommerce.shipping.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalculateShippingFeeRequest {
    private String shopId;                // UUID của shop
    private Integer toDistrictId;         // Mã quận/huyện điểm đến (GHN)
    private String toWardCode;           // Mã phường/xã điểm đến (GHN)
    private Integer weight;               // Tổng cân nặng (gram) - optional, sẽ tính từ cart nếu không có
}
