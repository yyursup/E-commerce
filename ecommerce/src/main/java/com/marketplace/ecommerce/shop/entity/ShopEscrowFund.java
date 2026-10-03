package com.marketplace.ecommerce.shop.entity;

import com.marketplace.ecommerce.shop.valueObjects.EscrowFundStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "shop_escrow_funds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ShopEscrowFund {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false, unique = true)
    private Shop shop;

    @Column(name = "balance", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "committed_amount", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal committedAmount = BigDecimal.ZERO;

    @Column(name = "current_trust_level", nullable = false)
    @Builder.Default
    private Integer currentTrustLevel = 1;

    @Column(name = "is_deficit", nullable = false)
    @Builder.Default
    private Boolean isDeficit = false;

    @Column(name = "deficit_amount", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal deficitAmount = BigDecimal.ZERO;

    @Column(name = "deficit_deadline")
    private LocalDateTime deficitDeadline;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private EscrowFundStatus status = EscrowFundStatus.ACTIVE;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
