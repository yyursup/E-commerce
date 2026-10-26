package com.marketplace.ecommerce.common;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

import static org.junit.jupiter.api.Assertions.*;

class QueryUtilsTest {

    private final QueryUtils queryUtils = new QueryUtils();

    @Test
    @DisplayName("createSort bao phủ tất cả các trường hợp sắp xếp")
    void testCreateSort() {
        // null or blank sortBy -> default DESC createdAt
        Sort s1 = queryUtils.createSort(null, "asc");
        assertEquals(Sort.by(Sort.Direction.DESC, "createdAt"), s1);

        Sort s2 = queryUtils.createSort("   ", "desc");
        assertEquals(Sort.by(Sort.Direction.DESC, "createdAt"), s2);

        // price asc / desc
        Sort s3 = queryUtils.createSort("price", "asc");
        assertEquals(Sort.by(Sort.Direction.ASC, "basePrice"), s3);

        Sort s4 = queryUtils.createSort("PRICE", "desc");
        assertEquals(Sort.by(Sort.Direction.DESC, "basePrice"), s4);

        // name
        Sort s5 = queryUtils.createSort("name", "ASC");
        assertEquals(Sort.by(Sort.Direction.ASC, "name"), s5);

        // created / createdAt
        Sort s6 = queryUtils.createSort("created", "desc");
        assertEquals(Sort.by(Sort.Direction.DESC, "createdAt"), s6);

        Sort s7 = queryUtils.createSort("createdAt", "asc");
        assertEquals(Sort.by(Sort.Direction.ASC, "createdAt"), s7);

        // default unknown
        Sort s8 = queryUtils.createSort("unknown_field", "asc");
        assertEquals(Sort.by(Sort.Direction.DESC, "createdAt"), s8);
    }
}
