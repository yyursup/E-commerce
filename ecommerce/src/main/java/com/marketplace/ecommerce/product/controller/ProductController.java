package com.marketplace.ecommerce.product.controller;

import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.product.dto.request.PageQueryRequest;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.product.service.QueryProductService;
import com.marketplace.ecommerce.recommendation.service.RecommendationService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/product")
@RequiredArgsConstructor
public class ProductController {
    private final QueryProductService queryProductService;
    private final RecommendationService recommendationService;
    private final UserRepository userRepository;

    /**
     * Xem chi tiết sản phẩm. Ghi nhận lượt xem (recordProductView) để dùng cho gợi ý.
     */
    @GetMapping("/{productId}")
    public ProductResponse getPublishedProductById(
            @PathVariable UUID productId,
            HttpSession session,
            @CurrentUser CurrentUserInfo principal
    ) {
        ProductResponse product = queryProductService.getPublishedProductById(productId);
        UUID userId = principal != null && principal.getAccountId() != null
                ? userRepository.findByAccountId(principal.getAccountId()).map(u -> u.getId()).orElse(null)
                : null;
        recommendationService.recordProductView(session.getId(), userId, productId);
        return product;
    }

    @GetMapping
    public Page<ProductResponse> getPublishedProducts(@Valid @ModelAttribute PageQueryRequest req) {
        return queryProductService.getPublishedProducts(req);
    }

    /**
     * Sản phẩm tương tự (cùng category + embedding similarity). Dùng cho block "Sản phẩm tương tự" trên trang chi tiết.
     */
    @GetMapping("/{productId}/similar")
    public List<ProductResponse> getSimilarProducts(
            @PathVariable UUID productId,
            @RequestParam(defaultValue = "8") int limit
    ) {
        return recommendationService.getSimilarProducts(productId, limit);
    }
}
