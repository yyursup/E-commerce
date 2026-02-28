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
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.order.repository.OrderItemsRepository;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.platform.service.PlatformSettingService;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.shipping.service.ShippingService;
import com.marketplace.ecommerce.shipping.usecase.GHNClient;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
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
    private PlatformSettingService platformSettingService;
    @Mock
    private EscrowService escrowService;

    @InjectMocks
    private OrderServiceImpl orderService;

    private UUID accountId;
    private User user;
    private Shop shop;
    private Order order;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        user = new User();
        user.setId(UUID.randomUUID());
        
        shop = new Shop();
        shop.setId(UUID.randomUUID());
        shop.setUser(user);

        order = new Order();
        order.setId(UUID.randomUUID());
        order.setUser(user);
        order.setShop(shop);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setItems(new HashSet<>());
    }

    @Test
    void retryCreateGhnOrder_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenReturn(order);

        OrderResponse response = orderService.retryCreateGhnOrder(order.getId(), accountId);

        assertNotNull(response);
        verify(orderRepository).save(any());
    }

    @Test
    void retryCreateGhnOrder_NotPermission() {
        User otherUser = new User();
        otherUser.setId(UUID.randomUUID());
        shop.setUser(otherUser);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));

        assertThrows(CustomException.class, () -> orderService.retryCreateGhnOrder(order.getId(), accountId));
    }

    @Test
    void setGhnOrderCodeManually_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenReturn(order);

        OrderResponse response = orderService.setGhnOrderCodeManually(order.getId(), "GHN123", accountId);

        assertNotNull(response);
        assertEquals("GHN123", order.getGhnOrderCode());
    }

    @Test
    void markReceivedByBuyer_Success() {
        order.setStatus(OrderStatus.DELIVERED);
        order.setReceivedByBuyer(false);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(orderRepository.findByIdAndUserId(order.getId(), user.getId())).thenReturn(Optional.of(order));

        orderService.markReceivedByBuyer(order.getId(), accountId);

        assertTrue(order.isReceivedByBuyer());
        verify(escrowService).releaseByOrder(order.getId());
        verify(orderRepository).save(order);
    }

    @Test
    void updateOrderStatus_CancelOrder_ReducesStock() {
        OrderItem item = new OrderItem();
        Product product = new Product();
        product.setQuantity(10);
        item.setProduct(product);
        item.setQuantity(2);
        order.setItems(new HashSet<>(Collections.singletonList(item)));
        order.setStatus(OrderStatus.PENDING_PAYMENT);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenReturn(order);

        orderService.updateOrderStatus(accountId, order.getId(), "CANCELLED");

        assertEquals(12, product.getQuantity());
        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        verify(productRepository).save(product);
    }

    @Test
    void convertCartToOrder_Success() {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setShopId(shop.getId());
        request.setAddressId(UUID.randomUUID());
        
        UserAddress addr = new UserAddress();
        addr.setDistrictId(1);
        addr.setWardCode("2");
        
        Cart cart = new Cart();
        CartItem cartItem = new CartItem();
        Product product = new Product();
        product.setShop(shop);
        product.setBasePrice(BigDecimal.valueOf(100));
        product.setQuantity(10);
        cartItem.setProduct(product);
        cartItem.setQuantity(2);
        cartItem.setDeleted(false);
        cart.setItems(new HashSet<>(Collections.singletonList(cartItem)));

        when(shopRepository.findById(shop.getId())).thenReturn(Optional.of(shop));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(any(), any())).thenReturn(Optional.of(addr));
        when(cartRepository.findByUserIdWithItems(user.getId())).thenReturn(Optional.of(cart));
        when(shippingService.quoteFee(any(), any(), anyInt(), anyString())).thenReturn(BigDecimal.valueOf(20));
        when(platformSettingService.getCommissionRate()).thenReturn(BigDecimal.valueOf(5));
        when(orderRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

        OrderResponse response = orderService.convertCartToOrder(accountId, request);

        assertNotNull(response);
        assertEquals(BigDecimal.valueOf(220).setScale(2), response.getTotalAmount().setScale(2));
        assertTrue(cartItem.getDeleted());
    }
}
