package com.marketplace.ecommerce.platform.policy.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "platform_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class PlatformPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "policy_key", nullable = false, unique = true, length = 100)
    private String policyKey;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 500)
    private String summary;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(length = 50, nullable = false)
    @Builder.Default
    private String category = "GENERAL";

    @Column(name = "target_audience", length = 50, nullable = false)
    @Builder.Default
    private String targetAudience = "ALL"; // ALL, SELLER, CUSTOMER

    @Column(length = 20)
    @Builder.Default
    private String version = "1.0";

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "effective_date")
    private LocalDateTime effectiveDate;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
