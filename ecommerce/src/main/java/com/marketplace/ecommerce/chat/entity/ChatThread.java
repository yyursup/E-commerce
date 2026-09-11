package com.marketplace.ecommerce.chat.entity;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.chat.enums.ThreadStatus;
import com.marketplace.ecommerce.chat.enums.ThreadType;
import com.marketplace.ecommerce.shop.entity.Shop;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_threads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ChatThread {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    @Builder.Default
    private ThreadType type = ThreadType.SUPPORT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_account_id", nullable = false)
    private Account customer;

    @Column(name = "customer_name", length = 100)
    private String customerName;

    @Column(name = "customer_avatar", length = 500)
    private String customerAvatar;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_account_id")
    private Account admin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id")
    private Shop shop;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "last_message", columnDefinition = "TEXT")
    private String lastMessage;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @Column(name = "unread_customer", nullable = false)
    @Builder.Default
    private int unreadCustomer = 0;

    @Column(name = "unread_admin", nullable = false)
    @Builder.Default
    private int unreadAdmin = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ThreadStatus status = ThreadStatus.OPEN;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
