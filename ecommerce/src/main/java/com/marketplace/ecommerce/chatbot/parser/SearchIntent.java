package com.marketplace.ecommerce.chatbot.parser;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

/**
 * Kết quả phân tích câu tìm kiếm: từ khóa + khoảng giá (nếu có).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchIntent {
    /** Từ khóa sản phẩm (đã bỏ cụm giá, filler). Null/blank = không có từ khóa. */
    private String keyword;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;

    private static final DecimalFormat PRICE_FMT =
            new DecimalFormat("#,###", DecimalFormatSymbols.getInstance(Locale.US));

    /** Câu ngắn mô tả ý tìm kiếm (dùng cho confirmation trong chat). */
    public String toConfirmationSummary() {
        StringBuilder sb = new StringBuilder();
        if (keyword != null && !keyword.isBlank()) {
            sb.append("\"").append(keyword.trim()).append("\"");
        }
        if (minPrice != null || maxPrice != null) {
            if (sb.length() > 0) sb.append(", ");
            if (minPrice != null && maxPrice != null) {
                sb.append("khoảng ").append(PRICE_FMT.format(minPrice)).append(" - ").append(PRICE_FMT.format(maxPrice)).append(" đ");
            } else if (maxPrice != null) {
                sb.append("dưới ").append(PRICE_FMT.format(maxPrice)).append(" đ");
            } else {
                sb.append("trên ").append(PRICE_FMT.format(minPrice)).append(" đ");
            }
        }
        return sb.length() > 0 ? sb.toString() : null;
    }
}
