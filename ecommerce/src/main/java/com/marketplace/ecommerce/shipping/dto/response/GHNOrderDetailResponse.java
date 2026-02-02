package com.marketplace.ecommerce.shipping.dto.response;

import lombok.Data;

@Data
public class GHNOrderDetailResponse {
    private String order_code;             // Mã vận đơn GHN
    private String sort_code;              // Mã sắp xếp
    private String trans_type;             // Loại vận chuyển
    private String ward_encode;            // Mã phường/xã
    private String district_encode;        // Mã quận/huyện
    private Integer fee;                   // Phí vận chuyển (VNĐ)
    private Integer total_fee;             // Tổng phí (VNĐ)
    private Integer expected_delivery_time; // Thời gian giao dự kiến (timestamp)
    private String status;                 // Trạng thái: ready_to_pick, picking, picked, storing, transporting, sorting, delivering, delivered, delivery_fail, return, returned, cancel
    private String status_text;           // Mô tả trạng thái
    private Long created_date;            // Ngày tạo (timestamp)
    private Long updated_date;             // Ngày cập nhật (timestamp)
    private Long pickup_time;              // Thời gian lấy hàng (timestamp)
    private Long deliver_time;             // Thời gian giao hàng (timestamp)
    private Long return_time;              // Thời gian trả hàng (timestamp)
    private Long cancel_time;              // Thời gian hủy (timestamp)
    private Integer cod_amount;            // Số tiền thu hộ (VNĐ)
    private Long cod_collect_date;        // Ngày thu COD (timestamp)
    private Long cod_transfer_date;        // Ngày chuyển COD (timestamp)
    private Long cod_failed_date;          // Ngày thu COD thất bại (timestamp)
}
