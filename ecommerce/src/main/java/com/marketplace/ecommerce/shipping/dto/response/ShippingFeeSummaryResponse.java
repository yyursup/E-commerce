package com.marketplace.ecommerce.shipping.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ShippingFeeSummaryResponse {
    private long outboundCount;
    private BigDecimal outboundTotal;
    private long returnCount;
    private BigDecimal returnTotal;
    private BigDecimal grandTotal;
}
