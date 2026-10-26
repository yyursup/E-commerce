package com.marketplace.ecommerce.platform.policy.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisputePolicyClauseRequest {

    @NotBlank(message = "Mã điều khoản không được để trống")
    private String code;

    @NotBlank(message = "Tiêu đề điều khoản không được để trống")
    private String title;

    @NotBlank(message = "Mô tả chi tiết điều khoản không được để trống")
    private String description;

    @NotBlank(message = "Nhóm điều khoản không được để trống (SELLER_FAULT, BUYER_FAULT, RETURN_DISPUTE)")
    private String category;

    private Integer displayOrder;

    private Boolean isActive;
}
