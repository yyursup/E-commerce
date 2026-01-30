package com.marketplace.ecommerce.review.entity;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.review.valueObjects.ReviewReportReason;
import com.marketplace.ecommerce.review.valueObjects.ReviewReportStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "review_reports",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"review_id", "reporter_user_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ReviewReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_user_id")
    private User reporter;

    @Column(name = "reporter_ip", length = 45)
    private String reporterIp;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ReviewReportReason reason;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ReviewReportStatus status;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        status = ReviewReportStatus.PENDING;
    }
}
