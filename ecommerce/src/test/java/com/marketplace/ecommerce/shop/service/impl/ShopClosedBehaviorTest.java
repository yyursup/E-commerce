package com.marketplace.ecommerce.shop.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.dto.request.CreateOrderRequest;
import com.marketplace.ecommerce.order.dto.request.QuoteRequest;
import com.marketplace.ecommerce.order.service.impl.CheckoutServiceImpl;
import com.marketplace.ecommerce.order.service.impl.OrderServiceImpl;
import com.marketplace.ecommerce.product.dto.request.CreateProductRequest;
import com.marketplace.ecommerce.product.dto.request.UpdateProductRequest;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.service.impl.ProductServiceImpl;
import com.marketplace.ecommerce.product.validate.ProductValidation;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import com.marketplace.ecommerce.voucher.entity.Voucher;
import com.marketplace.ecommerce.voucher.repository.VoucherRepository;
import com.marketplace.ecommerce.voucher.service.impl.VoucherServiceImpl;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherScope;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShopClosedBehaviorTest {

    @Mock
    private ShopRepository shopRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private VoucherRepository voucherRepository;

    @Mock
    private com.marketplace.ecommerce.voucher.repository.UserVoucherRepository userVoucherRepository;

    @Mock
    private ProductValidation productValidation;

    @InjectMocks
    private CheckoutServiceImpl checkoutService;

    @InjectMocks
    private OrderServiceImpl orderService;

    @InjectMocks
    private ProductServiceImpl productService;

    @InjectMocks
    private VoucherServiceImpl voucherService;

    private UUID accountId;
    private UUID userId;
    private UUID shopId;
    private Shop closedShop;
    private Shop activeShop;
    private User businessUser;
    private Account account;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        userId = UUID.randomUUID();
        shopId = UUID.randomUUID();

        com.marketplace.ecommerce.auth.entity.Role businessRole = com.marketplace.ecommerce.auth.entity.Role.builder()
                .roleName("BUSINESS")
                .build();

        account = Account.builder()
                .id(accountId)
                .disciplineLevel(DisciplineLevel.NONE)
                .isActive(true)
                .role(businessRole)
                .build();

        businessUser = User.builder()
                .id(userId)
                .account(account)
                .build();

        closedShop = Shop.builder()
                .id(shopId)
                .name("Closed Electronics Shop")
                .status(ShopStatus.CLOSED)
                .user(businessUser)
                .build();

        activeShop = Shop.builder()
                .id(shopId)
                .name("Active Electronics Shop")
                .status(ShopStatus.ACTIVE)
                .user(businessUser)
                .build();
    }

    @Test
    @DisplayName("Test 1: Checkout quote bị chặn khi Shop đã CLOSED")
    void checkoutQuote_ThrowsException_WhenShopClosed() {
        QuoteRequest req = new QuoteRequest();
        req.setShopId(shopId);
        req.setAddressId(UUID.randomUUID());

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(businessUser));
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(closedShop));

        CustomException ex = assertThrows(CustomException.class, () -> checkoutService.quote(accountId, req));
        assertTrue(ex.getMessage().contains("đã đóng cửa"));
    }

    @Test
    @DisplayName("Test 2: Checkout confirm bị chặn khi Shop đã CLOSED")
    void checkoutConfirm_ThrowsException_WhenShopClosed() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(businessUser));
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(closedShop));

        CustomException ex = assertThrows(CustomException.class, () -> checkoutService.confirm(accountId, shopId));
        assertTrue(ex.getMessage().contains("đã đóng cửa"));
    }

    @Test
    @DisplayName("Test 3: ConvertCartToOrder bị chặn khi Customer có Product của Shop CLOSED trong Cart")
    void convertCartToOrder_ThrowsException_WhenShopClosed() {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setShopId(shopId);
        request.setAddressId(UUID.randomUUID());

        when(shopRepository.findById(shopId)).thenReturn(Optional.of(closedShop));

        CustomException ex = assertThrows(CustomException.class, () -> orderService.convertCartToOrder(accountId, request));
        assertTrue(ex.getMessage().contains("đã đóng cửa"));
    }

    @Test
    @DisplayName("Test 4: BUSINESS user với CLOSED Shop không thể create Product")
    void createProduct_ThrowsException_WhenShopClosed() {
        CreateProductRequest req = new CreateProductRequest();
        req.setName("iPhone 15 Pro");
        req.setSku("IPHONE-15-PRO");
        req.setStockQuantity(10);
        req.setBasePrice(new BigDecimal("25000000"));

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(businessUser));
        when(shopRepository.findByUserId(userId)).thenReturn(Optional.of(closedShop));

        CustomException ex = assertThrows(CustomException.class, () -> productService.createProduct(accountId, req));
        assertTrue(ex.getMessage().contains("đã đóng cửa"));
    }

    @Test
    @DisplayName("Test 5: BUSINESS user với CLOSED Shop không thể update Product")
    void updateProduct_ThrowsException_WhenShopClosed() {
        UUID productId = UUID.randomUUID();
        UpdateProductRequest req = new UpdateProductRequest();
        req.setName("Updated iPhone 15");

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(businessUser));
        when(shopRepository.findByUserId(userId)).thenReturn(Optional.of(closedShop));

        CustomException ex = assertThrows(CustomException.class, () -> productService.updateProduct(accountId, productId, req));
        assertTrue(ex.getMessage().contains("đã đóng cửa"));
    }

    @Test
    @DisplayName("Test 6: BUSINESS user với CLOSED Shop không thể toggleFeatured Product")
    void toggleFeatured_ThrowsException_WhenShopClosed() {
        UUID productId = UUID.randomUUID();

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(businessUser));
        when(shopRepository.findByUserId(userId)).thenReturn(Optional.of(closedShop));

        CustomException ex = assertThrows(CustomException.class, () -> productService.toggleFeatured(accountId, productId));
        assertTrue(ex.getMessage().contains("đã đóng cửa"));
    }

    @Test
    @DisplayName("Test 7: Voucher của CLOSED Shop bị từ chối trong validateAndCalculateMulti")
    void validateVoucher_ThrowsException_WhenShopClosed() {
        Voucher shopVoucher = Voucher.builder()
                .id(UUID.randomUUID())
                .code("SHOPCLOSED50")
                .scope(VoucherScope.SHOP)
                .shop(closedShop)
                .status(VoucherStatus.ACTIVE)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .build();

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(businessUser));
        when(voucherRepository.findByCodeIgnoreCase("SHOPCLOSED50")).thenReturn(Optional.of(shopVoucher));

        CustomException ex = assertThrows(CustomException.class, () ->
                voucherService.validateAndCalculateMulti(
                        accountId,
                        "SHOPCLOSED50",
                        null,
                        shopId,
                        new BigDecimal("1000000"),
                        new BigDecimal("30000")
                )
        );
        assertTrue(ex.getMessage().contains("đã đóng cửa"));
    }

    @Test
    @DisplayName("Test 8: BUSINESS user với CLOSED Shop không thể tạo Voucher mới")
    void createVoucher_ThrowsException_WhenShopClosed() {
        com.marketplace.ecommerce.voucher.dto.CreateVoucherRequest req = new com.marketplace.ecommerce.voucher.dto.CreateVoucherRequest();
        req.setCode("VOUCHER2026");
        req.setTitle("Giảm giá xuân");
        req.setScope(VoucherScope.SHOP);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(businessUser));
        when(voucherRepository.existsByCodeIgnoreCase("VOUCHER2026")).thenReturn(false);
        when(shopRepository.findByUserId(userId)).thenReturn(Optional.of(closedShop));

        CustomException ex = assertThrows(CustomException.class, () -> voucherService.createVoucher(accountId, req));
        assertTrue(ex.getMessage().contains("đã đóng cửa"));
    }

    @Test
    @DisplayName("Test 9: Role BUSINESS được giữ nguyên khi Shop đóng cửa (không bị downgrade sang CUSTOMER)")
    void businessRole_Preserved_WhenShopClosed() {
        assertEquals("BUSINESS", businessUser.getAccount().getRole().getRoleName());
        assertEquals(ShopStatus.CLOSED, closedShop.getStatus());
        assertEquals(businessUser.getId(), closedShop.getUser().getId());
    }

    @Test
    @DisplayName("Test 10: ACTIVE và WARNED Shop vẫn cho phép validate và áp dụng Voucher bình thường")
    void activeAndWarnedShop_VoucherAllowed() {
        Shop warnedShop = Shop.builder()
                .id(UUID.randomUUID())
                .name("Warned Shop")
                .status(ShopStatus.WARNED)
                .user(businessUser)
                .build();

        Voucher activeShopVoucher = Voucher.builder()
                .id(UUID.randomUUID())
                .code("ACTIVEVOUCHER")
                .scope(VoucherScope.SHOP)
                .shop(activeShop)
                .voucherType(com.marketplace.ecommerce.voucher.valueObjects.VoucherType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("50000"))
                .minOrderValue(new BigDecimal("100000"))
                .status(VoucherStatus.ACTIVE)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .build();

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(businessUser));
        when(voucherRepository.findByCodeIgnoreCase("ACTIVEVOUCHER")).thenReturn(Optional.of(activeShopVoucher));

        var response = voucherService.validateAndCalculateMulti(
                accountId,
                "ACTIVEVOUCHER",
                null,
                shopId,
                new BigDecimal("500000"),
                new BigDecimal("30000")
        );

        assertNotNull(response);
        assertEquals(new BigDecimal("50000"), response.getDiscountAmount());
    }
}
