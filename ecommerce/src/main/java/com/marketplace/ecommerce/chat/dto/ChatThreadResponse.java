package com.marketplace.ecommerce.chat.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.marketplace.ecommerce.chat.entity.ChatThread;
import com.marketplace.ecommerce.chat.enums.ThreadStatus;
import com.marketplace.ecommerce.chat.enums.ThreadType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatThreadResponse {
    private UUID id;
    private ThreadType type;
    private UUID customerId;
    private String customerName;
    private String customerAvatar;
    private UUID adminId;
    private String adminName;
    private UUID shopId;
    private String shopName;
    private String title;
    private String lastMessage;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime lastMessageAt;

    private int unreadCount;
    private ThreadStatus status;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    public static ChatThreadResponse from(ChatThread thread, UUID currentUserId, boolean isAdmin) {
        int unread = isAdmin ? thread.getUnreadAdmin() : thread.getUnreadCustomer();
        return ChatThreadResponse.builder()
                .id(thread.getId())
                .type(thread.getType())
                .customerId(thread.getCustomer() != null ? thread.getCustomer().getId() : null)
                .customerName(thread.getCustomerName() != null ? thread.getCustomerName() : (thread.getCustomer() != null ? thread.getCustomer().getUsername() : "Khách"))
                .customerAvatar(thread.getCustomerAvatar())
                .adminId(thread.getAdmin() != null ? thread.getAdmin().getId() : null)
                .adminName(thread.getAdmin() != null ? thread.getAdmin().getUsername() : null)
                .shopId(thread.getShop() != null ? thread.getShop().getId() : null)
                .shopName(thread.getShop() != null ? thread.getShop().getName() : null)
                .title(thread.getTitle())
                .lastMessage(thread.getLastMessage())
                .lastMessageAt(thread.getLastMessageAt() != null ? thread.getLastMessageAt() : thread.getCreatedAt())
                .unreadCount(unread)
                .status(thread.getStatus())
                .createdAt(thread.getCreatedAt())
                .build();
    }
}
