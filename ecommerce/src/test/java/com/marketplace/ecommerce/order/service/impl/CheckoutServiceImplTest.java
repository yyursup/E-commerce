package com.marketplace.ecommerce.order.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.entity.UserAddress;
import com.marketplace.ecommerce.auth.repository.UserAddressRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.cart.entity.Cart;
import com.marketplace.ecommerce.cart.entity.CartItem;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.dto.request.QuoteRequest;
import com.marketplace.ecommerce.order.dto.response.CheckoutConfirmResponse;
import com.marketplace.ecommerce.order.dto.response.QuoteResponse;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.shipping.service.ShippingService;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import com.marketplace.ecommerce.voucher.dto.VoucherCalculationResponse;
import com.marketplace.ecommerce.voucher.service.VoucherService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CheckoutServiceImplTest {

    @Mock
    private ShopRepository shopRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CartRepository cartRepository;
    @Mock
    private UserAddressRepository userAddressRepository;
    @Mock
    private ShippingService shippingService;
    @Mock
    private VoucherService voucherService;

    @InjectMocks
    private CheckoutServiceImpl checkoutService;

    private UUID accountId;
    private User sampleUser;
    private Shop sampleShop;
    private UserAddress sampleAddress;
    private Cart sampleCart;
    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();

        sampleUser = new User();
        sampleUser.setId(UUID.randomUUID());

        sampleShop = new Shop();
        sampleShop.setId(UUID.randomUUID());
        sampleShop.setStatus(ShopStatus.ACTIVE);
        sampleShop.setName("Mega Tech");

        sampleAddress = new UserAddress();
        sampleAddress.setId(UUID.randomUUID());
        sampleAddress.setDistrictId(1442);
        sampleAddress.setWardCode("20101");

        sampleProduct = Product.builder()
                .id(UUID.randomUUID())
                .shop(sampleShop)
                .name("Tai nghe Sony WH-1000XM5")
                .basePrice(BigDecimal.valueOf(8000000))
                .build();

        CartItem item = new CartItem();
        item.setId(UUID.randomUUID());
        item.setProduct(sampleProduct);
        item.setUnitPrice(sampleProduct.getBasePrice());
        item.setQuantity(1);
        item.setDeleted(false);

        sampleCart = new Cart();
        sampleCart.setId(UUID.randomUUID());
        sampleCart.setItems(new HashSet<>(List.of(item)));
    }

    @Test
    @DisplayName("quote tính tạm tính, phí ship và áp dụng voucher thành công")
    void testQuote_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(sampleAddress.getId(), sampleUser.getId()))
                .thenReturn(Optional.of(sampleAddress));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(sampleCart));
        when(shippingService.quoteFee(any(), any(), any(), any())).thenReturn(BigDecimal.valueOf(35000));

        VoucherCalculationResponse voucherCalc = VoucherCalculationResponse.builder()
                .discountAmount(BigDecimal.valueOf(500000))
                .shopDiscountAmount(BigDecimal.valueOf(500000))
                .shopVoucherCode("SONY500")
                .build();
        when(voucherService.validateAndCalculate(any(), any(), any(), any(), any())).thenReturn(voucherCalc);

        QuoteRequest req = new QuoteRequest();
        req.setShopId(sampleShop.getId());
        req.setAddressId(sampleAddress.getId());
        req.setVoucherCode("SONY500");

        QuoteResponse res = checkoutService.quote(accountId, req);
        assertNotNull(res);
        assertEquals(new BigDecimal("8000000"), res.getSubtotal());
        assertEquals(new BigDecimal("35000"), res.getShippingFee());
        assertEquals(new BigDecimal("500000"), res.getDiscountAmount());
        assertEquals(new BigDecimal("7535000"), res.getTotal()); // 8M + 35k - 500k
    }

    @Test
    @DisplayName("quote ném lỗi khi Shop đã đóng cửa")
    void testQuote_ShopClosed() {
        sampleShop.setStatus(ShopStatus.CLOSED);
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));

        QuoteRequest req = new QuoteRequest();
        req.setShopId(sampleShop.getId());

        CustomException ex = assertThrows(CustomException.class, () -> checkoutService.quote(accountId, req));
        assertTrue(ex.getMessage().contains("đã đóng cửa"));
    }

    @Test
    @DisplayName("confirm trả về thông tin xác nhận đặt hàng và voucher khả dụng")
    void testConfirm_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(sampleCart));
        when(userAddressRepository.findDefault(sampleUser.getId())).thenReturn(Optional.of(sampleAddress));
        when(shippingService.quoteFee(any(), any(), any(), any())).thenReturn(BigDecimal.valueOf(30000));
        when(voucherService.listActiveVouchers(any(), eq(sampleShop.getId()), eq(accountId))).thenReturn(List.of());

        CheckoutConfirmResponse res = checkoutService.confirm(accountId, sampleShop.getId());
        assertNotNull(res);
        assertEquals(sampleShop.getId(), res.getShopId());
        assertEquals(new BigDecimal("8000000"), res.getSubtotal());
        assertEquals(new BigDecimal("30000"), res.getShippingFee());
    }

    @Test
    @DisplayName("quote voi voucher shop va platform (multi voucher) va truong hop giam gia lon hon tong tien")
    void testQuote_MultiVouchersAndClamping() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(sampleAddress.getId(), sampleUser.getId()))
                .thenReturn(Optional.of(sampleAddress));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(sampleCart));
        when(shippingService.quoteFee(any(), any(), any(), any())).thenReturn(BigDecimal.valueOf(20000));

        // Huge discount clamping test (discount > subtotal + shippingFee)
        VoucherCalculationResponse multiCalc = VoucherCalculationResponse.builder()
                .discountAmount(BigDecimal.valueOf(10000000))
                .shopDiscountAmount(BigDecimal.valueOf(5000000))
                .platformDiscountAmount(BigDecimal.valueOf(5000000))
                .shopVoucherCode("SHOP5M")
                .platformVoucherCode("PLAT5M")
                .voucherCode("SHOP5M+PLAT5M")
                .build();
        when(voucherService.validateAndCalculateMulti(any(), any(), any(), any(), any(), any())).thenReturn(multiCalc);

        QuoteRequest req = new QuoteRequest();
        req.setShopId(sampleShop.getId());
        req.setAddressId(sampleAddress.getId());
        req.setShopVoucherCode("SHOP5M");
        req.setPlatformVoucherCode("PLAT5M");

        QuoteResponse res = checkoutService.quote(accountId, req);
        assertNotNull(res);
        assertEquals(BigDecimal.ZERO, res.getTotal());
        assertEquals("SHOP5M", res.getShopVoucherCode());
        assertEquals("PLAT5M", res.getPlatformVoucherCode());
    }

    @Test
    @DisplayName("quote kiem tra toan bo cac ngoai le validation")
    void testQuote_AllExceptions() {
        QuoteRequest req = new QuoteRequest();
        req.setShopId(sampleShop.getId());
        req.setAddressId(sampleAddress.getId());

        // 1. User not found
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> checkoutService.quote(accountId, req));

        // 2. Shop not found
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> checkoutService.quote(accountId, req));

        // 3. Address not found
        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(sampleAddress.getId(), sampleUser.getId()))
                .thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> checkoutService.quote(accountId, req));

        // 4. Cart not found
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(sampleAddress.getId(), sampleUser.getId()))
                .thenReturn(Optional.of(sampleAddress));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> checkoutService.quote(accountId, req));

        // 5. Empty items from shop
        Cart emptyCart = new Cart();
        emptyCart.setId(UUID.randomUUID());
        emptyCart.setItems(new HashSet<>());
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(emptyCart));
        assertThrows(CustomException.class, () -> checkoutService.quote(accountId, req));
    }

    @Test
    @DisplayName("confirm kiem tra cac nhanh ngoai le va truong hop chua co dia chi")
    void testConfirm_ExceptionsAndNoAddress() {
        UUID shopId = sampleShop.getId();

        // 1. User not found
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> checkoutService.confirm(accountId, shopId));

        // 2. Shop not found
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findById(shopId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> checkoutService.confirm(accountId, shopId));

        // 3. Shop CLOSED
        sampleShop.setStatus(ShopStatus.CLOSED);
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(sampleShop));
        assertThrows(CustomException.class, () -> checkoutService.confirm(accountId, shopId));

        // 4. Cart not found
        sampleShop.setStatus(ShopStatus.ACTIVE);
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> checkoutService.confirm(accountId, shopId));

        // 5. Empty items
        Cart emptyCart = new Cart();
        emptyCart.setId(UUID.randomUUID());
        emptyCart.setItems(new HashSet<>());
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(emptyCart));
        assertThrows(CustomException.class, () -> checkoutService.confirm(accountId, shopId));

        // 6. No address found (neither default nor lastUsed) -> shippingFee = 0
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(sampleCart));
        when(userAddressRepository.findDefault(sampleUser.getId())).thenReturn(Optional.empty());
        when(userAddressRepository.findLastUsed(sampleUser.getId())).thenReturn(Optional.empty());
        when(voucherService.listActiveVouchers(any(), eq(shopId), eq(accountId))).thenReturn(List.of());

        CheckoutConfirmResponse resNoAddr = checkoutService.confirm(accountId, shopId);
        assertNotNull(resNoAddr);
        assertNull(resNoAddr.getAddress());
        assertEquals(BigDecimal.ZERO, resNoAddr.getShippingFee());
    }
}
