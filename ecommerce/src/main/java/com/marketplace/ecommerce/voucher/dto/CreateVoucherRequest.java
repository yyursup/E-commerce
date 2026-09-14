package com.marketplace.ecommerce.voucher.dto;

import com.marketplace.ecommerce.voucher.valueObjects.VoucherScope;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateVoucherRequest {

    @NotBlank(message = "Mã voucher không được để trống")
    private String code;

    @NotBlank(message = "Tiêu đề voucher không được để trống")
    private String title;

    private String description;

    @NotNull(message = "Loại voucher không được để trống")
    private VoucherType voucherType;

    @NotNull(message = "Giá trị giảm giá không được để trống")
    @Positive(message = "Giá trị giảm giá phải lớn hơn 0")
    private BigDecimal discountValue;

    private BigDecimal maxDiscountAmount;

    private BigDecimal minOrderValue;

    private Integer usageLimit;

    private Integer userUsageLimit;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private VoucherScope scope;

    private UUID shopId;

    private UUID categoryId;

    private Boolean isFirstOrderOnly;
}
