package com.marketplace.ecommerce.notification.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.notification.dto.NotificationResponse;
import com.marketplace.ecommerce.notification.entity.Notification;
import com.marketplace.ecommerce.notification.repository.NotificationRepository;
import com.marketplace.ecommerce.notification.service.NotificationService;
import com.marketplace.ecommerce.notification.valueObjects.NotificationChannelType;
import com.marketplace.ecommerce.notification.valueObjects.NotificationStatus;
import com.marketplace.ecommerce.notification.valueObjects.NotificationType;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.social.entity.ShopFollower;
import com.marketplace.ecommerce.social.repository.ShopFollowerRepository;
import com.marketplace.ecommerce.voucher.entity.Voucher;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ShopFollowerRepository shopFollowerRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(UUID accountId, Pageable pageable) {
        User user = getUser(accountId);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(NotificationResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID accountId) {
        User user = getUser(accountId);
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(UUID accountId, UUID notificationId) {
        User user = getUser(accountId);
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new CustomException("Không tìm thấy thông báo"));

        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        return NotificationResponse.from(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void markAllAsRead(UUID accountId) {
        User user = getUser(accountId);
        notificationRepository.markAllAsRead(user.getId(), LocalDateTime.now());
    }

    @Override
    @Transactional
    public void notifyFollowersAboutVoucher(Shop shop, Voucher voucher) {
        if (shop == null || voucher == null) {
            return;
        }

        List<ShopFollower> followers = shopFollowerRepository.findByShopId(shop.getId());
        if (followers == null || followers.isEmpty()) {
            log.info("Shop {} has no followers to notify about voucher {}", shop.getId(), voucher.getCode());
            return;
        }

        String shopName = (shop.getName() != null && !shop.getName().isBlank()) ? shop.getName() : "Shop bạn đang theo dõi";
        String title = "🎁 Ưu đãi mới từ " + shopName + "!";
        String discountText = formatDiscountText(voucher);
        String content = "Cửa hàng " + shopName + " vừa phát hành mã voucher [" + voucher.getCode() + "] - " +
                voucher.getTitle() + " (" + discountText + "). Số lượng có hạn, khám phá và lưu mã ngay!";

        List<Notification> notifications = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (ShopFollower follower : followers) {
            User recipient = follower.getUser();
            if (recipient == null) continue;

            Map<String, Object> payload = new HashMap<>();
            payload.put("shopId", shop.getId().toString());
            payload.put("shopName", shopName);
            payload.put("voucherId", voucher.getId().toString());
            payload.put("voucherCode", voucher.getCode());
            payload.put("discountValue", voucher.getDiscountValue());
            payload.put("voucherType", voucher.getVoucherType() != null ? voucher.getVoucherType().name() : null);

            Notification notif = Notification.builder()
                    .eventId("VOUCHER_" + voucher.getId() + "_" + recipient.getId())
                    .user(recipient)
                    .type(NotificationType.SHOP_VOUCHER)
                    .channel(NotificationChannelType.IN_APP)
                    .status(NotificationStatus.SENT)
                    .title(title)
                    .content(content)
                    .payload(payload)
                    .isRead(false)
                    .sentAt(now)
                    .build();

            notifications.add(notif);
        }

        notificationRepository.saveAll(notifications);
        log.info("Notified {} followers of shop {} about voucher {}", notifications.size(), shop.getId(), voucher.getCode());
    }

    private String formatDiscountText(Voucher voucher) {
        if (voucher == null || voucher.getVoucherType() == null || voucher.getDiscountValue() == null) {
            return "Giảm giá đặc biệt";
        }
        if (voucher.getVoucherType() == VoucherType.PERCENTAGE) {
            return "Giảm " + voucher.getDiscountValue().stripTrailingZeros().toPlainString() + "%";
        } else {
            NumberFormat nf = NumberFormat.getInstance(new Locale("vi", "VN"));
            return "Giảm " + nf.format(voucher.getDiscountValue()) + "đ";
        }
    }

    private User getUser(UUID accountId) {
        return userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin tài khoản người dùng"));
    }
}
