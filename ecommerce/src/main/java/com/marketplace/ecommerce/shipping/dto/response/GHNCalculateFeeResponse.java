package com.marketplace.ecommerce.shipping.dto.response;

import lombok.Data;

@Data
public class GHNCalculateFeeResponse {
    private Integer total;                 // Tổng phí (VNĐ)
    private Integer service_fee;          // Phí dịch vụ
    private Integer insurance_fee;         // Phí bảo hiểm
    private Integer pick_station_fee;     // Phí lấy hàng tại bưu cục
    private Integer coupon_value;         // Giá trị coupon (nếu có)
    private Integer r2s_fee;              // Phí R2S
    private Integer return_again;          // Phí giao lại
    private Integer document_return;      // Phí trả chứng từ
    private Integer double_check;         // Phí kiểm tra kép
    private Integer cod_fee;               // Phí thu hộ (COD)
    private Integer pick_remote_areas_fee; // Phí lấy hàng vùng xa
    private Integer deliver_remote_areas_fee; // Phí giao hàng vùng xa
    private Integer cod_failed_fee;       // Phí thu hộ thất bại
}
