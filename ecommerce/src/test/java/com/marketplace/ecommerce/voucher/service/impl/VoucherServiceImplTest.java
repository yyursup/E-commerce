package com.marketplace.ecommerce.voucher.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.product.repository.ProductCategoryRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.voucher.dto.VoucherResponse;
import com.marketplace.ecommerce.voucher.entity.UserVoucher;
import com.marketplace.ecommerce.voucher.entity.Voucher;
import com.marketplace.ecommerce.voucher.repository.UserVoucherRepository;
import com.marketplace.ecommerce.voucher.repository.VoucherRepository;
import com.marketplace.ecommerce.voucher.valueObjects.UserVoucherStatus;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherScope;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherStatus;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VoucherServiceImplTest {

    @Mock
    private VoucherRepository voucherRepository;

    @Mock
    private UserVoucherRepository userVoucherRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ShopRepository shopRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductCategoryRepository productCategoryRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private com.marketplace.ecommerce.notification.service.NotificationService notificationService;

    @InjectMocks
    private VoucherServiceImpl voucherService;

    private User testUserA;
    private User testUserB;
    private Voucher multiUseVoucher;
    private Shop testShop;

    @BeforeEach
    void setUp() {
        testUserA = User.builder()
                .id(UUID.randomUUID())
                .fullName("Nguyen Van A")
                .build();

        testUserB = User.builder()
                .id(UUID.randomUUID())
                .fullName("Tran Van B")
                .build();

        testShop = Shop.builder()
                .id(UUID.randomUUID())
                .name("Shop Cong Nghe")
                .build();

        multiUseVoucher = Voucher.builder()
                .id(UUID.randomUUID())
                .code("GIAM50K")
                .title("Giảm 50k cho đơn từ 200k")
                .voucherType(VoucherType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(50000))
                .minOrderValue(BigDecimal.valueOf(200000))
                .usageLimit(1000) // 1000 lượt toàn sàn
                .usedCount(0)
                .userUsageLimit(2) // Mỗi user được dùng 2 lần
                .status(VoucherStatus.ACTIVE)
                .scope(VoucherScope.PLATFORM)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .build();
    }

    @Test
    @DisplayName("User có thể áp dụng voucher nhiều lần nếu chưa vượt quá userUsageLimit")
    void testMultipleVoucherUsage_AllowedUpToUserLimit() {
        Order order1 = Order.builder()
                .id(UUID.randomUUID())
                .orderNumber("ORD-001")
                .user(testUserA)
                .subtotal(BigDecimal.valueOf(300000))
                .shippingFee(BigDecimal.valueOf(30000))
                .build();

        when(voucherRepository.findByCodeIgnoreCase("GIAM50K")).thenReturn(Optional.of(multiUseVoucher));
        // Lần 1: userA chưa từng dùng voucher (usedCount = 0)
        when(userVoucherRepository.countByUserIdAndVoucherIdAndStatus(testUserA.getId(), multiUseVoucher.getId(), UserVoucherStatus.USED))
                .thenReturn(0L);
        when(userVoucherRepository.findByUserIdAndVoucherIdAndStatus(testUserA.getId(), multiUseVoucher.getId(), UserVoucherStatus.UNUSED))
                .thenReturn(Optional.empty());

        BigDecimal discount1 = voucherService.applyVouchersToOrder(order1, null, "GIAM50K");

        assertEquals(BigDecimal.valueOf(50000), discount1);
        assertEquals(1, multiUseVoucher.getUsedCount());
        verify(userVoucherRepository, times(1)).save(any(UserVoucher.class));

        // Lần 2: userA đã dùng 1 lần (usedCount = 1 < userUsageLimit = 2)
        Order order2 = Order.builder()
                .id(UUID.randomUUID())
                .orderNumber("ORD-002")
                .user(testUserA)
                .subtotal(BigDecimal.valueOf(400000))
                .shippingFee(BigDecimal.valueOf(30000))
                .build();

        when(userVoucherRepository.countByUserIdAndVoucherIdAndStatus(testUserA.getId(), multiUseVoucher.getId(), UserVoucherStatus.USED))
                .thenReturn(1L);

        BigDecimal discount2 = voucherService.applyVouchersToOrder(order2, null, "GIAM50K");

        assertEquals(BigDecimal.valueOf(50000), discount2);
        assertEquals(2, multiUseVoucher.getUsedCount());
        verify(userVoucherRepository, times(2)).save(any(UserVoucher.class));
    }

    @Test
    @DisplayName("User bị từ chối khi vượt quá userUsageLimit nhưng không ảnh hưởng user khác")
    void testUserReachesPerUserLimit_DoesNotBlockOtherUsers() {
        Order orderA = Order.builder()
                .id(UUID.randomUUID())
                .orderNumber("ORD-A-03")
                .user(testUserA)
                .subtotal(BigDecimal.valueOf(300000))
                .shippingFee(BigDecimal.valueOf(30000))
                .build();

        when(voucherRepository.findByCodeIgnoreCase("GIAM50K")).thenReturn(Optional.of(multiUseVoucher));

        // User A đã dùng 2 lần (đạt limit 2)
        when(userVoucherRepository.countByUserIdAndVoucherIdAndStatus(testUserA.getId(), multiUseVoucher.getId(), UserVoucherStatus.USED))
                .thenReturn(2L);

        CustomException ex = assertThrows(CustomException.class, () ->
                voucherService.applyVouchersToOrder(orderA, null, "GIAM50K")
        );
        assertTrue(ex.getMessage().contains("Bạn đã sử dụng hết số lần cho phép"));

        // User B chưa từng dùng (usedCount = 0) -> User B áp dụng thành công bình thường
        Order orderB = Order.builder()
                .id(UUID.randomUUID())
                .orderNumber("ORD-B-01")
                .user(testUserB)
                .subtotal(BigDecimal.valueOf(300000))
                .shippingFee(BigDecimal.valueOf(30000))
                .build();

        when(userVoucherRepository.countByUserIdAndVoucherIdAndStatus(testUserB.getId(), multiUseVoucher.getId(), UserVoucherStatus.USED))
                .thenReturn(0L);
        when(userVoucherRepository.findByUserIdAndVoucherIdAndStatus(testUserB.getId(), multiUseVoucher.getId(), UserVoucherStatus.UNUSED))
                .thenReturn(Optional.empty());

        BigDecimal discountB = voucherService.applyVouchersToOrder(orderB, null, "GIAM50K");
        assertEquals(BigDecimal.valueOf(50000), discountB);
    }

    @Test
    @DisplayName("Voucher hết lượt toàn sàn thì cả User A và B đều không thể sử dụng")
    void testGlobalLimitExhausted_BlocksAllUsers() {
        multiUseVoucher.setUsageLimit(5);
        multiUseVoucher.setUsedCount(5); // Đã hết 5/5 lượt toàn sàn

        Order order = Order.builder()
                .id(UUID.randomUUID())
                .orderNumber("ORD-GLOBAL-EXHAUST")
                .user(testUserA)
                .subtotal(BigDecimal.valueOf(300000))
                .shippingFee(BigDecimal.valueOf(30000))
                .build();

        when(voucherRepository.findByCodeIgnoreCase("GIAM50K")).thenReturn(Optional.of(multiUseVoucher));

        CustomException ex = assertThrows(CustomException.class, () ->
                voucherService.applyVouchersToOrder(order, null, "GIAM50K")
        );
        assertTrue(ex.getMessage().contains("hết hạn hoặc hết lượt sử dụng"));
    }

    @Test
    @DisplayName("enrichVoucherResponses đánh dấu chính xác isEligible và lý do khi user đã hết quota")
    void testEnrichVoucherResponses_UserExhaustedQuota() {
        UUID accountId = UUID.randomUUID();
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(testUserA));
        when(voucherRepository.findAllCurrentlyActive(any(), any())).thenReturn(List.of(multiUseVoucher));

        // User A đã dùng 2 lần cho voucher này
        List<Object[]> usageRows = new ArrayList<>();
        usageRows.add(new Object[]{multiUseVoucher.getId(), 2L});
        when(userVoucherRepository.countUsedVouchersByUserId(testUserA.getId())).thenReturn(usageRows);
        when(orderRepository.countCompletedOrdersByUserId(testUserA.getId())).thenReturn(1L);

        List<VoucherResponse> responses = voucherService.listActiveVouchers(null, null, accountId);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        VoucherResponse resp = responses.get(0);

        assertEquals(2, resp.getUserUsedCount());
        assertEquals(0, resp.getUserRemainingUsage());
        assertFalse(resp.getIsEligible());
        assertNotNull(resp.getIneligibleReason());
        assertTrue(resp.getIneligibleReason().contains("hết số lần cho phép"));
    }

    @Test
    @DisplayName("Voucher chỉ dành cho đơn đầu tiên sẽ ineligible nếu user đã có đơn hoàn thành")
    void testFirstOrderVoucher_IneligibleForExistingCustomer() {
        Voucher firstOrderVoucher = Voucher.builder()
                .id(UUID.randomUUID())
                .code("ECOMNEW15")
                .title("Giảm 15% đơn đầu tiên")
                .voucherType(VoucherType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(15))
                .isFirstOrderOnly(true)
                .status(VoucherStatus.ACTIVE)
                .scope(VoucherScope.PLATFORM)
                .build();

        UUID accountId = UUID.randomUUID();
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(testUserA));
        when(voucherRepository.findAllCurrentlyActive(any(), any())).thenReturn(List.of(firstOrderVoucher));
        when(orderRepository.countCompletedOrdersByUserId(testUserA.getId())).thenReturn(2L); // Đã có 2 đơn hoàn thành

        List<VoucherResponse> responses = voucherService.listActiveVouchers(null, null, accountId);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        VoucherResponse resp = responses.get(0);

        assertFalse(resp.getIsEligible());
        assertEquals("Chỉ áp dụng cho đơn hàng đầu tiên của khách hàng mới", resp.getIneligibleReason());
    }

    @Test
    @DisplayName("Rollback voucher khôi phục lại usedCount và hoàn trả UserVoucher vào ví")
    void testRollbackVoucherUsage_RestoresQuota() {
        multiUseVoucher.setUsedCount(1);

        Order cancelledOrder = Order.builder()
                .id(UUID.randomUUID())
                .orderNumber("ORD-CANCEL-01")
                .user(testUserA)
                .platformVoucher(multiUseVoucher)
                .build();

        UserVoucher usedRecord = UserVoucher.builder()
                .id(UUID.randomUUID())
                .user(testUserA)
                .voucher(multiUseVoucher)
                .status(UserVoucherStatus.USED)
                .order(cancelledOrder)
                .build();

        when(userVoucherRepository.findByOrderId(cancelledOrder.getId())).thenReturn(List.of(usedRecord));
        // User chưa có UNUSED trong ví -> phục hồi record thành UNUSED
        when(userVoucherRepository.existsByUserIdAndVoucherIdAndStatus(testUserA.getId(), multiUseVoucher.getId(), UserVoucherStatus.UNUSED))
                .thenReturn(false);

        voucherService.rollbackVoucherUsage(cancelledOrder);

        assertEquals(0, multiUseVoucher.getUsedCount());
        assertEquals(UserVoucherStatus.UNUSED, usedRecord.getStatus());
        assertNull(usedRecord.getOrder());
        verify(userVoucherRepository).save(usedRecord);
    }
}
