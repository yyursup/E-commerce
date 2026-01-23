package com.marketplace.ecommerce.request.entity;

import com.marketplace.ecommerce.request.valueObjects.TargetType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "request_id", columnDefinition = "uuid")
    private UUID id;;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "request_id")
    private Request request;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 30)
    private TargetType targetType;

    @Column(name = "target_id", nullable = false, columnDefinition = "uuid")
    private UUID targetId;

    @Column(name = "evidence_url", length = 255)
    private String evidenceUrl;

    @Column(name = "moderator_note", columnDefinition = "TEXT")
    private String moderatorNote;
}
