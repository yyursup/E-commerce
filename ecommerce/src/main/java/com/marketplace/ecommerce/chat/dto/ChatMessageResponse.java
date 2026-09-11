package com.marketplace.ecommerce.chat.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.marketplace.ecommerce.chat.entity.ChatMessage;
import com.marketplace.ecommerce.chat.enums.ChatMessageType;
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
public class ChatMessageResponse {
    private UUID id;
    private UUID threadId;
    private UUID senderId;
    private String senderName;
    private String senderRole;
    private UUID recipientId;
    private String content;
    private ChatMessageType messageType;
    private String imageUrl;
    private String videoUrl;
    private Boolean isDeleted;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime readAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime editedAt;

    public static ChatMessageResponse from(ChatMessage message) {
        boolean deleted = Boolean.TRUE.equals(message.getIsDeleted());
        return ChatMessageResponse.builder()
                .id(message.getId())
                .threadId(message.getThread() != null ? message.getThread().getId() : null)
                .senderId(message.getSenderId())
                .senderName(message.getSenderName())
                .senderRole(message.getSenderRole())
                .recipientId(message.getRecipientId())
                .content(deleted ? "[Tin nhắn đã bị xóa]" : message.getContent())
                .messageType(message.getMessageType())
                .imageUrl(deleted ? null : message.getImageUrl())
                .videoUrl(deleted ? null : message.getVideoUrl())
                .readAt(message.getReadAt())
                .createdAt(message.getCreatedAt())
                .editedAt(message.getEditedAt())
                .isDeleted(deleted)
                .build();
    }
}
