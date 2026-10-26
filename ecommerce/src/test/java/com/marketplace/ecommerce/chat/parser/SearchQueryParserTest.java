package com.marketplace.ecommerce.chat.parser;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class SearchQueryParserTest {

    @Test
    @DisplayName("parse xử lý chuỗi rỗng hoặc null an toàn")
    void testParse_NullOrEmpty() {
        SearchIntent res1 = SearchQueryParser.parse(null);
        assertNull(res1.getKeyword());
        assertNull(res1.getMinPrice());
        assertNull(res1.getMaxPrice());

        SearchIntent res2 = SearchQueryParser.parse("   ");
        assertNull(res2.getKeyword());
    }

    @Test
    @DisplayName("parse khoảng giá: từ X đến Y triệu")
    void testParse_BetweenMillion() {
        SearchIntent intent = SearchQueryParser.parse("Tôi muốn laptop từ 15 đến 25 triệu");
        assertNotNull(intent);
        assertEquals("laptop", intent.getKeyword());
        assertEquals(new BigDecimal("15000000"), intent.getMinPrice());
        assertEquals(new BigDecimal("25000000"), intent.getMaxPrice());
    }

    @Test
    @DisplayName("parse khoảng giá: từ X đến Y nghìn")
    void testParse_BetweenThousand() {
        SearchIntent intent = SearchQueryParser.parse("Cần mua tai nghe từ 100 đến 300k");
        assertNotNull(intent);
        assertEquals("tai nghe", intent.getKeyword());
        assertEquals(new BigDecimal("100000"), intent.getMinPrice());
        assertEquals(new BigDecimal("300000"), intent.getMaxPrice());
    }

    @Test
    @DisplayName("parse giá dưới: dưới X triệu và dưới X nghìn")
    void testParse_Under() {
        SearchIntent m = SearchQueryParser.parse("Tìm giúp điện thoại dưới 10 triệu");
        assertEquals("điện thoại", m.getKeyword());
        assertNull(m.getMinPrice());
        assertEquals(new BigDecimal("10000000"), m.getMaxPrice());

        SearchIntent k = SearchQueryParser.parse("Chuột gaming dưới 500k");
        assertEquals("Chuột gaming", k.getKeyword());
        assertEquals(new BigDecimal("500000"), k.getMaxPrice());
    }

    @Test
    @DisplayName("parse giá trên: trên X triệu và trên X nghìn")
    void testParse_Over() {
        SearchIntent m = SearchQueryParser.parse("Laptop gaming trên 20 triệu");
        assertEquals("Laptop gaming", m.getKeyword());
        assertEquals(new BigDecimal("20000000"), m.getMinPrice());
        assertNull(m.getMaxPrice());

        SearchIntent k = SearchQueryParser.parse("Bàn phím cơ trên 800k");
        assertEquals("Bàn phím cơ", k.getKeyword());
        assertEquals(new BigDecimal("800000"), k.getMinPrice());
        assertNull(k.getMaxPrice());
    }

    @Test
    @DisplayName("parse giá khoảng (around): tạo biên +/- 20%")
    void testParse_AroundMillion() {
        SearchIntent intent = SearchQueryParser.parse("Tôi cần macbook khoảng 20 triệu");
        assertEquals("macbook", intent.getKeyword());
        // 20tr * 0.8 = 16tr, 20tr * 1.2 = 24tr
        assertEquals(new BigDecimal("16000000.0"), intent.getMinPrice());
        assertEquals(new BigDecimal("24000000.0"), intent.getMaxPrice());
    }

    @Test
    @DisplayName("parse giá viết tắt shorthand 30tr hoặc 250k")
    void testParse_Shorthand() {
        SearchIntent tr = SearchQueryParser.parse("iPhone 15 Pro Max 30tr");
        assertTrue(tr.getKeyword().contains("iPhone 15 Pro Max"));
        assertEquals(new BigDecimal("30000000"), tr.getMaxPrice());

        SearchIntent k = SearchQueryParser.parse("Cáp sạc type C 150k");
        assertTrue(k.getKeyword().contains("Cáp sạc type C"));
        assertEquals(new BigDecimal("150000"), k.getMaxPrice());
    }

    @Test
    @DisplayName("parse tự đảo giá nếu minPrice > maxPrice và chặn trần 1e12")
    void testParse_SwapAndCap() {
        SearchIntent intent = SearchQueryParser.parse("từ 30 đến 10 triệu điện thoại");
        assertEquals(new BigDecimal("10000000"), intent.getMinPrice());
        assertEquals(new BigDecimal("30000000"), intent.getMaxPrice());
    }

    @Test
    @DisplayName("SearchIntent getters and builder")
    void testSearchIntent_Methods() throws Exception {
        SearchIntent intent = SearchIntent.builder()
                .keyword("test")
                .minPrice(BigDecimal.ONE)
                .maxPrice(BigDecimal.TEN)
                .build();
        assertEquals("test", intent.getKeyword());
        assertEquals(BigDecimal.ONE, intent.getMinPrice());
        assertEquals(BigDecimal.TEN, intent.getMaxPrice());
        assertNotNull(intent.toString());
        assertNotNull(intent.toConfirmationSummary());

        SearchIntent minOnly = new SearchIntent("lap", BigDecimal.TEN, null);
        assertTrue(minOnly.toConfirmationSummary().contains("trên"));

        SearchIntent maxOnly = new SearchIntent(null, null, BigDecimal.TEN);
        assertTrue(maxOnly.toConfirmationSummary().contains("dưới"));

        SearchIntent empty = new SearchIntent();
        assertNull(empty.toConfirmationSummary());
        empty.setKeyword("  ");
        assertNull(empty.toConfirmationSummary());
        assertEquals(empty, new SearchIntent("  ", null, null));
        assertEquals(empty.hashCode(), new SearchIntent("  ", null, null).hashCode());

        // Long input (> 500 chars) & long keyword (> 200 chars) & capPrice (> 1e12)
        String longInput = "laptop ".repeat(100) + " 999999999 triệu";
        SearchIntent capped = SearchQueryParser.parse(longInput);
        assertNotNull(capped.getKeyword());
        assertTrue(capped.getKeyword().length() <= 200);

        String capInput = "laptop 999999999 triệu";
        SearchIntent capRes = SearchQueryParser.parse(capInput);
        assertEquals(new BigDecimal("1000000000000"), capRes.getMaxPrice());

        // Private helpers capPrice(<0) & parseNumber(null)
        java.lang.reflect.Method capPrice = SearchQueryParser.class.getDeclaredMethod("capPrice", BigDecimal.class);
        capPrice.setAccessible(true);
        assertEquals(BigDecimal.ZERO, capPrice.invoke(null, new BigDecimal("-10")));

        java.lang.reflect.Method parseNumber = SearchQueryParser.class.getDeclaredMethod("parseNumber", String.class);
        parseNumber.setAccessible(true);
        assertEquals(BigDecimal.ZERO, parseNumber.invoke(null, (Object) null));
    }
}
