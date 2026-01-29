package com.marketplace.ecommerce.auth.entity;

import com.marketplace.ecommerce.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class UserAddress extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "receiver_name", nullable = false)
    private String receiverName;

    @Column(name = "receiver_phone", nullable = false)
    private String receiverPhone;

    @Column(name = "address_line", nullable = false)
    private String addressLine;

    private String city;
    private String district;
    private String ward;

    @Column(name = "district_id", nullable = false)
    private Integer districtId;

    @Column(name = "ward_code", nullable = false)
    private String wardCode;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;
}
