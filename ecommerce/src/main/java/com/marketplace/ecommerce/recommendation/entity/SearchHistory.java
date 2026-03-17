package com.marketplace.ecommerce.recommendation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "search_history", indexes = {
    @Index(name = "idx_search_history_session", columnList = "session_id"),
    @Index(name = "idx_search_history_user", columnList = "user_id"),
    @Index(name = "idx_search_history_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "session_id", nullable = false, length = 255)
    private String sessionId;

    @Column(name = "user_id", columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "keyword", length = 500)
    private String keyword;

    @Column(name = "category_id", columnDefinition = "uuid")
    private UUID categoryId;

    @Column(name = "min_price", precision = 12, scale = 2)
    private BigDecimal minPrice;

    @Column(name = "max_price", precision = 12, scale = 2)
    private BigDecimal maxPrice;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
