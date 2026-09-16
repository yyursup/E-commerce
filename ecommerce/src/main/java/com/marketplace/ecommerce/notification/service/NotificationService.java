package com.marketplace.ecommerce.notification.service;

import com.marketplace.ecommerce.notification.dto.NotificationResponse;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.voucher.entity.Voucher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NotificationService {

    Page<NotificationResponse> getMyNotifications(UUID accountId, Pageable pageable);

    long getUnreadCount(UUID accountId);

    NotificationResponse markAsRead(UUID accountId, UUID notificationId);

    void markAllAsRead(UUID accountId);

    void notifyFollowersAboutVoucher(Shop shop, Voucher voucher);
}
