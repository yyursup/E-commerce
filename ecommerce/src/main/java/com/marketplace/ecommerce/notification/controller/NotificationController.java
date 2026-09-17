package com.marketplace.ecommerce.notification.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.notification.dto.NotificationResponse;
import com.marketplace.ecommerce.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/my")
    public ResponseEntity<Page<NotificationResponse>> getMyNotifications(
            @CurrentUser CurrentUserInfo currentUser,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        if (currentUser == null || currentUser.getAccountId() == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(notificationService.getMyNotifications(currentUser.getAccountId(), pageable));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @CurrentUser CurrentUserInfo currentUser
    ) {
        if (currentUser == null || currentUser.getAccountId() == null) {
            return ResponseEntity.ok(Map.of("unreadCount", 0L));
        }
        long count = notificationService.getUnreadCount(currentUser.getAccountId());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable UUID id
    ) {
        if (currentUser == null || currentUser.getAccountId() == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(notificationService.markAsRead(currentUser.getAccountId(), id));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(
            @CurrentUser CurrentUserInfo currentUser
    ) {
        if (currentUser == null || currentUser.getAccountId() == null) {
            return ResponseEntity.status(401).build();
        }
        notificationService.markAllAsRead(currentUser.getAccountId());
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu tất cả thông báo là đã đọc"));
    }
}
