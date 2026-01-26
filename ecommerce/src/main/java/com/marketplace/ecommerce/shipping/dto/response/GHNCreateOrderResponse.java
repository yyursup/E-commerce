package com.marketplace.ecommerce.shipping.dto.response;

import lombok.Data;

@Data
public class GHNCreateOrderResponse {
    private String order_code;             // Mã vận đơn GHN
    private String sort_code;              // Mã sắp xếp
    private String trans_type;             // Loại vận chuyển
    private String ward_encode;            // Mã phường/xã
    private String district_encode;        // Mã quận/huyện
    private Integer fee;                   // Phí vận chuyển (VNĐ)
    private Integer total_fee;             // Tổng phí (VNĐ)
    private Integer expected_delivery_time; // Thời gian giao dự kiến (timestamp)
}
