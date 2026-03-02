package com.marketplace.ecommerce.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "commissions", indexes = {
        @Index(name = "idx_commission_order", columnList = "order_id"),
        @Index(name = "idx_commission_seller", columnList = "seller_id"),
        @Index(name = "idx_commission_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Commission {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "order_id", nullable = false, unique = true, columnDefinition = "uuid")
    private UUID orderId;

    @Column(name = "seller_id", nullable = false, columnDefinition = "uuid")
    private UUID sellerId;

    @Column(name = "order_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal orderAmount;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal totalCommission;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "commission", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CommissionItem> items = new ArrayList<>();
}
