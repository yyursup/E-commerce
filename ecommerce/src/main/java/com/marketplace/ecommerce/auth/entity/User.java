package com.marketplace.ecommerce.auth.entity;


import com.marketplace.ecommerce.auth.valueObjects.GenderType;
import com.marketplace.ecommerce.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private GenderType gender;

    @Column(name = "identity_card_number", unique = true)
    private String identityCardNumber;

    @Column(name = "social_insurance_no", length = 20)
    private String socialInsuranceNo;

    @Column(name = "email", unique = true, length = 100)
    private String email;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "avatar_url", length = 255)
    private String avatarUrl;

    @Column(name = "address", length = 255)
    private String address;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", unique = true, nullable = false)
    private Account account;
}
