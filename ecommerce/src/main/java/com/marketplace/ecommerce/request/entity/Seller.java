package com.marketplace.ecommerce.request.entity;

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
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "request_id", columnDefinition = "uuid")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "request_id")
    private Request request;

    @Column(name = "shop_name", nullable = false, length = 150)
    private String shopName;

    @Column(name = "shop_phone", length = 20)
    private String shopPhone;

    @Column(name = "shop_email", length = 120)
    private String shopEmail;

    @Column(name = "tax_code", length = 50)
    private String taxCode;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "created_shop_id", columnDefinition = "uuid")
    private UUID createdShopId;
}
