package com.marketplace.ecommerce.platform.service;

import com.marketplace.ecommerce.platform.dto.CommissionFilterRequest;
import com.marketplace.ecommerce.platform.entity.Commission;
import jakarta.persistence.criteria.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommissionSpecificationTest {

    @Mock
    private Root<Commission> root;
    @Mock
    private CriteriaQuery<?> query;
    @Mock
    private CriteriaBuilder cb;
    @Mock
    private Predicate conjunctionPredicate;
    @Mock
    private Path<LocalDateTime> createdAtPath;
    @Mock
    private Order orderDesc;

    @Test
    @DisplayName("filter bao phủ trường hợp filter null")
    void testFilter_Null() {
        when(cb.conjunction()).thenReturn(conjunctionPredicate);
        when(root.<LocalDateTime>get("createdAt")).thenReturn(createdAtPath);
        when(cb.desc(createdAtPath)).thenReturn(orderDesc);

        Specification<Commission> spec = CommissionSpecification.filter(null);
        Predicate result = spec.toPredicate(root, query, cb);

        assertNotNull(result);
        verify(query).orderBy(orderDesc);
    }

    @Test
    @DisplayName("filter bao phủ from và to date")
    void testFilter_WithDates() {
        when(cb.conjunction()).thenReturn(conjunctionPredicate);
        List<Expression<Boolean>> expressions = new ArrayList<>();
        when(conjunctionPredicate.getExpressions()).thenReturn(expressions);

        when(root.<LocalDateTime>get("createdAt")).thenReturn(createdAtPath);
        when(cb.desc(createdAtPath)).thenReturn(orderDesc);

        Predicate gtePredicate = mock(Predicate.class);
        when(cb.greaterThanOrEqualTo(eq(createdAtPath), any(LocalDateTime.class))).thenReturn(gtePredicate);

        Predicate ltePredicate = mock(Predicate.class);
        when(cb.lessThanOrEqualTo(eq(createdAtPath), any(LocalDateTime.class))).thenReturn(ltePredicate);

        CommissionFilterRequest filter = new CommissionFilterRequest();
        filter.setFrom(LocalDate.of(2026, 1, 1));
        filter.setTo(LocalDate.of(2026, 1, 31));

        Specification<Commission> spec = CommissionSpecification.filter(filter);
        Predicate result = spec.toPredicate(root, query, cb);

        assertNotNull(result);
        assertEquals(2, expressions.size());
        verify(query).orderBy(orderDesc);
    }

    @Test
    @DisplayName("Bao phủ constructor private thông qua reflection")
    void testPrivateConstructor() throws Exception {
        java.lang.reflect.Constructor<CommissionSpecification> constructor =
                CommissionSpecification.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        CommissionSpecification instance = constructor.newInstance();
        assertNotNull(instance);
    }
}
