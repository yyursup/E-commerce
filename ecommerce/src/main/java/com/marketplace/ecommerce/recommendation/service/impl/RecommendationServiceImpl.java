package com.marketplace.ecommerce.recommendation.service.impl;

import com.marketplace.ecommerce.product.dto.request.PageQueryRequest;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.service.QueryProductService;
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
        if (limit <= 0) limit = 8;
        Set<UUID> seen = new LinkedHashSet<>();
        List<ProductResponse> out = new ArrayList<>();

        String sid = sessionId != null ? sessionId : "";
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

        Pageable viewPage = PageRequest.of(0, RECENT_VIEW_LIMIT);
        List<ProductView> recentViews = productViewRepository.findRecentBySessionOrUser(sid, userId, viewPage);
        for (ProductView v : recentViews) {
            List<ProductResponse> similar = getSimilarProducts(v.getProductId(), 3);
            for (ProductResponse p : similar) {
                if (seen.add(p.getId())) {
                    out.add(p);
                    if (out.size() >= limit) return out;
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

        Product product = opt.get();
        UUID categoryId = product.getProductCategory() != null ? product.getProductCategory().getId() : null;

        float[] sourceVec = productEmbeddingService.getOrComputeEmbedding(product);
        Pageable pageable = PageRequest.of(0, SIMILAR_CANDIDATES_PAGE_SIZE);
        List<Product> candidates = productRepository.findPublishedByCategoryExcludingId(productId, categoryId, pageable).getContent();

        if (candidates.isEmpty()) return List.of();

        if (sourceVec == null) return List.of();

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

        List<UUID> sorted = candidates.stream()
                .map(Product::getId)
                .filter(vecMap::containsKey)
                .sorted(Comparator.comparingDouble(id -> -cosineSimilarity(sourceVec, vecMap.get(id))))
                .limit(limit)
                .toList();

        if (sorted.isEmpty()) return List.of();

        List<ProductResponse> byIds = queryProductService.getPublishedProductsByIds(sorted);
        Map<UUID, ProductResponse> byIdMap = byIds.stream().collect(Collectors.toMap(ProductResponse::getId, p -> p));
        return sorted.stream().map(byIdMap::get).filter(Objects::nonNull).toList();
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
