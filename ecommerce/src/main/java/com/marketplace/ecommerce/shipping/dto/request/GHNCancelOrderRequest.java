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
public class GHNCancelOrderRequest {
    private List<String> order_codes;  // Danh sách mã vận đơn GHN cần hủy
}
