package com.marketplace.ecommerce.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "commission_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class CommissionItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commission_id", nullable = false)
    private Commission commission;

    private UUID orderItemId;

    private String productName;

    @Column(precision = 18, scale = 2)
    private BigDecimal unitPrice;

    private Integer quantity;

    @Column(precision = 5, scale = 2)
    private BigDecimal commissionRate;

    @Column(precision = 18, scale = 2)
    private BigDecimal commissionAmount;
}
