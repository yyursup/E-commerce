package com.marketplace.ecommerce.platform.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.platform.dto.CommissionFilterRequest;
import com.marketplace.ecommerce.platform.dto.response.CommissionDetailResponse;
import com.marketplace.ecommerce.platform.dto.response.CommissionResponse;
import com.marketplace.ecommerce.platform.entity.Commission;
import com.marketplace.ecommerce.platform.entity.CommissionItem;
import com.marketplace.ecommerce.platform.repository.CommissionRepository;
import com.marketplace.ecommerce.platform.service.CommissionService;
import com.marketplace.ecommerce.platform.service.CommissionSpecification;
import com.marketplace.ecommerce.request.entity.Seller;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommissionServiceImpl implements CommissionService {

    private static final BigDecimal DEFAULT_COMMISSION_RATE = new BigDecimal("5.00");

    private final CommissionRepository commissionRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CommissionResponse> getCommissions(CommissionFilterRequest filter) {
        List<Commission> commissions = commissionRepository.findAll(CommissionSpecification.filter(filter));

        Set<UUID> sellerIds = commissions.stream()
                .map(Commission::getSellerId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, String> sellerNameMap = userRepository.findAllById(sellerIds).stream()
                .collect(Collectors.toMap(User::getId, User::getFullName));

        List<CommissionResponse> responses = commissions.stream()
                .map(c -> CommissionResponse.from(c, sellerNameMap.get(c.getSellerId())))
                .toList();

        if (filter != null && filter.getSellerName() != null && !filter.getSellerName().isBlank()) {
            String keyword = filter.getSellerName().trim().toLowerCase();
            return responses.stream()
                    .filter(r -> r.getSellerName() != null
                            && r.getSellerName().toLowerCase().contains(keyword))
                    .toList();
        }

        return responses;
    }

    @Override
    @Transactional
    public void createCommission(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Order not found"));

        if (commissionRepository.existsByOrderId(order.getId())) {
            return;
        }

        if (order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.COMPLETED) {
            throw new CustomException("Order is not eligible for commission: " + order.getStatus());
        }

        if (order.getShop() == null || order.getShop().getUser() == null || order.getShop().getUser().getId() == null) {
            throw new CustomException("Seller not found");
        }

        Set<OrderItem> orderItems = order.getItems();
        if (orderItems == null || orderItems.isEmpty()) {
            throw new CustomException("Order items not found");
        }

        BigDecimal orderAmount = order.getSubtotal() == null ? BigDecimal.ZERO : order.getSubtotal();

        Commission commission = Commission.builder()
                .orderId(order.getId())
                .sellerId(order.getShop().getUser().getId())
                .orderAmount(orderAmount)
                .totalCommission(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();

        BigDecimal totalCommission = BigDecimal.ZERO;

        for (OrderItem orderItem : orderItems) {
            BigDecimal unitPrice = extractUnitPrice(orderItem);
            int quantity = orderItem.getQuantity() == null ? 0 : orderItem.getQuantity();

            BigDecimal lineAmount = unitPrice.multiply(BigDecimal.valueOf(quantity));
            BigDecimal commissionAmount = lineAmount
                    .multiply(DEFAULT_COMMISSION_RATE)
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

            CommissionItem item = CommissionItem.builder()
                    .commission(commission)
                    .orderItemId(orderItem.getId())
                    .productName(orderItem.getProductName())
                    .unitPrice(unitPrice)
                    .quantity(quantity)
                    .commissionRate(DEFAULT_COMMISSION_RATE)
                    .commissionAmount(commissionAmount)
                    .build();

            commission.getItems().add(item);
            totalCommission = totalCommission.add(commissionAmount);
        }

        commission.setTotalCommission(totalCommission);
        commissionRepository.save(commission);
    }

    @Override
    @Transactional(readOnly = true)
    public CommissionDetailResponse getByOrderId(UUID orderId) {
        Commission commission = commissionRepository.findByOrderId(orderId)
                .orElseThrow(() -> new CustomException("Commission not found for orderId=" + orderId));

        String sellerName = userRepository.findById(commission.getSellerId())
                .map(User::getFullName)
                .orElse(null);

        return CommissionDetailResponse.from(commission, sellerName);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalCommissionBySeller(UUID accountId) {
        User seller = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new RuntimeException("can not find seller"));

        BigDecimal result = commissionRepository.getTotalCommissionBySeller(seller.getId());
        return result == null ? BigDecimal.ZERO : result;
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalNetIncomeBySeller(UUID accountId) {
        User seller = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new RuntimeException("can not find seller"));
        BigDecimal result = commissionRepository.getTotalNetIncomeBySeller(seller.getId());
        return result == null ? BigDecimal.ZERO : result;
    }

    private BigDecimal extractUnitPrice(OrderItem orderItem) {
        if (orderItem == null) {
            return BigDecimal.ZERO;
        }
        if (orderItem.getUnitPrice() != null) {
            return orderItem.getUnitPrice();
        }
        return BigDecimal.ZERO;
    }
}