package com.marketplace.ecommerce.recommendation.service.impl;

import com.marketplace.ecommerce.product.dto.request.PageQueryRequest;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.service.QueryProductService;
import com.marketplace.ecommerce.product.valueObjects.ConditionGrade;
import com.marketplace.ecommerce.product.valueObjects.WarrantyType;
import com.marketplace.ecommerce.recommendation.entity.ProductEmbedding;
import com.marketplace.ecommerce.recommendation.entity.ProductView;
import com.marketplace.ecommerce.recommendation.entity.SearchHistory;
import com.marketplace.ecommerce.recommendation.repository.ProductEmbeddingRepository;
import com.marketplace.ecommerce.recommendation.repository.ProductViewRepository;
import com.marketplace.ecommerce.recommendation.repository.SearchHistoryRepository;
import com.marketplace.ecommerce.recommendation.service.ProductEmbeddingService;
import com.marketplace.ecommerce.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private static final int RECENT_SEARCH_LIMIT = 5;
    private static final int RECENT_VIEW_LIMIT = 15;
    private static final int SIMILAR_CANDIDATES_PAGE_SIZE = 50;

    private final SearchHistoryRepository searchHistoryRepository;
    private final ProductViewRepository productViewRepository;
    private final ProductEmbeddingRepository productEmbeddingRepository;
    private final ProductRepository productRepository;
    private final QueryProductService queryProductService;
    private final ProductEmbeddingService productEmbeddingService;

    @Override
    @Transactional
    @Async
    public void recordSearch(String sessionId, UUID userId, String keyword, UUID categoryId, BigDecimal minPrice, BigDecimal maxPrice) {
        if (sessionId == null || sessionId.isBlank()) return;
        try {
            SearchHistory sh = SearchHistory.builder()
                    .sessionId(sessionId)
                    .userId(userId)
                    .keyword(keyword != null && !keyword.isBlank() ? keyword.trim() : null)
                    .categoryId(categoryId)
                    .minPrice(minPrice)
                    .maxPrice(maxPrice)
                    .createdAt(LocalDateTime.now())
                    .build();
            searchHistoryRepository.save(sh);
        } catch (Exception e) {
            log.warn("Failed to record search: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    @Async
    public void recordProductView(String sessionId, UUID userId, UUID productId) {
        if (sessionId == null || sessionId.isBlank() || productId == null) return;
        try {
            ProductView pv = ProductView.builder()
                    .sessionId(sessionId)
                    .userId(userId)
                    .productId(productId)
                    .viewedAt(LocalDateTime.now())
                    .build();
            productViewRepository.save(pv);
        } catch (Exception e) {
            log.warn("Failed to record product view: {}", e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getRecommendationsForUser(String sessionId, UUID userId, int limit) {
        return getRecommendationsForUser(sessionId, userId, List.of(), limit);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getRecommendationsForUser(String sessionId, UUID userId, List<UUID> guestRecentIds, int limit) {
        if (limit <= 0) limit = 8;
        Set<UUID> seen = new LinkedHashSet<>();
        List<ProductResponse> out = new ArrayList<>();

        String sid = sessionId != null ? sessionId : "";

        // 1. Thu thập từ lịch sử tìm kiếm gần nhất
        Pageable searchPage = PageRequest.of(0, RECENT_SEARCH_LIMIT);
        List<SearchHistory> recentSearches = searchHistoryRepository.findRecentBySessionOrUser(sid, userId, searchPage);

        for (SearchHistory sh : recentSearches) {
            String kw = sh.getKeyword() != null && !sh.getKeyword().isBlank() ? sh.getKeyword() : null;
            if (kw == null && sh.getCategoryId() == null && sh.getMinPrice() == null && sh.getMaxPrice() == null) continue;
            PageQueryRequest req = PageQueryRequest.builder()
                    .search(kw)
                    .categoryId(sh.getCategoryId())
                    .minPrice(sh.getMinPrice())
                    .maxPrice(sh.getMaxPrice())
                    .page(0)
                    .size(4)
                    .build();
            var page = queryProductService.getPublishedProducts(req);
            for (ProductResponse p : page.getContent()) {
                if (seen.add(p.getId())) {
                    out.add(p);
                    if (out.size() >= limit) return out;
                }
            }
        }

        // 2. Thu thập từ lượt xem sản phẩm gần nhất (kết hợp DB views và Client LocalStorage ids)
        Pageable viewPage = PageRequest.of(0, RECENT_VIEW_LIMIT);
        List<ProductView> recentViews = productViewRepository.findRecentBySessionOrUser(sid, userId, viewPage);

        List<UUID> candidateProductIds = new ArrayList<>();
        for (ProductView v : recentViews) {
            if (v.getProductId() != null && !candidateProductIds.contains(v.getProductId())) {
                candidateProductIds.add(v.getProductId());
            }
        }
        if (guestRecentIds != null) {
            for (UUID gid : guestRecentIds) {
                if (gid != null && !candidateProductIds.contains(gid)) {
                    candidateProductIds.add(gid);
                }
            }
        }

        for (UUID prodId : candidateProductIds) {
            List<ProductResponse> similar = getSimilarProducts(prodId, 4);
            for (ProductResponse p : similar) {
                if (seen.add(p.getId())) {
                    out.add(p);
                    if (out.size() >= limit) return out;
                }
            }
        }

        // 3. Cold Start Fallback: Nếu user chưa có lịch sử tương tác nào, trả về top sản phẩm hot / featured của sàn
        if (out.size() < limit) {
            List<Product> topProducts = productRepository.findTopPublishedForRecommendation(PageRequest.of(0, limit * 2));
            List<UUID> topIds = topProducts.stream()
                    .map(Product::getId)
                    .filter(seen::add)
                    .limit(limit - out.size())
                    .toList();

            if (!topIds.isEmpty()) {
                List<ProductResponse> topResponses = queryProductService.getPublishedProductsByIds(topIds);
                Map<UUID, ProductResponse> map = topResponses.stream()
                        .collect(Collectors.toMap(ProductResponse::getId, p -> p, (a, b) -> a));
                for (UUID id : topIds) {
                    if (map.containsKey(id)) {
                        out.add(map.get(id));
                    }
                }
            }
        }

        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getSimilarProducts(UUID productId, int limit) {
        if (limit <= 0) limit = 8;
        Optional<Product> opt = productRepository.findPublishedByIdWithDetails(productId);
        if (opt.isEmpty()) return List.of();

        Product sourceProduct = opt.get();
        UUID categoryId = sourceProduct.getProductCategory() != null ? sourceProduct.getProductCategory().getId() : null;

        Pageable pageable = PageRequest.of(0, SIMILAR_CANDIDATES_PAGE_SIZE);
        List<Product> candidates = productRepository.findPublishedByCategoryExcludingId(productId, categoryId, pageable).getContent();

        // Nếu category không có đủ ứng viên, mở rộng tìm thêm các sản phẩm đang bán
        if (candidates.isEmpty()) {
            candidates = productRepository.findTopPublishedForRecommendation(pageable).stream()
                    .filter(p -> !p.getId().equals(productId))
                    .toList();
        }

        if (candidates.isEmpty()) return List.of();

        // Thử lấy Vector Embedding từ Ollama
        float[] sourceVec = productEmbeddingService.getOrComputeEmbedding(sourceProduct);

        List<UUID> sortedIds;

        if (sourceVec != null) {
            // TẦNG 2A: RANKING BẰNG VECTOR SIMILARITY (NẾU CÓ EMBEDDING)
            List<ProductEmbedding> embeddings = productEmbeddingRepository.findByProductIdIn(
                    candidates.stream().map(Product::getId).toList());
            Map<UUID, float[]> vecMap = new HashMap<>();
            for (ProductEmbedding pe : embeddings) {
                float[] v = productEmbeddingService.getStoredEmbedding(pe.getProductId());
                if (v != null) vecMap.put(pe.getProductId(), v);
            }
            for (Product p : candidates) {
                if (vecMap.containsKey(p.getId())) continue;
                float[] v = productEmbeddingService.getOrComputeEmbedding(p);
                if (v != null) vecMap.put(p.getId(), v);
            }

            sortedIds = candidates.stream()
                    .map(Product::getId)
                    .filter(vecMap::containsKey)
                    .sorted(Comparator.comparingDouble(id -> -cosineSimilarity(sourceVec, vecMap.get(id))))
                    .limit(limit)
                    .toList();
        } else {
            // TẦNG 2B: RANKING BẰNG THUẬT TOÁN LAI SHOPEE (CONTENT & TECH ATTRIBUTE MATCHING)
            // Khắc phục triệt để khi Ollama không bật
            sortedIds = candidates.stream()
                    .sorted(Comparator.comparingDouble(p -> -calculateTechSimilarityScore(sourceProduct, p)))
                    .map(Product::getId)
                    .limit(limit)
                    .toList();
        }

        if (sortedIds.isEmpty()) return List.of();

        List<ProductResponse> byIds = queryProductService.getPublishedProductsByIds(sortedIds);
        Map<UUID, ProductResponse> byIdMap = byIds.stream().collect(Collectors.toMap(ProductResponse::getId, p -> p, (a, b) -> a));
        return sortedIds.stream().map(byIdMap::get).filter(Objects::nonNull).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getCompatibleAccessories(UUID productId, int limit) {
        if (limit <= 0) limit = 8;
        List<Product> accessories = productRepository.findPotentialAccessories(productId, PageRequest.of(0, limit));
        if (accessories.isEmpty()) return List.of();

        List<UUID> ids = accessories.stream().map(Product::getId).toList();
        List<ProductResponse> responses = queryProductService.getPublishedProductsByIds(ids);
        Map<UUID, ProductResponse> map = responses.stream().collect(Collectors.toMap(ProductResponse::getId, p -> p, (a, b) -> a));
        return ids.stream().map(map::get).filter(Objects::nonNull).toList();
    }

    /**
     * Thuật toán chấm điểm tương quan đặc tính kỹ thuật (Tech Similarity Scoring):
     * Cùng Category (40đ) + Tương đồng mức giá (30đ) + Tương đồng tình trạng máy (15đ) + Tương đồng bảo hành (10đ) + Featured (5đ)
     */
    private double calculateTechSimilarityScore(Product source, Product target) {
        double score = 0.0;

        // 1. Cùng danh mục sản phẩm (Category match)
        if (source.getProductCategory() != null && target.getProductCategory() != null) {
            if (source.getProductCategory().getId().equals(target.getProductCategory().getId())) {
                score += 40.0;
            }
        }

        // 2. Độ tương đồng mức giá (Price proximity)
        if (source.getBasePrice() != null && target.getBasePrice() != null) {
            double p1 = source.getBasePrice().doubleValue();
            double p2 = target.getBasePrice().doubleValue();
            double maxP = Math.max(p1, p2);
            if (maxP > 0) {
                double priceDiffRatio = Math.abs(p1 - p2) / maxP;
                score += Math.max(0.0, 1.0 - priceDiffRatio) * 30.0;
            }
        }

        // 3. Tương đồng tình trạng máy (Condition Grade match)
        if (source.getConditionGrade() != null && target.getConditionGrade() != null) {
            if (source.getConditionGrade() == target.getConditionGrade()) {
                score += 15.0;
            } else if (source.getConditionGrade() != ConditionGrade.GRADE_NEW && target.getConditionGrade() != ConditionGrade.GRADE_NEW) {
                score += 8.0; // Đều là đồ đã qua sử dụng (Like New, 90-95%)
            }
        }

        // 4. Tương đồng hình thức bảo hành (Warranty Type match)
        if (source.getWarrantyType() != null && target.getWarrantyType() != null) {
            if (source.getWarrantyType() == target.getWarrantyType()) {
                score += 10.0;
            }
        }

        // 5. Uy tín & Nổi bật (Shop Trust & Featured Boost)
        if (target.isFeatured()) {
            score += 5.0;
        }

        return score;
    }

    private static double cosineSimilarity(float[] a, float[] b) {
        if (a == null || b == null || a.length != b.length) return 0;
        double dot = 0, na = 0, nb = 0;
        for (int i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            na += a[i] * a[i];
            nb += b[i] * b[i];
        }
        if (na == 0 || nb == 0) return 0;
        return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }
}
