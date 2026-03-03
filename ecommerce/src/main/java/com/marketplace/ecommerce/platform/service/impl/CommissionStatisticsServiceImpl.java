package com.marketplace.ecommerce.platform.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.order.dto.response.OrderResponse;
import com.marketplace.ecommerce.order.dto.response.RevenueSummaryResponse;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.service.OrderService;
import com.marketplace.ecommerce.order.service.QueryOrderService;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.platform.dto.response.CommissionByMonthResponse;
import com.marketplace.ecommerce.platform.dto.response.CommissionOverviewResponse;
import com.marketplace.ecommerce.platform.dto.response.SellerStatisticsResponse;
import com.marketplace.ecommerce.platform.dto.response.TopSellerCommissionResponse;
import com.marketplace.ecommerce.platform.repository.CommissionRepository;
import com.marketplace.ecommerce.platform.service.CommissionService;
import com.marketplace.ecommerce.platform.service.CommissionStatisticsService;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CommissionStatisticsServiceImpl implements CommissionStatisticsService {

    private final CommissionRepository commissionRepository;
    private final ShopRepository shopRepository;
    private final CommissionService commissionService;
    private final UserRepository userRepository;
    private final QueryOrderService queryOrderService;
    private final OrderRepository orderRepository;

    @Override
    public SellerStatisticsResponse getStatistics(UUID accountId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new RuntimeException("can not find user"));
        Shop shop = shopRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("can not find shop"));

        List<Order> orders = orderRepository.getOrdersByShop(shop);

        long totalOrders = orders.stream()
                .filter(order -> order.getStatus() != OrderStatus.PENDING_PAYMENT)
                .count();

        BigDecimal totalCommission = commissionService.getTotalCommissionBySeller(accountId);
        BigDecimal totalNetIncome = commissionService.getTotalNetIncomeBySeller(accountId);

        Map<OrderStatus, Long> orderCountByStatus = new EnumMap<>(OrderStatus.class);
        for (OrderStatus status : OrderStatus.values()) {
            orderCountByStatus.put(status, 0L);
        }

        for (Order order : orders) {
            OrderStatus status = order.getStatus();
            orderCountByStatus.put(status, orderCountByStatus.getOrDefault(status, 0L) + 1);
        }

        Map<String, Long> orderCountByStatusStr = new LinkedHashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            orderCountByStatusStr.put(status.name(), orderCountByStatus.getOrDefault(status, 0L));
        }

        RevenueSummaryResponse revenueSummary = queryOrderService.getRevenueSummaryByShop(accountId);

        return SellerStatisticsResponse.builder()
                .shopName(shop.getName())
                .totalRevenue(revenueSummary.getRevenue())
                .estimatedRevenue(revenueSummary.getEstimatedRevenue())
                .totalOrders(totalOrders)
                .totalCommission(totalCommission)
                .totalNetIncome(totalNetIncome)
                .orderCountByStatus(orderCountByStatusStr)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CommissionOverviewResponse getOverview() {
        List<Object[]> rows = commissionRepository.getOverviewStatistics();

        if (rows == null || rows.isEmpty()) {
            return CommissionOverviewResponse.builder()
                    .totalCommission(BigDecimal.ZERO)
                    .totalOrders(0L)
                    .averageCommissionRate(BigDecimal.ZERO)
                    .build();
        }

        Object[] row = rows.get(0);

        BigDecimal totalCommission = castBigDecimal(row[0]);
        Long totalOrders = castLong(row[1]);
        BigDecimal averageCommissionRate = castBigDecimal(row[2]);

        return CommissionOverviewResponse.builder()
                .totalCommission(totalCommission)
                .totalOrders(totalOrders)
                .averageCommissionRate(averageCommissionRate)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommissionByMonthResponse> getByMonth() {
        return commissionRepository.getCommissionByMonth().stream()
                .map(row -> CommissionByMonthResponse.builder()
                        .year(castInteger(row[0]))
                        .month(castInteger(row[1]))
                        .totalCommission(castBigDecimal(row[2]))
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopSellerCommissionResponse> getTopSellers(int limit) {
        int safeLimit = limit <= 0 ? 5 : limit;

        return commissionRepository.getTopSellerCommission(PageRequest.of(0, safeLimit)).stream()
                .map(row -> {
                    UUID sellerId = (UUID) row[0];
                    BigDecimal totalCommission = castBigDecimal(row[1]);

                    String shopName = shopRepository.findByUserId(sellerId)
                            .map(shop -> shop.getName())
                            .orElse(null);

                    return TopSellerCommissionResponse.builder()
                            .sellerId(sellerId)
                            .shopName(shopName)
                            .totalCommission(totalCommission)
                            .build();
                })
                .toList();
    }

    private BigDecimal castBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        if (value instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        return new BigDecimal(value.toString());
    }

    private Long castLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Long l) {
            return l;
        }
        if (value instanceof Number n) {
            return n.longValue();
        }
        return Long.parseLong(value.toString());
    }

    private Integer castInteger(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof Integer i) {
            return i;
        }
        if (value instanceof Number n) {
            return n.intValue();
        }
        return Integer.parseInt(value.toString());
    }
}