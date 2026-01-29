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
import com.marketplace.ecommerce.order.dto.request.QuoteRequest;
import com.marketplace.ecommerce.order.dto.response.CheckoutConfirmResponse;
import com.marketplace.ecommerce.order.dto.response.OrderResponse;
import com.marketplace.ecommerce.order.dto.response.QuoteResponse;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.order.repository.OrderItemsRepository;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.service.OrderService;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.shipping.dto.request.GHNCreateOrderRequest;
import com.marketplace.ecommerce.shipping.dto.response.GHNCreateOrderResponse;
import com.marketplace.ecommerce.shipping.service.ShippingService;
import com.marketplace.ecommerce.shipping.usecase.GHNClient;
import com.marketplace.ecommerce.shipping.valueObjects.OrderStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final OrderItemsRepository orderItemsRepository;
    private final CartItemRepository cartItemRepository;
    private final GHNClient ghnClient;
    private final UserAddressRepository userAddressRepository;
    private final ShippingService shippingService;

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(UUID accountId, UUID orderId, String status) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Order not found"));

        if (!order.getShop().getUser().getId().equals(user.getId())) {
            throw new CustomException("You don't have any permission to update this order");
        }

        OrderStatus currentStatus = order.getStatus();
        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(status);
        } catch (Exception e) {
            throw new CustomException("Invalid status: " + status);
        }

        if (newStatus == OrderStatus.CANCELLED &&
                currentStatus != OrderStatus.PENDING_PAYMENT && currentStatus != OrderStatus.CONFIRMED) {
            throw new CustomException("Can not cancelOrder with status " + currentStatus);
        }

        if (newStatus == OrderStatus.CANCELLED) {

            for (OrderItem item : order.getItems()) {
                if (item.getProduct() != null) {
                    Product p = item.getProduct();
                    if (p.getQuantity() != null) {
                        p.setQuantity(p.getQuantity() + item.getQuantity());
                        productRepository.save(p);
                    }
                }
            }

            if (order.getGhnOrderCode() != null && !order.getGhnOrderCode().isEmpty()) {
                try {
                    ghnClient.cancelOrder(order.getGhnOrderCode());
                    log.info("Đã hủy đơn GHN: {}", order.getGhnOrderCode());
                } catch (Exception e) {
                    log.error("Lỗi khi hủy đơn GHN: {}", e.getMessage());
                }
            }
        }

        if (currentStatus == OrderStatus.PENDING_PAYMENT && newStatus == OrderStatus.CONFIRMED) {
            if (order.getGhnOrderCode() == null || order.getGhnOrderCode().isEmpty()) {
                try {
                    GHNCreateOrderRequest ghnRequest = shippingService.build(order);
                    GHNCreateOrderResponse ghnResponse = ghnClient.createOrder(ghnRequest);
                    order.setGhnOrderCode(ghnResponse.getOrder_code());
                } catch (Exception e) {
                    log.error("Error when create order {}: {}", order.getOrderNumber(), e.getMessage());
                }
            }
        }

        order.setStatus(newStatus);
        order = orderRepository.save(order);

        return OrderResponse.from(order);
    }

    @Override
    public OrderResponse convertCartToOrder(UUID accountId, CreateOrderRequest request) {
        Shop shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new CustomException("Shop not found."));

        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found."));

        UserAddress addr = userAddressRepository
                .findByIdAndUserIdAndDeletedFalse(request.getAddressId(), user.getId())
                .orElseThrow(() -> new CustomException("Address not found."));

        Cart cart = cartRepository.findByUserIdWithItems(user.getId())
                .orElseThrow(() -> new CustomException("Cart not found."));

        List<CartItem> cartItems = findActiveItemByProduct(cart, shop.getId());

        if (cartItems.isEmpty()) {
            throw new CustomException("There's no items in this cart from the shop.");
        }

        BigDecimal subtotal = getBigDecimal(cartItems);

        BigDecimal shippingFee = shippingService.quoteFee(
                shop, cartItems, addr.getDistrictId(), addr.getWardCode()
        );


        String orderNumber = generateOrderNumber();

        Order order = new Order();
        order.setOrderNumber(orderNumber);
        order.setUser(user);
        order.setShop(shop);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setShippingName(addr.getReceiverName());
        order.setShippingPhone(addr.getReceiverPhone());
        order.setShippingAddress(addr.getAddressLine());
        order.setShippingCity(addr.getCity());
        order.setShippingDistrict(addr.getDistrict());
        order.setShippingWard(addr.getWard());
        order.setShippingDistrictId(addr.getDistrictId());
        order.setShippingWardCode(addr.getWardCode());

        order.setNotes(request.getNotes());
        order.setSubtotal(subtotal);
        order.setShippingFee(shippingFee);
        order.calculateTotal();

        order = orderRepository.save(order);

        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();

            if (product.getQuantity() != null) {
                int newStock = product.getQuantity() - cartItem.getQuantity();
                product.setQuantity(newStock);
                productRepository.save(product);
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setProductName(product.getName());
            orderItem.setQuantity(cartItem.getQuantity());
            BigDecimal unitPrice = product.getBasePrice();
            orderItem.setUnitPrice(unitPrice);
            orderItem.calculateTotalPrice();
            order.getItems().add(orderItem);
            orderItemsRepository.save(orderItem);
        }

        for (CartItem cartItem : cartItems) {
            cartItem.setDeleted(true);
            cartItemRepository.save(cartItem);
        }

        return OrderResponse.from(order);
    }

    @NotNull
    private static BigDecimal getBigDecimal(List<CartItem> cartItems) {
        BigDecimal subtotal = BigDecimal.ZERO;

        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();

            if (product.getQuantity() != null && product.getQuantity() < cartItem.getQuantity()) {
                throw new CustomException(
                        "Sản phẩm " + product.getName()
                                + " không đủ số lượng. Còn lại: " + product.getQuantity()
                );
            }

            BigDecimal unitPrice = product.getBasePrice();
            subtotal = subtotal.add(unitPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }
        return subtotal;
    }


    private List<CartItem> findActiveItemByProduct(Cart cart, UUID shopId) {
        return cart.getActiveCartDetails().stream()
                .filter(i -> i.getProduct().getShop().getId().equals(shopId))
                .toList();
    }

    private String generateOrderNumber() {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String baseNumber = "ORD-" + datePrefix + "-";
        int sequence = 1;
        String orderNumber = baseNumber + String.format("%04d", sequence);

        while (orderRepository.findByOrderNumber(orderNumber).isPresent()) {
            sequence++;
            orderNumber = baseNumber + String.format("%04d", sequence);
        }

        return orderNumber;
    }

}
