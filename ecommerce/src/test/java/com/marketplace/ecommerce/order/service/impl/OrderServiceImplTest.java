package com.marketplace.ecommerce.order.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.entity.UserAddress;
import com.marketplace.ecommerce.auth.repository.UserAddressRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.cart.entity.Cart;
import com.marketplace.ecommerce.cart.entity.CartItem;
import com.marketplace.ecommerce.cart.repository.CartItemRepository;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.dto.request.CreateOrderRequest;
import com.marketplace.ecommerce.order.dto.response.OrderResponse;
import com.marketplace.ecommerce.order.dto.response.ShopRankingItem;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.order.repository.OrderItemsRepository;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.payment.valueObjects.PaymentMethod;
import com.marketplace.ecommerce.platform.service.CommissionCalculationService;
import com.marketplace.ecommerce.platform.service.CommissionService;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.entity.ProductVariant;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.repository.ProductVariantRepository;
import com.marketplace.ecommerce.product.service.InventoryHistoryService;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.request.service.OrderDisputeService;
import com.marketplace.ecommerce.shipping.dto.request.GHNCreateOrderRequest;
import com.marketplace.ecommerce.shipping.dto.response.GHNCreateOrderResponse;
import com.marketplace.ecommerce.shipping.service.ShippingService;
import com.marketplace.ecommerce.shipping.usecase.GHNClient;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import com.marketplace.ecommerce.voucher.service.VoucherService;
import com.marketplace.ecommerce.wallet.service.WalletService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private ShopRepository shopRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CartRepository cartRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductVariantRepository productVariantRepository;
    @Mock
    private OrderItemsRepository orderItemsRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private GHNClient ghnClient;
    @Mock
    private UserAddressRepository userAddressRepository;
    @Mock
    private ShippingService shippingService;
    @Mock
    private CommissionCalculationService commissionCalculationService;
    @Mock
    private EscrowService escrowService;
    @Mock
    private CommissionService commissionService;
    @Mock
    private VoucherService voucherService;
    @Mock
    private InventoryHistoryService inventoryHistoryService;
    @Mock
    private OrderDisputeService orderDisputeService;
    @Mock
    private WalletService walletService;

    @InjectMocks
    private OrderServiceImpl orderService;

    private UUID accountId;
    private User sampleBuyer;
    private User sampleSellerUser;
    private Shop sampleShop;
    private UserAddress sampleAddress;
    private Product sampleProduct;
    private ProductVariant sampleVariant;
    private Cart sampleCart;
    private CartItem sampleCartItem;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();

        sampleBuyer = new User();
        sampleBuyer.setId(UUID.randomUUID());

        sampleSellerUser = new User();
        sampleSellerUser.setId(UUID.randomUUID());

        sampleShop = new Shop();
        sampleShop.setId(UUID.randomUUID());
        sampleShop.setName("Shop Cong Nghe");
        sampleShop.setStatus(ShopStatus.ACTIVE);
        sampleShop.setUser(sampleSellerUser);

        sampleAddress = new UserAddress();
        sampleAddress.setId(UUID.randomUUID());
        sampleAddress.setReceiverName("Nguoi Nhan");
        sampleAddress.setReceiverPhone("0987654321");
        sampleAddress.setAddressLine("123 Duong XYZ");
        sampleAddress.setDistrictId(1442);
        sampleAddress.setWardCode("20101");

        ProductCategory cat = new ProductCategory();
        cat.setId(UUID.randomUUID());
        cat.setName("Smartphone");

        sampleProduct = Product.builder()
                .id(UUID.randomUUID())
                .shop(sampleShop)
                .productCategory(cat)
                .name("Samsung Galaxy S24")
                .basePrice(BigDecimal.valueOf(20000000))
                .quantity(15)
                .status(ProductStatus.PUBLISHED)
                .deleted(false)
                .build();

        sampleVariant = ProductVariant.builder()
                .id(UUID.randomUUID())
                .product(sampleProduct)
                .color("Xam")
                .size("256GB")
                .price(BigDecimal.valueOf(21000000))
                .stock(10)
                .sold(0)
                .deleted(false)
                .build();

        sampleCart = new Cart();
        sampleCart.setId(UUID.randomUUID());
        sampleCart.setUser(sampleBuyer);

        sampleCartItem = new CartItem();
        sampleCartItem.setId(UUID.randomUUID());
        sampleCartItem.setCart(sampleCart);
        sampleCartItem.setProduct(sampleProduct);
        sampleCartItem.setVariantId(sampleVariant.getId());
        sampleCartItem.setQuantity(2);
        sampleCartItem.setDeleted(false);

        sampleCart.setItems(new HashSet<>(List.of(sampleCartItem)));
    }

    @Test
    @DisplayName("convertCartToOrder thành công qua phương thức VÍ SÀN (WALLET)")
    void testConvertCartToOrder_Wallet() {
        CreateOrderRequest req = new CreateOrderRequest();
        req.setShopId(sampleShop.getId());
        req.setAddressId(sampleAddress.getId());
        req.setPaymentMethod("WALLET");
        req.setNotes("Giao giờ hành chính");

        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(sampleAddress.getId(), sampleBuyer.getId()))
                .thenReturn(Optional.of(sampleAddress));
        when(cartRepository.findByUserIdWithItems(sampleBuyer.getId())).thenReturn(Optional.of(sampleCart));

        when(shippingService.quoteFee(any(), any(), any(), any())).thenReturn(BigDecimal.valueOf(30000));
        when(commissionCalculationService.calculateFinalRate(any(), any(), any())).thenReturn(BigDecimal.valueOf(5.0));

        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            if (o.getId() == null) o.setId(UUID.randomUUID());
            return o;
        });

        when(productVariantRepository.findById(sampleVariant.getId())).thenReturn(Optional.of(sampleVariant));

        OrderResponse res = orderService.convertCartToOrder(accountId, req);
        assertNotNull(res);
        assertEquals(OrderStatus.CONFIRMED, res.getStatus());
        assertEquals(PaymentMethod.WALLET.name(), res.getPaymentMethod());
        assertEquals(8, sampleVariant.getStock()); // 10 - 2 = 8
        verify(walletService).payOrderWithWallet(any(Order.class));
    }

    @Test
    @DisplayName("convertCartToOrder ném lỗi khi khách chọn phương thức COD đã ngừng hỗ trợ")
    void testConvertCartToOrder_CodDisabled() {
        CreateOrderRequest req = new CreateOrderRequest();
        req.setShopId(sampleShop.getId());
        req.setAddressId(sampleAddress.getId());
        req.setPaymentMethod("COD");

        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(sampleAddress.getId(), sampleBuyer.getId()))
                .thenReturn(Optional.of(sampleAddress));
        when(cartRepository.findByUserIdWithItems(sampleBuyer.getId())).thenReturn(Optional.of(sampleCart));

        CustomException ex = assertThrows(CustomException.class, () -> orderService.convertCartToOrder(accountId, req));
        assertTrue(ex.getMessage().contains("COD"));
    }

    @Test
    @DisplayName("convertCartToOrder với VNPAY và áp dụng Voucher đôi (Shop + Sàn)")
    void testConvertCartToOrder_VnpayWithVouchers() {
        CreateOrderRequest req = new CreateOrderRequest();
        req.setShopId(sampleShop.getId());
        req.setAddressId(sampleAddress.getId());
        req.setPaymentMethod("VNPAY");
        req.setShopVoucherCode("SHOP10");
        req.setPlatformVoucherCode("PLAT20");

        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(sampleAddress.getId(), sampleBuyer.getId()))
                .thenReturn(Optional.of(sampleAddress));
        when(cartRepository.findByUserIdWithItems(sampleBuyer.getId())).thenReturn(Optional.of(sampleCart));
        when(shippingService.quoteFee(any(), any(), any(), any())).thenReturn(BigDecimal.valueOf(25000));
        when(commissionCalculationService.calculateFinalRate(any(), any(), any())).thenReturn(BigDecimal.valueOf(4.0));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            if (o.getId() == null) o.setId(UUID.randomUUID());
            return o;
        });
        when(productVariantRepository.findById(sampleVariant.getId())).thenReturn(Optional.of(sampleVariant));

        OrderResponse res = orderService.convertCartToOrder(accountId, req);
        assertNotNull(res);
        assertEquals(OrderStatus.PENDING_PAYMENT, res.getStatus());
        assertEquals(PaymentMethod.VNPAY.name(), res.getPaymentMethod());
        verify(voucherService).applyVouchersToOrder(any(Order.class), eq("SHOP10"), eq("PLAT20"));
        verify(cartItemRepository).save(any(CartItem.class));
    }

    @Test
    @DisplayName("convertCartToOrder với Voucher đơn lẻ")
    void testConvertCartToOrder_SingleVoucher() {
        CreateOrderRequest req = new CreateOrderRequest();
        req.setShopId(sampleShop.getId());
        req.setAddressId(sampleAddress.getId());
        req.setPaymentMethod("WALLET");
        req.setVoucherCode("GIAM50K");

        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(sampleAddress.getId(), sampleBuyer.getId()))
                .thenReturn(Optional.of(sampleAddress));
        when(cartRepository.findByUserIdWithItems(sampleBuyer.getId())).thenReturn(Optional.of(sampleCart));
        when(shippingService.quoteFee(any(), any(), any(), any())).thenReturn(BigDecimal.valueOf(20000));
        when(commissionCalculationService.calculateFinalRate(any(), any(), any())).thenReturn(BigDecimal.valueOf(3.0));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            if (o.getId() == null) o.setId(UUID.randomUUID());
            return o;
        });
        when(productVariantRepository.findById(sampleVariant.getId())).thenReturn(Optional.of(sampleVariant));

        OrderResponse res = orderService.convertCartToOrder(accountId, req);
        assertNotNull(res);
        verify(voucherService).applyVoucherToOrder(any(Order.class), eq("GIAM50K"));
    }

    @Test
    @DisplayName("convertCartToOrder không có variant, trừ kho trực tiếp từ Product")
    void testConvertCartToOrder_NoVariant() {
        sampleCartItem.setVariantId(null);
        sampleProduct.setQuantity(20);
        sampleProduct.setSold(5);

        CreateOrderRequest req = new CreateOrderRequest();
        req.setShopId(sampleShop.getId());
        req.setAddressId(sampleAddress.getId());
        req.setPaymentMethod("WALLET");

        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(sampleAddress.getId(), sampleBuyer.getId()))
                .thenReturn(Optional.of(sampleAddress));
        when(cartRepository.findByUserIdWithItems(sampleBuyer.getId())).thenReturn(Optional.of(sampleCart));
        when(shippingService.quoteFee(any(), any(), any(), any())).thenReturn(BigDecimal.valueOf(15000));
        when(commissionCalculationService.calculateFinalRate(any(), any(), any())).thenReturn(BigDecimal.valueOf(5.0));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            if (o.getId() == null) o.setId(UUID.randomUUID());
            return o;
        });

        OrderResponse res = orderService.convertCartToOrder(accountId, req);
        assertNotNull(res);
        assertEquals(18, sampleProduct.getQuantity()); // 20 - 2 = 18
        assertEquals(7, sampleProduct.getSold()); // 5 + 2 = 7
    }

    @Test
    @DisplayName("convertCartToOrder ném lỗi khi Shop bị CLOSED")
    void testConvertCartToOrder_ShopClosed() {
        sampleShop.setStatus(ShopStatus.CLOSED);
        CreateOrderRequest req = new CreateOrderRequest();
        req.setShopId(sampleShop.getId());

        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));

        CustomException ex = assertThrows(CustomException.class, () -> orderService.convertCartToOrder(accountId, req));
        assertTrue(ex.getMessage().contains("đã đóng cửa"));
    }

    @Test
    @DisplayName("convertCartToOrder ném lỗi khi giỏ hàng không có sản phẩm của shop")
    void testConvertCartToOrder_CartEmptyForShop() {
        Shop anotherShop = new Shop();
        anotherShop.setId(UUID.randomUUID());
        sampleProduct.setShop(anotherShop);

        CreateOrderRequest req = new CreateOrderRequest();
        req.setShopId(sampleShop.getId());
        req.setAddressId(sampleAddress.getId());

        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(sampleAddress.getId(), sampleBuyer.getId()))
                .thenReturn(Optional.of(sampleAddress));
        when(cartRepository.findByUserIdWithItems(sampleBuyer.getId())).thenReturn(Optional.of(sampleCart));

        CustomException ex = assertThrows(CustomException.class, () -> orderService.convertCartToOrder(accountId, req));
        assertTrue(ex.getMessage().contains("There's no items in this cart from the shop"));
    }

    @Test
    @DisplayName("convertCartToOrder ném lỗi khi sản phẩm chưa PUBLISHED hoặc bị xóa")
    void testConvertCartToOrder_ProductNotPublished() {
        sampleProduct.setStatus(ProductStatus.DRAFT);

        CreateOrderRequest req = new CreateOrderRequest();
        req.setShopId(sampleShop.getId());
        req.setAddressId(sampleAddress.getId());

        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(sampleAddress.getId(), sampleBuyer.getId()))
                .thenReturn(Optional.of(sampleAddress));
        when(cartRepository.findByUserIdWithItems(sampleBuyer.getId())).thenReturn(Optional.of(sampleCart));

        CustomException ex = assertThrows(CustomException.class, () -> orderService.convertCartToOrder(accountId, req));
        assertTrue(ex.getMessage().contains("không khả dụng để thanh toán"));
    }

    @Test
    @DisplayName("convertCartToOrder ném lỗi khi số lượng tồn kho biến thể không đủ")
    void testConvertCartToOrder_InsufficientVariantStock() {
        sampleVariant.setStock(1);
        sampleCartItem.setQuantity(5);

        CreateOrderRequest req = new CreateOrderRequest();
        req.setShopId(sampleShop.getId());
        req.setAddressId(sampleAddress.getId());
        req.setPaymentMethod("WALLET");

        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(sampleAddress.getId(), sampleBuyer.getId()))
                .thenReturn(Optional.of(sampleAddress));
        when(cartRepository.findByUserIdWithItems(sampleBuyer.getId())).thenReturn(Optional.of(sampleCart));
        when(productVariantRepository.findById(sampleVariant.getId())).thenReturn(Optional.of(sampleVariant));

        CustomException ex = assertThrows(CustomException.class, () -> orderService.convertCartToOrder(accountId, req));
        assertTrue(ex.getMessage().contains("không đủ số lượng"));
    }

    @Test
    @DisplayName("convertCartToOrder ném lỗi khi số lượng tồn kho sản phẩm gốc không đủ")
    void testConvertCartToOrder_InsufficientProductStock() {
        sampleCartItem.setVariantId(null);
        sampleProduct.setQuantity(1);
        sampleCartItem.setQuantity(5);

        CreateOrderRequest req = new CreateOrderRequest();
        req.setShopId(sampleShop.getId());
        req.setAddressId(sampleAddress.getId());
        req.setPaymentMethod("WALLET");

        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(sampleAddress.getId(), sampleBuyer.getId()))
                .thenReturn(Optional.of(sampleAddress));
        when(cartRepository.findByUserIdWithItems(sampleBuyer.getId())).thenReturn(Optional.of(sampleCart));

        CustomException ex = assertThrows(CustomException.class, () -> orderService.convertCartToOrder(accountId, req));
        assertTrue(ex.getMessage().contains("không đủ số lượng"));
    }

    @Test
    @DisplayName("convertCartToOrder ném lỗi khi phương thức thanh toán không hợp lệ")
    void testConvertCartToOrder_InvalidPaymentMethod() {
        CreateOrderRequest req = new CreateOrderRequest();
        req.setShopId(sampleShop.getId());
        req.setAddressId(sampleAddress.getId());
        req.setPaymentMethod("CRYPTO_PAY");

        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(sampleAddress.getId(), sampleBuyer.getId()))
                .thenReturn(Optional.of(sampleAddress));
        when(cartRepository.findByUserIdWithItems(sampleBuyer.getId())).thenReturn(Optional.of(sampleCart));

        CustomException ex = assertThrows(CustomException.class, () -> orderService.convertCartToOrder(accountId, req));
        assertTrue(ex.getMessage().contains("Phương thức thanh toán không hợp lệ"));
    }

    @Test
    @DisplayName("retryCreateGhnOrder thành công")
    void testRetryCreateGhnOrder_Success() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setShop(sampleShop);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setGhnOrderCode(null);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleSellerUser));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        GHNCreateOrderRequest ghnReq = mock(GHNCreateOrderRequest.class);
        GHNCreateOrderResponse ghnResp = mock(GHNCreateOrderResponse.class);
        when(ghnResp.getOrderCode()).thenReturn("GHN-SUCCESS-123");
        when(shippingService.build(order)).thenReturn(ghnReq);
        when(ghnClient.createOrder(ghnReq)).thenReturn(ghnResp);

        OrderResponse res = orderService.retryCreateGhnOrder(orderId, accountId);
        assertNotNull(res);
        assertEquals("GHN-SUCCESS-123", order.getGhnOrderCode());
    }

    @Test
    @DisplayName("retryCreateGhnOrder ném lỗi nếu không phải chủ shop")
    void testRetryCreateGhnOrder_NotShopOwner() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setShop(sampleShop);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        CustomException ex = assertThrows(CustomException.class, () -> orderService.retryCreateGhnOrder(orderId, accountId));
        assertTrue(ex.getMessage().contains("You don't have any permissions"));
    }

    @Test
    @DisplayName("retryCreateGhnOrder ném lỗi nếu đơn đã có mã vận đơn GHN")
    void testRetryCreateGhnOrder_AlreadyHasCode() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setShop(sampleShop);
        order.setGhnOrderCode("GHN-EXISTS-999");

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleSellerUser));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        CustomException ex = assertThrows(CustomException.class, () -> orderService.retryCreateGhnOrder(orderId, accountId));
        assertTrue(ex.getMessage().contains("already has a GHN tracking code"));
    }

    @Test
    @DisplayName("retryCreateGhnOrder ném lỗi nếu trạng thái đơn không phải CONFIRMED/PROCESSING/SHIPPING")
    void testRetryCreateGhnOrder_InvalidStatus() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setShop(sampleShop);
        order.setStatus(OrderStatus.DELIVERED);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleSellerUser));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        CustomException ex = assertThrows(CustomException.class, () -> orderService.retryCreateGhnOrder(orderId, accountId));
        assertTrue(ex.getMessage().contains("CONFIRMED/PROCESSING/SHIPPING"));
    }

    @Test
    @DisplayName("retryCreateGhnOrder xử lý ngoại lệ từ ghnClient mà không làm sập tiến trình")
    void testRetryCreateGhnOrder_ClientExceptionHandled() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setShop(sampleShop);
        order.setStatus(OrderStatus.PROCESSING);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleSellerUser));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        when(shippingService.build(order)).thenThrow(new RuntimeException("GHN service unavailable"));

        OrderResponse res = orderService.retryCreateGhnOrder(orderId, accountId);
        assertNotNull(res);
        assertNull(order.getGhnOrderCode());
    }

    @Test
    @DisplayName("setGhnOrderCodeManually thành công với mã hợp lệ")
    void testSetGhnOrderCodeManually_Success() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setShop(sampleShop);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleSellerUser));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse res = orderService.setGhnOrderCodeManually(orderId, "  GHN-MANUAL-1234  ", accountId);
        assertNotNull(res);
        assertEquals("GHN-MANUAL-1234", order.getGhnOrderCode());
    }

    @Test
    @DisplayName("setGhnOrderCodeManually ném lỗi khi người dùng không phải chủ shop")
    void testSetGhnOrderCodeManually_NotShopOwner() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setShop(sampleShop);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        CustomException ex = assertThrows(CustomException.class, () -> orderService.setGhnOrderCodeManually(orderId, "GHN-123", accountId));
        assertTrue(ex.getMessage().contains("You don't have permission"));
    }

    @Test
    @DisplayName("setGhnOrderCodeManually ném lỗi khi mã vận đơn trống")
    void testSetGhnOrderCodeManually_EmptyCode() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setShop(sampleShop);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleSellerUser));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        CustomException ex = assertThrows(CustomException.class, () -> orderService.setGhnOrderCodeManually(orderId, "   ", accountId));
        assertTrue(ex.getMessage().contains("must not be empty"));
    }

    @Test
    @DisplayName("autoReceiveAndRelease giải ngân thành công khi đủ điều kiện")
    void testAutoReceiveAndRelease_Success() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setStatus(OrderStatus.DELIVERED);
        order.setReceivedByBuyer(false);

        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));
        when(orderDisputeService.hasActiveDispute(orderId)).thenReturn(false);

        orderService.autoReceiveAndRelease(orderId);

        assertTrue(order.isReceivedByBuyer());
        assertNotNull(order.getReceivedAt());
        verify(escrowService).releaseByOrder(orderId);
        verify(orderRepository).save(order);
    }

    @Test
    @DisplayName("autoReceiveAndRelease không làm gì nếu buyer đã nhận hoặc chưa DELIVERED hoặc có dispute")
    void testAutoReceiveAndRelease_NoOps() {
        UUID orderId = UUID.randomUUID();

        // 1. Đã nhận
        Order o1 = new Order();
        o1.setId(orderId);
        o1.setReceivedByBuyer(true);
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(o1));
        orderService.autoReceiveAndRelease(orderId);
        verify(escrowService, never()).releaseByOrder(any());

        // 2. Chưa DELIVERED
        Order o2 = new Order();
        o2.setId(orderId);
        o2.setStatus(OrderStatus.SHIPPING);
        o2.setReceivedByBuyer(false);
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(o2));
        orderService.autoReceiveAndRelease(orderId);
        verify(escrowService, never()).releaseByOrder(any());

        // 3. Có dispute
        Order o3 = new Order();
        o3.setId(orderId);
        o3.setStatus(OrderStatus.DELIVERED);
        o3.setReceivedByBuyer(false);
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(o3));
        when(orderDisputeService.hasActiveDispute(orderId)).thenReturn(true);
        orderService.autoReceiveAndRelease(orderId);
        verify(escrowService, never()).releaseByOrder(any());
    }

    @Test
    @DisplayName("autoMarkReceivedOrders quét các đơn quá hạn và kích hoạt giải ngân")
    void testAutoMarkReceivedOrders_Scheduled() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();

        Order o1 = new Order();
        o1.setId(id1);
        o1.setStatus(OrderStatus.DELIVERED);
        o1.setReceivedByBuyer(false);

        when(orderRepository.findIdsByStatusAndReceivedByBuyerFalseAndDeliveredAtBefore(eq(OrderStatus.DELIVERED), any()))
                .thenReturn(List.of(id1, id2));

        when(orderRepository.findByIdForUpdate(id1)).thenReturn(Optional.of(o1));
        when(orderRepository.findByIdForUpdate(id2)).thenReturn(Optional.empty()); // Sẽ throw exception và được catch

        assertDoesNotThrow(() -> orderService.autoMarkReceivedOrders());
        verify(escrowService).releaseByOrder(id1);
    }

    @Test
    @DisplayName("markReceivedByBuyer xác nhận nhận hàng, giải ngân tiền ký quỹ và chuyển COMPLETED")
    void testMarkReceivedByBuyer_Success() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setUser(sampleBuyer);
        order.setStatus(OrderStatus.DELIVERED);
        order.setReceivedByBuyer(false);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));
        when(orderDisputeService.hasActiveDispute(orderId)).thenReturn(false);

        orderService.markReceivedByBuyer(orderId, accountId);

        assertTrue(order.isReceivedByBuyer());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
        assertNotNull(order.getReceivedAt());
        verify(escrowService).releaseByOrder(orderId);
        verify(orderRepository).save(order);
    }

    @Test
    @DisplayName("markReceivedByBuyer ném lỗi nếu người dùng không phải người mua")
    void testMarkReceivedByBuyer_NotBuyer() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setUser(sampleBuyer);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleSellerUser));
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));

        CustomException ex = assertThrows(CustomException.class, () -> orderService.markReceivedByBuyer(orderId, accountId));
        assertTrue(ex.getMessage().contains("You don't have permission"));
    }

    @Test
    @DisplayName("markReceivedByBuyer ném lỗi nếu đơn hàng chưa ở trạng thái DELIVERED")
    void testMarkReceivedByBuyer_NotDelivered() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setUser(sampleBuyer);
        order.setStatus(OrderStatus.SHIPPING);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));

        CustomException ex = assertThrows(CustomException.class, () -> orderService.markReceivedByBuyer(orderId, accountId));
        assertTrue(ex.getMessage().contains("Chỉ có thể xác nhận khi đơn hàng ở trạng thái đã giao"));
    }

    @Test
    @DisplayName("markReceivedByBuyer ném lỗi nếu đơn đã hoàn tất hoặc có khiếu nại")
    void testMarkReceivedByBuyer_AlreadyCompletedOrDisputed() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setUser(sampleBuyer);
        order.setStatus(OrderStatus.COMPLETED);
        order.setReceivedByBuyer(true);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));

        CustomException ex1 = assertThrows(CustomException.class, () -> orderService.markReceivedByBuyer(orderId, accountId));
        assertTrue(ex1.getMessage().contains("Chỉ có thể xác nhận khi đơn hàng ở trạng thái đã giao"));

        order.setStatus(OrderStatus.DELIVERED);
        order.setReceivedByBuyer(true);
        CustomException ex2 = assertThrows(CustomException.class, () -> orderService.markReceivedByBuyer(orderId, accountId));
        assertTrue(ex2.getMessage().contains("Đơn hàng đã được xác nhận hoàn tất trước đó"));

        order.setReceivedByBuyer(false);
        when(orderDisputeService.hasActiveDispute(orderId)).thenReturn(true);
        CustomException ex3 = assertThrows(CustomException.class, () -> orderService.markReceivedByBuyer(orderId, accountId));
        assertTrue(ex3.getMessage().contains("Đơn hàng đang trong quá trình khiếu nại hoặc tranh chấp"));
    }

    @Test
    @DisplayName("updateOrderStatus cho phép Seller hủy đơn CONFIRMED, hoàn tiền Escrow và phục hồi kho")
    void testUpdateOrderStatus_Cancel() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setOrderNumber("ORD-999");
        order.setShop(sampleShop);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setPaymentMethod(PaymentMethod.WALLET);
        order.setStockDeducted(true);
        order.setSubtotal(BigDecimal.valueOf(40000000));
        order.setTotal(BigDecimal.valueOf(40000000));

        OrderItem item = new OrderItem();
        item.setProduct(sampleProduct);
        item.setQuantity(2);
        item.setUnitPrice(BigDecimal.valueOf(20000000));
        item.setTotalPrice(BigDecimal.valueOf(40000000));
        order.setItems(new HashSet<>(List.of(item)));

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleSellerUser));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse res = orderService.updateOrderStatus(accountId, orderId, "CANCELLED");
        assertEquals(OrderStatus.CANCELLED, res.getStatus());
        assertEquals(17, sampleProduct.getQuantity()); // 15 + 2 = 17
        verify(escrowService).refundByOrder(eq(orderId), anyString());
        verify(voucherService).rollbackVoucherUsage(order);
    }

    @Test
    @DisplayName("updateOrderStatus hủy đơn VNPAY đã CONFIRMED và hủy đơn vận chuyển GHN")
    void testUpdateOrderStatus_CancelVnpayAndGhn() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setOrderNumber("ORD-VNPAY");
        order.setShop(sampleShop);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setPaymentMethod(PaymentMethod.VNPAY);
        order.setGhnOrderCode("GHN-TO-CANCEL");
        order.setItems(new HashSet<>());

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleSellerUser));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse res = orderService.updateOrderStatus(accountId, orderId, "CANCELLED");
        assertEquals(OrderStatus.CANCELLED, res.getStatus());
        verify(escrowService).refundByOrder(eq(orderId), anyString());
        verify(ghnClient).cancelOrder("GHN-TO-CANCEL");
    }

    @Test
    @DisplayName("updateOrderStatus hủy đơn GHN lỗi không làm sập giao dịch")
    void testUpdateOrderStatus_CancelGhnClientErrorHandled() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setShop(sampleShop);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setGhnOrderCode("GHN-FAIL-CANCEL");
        order.setItems(new HashSet<>());

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleSellerUser));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("GHN Timeout")).when(ghnClient).cancelOrder(anyString());

        assertDoesNotThrow(() -> orderService.updateOrderStatus(accountId, orderId, "CANCELLED"));
    }

    @Test
    @DisplayName("updateOrderStatus luồng chuyển tiếp hợp lệ: CONFIRMED -> PROCESSING -> SHIPPING -> DELIVERED")
    void testUpdateOrderStatus_ValidTransitions() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setShop(sampleShop);
        order.setStatus(OrderStatus.CONFIRMED);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleSellerUser));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // 1. CONFIRMED -> PROCESSING
        OrderResponse r1 = orderService.updateOrderStatus(accountId, orderId, "PROCESSING");
        assertEquals(OrderStatus.PROCESSING, r1.getStatus());

        // 2. PROCESSING -> SHIPPING
        OrderResponse r2 = orderService.updateOrderStatus(accountId, orderId, "SHIPPING");
        assertEquals(OrderStatus.SHIPPING, r2.getStatus());

        // 3. SHIPPING -> DELIVERED
        OrderResponse r3 = orderService.updateOrderStatus(accountId, orderId, "DELIVERED");
        assertEquals(OrderStatus.DELIVERED, r3.getStatus());
        verify(commissionService).createCommission(orderId);
    }

    @Test
    @DisplayName("updateOrderStatus ném lỗi khi chuyển trạng thái bất hợp lệ")
    void testUpdateOrderStatus_InvalidTransitions() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setShop(sampleShop);
        order.setStatus(OrderStatus.CONFIRMED);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleSellerUser));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        // CONFIRMED không thể nhảy vọt sang DELIVERED
        CustomException ex1 = assertThrows(CustomException.class, () -> orderService.updateOrderStatus(accountId, orderId, "DELIVERED"));
        assertTrue(ex1.getMessage().contains("Invalid transition"));

        // Mã trạng thái không tồn tại
        CustomException ex2 = assertThrows(CustomException.class, () -> orderService.updateOrderStatus(accountId, orderId, "INVALID_STATUS"));
        assertTrue(ex2.getMessage().contains("Invalid status"));

        // Trạng thái SHIPPING không thể CANCELLED
        order.setStatus(OrderStatus.SHIPPING);
        CustomException ex3 = assertThrows(CustomException.class, () -> orderService.updateOrderStatus(accountId, orderId, "CANCELLED"));
        assertTrue(ex3.getMessage().contains("Can not cancelOrder with status SHIPPING"));
    }

    @Test
    @DisplayName("updateOrderStatus ném lỗi khi người dùng không phải chủ shop")
    void testUpdateOrderStatus_NotShopOwner() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setShop(sampleShop);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        CustomException ex = assertThrows(CustomException.class, () -> orderService.updateOrderStatus(accountId, orderId, "PROCESSING"));
        assertTrue(ex.getMessage().contains("You don't have any permission"));
    }

    @Test
    @DisplayName("getShopRanking trả về danh sách xếp hạng doanh thu chính xác")
    void testGetShopRanking() {
        UUID shop1 = UUID.randomUUID();
        UUID shop2 = UUID.randomUUID();

        List<Object[]> rows = List.of(
                new Object[]{shop1, "Shop Top 1", BigDecimal.valueOf(50000000), 100L},
                new Object[]{shop2, "Shop Top 2", null, 0L}
        );

        when(orderRepository.getShopRankingByRevenue()).thenReturn(rows);

        List<ShopRankingItem> rankings = orderService.getShopRanking();
        assertEquals(2, rankings.size());

        assertEquals(1, rankings.get(0).getRank());
        assertEquals("Shop Top 1", rankings.get(0).getShopName());
        assertEquals(BigDecimal.valueOf(50000000), rankings.get(0).getTotalRevenue());
        assertEquals(100L, rankings.get(0).getOrderCount());

        assertEquals(2, rankings.get(1).getRank());
        assertEquals("Shop Top 2", rankings.get(1).getShopName());
        assertEquals(BigDecimal.ZERO, rankings.get(1).getTotalRevenue());
        assertEquals(0L, rankings.get(1).getOrderCount());
    }

    @Test
    @DisplayName("retryCreateGhnOrder va setGhnOrderCodeManually quan ly ma van don GHN")
    void testGhnOrderCodeManagement() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setShop(sampleShop);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setItems(new HashSet<>());
        GHNCreateOrderRequest ghnReq = new GHNCreateOrderRequest();
        when(shippingService.build(order)).thenReturn(ghnReq);

        User otherUser = new User();
        otherUser.setId(UUID.randomUUID());

        // 1. retryCreateGhnOrder - validations
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleSellerUser));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        // not shop owner
        order.getShop().setUser(otherUser);
        assertThrows(CustomException.class, () -> orderService.retryCreateGhnOrder(orderId, accountId));

        // already has code
        order.getShop().setUser(sampleSellerUser);
        order.setGhnOrderCode("GHN-12345");
        assertThrows(CustomException.class, () -> orderService.retryCreateGhnOrder(orderId, accountId));

        // invalid status
        order.setGhnOrderCode(null);
        order.setStatus(OrderStatus.CANCELLED);
        assertThrows(CustomException.class, () -> orderService.retryCreateGhnOrder(orderId, accountId));

        // success
        order.setStatus(OrderStatus.CONFIRMED);
        GHNCreateOrderResponse ghnRes = new GHNCreateOrderResponse();
        ghnRes.setOrderCode("GHN-RETRY-OK");
        when(ghnClient.createOrder(any())).thenReturn(ghnRes);
        when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse res = orderService.retryCreateGhnOrder(orderId, accountId);
        assertNotNull(res);
        assertEquals("GHN-RETRY-OK", order.getGhnOrderCode());

        // 2. setGhnOrderCodeManually
        assertThrows(CustomException.class, () -> orderService.setGhnOrderCodeManually(orderId, "", accountId));
        OrderResponse manualRes = orderService.setGhnOrderCodeManually(orderId, "GHN-MANUAL-888", accountId);
        assertNotNull(manualRes);
        assertEquals("GHN-MANUAL-888", order.getGhnOrderCode());
    }

    @Test
    @DisplayName("markReceivedByBuyer va autoMarkReceivedOrders cap nhat nhan hang va giai ngan escrow")
    void testMarkReceivedAndAutoRelease() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setOrderNumber("ORD-REC-1");
        order.setUser(sampleBuyer);
        order.setShop(sampleShop);
        order.setStatus(OrderStatus.DELIVERED);
        order.setReceivedByBuyer(false);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(order));
        when(orderDisputeService.hasActiveDispute(orderId)).thenReturn(false);

        // 1. Success markReceivedByBuyer
        orderService.markReceivedByBuyer(orderId, accountId);
        assertTrue(order.isReceivedByBuyer());
        assertEquals(OrderStatus.COMPLETED, order.getStatus());
        verify(escrowService).releaseByOrder(orderId);

        // 2. Already completed throws
        assertThrows(CustomException.class, () -> orderService.markReceivedByBuyer(orderId, accountId));

        // 3. Status not DELIVERED throws
        order.setStatus(OrderStatus.SHIPPING);
        order.setReceivedByBuyer(false);
        assertThrows(CustomException.class, () -> orderService.markReceivedByBuyer(orderId, accountId));

        // 4. Active dispute throws
        order.setStatus(OrderStatus.DELIVERED);
        when(orderDisputeService.hasActiveDispute(orderId)).thenReturn(true);
        assertThrows(CustomException.class, () -> orderService.markReceivedByBuyer(orderId, accountId));

        // 5. autoMarkReceivedOrders cron scan
        when(orderRepository.findIdsByStatusAndReceivedByBuyerFalseAndDeliveredAtBefore(eq(OrderStatus.DELIVERED), any()))
                .thenReturn(List.of(orderId));
        when(orderDisputeService.hasActiveDispute(orderId)).thenReturn(false);
        order.setStatus(OrderStatus.DELIVERED);
        order.setReceivedByBuyer(false);

        orderService.autoMarkReceivedOrders();
        assertTrue(order.isReceivedByBuyer());
    }

    @Test
    @DisplayName("updateOrderStatus CANCELLED hoan ton kho san pham va bien the, huy van don GHN")
    void testUpdateOrderStatus_CancelAndRestoreStock() {
        UUID orderId = UUID.randomUUID();
        Order order = new Order();
        order.setId(orderId);
        order.setOrderNumber("ORD-CANCEL-STOCK");
        order.setShop(sampleShop);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setStockDeducted(true);
        order.setGhnOrderCode("GHN-CANCEL-ME");
        order.setPaymentMethod(PaymentMethod.WALLET);

        Product p = new Product();
        p.setId(UUID.randomUUID());
        p.setQuantity(10);

        UUID varId = UUID.randomUUID();
        ProductVariant variant = new ProductVariant();
        variant.setId(varId);
        variant.setStock(5);

        order.setSubtotal(new BigDecimal("200000"));
        order.setTotal(new BigDecimal("200000"));
        order.setShippingFee(BigDecimal.ZERO);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setShopDiscountAmount(BigDecimal.ZERO);

        OrderItem item = new OrderItem();
        item.setProduct(p);
        item.setVariantId(varId);
        item.setQuantity(2);
        item.setUnitPrice(new BigDecimal("100000"));
        item.setProductName("Test Product");
        item.setTotalPrice(new BigDecimal("200000"));

        order.setItems(Set.of(item));

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleSellerUser));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(productVariantRepository.findById(varId)).thenReturn(Optional.of(variant));
        when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse res = orderService.updateOrderStatus(accountId, orderId, "CANCELLED");
        assertNotNull(res);
        assertEquals(OrderStatus.CANCELLED, res.getStatus());
        assertFalse(order.isStockDeducted());
        assertEquals(12, p.getQuantity());
        assertEquals(7, variant.getStock());
        verify(ghnClient).cancelOrder("GHN-CANCEL-ME");
        verify(escrowService).refundByOrder(eq(orderId), any());
    }

    @Test
    @DisplayName("Cac ngoai le UserNotFound va OrderNotFound trong OrderService")
    void testOrderNotFoundAndUserNotFoundExceptions() {
        UUID orderId = UUID.randomUUID();

        // 1. User not found in retryCreateGhnOrder
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> orderService.retryCreateGhnOrder(orderId, accountId));

        // 2. Order not found in retryCreateGhnOrder
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleSellerUser));
        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> orderService.retryCreateGhnOrder(orderId, accountId));

        // 3. User not found in setGhnOrderCodeManually
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> orderService.setGhnOrderCodeManually(orderId, "GHN", accountId));

        // 4. Order not found in setGhnOrderCodeManually
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleSellerUser));
        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> orderService.setGhnOrderCodeManually(orderId, "GHN", accountId));

        // 5. User not found in markReceivedByBuyer
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> orderService.markReceivedByBuyer(orderId, accountId));

        // 6. Order not found in markReceivedByBuyer
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> orderService.markReceivedByBuyer(orderId, accountId));

        // 7. User not found in updateOrderStatus
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> orderService.updateOrderStatus(accountId, orderId, "CONFIRMED"));

        // 8. Order not found in updateOrderStatus
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleSellerUser));
        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> orderService.updateOrderStatus(accountId, orderId, "CONFIRMED"));

        // 9. convertCartToOrder: Shop not found, User not found, Address not found, Cart not found
        CreateOrderRequest req = new CreateOrderRequest();
        req.setShopId(UUID.randomUUID());
        req.setAddressId(UUID.randomUUID());

        when(shopRepository.findById(req.getShopId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> orderService.convertCartToOrder(accountId, req));

        when(shopRepository.findById(req.getShopId())).thenReturn(Optional.of(sampleShop));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> orderService.convertCartToOrder(accountId, req));

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleBuyer));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(req.getAddressId(), sampleBuyer.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> orderService.convertCartToOrder(accountId, req));

        UserAddress addr = new UserAddress();
        addr.setId(req.getAddressId());
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(req.getAddressId(), sampleBuyer.getId())).thenReturn(Optional.of(addr));
        when(cartRepository.findByUserIdWithItems(sampleBuyer.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> orderService.convertCartToOrder(accountId, req));

        // 10. getShopRanking with null orderCount & generateOrderNumber collision
        List<Object[]> rows = java.util.Collections.singletonList(new Object[]{UUID.randomUUID(), "Shop Null Count", null, null});
        when(orderRepository.getShopRankingByRevenue()).thenReturn(rows);
        assertEquals(0L, orderService.getShopRanking().get(0).getOrderCount());
    }
}
