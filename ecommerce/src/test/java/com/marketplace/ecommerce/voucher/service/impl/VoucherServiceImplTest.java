package com.marketplace.ecommerce.voucher.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.marketplace.ecommerce.cart.entity.Cart;
import com.marketplace.ecommerce.cart.entity.CartItem;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.notification.service.NotificationService;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.repository.ProductCategoryRepository;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import com.marketplace.ecommerce.voucher.dto.CreateVoucherRequest;
import com.marketplace.ecommerce.voucher.dto.VoucherCalculationResponse;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class VoucherServiceImplTest {

    @Mock
    private VoucherRepository voucherRepository;

    @Mock
    private UserVoucherRepository userVoucherRepository;

        @Mock
        private UserRepository userRepository;

        @Mock
        private OrderRepository orderRepository;

            @Mock
    private ShopRepository shopRepository;

    @Mock
    private ProductCategoryRepository productCategoryRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private NotificationService notificationService;

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
                .status(ShopStatus.ACTIVE)
                .build();

        lenient().when(userRepository.findByAccountId(any())).thenReturn(Optional.of(testUserA));
        lenient().when(userRepository.findById(any())).thenReturn(Optional.of(testUserA));

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
                when(voucherRepository.findAllCurrentlyActive(any(), any(), any(Pageable.class)))
                        .thenReturn(new PageImpl<>(List.of(multiUseVoucher)));

                // User A đã dùng 2 lần cho voucher này
                List<Object[]> usageRows = new ArrayList<>();
                usageRows.add(new Object[]{multiUseVoucher.getId(), 2L});
                when(userVoucherRepository.countUsedVouchersByUserId(testUserA.getId())).thenReturn(usageRows);
                when(orderRepository.countCompletedOrdersByUserId(testUserA.getId())).thenReturn(1L);

                Page<VoucherResponse> responsePage = voucherService.listActiveVouchers(null, null, accountId, PageRequest.of(0, 10));

                assertNotNull(responsePage);
                assertEquals(1, responsePage.getTotalElements());
                VoucherResponse resp = responsePage.getContent().get(0);

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
                when(voucherRepository.findAllCurrentlyActive(any(), any(), any(Pageable.class)))
                        .thenReturn(new PageImpl<>(List.of(firstOrderVoucher)));
                when(orderRepository.countCompletedOrdersByUserId(testUserA.getId())).thenReturn(2L); // Đã có 2 đơn hoàn thành

                Page<VoucherResponse> responsePage = voucherService.listActiveVouchers(null, null, accountId, PageRequest.of(0, 10));

                assertNotNull(responsePage);
                assertEquals(1, responsePage.getTotalElements());
                VoucherResponse resp = responsePage.getContent().get(0);

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

        @Test
        @DisplayName("listActiveVouchers overload trả về List<VoucherResponse> hoạt động chính xác")
        void testListActiveVouchers_ListOverload() {
                UUID accountId = UUID.randomUUID();
                when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(testUserA));
                when(voucherRepository.findAllCurrentlyActive(any(), any(), any(Pageable.class)))
                                .thenReturn(new PageImpl<>(List.of(multiUseVoucher)));

                List<VoucherResponse> list = voucherService.listActiveVouchers(null, null, accountId);

                assertNotNull(list);
                assertEquals(1, list.size());
                assertEquals("GIAM50K", list.get(0).getCode());
        }

    @Test
    @DisplayName("createVoucher validation failures")
    void testCreateVoucher_ValidationFailures() {
        UUID accountId = UUID.randomUUID();
        when(userRepository.findById(accountId)).thenReturn(Optional.of(testUserA));

        // 1. Code da ton tai
        CreateVoucherRequest req1 = CreateVoucherRequest.builder()
                .code("EXISTING")
                .title("Existing")
                .voucherType(VoucherType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(10000))
                .build();
        when(voucherRepository.existsByCodeIgnoreCase("EXISTING")).thenReturn(true);
        assertThrows(CustomException.class, () -> voucherService.createVoucher(accountId, req1));

        // 2. Scope SHOP nhung shopId truyen vao khong ton tai
        UUID fakeShopId = UUID.randomUUID();
        CreateVoucherRequest req2 = CreateVoucherRequest.builder()
                .code("SHOP1")
                .title("Shop 1")
                .scope(VoucherScope.SHOP)
                .shopId(fakeShopId)
                .voucherType(VoucherType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(10000))
                .build();
        when(voucherRepository.existsByCodeIgnoreCase("SHOP1")).thenReturn(false);
        when(shopRepository.findById(fakeShopId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> voucherService.createVoucher(accountId, req2));

        // 3. Scope SHOP khong truyen shopId va user chua co shop
        CreateVoucherRequest req3 = CreateVoucherRequest.builder()
                .code("SHOP2")
                .title("Shop 2")
                .scope(VoucherScope.SHOP)
                .voucherType(VoucherType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(10000))
                .build();
        when(voucherRepository.existsByCodeIgnoreCase("SHOP2")).thenReturn(false);
        when(shopRepository.findByUserId(testUserA.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> voucherService.createVoucher(accountId, req3));

        // 4. Shop da dong cua (CLOSED)
        Shop closedShop = Shop.builder().id(UUID.randomUUID()).status(ShopStatus.CLOSED).build();
        when(shopRepository.findById(closedShop.getId())).thenReturn(Optional.of(closedShop));
        CreateVoucherRequest req4 = CreateVoucherRequest.builder()
                .code("SHOP4")
                .title("Shop 4")
                .scope(VoucherScope.SHOP)
                .shopId(closedShop.getId())
                .voucherType(VoucherType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(10000))
                .build();
        when(voucherRepository.existsByCodeIgnoreCase("SHOP4")).thenReturn(false);
        assertThrows(CustomException.class, () -> voucherService.createVoucher(accountId, req4));

        // 5. Shop PENDING_DEPOSIT
        Shop pendingShop = Shop.builder().id(UUID.randomUUID()).status(ShopStatus.PENDING_DEPOSIT).build();
        when(shopRepository.findById(pendingShop.getId())).thenReturn(Optional.of(pendingShop));
        CreateVoucherRequest req5 = CreateVoucherRequest.builder()
                .code("SHOP5")
                .title("Shop 5")
                .scope(VoucherScope.SHOP)
                .shopId(pendingShop.getId())
                .voucherType(VoucherType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(10000))
                .build();
        when(voucherRepository.existsByCodeIgnoreCase("SHOP5")).thenReturn(false);
        assertThrows(CustomException.class, () -> voucherService.createVoucher(accountId, req5));

        // 6. categoryId khong ton tai
        UUID fakeCatId = UUID.randomUUID();
        CreateVoucherRequest req6 = CreateVoucherRequest.builder()
                .code("CAT_FAIL")
                .title("Cat Fail")
                .scope(VoucherScope.PLATFORM)
                .categoryId(fakeCatId)
                .voucherType(VoucherType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(10000))
                .build();
        when(voucherRepository.existsByCodeIgnoreCase("CAT_FAIL")).thenReturn(false);
        when(productCategoryRepository.findById(fakeCatId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> voucherService.createVoucher(accountId, req6));

        // 7. getUser not found
        UUID unknownUser = UUID.randomUUID();
        when(userRepository.findByAccountId(unknownUser)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> voucherService.createVoucher(unknownUser, req1));
    }

    @Test
    @DisplayName("applyVouchersToOrder va cac loi validation voucher")
    void testApplyVouchersToOrder_ErrorsAndCapping() {
        Order order = Order.builder()
                .id(UUID.randomUUID())
                .user(testUserA)
                .shop(testShop)
                .subtotal(BigDecimal.valueOf(100000))
                .shippingFee(BigDecimal.valueOf(20000))
                .build();

        // 1. shop voucher code not found
        when(voucherRepository.findByCodeIgnoreCase("NOTFOUND_SHOP")).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> voucherService.applyVouchersToOrder(order, "NOTFOUND_SHOP", null));

        // 2. voucher truyen vao shopVoucher nhung lai co scope PLATFORM
        Voucher invalidScopeShop = Voucher.builder()
                .id(UUID.randomUUID())
                .code("PLAT_AS_SHOP")
                .scope(VoucherScope.PLATFORM)
                .build();
        when(voucherRepository.findByCodeIgnoreCase("PLAT_AS_SHOP")).thenReturn(Optional.of(invalidScopeShop));
        assertThrows(CustomException.class, () -> voucherService.applyVouchersToOrder(order, "PLAT_AS_SHOP", null));

        // 3. shop voucher khong trung shopId voi don hang
        Shop otherShop = Shop.builder().id(UUID.randomUUID()).name("Other Shop").status(ShopStatus.ACTIVE).build();
        Voucher wrongShopVoucher = Voucher.builder()
                .id(UUID.randomUUID())
                .code("WRONG_SHOP")
                .scope(VoucherScope.SHOP)
                .shop(otherShop)
                .build();
        when(voucherRepository.findByCodeIgnoreCase("WRONG_SHOP")).thenReturn(Optional.of(wrongShopVoucher));
        assertThrows(CustomException.class, () -> voucherService.applyVouchersToOrder(order, "WRONG_SHOP", null));

        // 4. platform voucher code not found
        when(voucherRepository.findByCodeIgnoreCase("NOTFOUND_PLAT")).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> voucherService.applyVouchersToOrder(order, null, "NOTFOUND_PLAT"));

        // 5. platform voucher lai co scope SHOP
        Voucher shopAsPlat = Voucher.builder()
                .id(UUID.randomUUID())
                .code("SHOP_AS_PLAT")
                .scope(VoucherScope.SHOP)
                .build();
        when(voucherRepository.findByCodeIgnoreCase("SHOP_AS_PLAT")).thenReturn(Optional.of(shopAsPlat));
        assertThrows(CustomException.class, () -> voucherService.applyVouchersToOrder(order, null, "SHOP_AS_PLAT"));

        // 6. Tong discount cua ca 2 voucher vuot qua subtotal + shipping (cap lai bang subtotal + shipping)
        Voucher validShopV = Voucher.builder()
                .id(UUID.randomUUID())
                .code("SHOP_BIG")
                .scope(VoucherScope.SHOP)
                .shop(testShop)
                .status(VoucherStatus.ACTIVE)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(2))
                .voucherType(VoucherType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(90000))
                .usedCount(0)
                .build();

        Voucher validPlatV = Voucher.builder()
                .id(UUID.randomUUID())
                .code("PLAT_BIG")
                .scope(VoucherScope.PLATFORM)
                .status(VoucherStatus.ACTIVE)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(2))
                .voucherType(VoucherType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(50000))
                .usedCount(0)
                .build();

        when(voucherRepository.findByCodeIgnoreCase("SHOP_BIG")).thenReturn(Optional.of(validShopV));
        when(voucherRepository.findByCodeIgnoreCase("PLAT_BIG")).thenReturn(Optional.of(validPlatV));
        when(userVoucherRepository.findByUserIdAndVoucherIdAndStatus(any(), any(), any())).thenReturn(Optional.empty());

        BigDecimal totalDiscount = voucherService.applyVouchersToOrder(order, "SHOP_BIG", "PLAT_BIG");
        // Max allowed is 100000 + 20000 = 120000, even though 90000 + 50000 = 140000
        assertEquals(BigDecimal.valueOf(120000), totalDiscount);
        assertEquals(BigDecimal.valueOf(120000), order.getDiscountAmount());
    }

    @Test
    @DisplayName("recordUserVoucherUsed khi da co ban ghi UNUSED va cac truong hop limit")
    void testRecordUserVoucherUsed_Branches() {
        Order order = Order.builder()
                .id(UUID.randomUUID())
                .user(testUserA)
                .shop(testShop)
                .subtotal(BigDecimal.valueOf(100000))
                .shippingFee(BigDecimal.valueOf(20000))
                .build();

        // Case 1: user da co UNUSED va su dung xong dat toi maxLimit -> doi UNUSED thanh USED
        Voucher v1 = Voucher.builder()
                .id(UUID.randomUUID())
                .code("V_LIMIT1")
                .scope(VoucherScope.PLATFORM)
                .status(VoucherStatus.ACTIVE)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(2))
                .voucherType(VoucherType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(10000))
                .userUsageLimit(1)
                .usedCount(0)
                .build();
        UserVoucher uv1 = UserVoucher.builder()
                .id(UUID.randomUUID())
                .user(testUserA)
                .voucher(v1)
                .status(UserVoucherStatus.UNUSED)
                .claimedAt(LocalDateTime.now())
                .build();

        when(voucherRepository.findByCodeIgnoreCase("V_LIMIT1")).thenReturn(Optional.of(v1));
        when(userVoucherRepository.countByUserIdAndVoucherIdAndStatus(testUserA.getId(), v1.getId(), UserVoucherStatus.USED)).thenReturn(0L);
        when(userVoucherRepository.findByUserIdAndVoucherIdAndStatus(testUserA.getId(), v1.getId(), UserVoucherStatus.UNUSED)).thenReturn(Optional.of(uv1));

        voucherService.applyVouchersToOrder(order, null, "V_LIMIT1");
        assertEquals(UserVoucherStatus.USED, uv1.getStatus());
        assertEquals(order, uv1.getOrder());

        // Case 2: user co UNUSED nhung limit = 5, moi dung 0 -> tao ban ghi USED moi, giu nguyen UNUSED
        Voucher v2 = Voucher.builder()
                .id(UUID.randomUUID())
                .code("V_LIMIT5")
                .scope(VoucherScope.PLATFORM)
                .status(VoucherStatus.ACTIVE)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(2))
                .voucherType(VoucherType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(10000))
                .userUsageLimit(5)
                .usedCount(0)
                .build();
        UserVoucher uv2 = UserVoucher.builder()
                .id(UUID.randomUUID())
                .user(testUserA)
                .voucher(v2)
                .status(UserVoucherStatus.UNUSED)
                .claimedAt(LocalDateTime.now())
                .build();

        when(voucherRepository.findByCodeIgnoreCase("V_LIMIT5")).thenReturn(Optional.of(v2));
        when(userVoucherRepository.countByUserIdAndVoucherIdAndStatus(testUserA.getId(), v2.getId(), UserVoucherStatus.USED)).thenReturn(0L);
        when(userVoucherRepository.findByUserIdAndVoucherIdAndStatus(testUserA.getId(), v2.getId(), UserVoucherStatus.UNUSED)).thenReturn(Optional.of(uv2));

        voucherService.applyVouchersToOrder(order, null, "V_LIMIT5");
        assertEquals(UserVoucherStatus.UNUSED, uv2.getStatus());
        verify(userVoucherRepository, atLeastOnce()).save(any(UserVoucher.class));
    }

    @Test
    @DisplayName("rollbackVoucherUsage truong hop legacy voucher va khoi phuc UNUSED vao vi")
    void testRollbackVoucherUsage_Comprehensive() {
        Voucher legacyVoucher = Voucher.builder()
                .id(UUID.randomUUID())
                .code("LEGACY")
                .usedCount(2)
                .build();

        Order order = Order.builder()
                .id(UUID.randomUUID())
                .user(testUserA)
                .voucher(legacyVoucher)
                .voucherCode("LEGACY")
                .build();

        UserVoucher uv = UserVoucher.builder()
                .id(UUID.randomUUID())
                .user(testUserA)
                .voucher(legacyVoucher)
                .status(UserVoucherStatus.USED)
                .build();

        when(userVoucherRepository.findByOrderId(order.getId())).thenReturn(List.of(uv));
        // User CHUA co voucher nay trong vi dang UNUSED -> khoi phuc lai thanh UNUSED
        when(userVoucherRepository.existsByUserIdAndVoucherIdAndStatus(testUserA.getId(), legacyVoucher.getId(), UserVoucherStatus.UNUSED)).thenReturn(false);

        voucherService.rollbackVoucherUsage(order);

        assertEquals(1, legacyVoucher.getUsedCount());
        assertEquals(UserVoucherStatus.UNUSED, uv.getStatus());
        assertNull(uv.getOrder());
        assertNull(uv.getUsedAt());
        verify(userVoucherRepository).save(uv);
    }

    @Test
    @DisplayName("validateAndGetDiscount voi category hierarchy, IntlFormatHelper va cac trang thai shop")
    void testValidateAndGetDiscount_CategoryHierarchyAndShopStates() {
        UUID catParentId = UUID.randomUUID();
        UUID catChildId = UUID.randomUUID();
        ProductCategory parentCat = new ProductCategory();
        parentCat.setId(catParentId);
        parentCat.setName("Thoi Trang");

        ProductCategory childCat = new ProductCategory();
        childCat.setId(catChildId);
        childCat.setName("Ao Nam");
        childCat.setParent(parentCat);

        Voucher catVoucher = Voucher.builder()
                .id(UUID.randomUUID())
                .code("FASHION20")
                .category(parentCat)
                .scope(VoucherScope.PLATFORM)
                .status(VoucherStatus.ACTIVE)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(2))
                .voucherType(VoucherType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(20000))
                .minOrderValue(BigDecimal.valueOf(300000))
                .build();

        // 1. Cart co san pham thuoc child category nhung tong chua du minOrderValue -> goi IntlFormatHelper!
        Product prod = Product.builder().id(UUID.randomUUID()).basePrice(BigDecimal.valueOf(100000)).productCategory(childCat).shop(testShop).build();
        CartItem item = CartItem.builder().id(UUID.randomUUID()).product(prod).quantity(1).deleted(false).build();
        Cart cart = Cart.builder().id(UUID.randomUUID()).user(testUserA).items(Set.of(item)).build();

        when(cartRepository.findByUserIdWithItems(testUserA.getId())).thenReturn(Optional.of(cart));
        when(voucherRepository.findByCodeIgnoreCase("FASHION20")).thenReturn(Optional.of(catVoucher));

        CustomException exIntl = assertThrows(CustomException.class, () ->
                voucherService.validateAndCalculate(testUserA.getId(), "FASHION20", testShop.getId(), BigDecimal.valueOf(100000), BigDecimal.valueOf(10000)));
        assertTrue(exIntl.getMessage().contains("Tổng giá trị các sản phẩm thuộc ngành hàng"));
        assertTrue(exIntl.getMessage().contains("300000"));

        // 2. Cart khong co san pham nao thuoc category
        ProductCategory otherCat = new ProductCategory();
        otherCat.setId(UUID.randomUUID());
        otherCat.setName("Dien Tu");
        prod.setProductCategory(otherCat);
        CustomException exNoMatch = assertThrows(CustomException.class, () ->
                voucherService.validateAndCalculate(testUserA.getId(), "FASHION20", testShop.getId(), BigDecimal.valueOf(500000), BigDecimal.valueOf(10000)));
        assertTrue(exNoMatch.getMessage().contains("chỉ áp dụng cho sản phẩm thuộc ngành hàng"));

        // 3. Shop trang thai CLOSED
        Shop closedShop = Shop.builder().id(UUID.randomUUID()).status(ShopStatus.CLOSED).build();
        Voucher shopV = Voucher.builder()
                .id(UUID.randomUUID())
                .code("SHOP_CLOSED")
                .scope(VoucherScope.SHOP)
                .shop(closedShop)
                .status(VoucherStatus.ACTIVE)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(2))
                .voucherType(VoucherType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(10000))
                .build();
        when(voucherRepository.findByCodeIgnoreCase("SHOP_CLOSED")).thenReturn(Optional.of(shopV));
        CustomException exClosed = assertThrows(CustomException.class, () ->
                voucherService.validateAndCalculate(testUserA.getId(), "SHOP_CLOSED", closedShop.getId(), BigDecimal.valueOf(100000), BigDecimal.valueOf(10000)));
        assertTrue(exClosed.getMessage().contains("đã đóng cửa"));

        // 4. Shop trang thai SUSPENDED
        closedShop.setStatus(ShopStatus.SUSPENDED);
        CustomException exStatus = assertThrows(CustomException.class, () ->
                voucherService.validateAndCalculate(testUserA.getId(), "SHOP_CLOSED", closedShop.getId(), BigDecimal.valueOf(100000), BigDecimal.valueOf(10000)));
        assertTrue(exStatus.getMessage().contains("hiện không khả dụng"));

        // 5. First order voucher khi user == null
        Voucher firstOrderV = Voucher.builder()
                .id(UUID.randomUUID())
                .code("ECOMNEW15")
                .scope(VoucherScope.PLATFORM)
                .status(VoucherStatus.ACTIVE)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(2))
                .voucherType(VoucherType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(15000))
                .build();
        when(voucherRepository.findByCodeIgnoreCase("ECOMNEW15")).thenReturn(Optional.of(firstOrderV));
        assertThrows(CustomException.class, () ->
                voucherService.validateAndCalculate(null, "ECOMNEW15", null, BigDecimal.valueOf(100000), BigDecimal.valueOf(10000)));

        // 6. First order voucher khi user da co completed orders > 0
        when(orderRepository.countCompletedOrdersByUserId(testUserA.getId())).thenReturn(2L);
        assertThrows(CustomException.class, () ->
                voucherService.validateAndCalculate(testUserA.getId(), "ECOMNEW15", null, BigDecimal.valueOf(100000), BigDecimal.valueOf(10000)));

        // 7. User da dung het usage limit
        Voucher limitVoucher = Voucher.builder()
                .id(UUID.randomUUID())
                .code("LIMIT_V")
                .scope(VoucherScope.PLATFORM)
                .status(VoucherStatus.ACTIVE)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(2))
                .voucherType(VoucherType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(10000))
                .userUsageLimit(2)
                .build();
        when(voucherRepository.findByCodeIgnoreCase("LIMIT_V")).thenReturn(Optional.of(limitVoucher));
        when(userVoucherRepository.countByUserIdAndVoucherIdAndStatus(testUserA.getId(), limitVoucher.getId(), UserVoucherStatus.USED)).thenReturn(2L);
        assertThrows(CustomException.class, () ->
                voucherService.validateAndCalculate(testUserA.getId(), "LIMIT_V", null, BigDecimal.valueOf(100000), BigDecimal.valueOf(10000)));
    }

    @Test
    @DisplayName("calculateDiscount va deactivateVouchersOnShopClose bien")
    void testCalculateDiscountAndDeactivate() {
        // 1. FREE_SHIPPING voucher voi discountValue = null (mien phi toan bo shippingFee)
        Voucher freeShipAll = Voucher.builder()
                .id(UUID.randomUUID())
                .code("FREESHIP_ALL")
                .scope(VoucherScope.PLATFORM)
                .status(VoucherStatus.ACTIVE)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(2))
                .voucherType(VoucherType.FREE_SHIPPING)
                .discountValue(null)
                .build();
        when(voucherRepository.findByCodeIgnoreCase("FREESHIP_ALL")).thenReturn(Optional.of(freeShipAll));
        VoucherCalculationResponse res = voucherService.validateAndCalculate(testUserA.getId(), "FREESHIP_ALL", null, BigDecimal.valueOf(200000), BigDecimal.valueOf(35000));
        assertEquals(BigDecimal.valueOf(35000), res.getDiscountAmount());

        // 2. FIXED_AMOUNT voi discountValue > subtotal (cap lai bang subtotal)
        Voucher bigFixed = Voucher.builder()
                .id(UUID.randomUUID())
                .code("BIG_FIXED")
                .scope(VoucherScope.PLATFORM)
                .status(VoucherStatus.ACTIVE)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(2))
                .voucherType(VoucherType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(150000))
                .build();
        when(voucherRepository.findByCodeIgnoreCase("BIG_FIXED")).thenReturn(Optional.of(bigFixed));
        VoucherCalculationResponse resFixed = voucherService.validateAndCalculate(testUserA.getId(), "BIG_FIXED", null, BigDecimal.valueOf(80000), BigDecimal.valueOf(10000));
        assertEquals(BigDecimal.valueOf(80000), resFixed.getDiscountAmount());

        // 3. deactivateVouchersOnShopClose voi null shopId
        voucherService.deactivateVouchersOnShopClose(null);
        verify(voucherRepository, never()).updateStatusByShopId(any(), any(), any());

        // 4. deactivateVouchersOnShopClose voi valid shopId
        UUID sid = UUID.randomUUID();
        voucherService.deactivateVouchersOnShopClose(sid);
        verify(voucherRepository).updateStatusByShopId(sid, VoucherStatus.ACTIVE, VoucherStatus.INACTIVE);
    }


    @Test
    @DisplayName("rollbackVoucherUsage giam luot su dung va khoi phuc user voucher")
    void testRollbackVoucherUsage_Branches() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setOrderNumber("ORD-ROLLBACK-V");
        order.setUser(testUserA);

        Voucher shopV = Voucher.builder()
                .id(UUID.randomUUID())
                .code("SHOP_V")
                .usedCount(2)
                .build();
        Voucher platV = Voucher.builder()
                .id(UUID.randomUUID())
                .code("PLAT_V")
                .usedCount(1)
                .build();
        Voucher extraV = Voucher.builder()
                .id(UUID.randomUUID())
                .code("EXTRA_V")
                .usedCount(1)
                .build();

        order.setShopVoucher(shopV);
        order.setPlatformVoucher(platV);
        order.setVoucher(extraV);

        UserVoucher uv1 = UserVoucher.builder()
                .id(UUID.randomUUID())
                .user(testUserA)
                .voucher(shopV)
                .status(UserVoucherStatus.USED)
                .build();
        UserVoucher uv2 = UserVoucher.builder()
                .id(UUID.randomUUID())
                .user(testUserA)
                .voucher(platV)
                .status(UserVoucherStatus.USED)
                .build();

        when(userVoucherRepository.findByOrderId(orderId)).thenReturn(List.of(uv1, uv2));
        // uv1 hasUnused is false -> restores
        when(userVoucherRepository.existsByUserIdAndVoucherIdAndStatus(testUserA.getId(), shopV.getId(), UserVoucherStatus.UNUSED))
                .thenReturn(false);
        // uv2 hasUnused is true -> deletes
        when(userVoucherRepository.existsByUserIdAndVoucherIdAndStatus(testUserA.getId(), platV.getId(), UserVoucherStatus.UNUSED))
                .thenReturn(true);

        voucherService.rollbackVoucherUsage(order);

        assertEquals(1, shopV.getUsedCount());
        assertEquals(0, platV.getUsedCount());
        assertEquals(0, extraV.getUsedCount());
        assertEquals(UserVoucherStatus.UNUSED, uv1.getStatus());
        verify(userVoucherRepository).delete(uv2);
    }

    @Test
    @DisplayName("createVoucher kiem tra cac nhanh validate shop va duplicate code")
    void testCreateVoucher_Validations() {
        UUID accountId = UUID.randomUUID();
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(testUserA));

        // 1. Duplicate code
        CreateVoucherRequest req = new CreateVoucherRequest();
        req.setCode("EXISTING_CODE");
        when(voucherRepository.existsByCodeIgnoreCase("EXISTING_CODE")).thenReturn(true);
        assertThrows(CustomException.class, () -> voucherService.createVoucher(accountId, req));

        // 2. Scope SHOP with shopId not found
        req.setCode("NEW_SHOP_V");
        req.setScope(VoucherScope.SHOP);
        req.setShopId(UUID.randomUUID());
        when(voucherRepository.existsByCodeIgnoreCase("NEW_SHOP_V")).thenReturn(false);
        when(shopRepository.findById(req.getShopId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> voucherService.createVoucher(accountId, req));

        // 3. Scope SHOP without shopId, user has no shop
        req.setShopId(null);
        when(shopRepository.findByUserId(testUserA.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> voucherService.createVoucher(accountId, req));

        // 4. Shop CLOSED
        Shop closedShop = new Shop();
        closedShop.setId(UUID.randomUUID());
        closedShop.setStatus(ShopStatus.CLOSED);
        when(shopRepository.findByUserId(testUserA.getId())).thenReturn(Optional.of(closedShop));
        assertThrows(CustomException.class, () -> voucherService.createVoucher(accountId, req));

        // 5. Shop PENDING_DEPOSIT
        closedShop.setStatus(ShopStatus.PENDING_DEPOSIT);
        assertThrows(CustomException.class, () -> voucherService.createVoucher(accountId, req));

        // 6. CategoryId not found
        closedShop.setStatus(ShopStatus.ACTIVE);
        req.setCategoryId(UUID.randomUUID());
        when(productCategoryRepository.findById(req.getCategoryId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> voucherService.createVoucher(accountId, req));

        // 7. Success creation
        ProductCategory cat = new ProductCategory();
        cat.setId(req.getCategoryId());
        when(productCategoryRepository.findById(req.getCategoryId())).thenReturn(Optional.of(cat));
        when(voucherRepository.save(any())).thenAnswer(inv -> {
            Voucher v = inv.getArgument(0);
            v.setId(UUID.randomUUID());
            return v;
        });

        req.setTitle("Voucher Mới");
        req.setVoucherType(VoucherType.FIXED_AMOUNT);
        req.setDiscountValue(BigDecimal.valueOf(20000));
        req.setMinOrderValue(BigDecimal.valueOf(100000));
        req.setStartDate(LocalDateTime.now().plusDays(1));
        req.setEndDate(LocalDateTime.now().plusDays(10));
        req.setUsageLimit(100);

        VoucherResponse created = voucherService.createVoucher(accountId, req);
        assertNotNull(created);
        assertEquals("NEW_SHOP_V", created.getCode());
    }

    @Test
    @DisplayName("VoucherService nem ngoai le khi khong tim thay voucher hoac user")
    void testVoucherService_NotFoundExceptions() {
        // 1. applyVoucherToOrder not found
        Order order = new Order();
        when(voucherRepository.findByCodeIgnoreCase("NOT_FOUND")).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> voucherService.applyVoucherToOrder(order, "NOT_FOUND"));

        // 2. validateAndCalculateMulti not found
        assertThrows(CustomException.class, () -> voucherService.validateAndCalculateMulti(
                testUserA.getId(), "NOT_FOUND", null, UUID.randomUUID(), BigDecimal.valueOf(100000), BigDecimal.valueOf(20000)));

        assertThrows(CustomException.class, () -> voucherService.validateAndCalculateMulti(
                testUserA.getId(), null, "NOT_FOUND", UUID.randomUUID(), BigDecimal.valueOf(100000), BigDecimal.valueOf(20000)));

        // 3. User not found in createVoucher
        UUID nonUser = UUID.randomUUID();
        when(userRepository.findByAccountId(nonUser)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> voucherService.createVoucher(nonUser, new CreateVoucherRequest()));
    }
}
