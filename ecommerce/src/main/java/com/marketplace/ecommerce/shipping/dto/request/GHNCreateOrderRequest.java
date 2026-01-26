package com.marketplace.ecommerce.shipping.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GHNCreateOrderRequest {
    private Integer payment_type_id;      // 1 = người gửi trả, 2 = người nhận trả
    private String note;                  // Ghi chú
    private String required_note;         // CHOTHUHANG, CHOXEMHANGKHONGTHU, KHONGCHOXEMHANG
    private String to_name;               // Tên người nhận
    private String to_phone;              // SĐT người nhận
    private String to_address;            // Địa chỉ chi tiết
    private String to_ward_code;          // Mã phường/xã
    private String to_district_id;        // Mã quận/huyện
    private Integer cod_amount;           // Số tiền thu hộ (VNĐ) - nếu có COD
    private Integer weight;               // Cân nặng (gram)
    private Integer length;                // Chiều dài (cm)
    private Integer width;                 // Chiều rộng (cm)
    private Integer height;                // Chiều cao (cm)
    private Integer service_type_id;       // 2 = hàng nhẹ, 5 = hàng nặng
    private Integer service_id;           // ID dịch vụ (lấy từ API danh sách dịch vụ)
    private Integer insurance_value;       // Khai giá hàng hóa (VNĐ)
    private String client_order_code;     // Mã đơn hàng của bạn (orderNumber)
    private Integer pick_station_id;      // ID bưu cục lấy hàng (optional)
    private List<GHNItem> items;         // Danh sách sản phẩm (cho hàng nặng)

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GHNItem {
        private String name;               // Tên sản phẩm
        private Integer quantity;          // Số lượng
        private Integer weight;            // Cân nặng (gram)
        private Integer length;            // Chiều dài (cm)
        private Integer width;             // Chiều rộng (cm)
        private Integer height;            // Chiều cao (cm)
    }
}
