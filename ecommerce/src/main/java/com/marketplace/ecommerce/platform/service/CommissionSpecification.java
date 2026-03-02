package com.marketplace.ecommerce.platform.service;

import com.marketplace.ecommerce.platform.dto.CommissionFilterRequest;
import com.marketplace.ecommerce.platform.entity.Commission;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public final class CommissionSpecification {

    private CommissionSpecification() {
    }

    public static Specification<Commission> filter(CommissionFilterRequest filter) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();

            if (filter == null) {
                query.orderBy(cb.desc(root.get("createdAt")));
                return predicate;
            }

            if (filter.getFrom() != null) {
                LocalDateTime fromDateTime = filter.getFrom().atStartOfDay();
                predicate.getExpressions().add(
                        cb.greaterThanOrEqualTo(root.get("createdAt"), fromDateTime)
                );
            }

            if (filter.getTo() != null) {
                LocalDateTime toDateTime = filter.getTo().plusDays(1).atStartOfDay().minusNanos(1);
                predicate.getExpressions().add(
                        cb.lessThanOrEqualTo(root.get("createdAt"), toDateTime)
                );
            }

            query.orderBy(cb.desc(root.get("createdAt")));
            return predicate;
        };
    }
}