package com.marketplace.ecommerce.payment.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EscrowSplitSettlementRequest {

    @NotNull(message = "Tỷ lệ hoàn cho Người mua không được để trống")
    @Min(value = 0, message = "Tỷ lệ Người mua tối thiểu 0%")
    @Max(value = 100, message = "Tỷ lệ Người mua tối đa 100%")
    private Integer buyerPercentage;

    @NotNull(message = "Tỷ lệ giải ngân cho Người bán không được để trống")
    @Min(value = 0, message = "Tỷ lệ Người bán tối thiểu 0%")
    @Max(value = 100, message = "Tỷ lệ Người bán tối đa 100%")
    private Integer sellerPercentage;

    private String note;
}
