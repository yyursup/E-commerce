package com.marketplace.ecommerce.platform.policy.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformPolicyRequest {

    @NotBlank(message = "Mã định danh chính sách (policyKey) không được để trống")
    private String policyKey;

    @NotBlank(message = "Tiêu đề chính sách không được để trống")
    private String title;

    private String summary;

    @NotBlank(message = "Nội dung điều khoản chính sách không được để trống")
    private String content;

    private String category; // GENERAL, ESCROW, RETURN_REFUND, DISPUTE, SELLER_RULES, SHIPPING, CONDITION_GRADE, PRIVACY

    private String targetAudience; // ALL, SELLER, CUSTOMER

    private String version;

    private Integer displayOrder;

    private Boolean isActive;

    private LocalDateTime effectiveDate;
}
