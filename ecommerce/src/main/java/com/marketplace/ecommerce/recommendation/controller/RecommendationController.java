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
     * Gợi ý sản phẩm cho user/session (dựa trên lịch sử tìm kiếm + đã xem).
     * Frontend gọi với credentials để có sessionId; nếu đăng nhập thì có thêm userId.
     */
    @GetMapping
    public ResponseEntity<List<ProductResponse>> getRecommendations(
            HttpSession session,
            @CurrentUser CurrentUserInfo principal,
            @RequestParam(defaultValue = "8") int limit
    ) {
        UUID userId = principal != null && principal.getAccountId() != null
                ? userRepository.findByAccountId(principal.getAccountId()).map(u -> u.getId()).orElse(null)
                : null;
        List<ProductResponse> list = recommendationService.getRecommendationsForUser(session.getId(), userId, limit);
        return ResponseEntity.ok(list);
    }
}
