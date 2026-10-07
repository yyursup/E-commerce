package com.marketplace.ecommerce.statistics.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailySalesPointDTO {
    private String date; // format: YYYY-MM-DD
    private BigDecimal revenue;
    private Long orderCount;
}
