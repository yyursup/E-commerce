package com.marketplace.ecommerce.order.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.dto.response.OrderResponse;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.service.QueryOrderService;
import com.marketplace.ecommerce.shipping.valueObjects.OrderStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QueryOrderServiceImpl implements QueryOrderService {
    private final OrderRepository orderRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;

    @Override
    public OrderResponse adminGetOrder(UUID orderId, UUID accountId) {
        requireUserByAccountId(accountId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Order not found."));

        return OrderResponse.from(order);
    }

    @Override
    public List<OrderResponse> adminListOrders(UUID accountId, OrderStatus statusOpt) {
        requireUserByAccountId(accountId);

        List<Order> orders = (statusOpt == null)
                ? orderRepository.findAllByOrderByCreatedAtDesc()
                : orderRepository.findByStatusOrderByCreatedAtDesc(statusOpt);

        return orders.stream().map(OrderResponse::from).toList();
    }


    @Override
    public OrderResponse getOrderForUser(UUID orderId, UUID accountId) {
        User user = requireUserByAccountId(accountId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Order not found."));

        if (order.getUser() == null || !order.getUser().getId().equals(user.getId())) {
            throw new CustomException("Forbidden");
        }

        return OrderResponse.from(order);
    }

    @Override
    public OrderResponse getOrderByIdAndShop(UUID orderId, UUID accountShopId) {
        User seller = requireUserByAccountId(accountShopId);
        Shop shop = requireOwnedShop(seller);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Order not found."));

        if (order.getShop() == null || !order.getShop().getId().equals(shop.getId())) {
            throw new CustomException("Order not found.");
        }

        return OrderResponse.from(order);
    }

    @Override
    public List<OrderResponse> listOrdersForUser(UUID accountId, OrderStatus status) {
        User user = requireUserByAccountId(accountId);

        List<Order> orders = (status == null)
                ? orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                : orderRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), status);

        return orders.stream().map(OrderResponse::from).toList();
    }

    @Override
    public List<OrderResponse> listOrdersForShop(UUID accountShopId, OrderStatus status) {
        User seller = requireUserByAccountId(accountShopId);
        Shop shop = requireOwnedShop(seller);

        List<Order> orders = (status == null)
                ? orderRepository.findByShopIdOrderByCreatedAtDesc(shop.getId())
                : orderRepository.findByShopIdAndStatusOrderByCreatedAtDesc(shop.getId(), status);

        return orders.stream().map(OrderResponse::from).toList();
    }

    private User requireUserByAccountId(UUID accountId) {
        return userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found."));
    }

    private Shop requireShop(User user) {
        return shopRepository.findByUserId(user.getId())
                .orElseThrow(() -> new CustomException("Shop not found."));
    }

    private Shop requireOwnedShop(User seller) {
        Shop shop = requireShop(seller);

        if (shop.getUser() == null || !shop.getUser().getId().equals(seller.getId())) {
            throw new CustomException("Forbidden");
        }
        return shop;
    }
}
