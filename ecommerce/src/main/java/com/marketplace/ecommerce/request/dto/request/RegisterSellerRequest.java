package com.marketplace.ecommerce.request.dto.request;

import com.marketplace.ecommerce.request.valueObjects.BusinessType;
import com.marketplace.ecommerce.request.valueObjects.SellerType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterSellerRequest {

    @NotNull(message = "Vui lòng chọn loại hình người bán (INDIVIDUAL hoặc BUSINESS)")
    private SellerType sellerType;

    @Size(max = 5000)
    private String description;

    @Size(max = 255)
    private String coverImageUrl;

    @NotBlank(message = "Tên shop không được để trống")
    @Size(max = 150, message = "Tên shop tối đa 150 ký tự")
    private String shopName;

    @NotBlank(message = "Số điện thoại shop không được để trống")
    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String shopPhone;

    @Size(max = 120, message = "Email tối đa 120 ký tự")
    private String shopEmail;

    @NotBlank(message = "Địa chỉ lấy hàng không được để trống")
    @Size(max = 2000, message = "Địa chỉ lấy hàng tối đa 2000 ký tự")
    private String pickupAddress;

    @NotBlank(message = "Địa chỉ trả hàng không được để trống")
    @Size(max = 2000, message = "Địa chỉ trả hàng tối đa 2000 ký tự")
    private String returnAddress;

    @Size(max = 2000)
    private String address;

    // Thuế & Định danh
    @Size(max = 50, message = "Mã số thuế tối đa 50 ký tự")
    private String taxCode;

    @Size(max = 120, message = "Email nhận hóa đơn tối đa 120 ký tự")
    private String invoiceEmail;

    // Hộ kinh doanh / Doanh nghiệp
    private BusinessType businessType;

    @Size(max = 255, message = "Tên công ty / Hộ KD tối đa 255 ký tự")
    private String businessName;

    @Size(max = 2000, message = "Địa chỉ trụ sở tối đa 2000 ký tự")
    private String businessAddress;

    @Size(max = 500, message = "Link ảnh GPKD tối đa 500 ký tự")
    private String businessLicenseUrl;

    // Ngân hàng
    @NotBlank(message = "Tên chủ tài khoản không được để trống")
    @Size(max = 150, message = "Tên chủ tài khoản tối đa 150 ký tự")
    private String bankAccountName;

    @NotBlank(message = "Số tài khoản ngân hàng không được để trống")
    @Size(max = 50, message = "Số tài khoản ngân hàng tối đa 50 ký tự")
    private String bankAccountNumber;

    @NotBlank(message = "Tên ngân hàng không được để trống")
    @Size(max = 150, message = "Tên ngân hàng tối đa 150 ký tự")
    private String bankName;
}
