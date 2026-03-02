package com.marketplace.ecommerce.platform.service.impl;

import com.marketplace.ecommerce.platform.dto.response.CommissionByMonthResponse;
import com.marketplace.ecommerce.platform.dto.response.CommissionOverviewResponse;
import com.marketplace.ecommerce.platform.dto.response.TopSellerCommissionResponse;
import com.marketplace.ecommerce.platform.repository.CommissionRepository;
import com.marketplace.ecommerce.platform.service.CommissionStatisticsService;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommissionStatisticsServiceImpl implements CommissionStatisticsService {

    private final CommissionRepository commissionRepository;
    private final ShopRepository shopRepository;

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