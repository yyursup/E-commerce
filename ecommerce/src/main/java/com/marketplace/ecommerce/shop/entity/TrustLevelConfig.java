package com.marketplace.ecommerce.shop.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "trust_level_configs", uniqueConstraints = {
    @UniqueConstraint(columnNames = "star_level")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class TrustLevelConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "star_level", nullable = false, unique = true)
    private Integer starLevel; // 1 to 5

    @Column(name = "tier_name", nullable = false, length = 100)
    private String tierName; // Cơ bản, Tiềm năng, Uy tín, Vàng, Kim Cương

    @Column(name = "min_deposit", nullable = false, precision = 19, scale = 2)
    private BigDecimal minDeposit;

    @Column(name = "max_deposit", precision = 19, scale = 2)
    private BigDecimal maxDeposit; // null for level 5 (unlimited)

    @Column(name = "badge_icon_url", length = 500)
    private String badgeIconUrl;

    @Column(name = "benefits_description", columnDefinition = "TEXT")
    private String benefitsDescription;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", columnDefinition = "uuid")
    private UUID updatedBy;
}
