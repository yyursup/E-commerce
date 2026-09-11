package com.marketplace.ecommerce.request.entity;

import com.marketplace.ecommerce.request.valueObjects.BusinessType;
import com.marketplace.ecommerce.request.valueObjects.SellerType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "sellers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seller {
    @Id
    @Column(name = "request_id", columnDefinition = "uuid")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "request_id")
    private Request request;

    @Enumerated(EnumType.STRING)
    @Column(name = "seller_type", nullable = false, length = 50)
    @Builder.Default
    private SellerType sellerType = SellerType.INDIVIDUAL;

    @Column(name = "shop_name", nullable = false, length = 150)
    private String shopName;

    @Column(name = "shop_phone", length = 20)
    private String shopPhone;

    @Column(name = "shop_email", length = 120)
    private String shopEmail;

    @Column(name = "pickup_address", columnDefinition = "TEXT")
    private String pickupAddress;

    @Column(name = "return_address", columnDefinition = "TEXT")
    private String returnAddress;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    // Định danh thuế / Pháp lý
    @Column(name = "tax_code", length = 50)
    private String taxCode;

    @Column(name = "invoice_email", length = 120)
    private String invoiceEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "business_type", length = 50)
    private BusinessType businessType;

    @Column(name = "business_name", length = 255)
    private String businessName;

    @Column(name = "business_address", columnDefinition = "TEXT")
    private String businessAddress;

    @Column(name = "business_license_url", length = 500)
    private String businessLicenseUrl;

    // Ngân hàng
    @Column(name = "bank_account_name", length = 150)
    private String bankAccountName;

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    @Column(name = "bank_name", length = 150)
    private String bankName;

    @Column(name = "created_shop_id", columnDefinition = "uuid")
    private UUID createdShopId;
}
