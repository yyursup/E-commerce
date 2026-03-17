package com.marketplace.ecommerce.recommendation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "product_views", indexes = {
    @Index(name = "idx_product_view_session", columnList = "session_id"),
    @Index(name = "idx_product_view_user", columnList = "user_id"),
    @Index(name = "idx_product_view_viewed", columnList = "viewed_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductView {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "session_id", nullable = false, length = 255)
    private String sessionId;

    @Column(name = "user_id", columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "product_id", nullable = false, columnDefinition = "uuid")
    private UUID productId;

    @Column(name = "viewed_at", nullable = false)
    private LocalDateTime viewedAt;
}
