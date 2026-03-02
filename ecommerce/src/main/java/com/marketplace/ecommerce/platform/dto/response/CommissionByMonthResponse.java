package com.marketplace.ecommerce.platform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
public class CommissionByMonthResponse {

    private Integer year;
    private Integer month;
    private BigDecimal totalCommission;

    public static CommissionByMonthResponse from(Integer year, Integer month, BigDecimal totalCommission) {
        return CommissionByMonthResponse.builder()
                .year(year)
                .month(month)
                .totalCommission(totalCommission)
                .build();
    }
}