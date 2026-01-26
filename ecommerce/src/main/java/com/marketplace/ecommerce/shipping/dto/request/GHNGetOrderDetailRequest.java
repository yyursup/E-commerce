package com.marketplace.ecommerce.shipping.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GHNGetOrderDetailRequest {
    private String order_code;  // Mã vận đơn GHN (nếu dùng order_code)
    private String client_order_code;  // Mã đơn hàng của bạn (nếu dùng client_order_code)
}
