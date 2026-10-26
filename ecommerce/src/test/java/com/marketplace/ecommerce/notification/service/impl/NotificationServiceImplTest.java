package com.marketplace.ecommerce.notification.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.notification.dto.NotificationResponse;
import com.marketplace.ecommerce.notification.entity.Notification;
import com.marketplace.ecommerce.notification.repository.NotificationRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.social.entity.ShopFollower;
import com.marketplace.ecommerce.social.repository.ShopFollowerRepository;
import com.marketplace.ecommerce.voucher.entity.Voucher;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ShopFollowerRepository shopFollowerRepository;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private UUID accountId;
    private User sampleUser;
    private Notification sampleNotification;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        sampleUser = new User();
        sampleUser.setId(UUID.randomUUID());

        sampleNotification = Notification.builder()
                .id(UUID.randomUUID())
                .user(sampleUser)
                .title("Thông báo đơn hàng")
                .content("Đơn hàng của bạn đã giao thành công")
                .isRead(false)
                .build();
    }

    @Test
    @DisplayName("getMyNotifications trả về danh sách thông báo phân trang")
    void testGetMyNotifications() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(sampleUser.getId(), Pageable.unpaged()))
                .thenReturn(new PageImpl<>(List.of(sampleNotification)));

        Page<NotificationResponse> page = notificationService.getMyNotifications(accountId, Pageable.unpaged());
        assertEquals(1, page.getTotalElements());
        assertEquals("Thông báo đơn hàng", page.getContent().get(0).getTitle());
    }

    @Test
    @DisplayName("getUnreadCount đếm số lượng thông báo chưa đọc")
    void testGetUnreadCount() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(notificationRepository.countByUserIdAndIsReadFalse(sampleUser.getId())).thenReturn(5L);

        assertEquals(5L, notificationService.getUnreadCount(accountId));
    }

    @Test
    @DisplayName("markAsRead cập nhật isRead = true")
    void testMarkAsRead() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(notificationRepository.findByIdAndUserId(sampleNotification.getId(), sampleUser.getId()))
                .thenReturn(Optional.of(sampleNotification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        NotificationResponse res = notificationService.markAsRead(accountId, sampleNotification.getId());
        assertTrue(res.getIsRead());
    }

    @Test
    @DisplayName("markAllAsRead cập nhật tất cả thông báo đã đọc")
    void testMarkAllAsRead() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        notificationService.markAllAsRead(accountId);
        verify(notificationRepository).markAllAsRead(eq(sampleUser.getId()), any());
    }

    @Test
    @DisplayName("notifyFollowersAboutVoucher phát thông báo ưu đãi cho người theo dõi")
    void testNotifyFollowersAboutVoucher() {
        Shop shop = new Shop();
        shop.setId(UUID.randomUUID());
        shop.setName("Apple Store");

        Voucher voucher = new Voucher();
        voucher.setId(UUID.randomUUID());
        voucher.setCode("APL10");
        voucher.setTitle("Giảm 10%");
        voucher.setVoucherType(VoucherType.PERCENTAGE);
        voucher.setDiscountValue(BigDecimal.TEN);

        ShopFollower follower = new ShopFollower();
        follower.setUser(sampleUser);
        when(shopFollowerRepository.findByShopId(shop.getId())).thenReturn(List.of(follower));

        notificationService.notifyFollowersAboutVoucher(shop, voucher);

        verify(notificationRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("Bao phủ các nhánh còn lại của NotificationServiceImpl (exceptions, null/empty, FIXED_AMOUNT)")
    void testNotificationEdgeCases() {
        // 1. User not found
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> notificationService.getUnreadCount(accountId));

        // 2. Notification not found in markAsRead
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(notificationRepository.findByIdAndUserId(any(), eq(sampleUser.getId()))).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> notificationService.markAsRead(accountId, UUID.randomUUID()));

        // 3. notifyFollowersAboutVoucher: null shop or null voucher
        Shop shop = new Shop();
        shop.setId(UUID.randomUUID());
        shop.setName("   "); // blank shop name
        Voucher voucher = new Voucher();
        voucher.setId(UUID.randomUUID());
        voucher.setCode("FIX50K");
        voucher.setTitle("Giảm 50k");
        voucher.setVoucherType(VoucherType.FIXED_AMOUNT);
        voucher.setDiscountValue(BigDecimal.valueOf(50000));

        notificationService.notifyFollowersAboutVoucher(null, voucher);
        notificationService.notifyFollowersAboutVoucher(shop, null);

        // 4. followers empty or null
        when(shopFollowerRepository.findByShopId(shop.getId())).thenReturn(List.of());
        notificationService.notifyFollowersAboutVoucher(shop, voucher);
        when(shopFollowerRepository.findByShopId(shop.getId())).thenReturn(null);
        notificationService.notifyFollowersAboutVoucher(shop, voucher);

        // 5. followers with null user + FIXED_AMOUNT voucher + null voucherType voucher
        ShopFollower fNullUser = new ShopFollower();
        fNullUser.setUser(null);
        ShopFollower fValid = new ShopFollower();
        fValid.setUser(sampleUser);
        when(shopFollowerRepository.findByShopId(shop.getId())).thenReturn(List.of(fNullUser, fValid));

        notificationService.notifyFollowersAboutVoucher(shop, voucher);

        voucher.setVoucherType(null);
        voucher.setDiscountValue(null);
        notificationService.notifyFollowersAboutVoucher(shop, voucher);

        verify(notificationRepository, times(2)).saveAll(anyList());
    }
}
