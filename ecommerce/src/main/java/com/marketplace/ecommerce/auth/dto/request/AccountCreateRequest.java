package com.marketplace.ecommerce.auth.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountCreateRequest {
    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 50, message = "Tên đăng nhập phải có từ 3 đến 50 ký tự")
    private String username;
    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @Pattern(regexp = "(84|0[3|5|7|8|9])+(\\d{8})", message = "Số điện thoại không hợp lệ!")
    private String phoneNumber;

    @NotNull(message = "Vui lòng xác nhận đồng ý với Điều khoản dịch vụ và Chính sách sàn")
    @AssertTrue(message = "Bạn phải đồng ý với Điều khoản dịch vụ và Chính sách của sàn để đăng ký tài khoản")
    @Builder.Default
    private Boolean agreeToTerms = false;
}
