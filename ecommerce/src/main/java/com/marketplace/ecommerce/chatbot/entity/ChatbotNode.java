package com.marketplace.ecommerce.chatbot.entity;

import com.marketplace.ecommerce.chatbot.valueobject.ChatbotNodeType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "chatbot_nodes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotNode {

    @Id
    @Column(name = "id", length = 100, nullable = false)
    private String id;

    @Column(name = "message_text", columnDefinition = "TEXT", nullable = false)
    private String messageText;

    @Enumerated(EnumType.STRING)
    @Column(name = "node_type", length = 50, nullable = false)
    private ChatbotNodeType nodeType = ChatbotNodeType.MENU;

    @Column(name = "role_context", length = 20)
    private String roleContext;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
