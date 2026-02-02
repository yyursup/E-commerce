package com.marketplace.ecommerce.shipping.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class GHNCancelOrderResponse {
    private List<String> order_codes;  // Danh sách mã đơn đã hủy
    private Boolean result;            // Kết quả: true = thành công
}
