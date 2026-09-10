package com.marketplace.ecommerce.chat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "chatbot_options")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotOption {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "node_id", length = 100, nullable = false)
    private String nodeId;

    @Column(name = "button_label", nullable = false, length = 255)
    private String buttonLabel;

    @Column(name = "next_node_id", length = 100)
    private String nextNodeId;

    @Column(name = "action_payload", length = 80, nullable = false)
    private String actionPayload;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "node_id", referencedColumnName = "id", insertable = false, updatable = false)
    private ChatbotNode node;
}
