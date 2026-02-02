package com.marketplace.ecommerce.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
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
    @NotBlank(message = "User name can not be blank")
    @Size(min = 3, max = 50, message = "Username must be least 3-50 characters")
    private String username;
    @NotBlank(message = "User name can not be blank")
    private String password;
    @NotBlank(message = "User name can not be blank")
    @Email(message = "Email is not in the correct format ")
    private String email;

    @Pattern(regexp = "(84|0[3|5|7|8|9])+(\\d{8})", message = "Phone invalid!")
    private String phoneNumber;
}
