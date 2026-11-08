package com.marketplace.ecommerce.wallet.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWithdrawalRequest {

    @NotNull(message = "Số tiền rút không được để trống")
    @DecimalMin(value = "100000.00", message = "Số tiền rút tối thiểu là 100.000 VNĐ")
    private BigDecimal amount;

    // Optional override nếu người dùng muốn chỉ định tài khoản ngân hàng nhận
    @Size(max = 150, message = "Tên ngân hàng tối đa 150 ký tự")
    private String bankName;

    @Size(max = 50, message = "Số tài khoản từ 5 đến 50 ký tự")
    private String bankAccountNumber;

    @Size(max = 150, message = "Tên chủ tài khoản tối đa 150 ký tự")
    private String bankAccountName;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String note;
}

