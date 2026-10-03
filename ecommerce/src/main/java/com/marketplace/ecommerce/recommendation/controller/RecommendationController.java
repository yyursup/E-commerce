package com.marketplace.ecommerce.recommendation.controller;

import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.recommendation.service.RecommendationService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserRepository userRepository;

    /**
     * Gợi ý sản phẩm cho user/session (dựa trên lịch sử tìm kiếm + đã xem + guest recent IDs).
     */
    @GetMapping
    public ResponseEntity<List<ProductResponse>> getRecommendations(
            HttpSession session,
            @CurrentUser CurrentUserInfo principal,
            @RequestParam(required = false) List<UUID> recentProductIds,
            @RequestParam(defaultValue = "8") int limit
    ) {
        UUID userId = principal != null && principal.getAccountId() != null
                ? userRepository.findByAccountId(principal.getAccountId()).map(u -> u.getId()).orElse(null)
                : null;
        List<ProductResponse> list = recommendationService.getRecommendationsForUser(session.getId(), userId, recentProductIds, limit);
        return ResponseEntity.ok(list);
    }

    /**
     * Gợi ý sản phẩm tương đương cấu hình & tầm giá (Dùng cho trang chi tiết).
     */
    @GetMapping("/similar/{productId}")
    public ResponseEntity<List<ProductResponse>> getSimilarProducts(
            @PathVariable UUID productId,
            @RequestParam(defaultValue = "8") int limit
    ) {
        List<ProductResponse> list = recommendationService.getSimilarProducts(productId, limit);
        return ResponseEntity.ok(list);
    }

    /**
     * Gợi ý phụ kiện công nghệ tương thích (Cross-selling).
     */
    @GetMapping("/accessories/{productId}")
    public ResponseEntity<List<ProductResponse>> getCompatibleAccessories(
            @PathVariable UUID productId,
            @RequestParam(defaultValue = "8") int limit
    ) {
        List<ProductResponse> list = recommendationService.getCompatibleAccessories(productId, limit);
        return ResponseEntity.ok(list);
    }

    /**
     * Ghi nhận lượt xem / tương tác từ Frontend (Client tracking).
     */
    @PostMapping("/track")
    public ResponseEntity<Void> trackActivity(
            HttpSession session,
            @CurrentUser CurrentUserInfo principal,
            @RequestParam UUID productId
    ) {
        UUID userId = principal != null && principal.getAccountId() != null
                ? userRepository.findByAccountId(principal.getAccountId()).map(u -> u.getId()).orElse(null)
                : null;
        recommendationService.recordProductView(session.getId(), userId, productId);
        return ResponseEntity.ok().build();
    }
}
