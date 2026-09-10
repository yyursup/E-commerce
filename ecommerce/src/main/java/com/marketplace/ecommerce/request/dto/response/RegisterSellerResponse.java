package com.marketplace.ecommerce.request.dto.response;

import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.request.valueObjects.BusinessType;
import com.marketplace.ecommerce.request.valueObjects.SellerType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterSellerResponse {
    private SellerType sellerType;
    private String shopName;
    private String shopPhone;
    private String shopEmail;
    private String pickupAddress;
    private String returnAddress;
    private String address;

    // Thuế & Định danh
    private String taxCode;
    private String invoiceEmail;

    // Hộ KD / Doanh nghiệp
    private BusinessType businessType;
    private String businessName;
    private String businessAddress;
    private String businessLicenseUrl;

    // Ngân hàng
    private String bankAccountName;
    private String bankAccountNumber;
    private String bankName;

    public static RegisterSellerResponse from(Seller s) {
        if (s == null) return null;
        return RegisterSellerResponse.builder()
                .sellerType(s.getSellerType())
                .shopName(s.getShopName())
                .shopPhone(s.getShopPhone())
                .shopEmail(s.getShopEmail())
                .pickupAddress(s.getPickupAddress() != null ? s.getPickupAddress() : s.getAddress())
                .returnAddress(s.getReturnAddress() != null ? s.getReturnAddress() : s.getAddress())
                .address(s.getAddress())
                .taxCode(s.getTaxCode())
                .invoiceEmail(s.getInvoiceEmail())
                .businessType(s.getBusinessType())
                .businessName(s.getBusinessName())
                .businessAddress(s.getBusinessAddress())
                .businessLicenseUrl(s.getBusinessLicenseUrl())
                .bankAccountName(s.getBankAccountName())
                .bankAccountNumber(s.getBankAccountNumber())
                .bankName(s.getBankName())
                .build();
    }
}
