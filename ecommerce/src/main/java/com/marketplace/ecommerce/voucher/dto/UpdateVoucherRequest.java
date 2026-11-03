package com.marketplace.ecommerce.voucher.dto;

import com.marketplace.ecommerce.voucher.valueObjects.VoucherType;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVoucherRequest {

    private String title;

    private String description;

    private VoucherType voucherType;

    @Positive(message = "Giá trị giảm giá phải lớn hơn 0")
    private BigDecimal discountValue;

    private BigDecimal maxDiscountAmount;

    private BigDecimal minOrderValue;

    private Integer usageLimit;

    private Integer userUsageLimit;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private UUID categoryId;

    private Boolean isFirstOrderOnly;
}
