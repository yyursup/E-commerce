package com.marketplace.ecommerce.wallet.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankInfoRequest {

    @NotBlank(message = "Tên ngân hàng không được để trống")
    @Size(max = 150, message = "Tên ngân hàng tối đa 150 ký tự")
    private String bankName;

    @NotBlank(message = "Số tài khoản ngân hàng không được để trống")
    @Size(min = 5, max = 50, message = "Số tài khoản từ 5 đến 50 ký tự")
    private String bankAccountNumber;

    @NotBlank(message = "Tên chủ tài khoản không được để trống")
    @Size(max = 150, message = "Tên chủ tài khoản tối đa 150 ký tự")
    private String bankAccountName;
}

