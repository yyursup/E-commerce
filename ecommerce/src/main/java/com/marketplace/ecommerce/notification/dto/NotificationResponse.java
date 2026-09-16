package com.marketplace.ecommerce.notification.dto;

import com.marketplace.ecommerce.notification.entity.Notification;
import com.marketplace.ecommerce.notification.valueObjects.NotificationChannelType;
import com.marketplace.ecommerce.notification.valueObjects.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private UUID id;
    private String title;
    private String content;
    private NotificationType type;
    private NotificationChannelType channel;
    private Map<String, Object> payload;
    private Boolean isRead;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification n) {
        if (n == null) return null;
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .content(n.getContent())
                .type(n.getType())
                .channel(n.getChannel())
                .payload(n.getPayload())
                .isRead(n.getIsRead() != null ? n.getIsRead() : false)
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
