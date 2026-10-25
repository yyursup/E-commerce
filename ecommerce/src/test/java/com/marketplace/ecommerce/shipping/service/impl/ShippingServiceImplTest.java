package com.marketplace.ecommerce.shipping.service.impl;

import com.marketplace.ecommerce.cart.entity.CartItem;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.payment.valueObjects.PaymentMethod;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.valueObjects.ConditionGrade;
import com.marketplace.ecommerce.shipping.dto.request.GHNCalculateFeeRequest;
import com.marketplace.ecommerce.shipping.dto.request.GHNCreateOrderRequest;
import com.marketplace.ecommerce.shipping.dto.response.GHNCalculateFeeResponse;
import com.marketplace.ecommerce.shipping.usecase.GHNClient;
import com.marketplace.ecommerce.shop.entity.Shop;
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
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShippingServiceImplTest {

    @Mock
    private GHNClient ghnClient;

    @InjectMocks
    private ShippingServiceImpl shippingService;

    private Shop shop;
    private Order order;
    private Product brandNewProduct;
    private Product usedProduct;

    @BeforeEach
    void setUp() {
        shop = new Shop();
        shop.setId(UUID.randomUUID());
        shop.setName("Tech Shop");
        shop.setDistrictId(1442);
        shop.setWardCode("20101");

        brandNewProduct = Product.builder()
                .id(UUID.randomUUID())
                .name("iPhone 15 Sealed")
                .conditionGrade(ConditionGrade.GRADE_NEW)
                .weight(400)
                .build();

        usedProduct = Product.builder()
                .id(UUID.randomUUID())
                .name("Tai nghe Like New")
                .conditionGrade(ConditionGrade.GRADE_LIKE_NEW)
                .weight(null) // test default weight 500
                .build();

        OrderItem item1 = OrderItem.builder()
                .id(UUID.randomUUID())
                .product(brandNewProduct)
                .productName(brandNewProduct.getName())
                .quantity(1)
                .build();

        order = Order.builder()
                .id(UUID.randomUUID())
                .orderNumber("ORD-SHIP-01")
                .shop(shop)
                .items(Set.of(item1))
                .shippingName("Nguyen Van B")
                .shippingPhone("0988888888")
                .shippingAddress("456 Nguyen Trai")
                .shippingDistrictId(1442)
                .shippingWardCode("20101")
                .paymentMethod(PaymentMethod.COD)
                .subtotal(BigDecimal.valueOf(10000000))
                .total(BigDecimal.valueOf(10030000))
                .notes("Giao giờ hành chính")
                .build();
    }

    @Test
    @DisplayName("build GHNCreateOrderRequest cho đơn hàng có hàng mới nguyên seal (CHOXEMHANGKHONGTHU)")
    void testBuild_BrandNewOrder() {
        GHNCreateOrderRequest req = shippingService.build(order);
        assertNotNull(req);
        assertEquals("CHOXEMHANGKHONGTHU", req.getRequired_note());
        assertEquals("ORD-SHIP-01", req.getClient_order_code());
        assertEquals(10030000, req.getCod_amount());
        assertEquals(5_000_000, req.getInsurance_value()); // capped at 5tr
        assertEquals(400, req.getWeight());
    }

    @Test
    @DisplayName("build GHNCreateOrderRequest cho đơn hàng cũ cho thử hàng (CHOTHUHANG) và thanh toán ví")
    void testBuild_UsedProductOrder() {
        OrderItem item2 = OrderItem.builder()
                .id(UUID.randomUUID())
                .product(usedProduct)
                .quantity(2)
                .build();

        order.setItems(Set.of(item2));
        order.setPaymentMethod(PaymentMethod.WALLET);
        order.setSubtotal(BigDecimal.valueOf(2000000));
        order.setTotal(BigDecimal.valueOf(2030000));

        GHNCreateOrderRequest req = shippingService.build(order);
        assertEquals("CHOTHUHANG", req.getRequired_note());
        assertEquals(0, req.getCod_amount()); // WALLET thì COD = 0
        assertEquals(2000000, req.getInsurance_value());
        assertEquals(1000, req.getWeight()); // 2 * default 500
    }

    @Test
    @DisplayName("build ném ngoại lệ khi thiếu thông tin quận huyện giao hàng")
    void testBuild_MissingAddress() {
        order.setShippingDistrictId(null);
        assertThrows(CustomException.class, () -> shippingService.build(order));
    }

    @Test
    @DisplayName("quoteFee tính phí vận chuyển thành công qua GHN Client")
    void testQuoteFee_Success() {
        CartItem cartItem = new CartItem();
        cartItem.setProduct(brandNewProduct);
        cartItem.setQuantity(2);

        GHNCalculateFeeResponse feeRes = new GHNCalculateFeeResponse();
        feeRes.setTotal(32000);
        when(ghnClient.calculateFee(any(GHNCalculateFeeRequest.class))).thenReturn(feeRes);

        BigDecimal fee = shippingService.quoteFee(shop, List.of(cartItem), 1442, "20101");
        assertEquals(BigDecimal.valueOf(32000), fee);
    }

    @Test
    @DisplayName("quoteFee ném ngoại lệ khi thiếu thông tin quận/huyện hoặc GHN báo lỗi")
    void testQuoteFee_Failures() {
        // Thiếu thông tin
        assertThrows(CustomException.class, () -> shippingService.quoteFee(shop, List.of(), null, "20101"));

        // GHN client ném lỗi
        CartItem cartItem = new CartItem();
        cartItem.setProduct(brandNewProduct);
        cartItem.setQuantity(1);
        when(ghnClient.calculateFee(any())).thenThrow(new RuntimeException("Network down"));

        assertThrows(CustomException.class, () -> shippingService.quoteFee(shop, List.of(cartItem), 1442, "20101"));
    }

    @Test
    @DisplayName("Bao phủ các nhánh fallback địa chỉ shop và null/blank trong build và quoteFee")
    void testFallbackAndNullBranches() {
        // 1. Shop missing districtId / wardCode in build() + null notes/subtotal/total + blank productName
        shop.setDistrictId(null);
        shop.setWardCode(null);
        order.setNotes(null);
        order.setSubtotal(null);
        order.setTotal(null);
        order.getItems().iterator().next().setProductName("   ");

        GHNCreateOrderRequest req = shippingService.build(order);
        assertEquals(1442, req.getFrom_district_id());
        assertEquals("21012", req.getFrom_ward_code());
        assertEquals("", req.getNote());
        assertEquals(0, req.getInsurance_value());
        assertEquals(0, req.getCod_amount());
        assertEquals("Sản phẩm", req.getItems().get(0).getName());

        // 2. shippingWardCode null in build()
        order.setShippingWardCode(null);
        assertThrows(CustomException.class, () -> shippingService.build(order));

        // 3. quoteFee with shop missing district/ward and cartItem with null product weight
        CartItem usedCartItem = new CartItem();
        usedCartItem.setProduct(usedProduct); // weight == null -> 500
        usedCartItem.setQuantity(1);

        GHNCalculateFeeResponse feeRes = new GHNCalculateFeeResponse();
        feeRes.setTotal(25000);
        when(ghnClient.calculateFee(any())).thenReturn(feeRes);

        BigDecimal fee = shippingService.quoteFee(shop, List.of(usedCartItem), 1442, "20101");
        assertEquals(BigDecimal.valueOf(25000), fee);

        // 4. quoteFee with blank toWardCode
        assertThrows(CustomException.class, () -> shippingService.quoteFee(shop, List.of(usedCartItem), 1442, "  "));
        assertThrows(CustomException.class, () -> shippingService.quoteFee(shop, List.of(usedCartItem), 1442, null));
    }
}
