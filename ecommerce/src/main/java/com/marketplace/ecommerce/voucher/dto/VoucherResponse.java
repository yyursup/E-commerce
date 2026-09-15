package com.marketplace.ecommerce.voucher.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.marketplace.ecommerce.voucher.entity.Voucher;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherScope;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherStatus;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherType;
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
public class VoucherResponse {

    private UUID id;
    private String code;
    private String title;
    private String description;
    private VoucherType voucherType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderValue;
    private Integer usageLimit;
    private Integer usedCount;
    private Integer userUsageLimit;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private VoucherStatus status;
    private VoucherScope scope;

    private UUID shopId;
    private String shopName;

    private UUID categoryId;
    private String categoryName;

    @JsonProperty("isAvailable")
    private boolean isAvailable;

    @JsonProperty("isClaimed")
    private boolean isClaimed;

    @JsonProperty("isFirstOrderOnly")
    private Boolean isFirstOrderOnly;

    private LocalDateTime createdAt;

    public static VoucherResponse from(Voucher v) {
        if (v == null) return null;
        return VoucherResponse.builder()
                .id(v.getId())
                .code(v.getCode())
                .title(v.getTitle())
                .description(v.getDescription())
                .voucherType(v.getVoucherType())
                .discountValue(v.getDiscountValue())
                .maxDiscountAmount(v.getMaxDiscountAmount())
                .minOrderValue(v.getMinOrderValue())
                .usageLimit(v.getUsageLimit())
                .usedCount(v.getUsedCount())
                .userUsageLimit(v.getUserUsageLimit())
                .startDate(v.getStartDate())
                .endDate(v.getEndDate())
                .status(v.getStatus())
                .scope(v.getScope())
                .shopId(v.getShop() != null ? v.getShop().getId() : null)
                .shopName(v.getShop() != null ? v.getShop().getName() : null)
                .categoryId(v.getCategory() != null ? v.getCategory().getId() : null)
                .categoryName(v.getCategory() != null ? v.getCategory().getName() : null)
                .isAvailable(v.isCurrentlyActive())
                .isClaimed(false)
                .isFirstOrderOnly(v.getIsFirstOrderOnly() != null ? v.getIsFirstOrderOnly() : false)
                .createdAt(v.getCreatedAt())
                .build();
    }
}
