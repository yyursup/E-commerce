package com.marketplace.ecommerce.chatbot.parser;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Phân tích câu tiếng Việt để trích từ khóa + ràng buộc giá.
 * Chuẩn hóa input, validate giá, giới hạn độ dài keyword.
 */
public final class SearchQueryParser {

    private static final int MAX_INPUT_LENGTH = 500;
    private static final int MAX_KEYWORD_LENGTH = 200;
    private static final BigDecimal PRICE_CAP = new BigDecimal("1000000000000"); // 1e12

    private static final BigDecimal ONE_MILLION = new BigDecimal("1000000");
    private static final BigDecimal ONE_THOUSAND = new BigDecimal("1000");

    // "dưới 30 triệu", "dưới 30 tr" — bắt buộc có đơn vị triệu, tránh "dưới 500" nhầm với triệu
    private static final Pattern UNDER_MILLION = Pattern.compile(
            "dưới\\s*([0-9]+(?:[.,][0-9]+)?)\\s*(?:triệu|tr(?!i)|triệu\\s*đồng)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern UNDER_THOUSAND = Pattern.compile(
            "dưới\\s*([0-9]+(?:[.,][0-9]+)?)\\s*(?:nghìn|ngàn|k)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    // "trên 10 triệu", "trên 5 tr" — bắt buộc có đơn vị triệu, để "trên 500k" match OVER_THOUSAND
    private static final Pattern OVER_MILLION = Pattern.compile(
            "trên\\s*([0-9]+(?:[.,][0-9]+)?)\\s*(?:triệu|tr(?!i)|triệu\\s*đồng)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern OVER_THOUSAND = Pattern.compile(
            "trên\\s*([0-9]+(?:[.,][0-9]+)?)\\s*(?:nghìn|ngàn|k)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    // "từ 5 đến 15 triệu", "từ 5 - 20 tr" — bắt buộc có đơn vị triệu
    private static final Pattern BETWEEN_MILLION = Pattern.compile(
            "từ\\s*([0-9]+(?:[.,][0-9]+)?)\\s*(?:đến|-|tới)\\s*([0-9]+(?:[.,][0-9]+)?)\\s*(?:triệu|tr(?!i)|triệu\\s*đồng)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    // "từ 100 đến 500 nghìn", "từ 50 - 200 ngàn"
    private static final Pattern BETWEEN_THOUSAND = Pattern.compile(
            "từ\\s*([0-9]+(?:[.,][0-9]+)?)\\s*(?:đến|-|tới)\\s*([0-9]+(?:[.,][0-9]+)?)\\s*(?:nghìn|ngàn|k)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    // "khoảng 20 triệu", "khoảng 15 tr" — bắt buộc có đơn vị triệu
    private static final Pattern AROUND_MILLION = Pattern.compile(
            "khoảng\\s*([0-9]+(?:[.,][0-9]+)?)\\s*(?:triệu|tr(?!i)|triệu\\s*đồng)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    // "30 triệu", "15 tr" standalone — phải có "triệu" hoặc "tr" (tr = triệu), không match "nghìn/ngàn/k"
    private static final Pattern ONLY_MILLION = Pattern.compile(
            "([0-9]+(?:[.,][0-9]+)?)\\s*(?:triệu|tr(?!i)|triệu\\s*đồng)(?!\\s*đến|\\s*-|\\s*tới)",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    // "500 nghìn", "500 ngàn", "500k" standalone (đơn vị nghìn)
    private static final Pattern ONLY_THOUSAND = Pattern.compile(
            "([0-9]+(?:[.,][0-9]+)?)\\s*(?:nghìn|ngàn|k)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    // Viết tắt: "30tr", "1.5tr" (tr = triệu). Dùng \b để tr không ăn "triệu"
    private static final Pattern SHORTHAND_TR = Pattern.compile(
            "([0-9]+(?:[.,][0-9]+)?)\\s*tr\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern SHORTHAND_K = Pattern.compile(
            "([0-9]+(?:[.,][0-9]+)?)\\s*k\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    /** Cụm cần bỏ khi lấy từ khóa (filler) */
    private static final Pattern FILLER = Pattern.compile(
            "\\b(tôi\\s+cần|tôi\\s+muốn|cho\\s+tôi|bạn\\s+tìm|tìm\\s+giúp|tìm\\s+giùm|tìm\\s+giúp\\s+tôi|hãy\\s+tìm|giúp\\s+tôi\\s+tìm|muốn\\s+mua|cần\\s+mua|bạn\\s+tìm\\s+giùm)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private SearchQueryParser() {}

    /**
     * Chuẩn hóa chuỗi: NFC, trim, gộp khoảng trắng.
     */
    public static String normalizeInput(String input) {
        if (input == null) return "";
        String s = input.trim();
        if (s.isEmpty()) return "";
        s = Normalizer.normalize(s, Normalizer.Form.NFC);
        s = s.replaceAll("\\s+", " ").trim();
        if (s.length() > MAX_INPUT_LENGTH) s = s.substring(0, MAX_INPUT_LENGTH);
        return s;
    }

    /**
     * Phân tích input người dùng thành từ khóa + min/max giá (VNĐ).
     * Giá được validate (>= 0, <= cap); nếu min > max thì swap.
     * Keyword cắt tối đa MAX_KEYWORD_LENGTH.
     */
    public static SearchIntent parse(String input) {
        String text = normalizeInput(input);
        if (text.isEmpty()) {
            return SearchIntent.builder().keyword(null).minPrice(null).maxPrice(null).build();
        }

        BigDecimal minPrice = null;
        BigDecimal maxPrice = null;
        String working = text;

        // 1) "từ X đến Y triệu" (ưu tiên)
        Matcher betweenM = BETWEEN_MILLION.matcher(working);
        if (betweenM.find()) {
            minPrice = parseNumber(betweenM.group(1)).multiply(ONE_MILLION);
            maxPrice = parseNumber(betweenM.group(2)).multiply(ONE_MILLION);
            working = removeMatch(working, betweenM);
        }
        // "từ X đến Y nghìn"
        if (minPrice == null && maxPrice == null) {
            Matcher betweenK = BETWEEN_THOUSAND.matcher(working);
            if (betweenK.find()) {
                minPrice = parseNumber(betweenK.group(1)).multiply(ONE_THOUSAND);
                maxPrice = parseNumber(betweenK.group(2)).multiply(ONE_THOUSAND);
                working = removeMatch(working, betweenK);
            }
        }

        // 2) "dưới X triệu" / "dưới X nghìn"
        if (maxPrice == null) {
            Matcher underM = UNDER_MILLION.matcher(working);
            if (underM.find()) {
                maxPrice = parseNumber(underM.group(1)).multiply(ONE_MILLION);
                working = removeMatch(working, underM);
            } else {
                Matcher underK = UNDER_THOUSAND.matcher(working);
                if (underK.find()) {
                    maxPrice = parseNumber(underK.group(1)).multiply(ONE_THOUSAND);
                    working = removeMatch(working, underK);
                }
            }
        }

        // 3) "trên X triệu" / "trên X nghìn"
        if (minPrice == null) {
            Matcher overM = OVER_MILLION.matcher(working);
            if (overM.find()) {
                minPrice = parseNumber(overM.group(1)).multiply(ONE_MILLION);
                working = removeMatch(working, overM);
            } else {
                Matcher overK = OVER_THOUSAND.matcher(working);
                if (overK.find()) {
                    minPrice = parseNumber(overK.group(1)).multiply(ONE_THOUSAND);
                    working = removeMatch(working, overK);
                }
            }
        }

        // 4) "khoảng X triệu"
        if (minPrice == null && maxPrice == null) {
            Matcher around = AROUND_MILLION.matcher(working);
            if (around.find()) {
                BigDecimal x = parseNumber(around.group(1)).multiply(ONE_MILLION);
                minPrice = x.multiply(new BigDecimal("0.8"));
                maxPrice = x.multiply(new BigDecimal("1.2"));
                working = removeMatch(working, around);
            }
        }

        // 5) Chỉ "X triệu" hoặc "X tr" standalone (triệu)
        if (maxPrice == null && minPrice == null) {
            Matcher onlyM = ONLY_MILLION.matcher(working);
            if (onlyM.find()) {
                maxPrice = parseNumber(onlyM.group(1)).multiply(ONE_MILLION);
                working = removeMatch(working, onlyM);
            }
        }
        // 5b) Chỉ "X nghìn", "X ngàn", "X k" standalone (nghìn VNĐ)
        if (maxPrice == null && minPrice == null) {
            Matcher onlyK = ONLY_THOUSAND.matcher(working);
            if (onlyK.find()) {
                maxPrice = parseNumber(onlyK.group(1)).multiply(ONE_THOUSAND);
                working = removeMatch(working, onlyK);
            }
        }

        // 6) Viết tắt "30tr", "500k" dính số (chỉ khi chưa có giá)
        if (minPrice == null && maxPrice == null) {
            Matcher tr = SHORTHAND_TR.matcher(working);
            if (tr.find()) {
                maxPrice = parseNumber(tr.group(1)).multiply(ONE_MILLION);
                working = removeMatch(working, tr);
            } else {
                Matcher k = SHORTHAND_K.matcher(working);
                if (k.find()) {
                    maxPrice = parseNumber(k.group(1)).multiply(ONE_THOUSAND);
                    working = removeMatch(working, k);
                }
            }
        }

        // Validate và chuẩn hóa giá
        minPrice = capPrice(minPrice);
        maxPrice = capPrice(maxPrice);
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            BigDecimal tmp = minPrice;
            minPrice = maxPrice;
            maxPrice = tmp;
        }

        // Lấy từ khóa: bỏ filler, trim, cắt độ dài
        working = FILLER.matcher(working).replaceAll(" ");
        working = working.replaceAll("\\s+", " ").trim();
        working = working.replaceAll("^[.,\\s]+|[.,\\s]+$", "").trim();
        String keyword = working.isEmpty() ? null : working;
        if (keyword != null && keyword.length() > MAX_KEYWORD_LENGTH) {
            keyword = keyword.substring(0, MAX_KEYWORD_LENGTH).trim();
        }

        return SearchIntent.builder()
                .keyword(keyword)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .build();
    }

    private static String removeMatch(String text, Matcher matcher) {
        return text.substring(0, matcher.start()) + " " + text.substring(matcher.end());
    }

    private static BigDecimal capPrice(BigDecimal value) {
        if (value == null) return null;
        if (value.compareTo(BigDecimal.ZERO) < 0) return BigDecimal.ZERO;
        if (value.compareTo(PRICE_CAP) > 0) return PRICE_CAP;
        return value;
    }

    private static BigDecimal parseNumber(String s) {
        if (s == null) return BigDecimal.ZERO;
        return new BigDecimal(s.replace(',', '.'));
    }
}
