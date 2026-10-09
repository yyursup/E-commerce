package com.marketplace.ecommerce.shop.dto.request;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEscrowStatusRequest {

    // true: Đăng ký nạp ký quỹ (chuyển sang PENDING_PAYMENT)
    // false: Hủy yêu cầu nạp ký quỹ (chuyển về NONE)
    private Boolean isEscrowParticipated;

    // Số tiền muốn nạp (chỉ bắt buộc khi isEscrowParticipated = true)
    @Min(value = 0, message = "Số tiền cam kết không hợp lệ")
    private BigDecimal committedAmount;
}
