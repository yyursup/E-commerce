package com.marketplace.ecommerce.voucher.dto;

import com.marketplace.ecommerce.voucher.valueObjects.VoucherScope;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
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
    @DecimalMax(value = "9999999999.99", message = "Giá trị giảm giá vượt quá giới hạn hệ thống cho phép")
    private BigDecimal discountValue;

    @DecimalMax(value = "9999999999.99", message = "Mức giảm tối đa vượt quá giới hạn hệ thống cho phép")
    private BigDecimal maxDiscountAmount;

    @PositiveOrZero(message = "Giá trị đơn hàng tối thiểu không được âm")
    @DecimalMax(value = "9999999999.99", message = "Giá trị đơn hàng tối thiểu vượt quá giới hạn hệ thống cho phép")
    private BigDecimal minOrderValue;

    @Positive(message = "Tổng lượt sử dụng phải lớn hơn 0")
    @Max(value = 10000000, message = "Tổng lượt sử dụng không được vượt quá 10.000.000")
    private Integer usageLimit;

    @Positive(message = "Lượt dùng mỗi tài khoản phải lớn hơn 0")
    @Max(value = 100, message = "Lượt dùng mỗi tài khoản không được vượt quá 100")
    private Integer userUsageLimit;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private VoucherScope scope;

    private UUID shopId;

    private UUID categoryId;

    private Boolean isFirstOrderOnly;
}
