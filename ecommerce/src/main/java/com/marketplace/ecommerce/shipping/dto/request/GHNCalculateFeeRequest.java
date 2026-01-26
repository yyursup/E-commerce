package com.marketplace.ecommerce.shipping.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GHNCalculateFeeRequest {
    private Integer from_district_id;      // Mã quận/huyện điểm đi
    private String from_ward_code;         // Mã phường/xã điểm đi (GHN yêu cầu String)
    private Integer to_district_id;        // Mã quận/huyện điểm đến
    private String to_ward_code;          // Mã phường/xã điểm đến (GHN yêu cầu String)
    private Integer weight;               // Cân nặng (gram)
    private Integer length;                // Chiều dài (cm) - optional
    private Integer width;                 // Chiều rộng (cm) - optional
    private Integer height;                // Chiều cao (cm) - optional
    private Integer service_type_id;      // Loại dịch vụ: 2 = hàng nhẹ, 5 = hàng nặng
    private Integer insurance_value;      // Khai giá hàng hóa (VNĐ) - optional
}
