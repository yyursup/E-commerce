package com.marketplace.ecommerce.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpsertAddressRequest {

    @NotBlank(message = "Vui lòng nhập tên người nhận")
    @Size(max = 100, message = "Tên người nhận tối đa 100 ký tự")
    private String receiverName;

    @NotBlank(message = "Vui lòng nhập số điện thoại người nhận")
    @Size(max = 20, message = "Số điện thoại người nhận tối đa 20 ký tự")
    @Pattern(
            regexp = "^(\\+84|0)(3|5|7|8|9)\\d{8}$",
            message = "Số điện thoại người nhận không hợp lệ"
    )
    private String receiverPhone;

    @NotBlank(message = "Vui lòng nhập địa chỉ")
    @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
    private String addressLine;

    @Size(max = 100, message = "Tỉnh/thành phố tối đa 100 ký tự")
    private String city;

    @Size(max = 100, message = "Quận/huyện tối đa 100 ký tự")
    private String district;

    @Size(max = 100, message = "Phường/xã tối đa 100 ký tự")
    private String ward;

    @NotNull(message = "Vui lòng chọn quận/huyện")
    private Integer districtId;

    @NotBlank(message = "Vui lòng chọn phường/xã")
    @Size(max = 50, message = "Mã phường/xã tối đa 50 ký tự")
    private String wardCode;

    private Boolean isDefault;
}
