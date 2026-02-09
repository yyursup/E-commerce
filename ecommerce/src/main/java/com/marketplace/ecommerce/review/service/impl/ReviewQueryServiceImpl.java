package com.marketplace.ecommerce.review.service.impl;

import com.marketplace.ecommerce.review.dto.projection.ReviewStatsProjection;
import com.marketplace.ecommerce.review.dto.response.ReviewStatsResponse;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.service.ReviewQueryService;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewQueryServiceImpl implements ReviewQueryService {

    private final ReviewRepository reviewRepository;

    @Override
    @Transactional(readOnly = true)
    public ReviewStatsResponse getProductReviewStats(UUID productId) {
        ReviewStatsProjection s = reviewRepository.getStats(productId, ReviewStatus.ACTIVE);

        double avg = (s == null || s.getAvgRating() == null) ? 0.0 : s.getAvgRating();
        long total = nzLong(s == null ? null : s.getTotalReviews());

        long withImages = nzNum(s == null ? null : s.getWithImages());
        long withComments = nzNum(s == null ? null : s.getWithComments());

        long star1 = nzNum(s == null ? null : s.getStar1());
        long star2 = nzNum(s == null ? null : s.getStar2());
        long star3 = nzNum(s == null ? null : s.getStar3());
        long star4 = nzNum(s == null ? null : s.getStar4());
        long star5 = nzNum(s == null ? null : s.getStar5());

        Map<Integer, Long> starsCount = new LinkedHashMap<>();
        starsCount.put(1, star1);
        starsCount.put(2, star2);
        starsCount.put(3, star3);
        starsCount.put(4, star4);
        starsCount.put(5, star5);

        Map<Integer, Double> starsPercent = new LinkedHashMap<>();
        for (int i = 1; i <= 5; i++) {
            long c = starsCount.get(i);
            double pct = (total == 0) ? 0.0 : (c * 100.0 / total);
            starsPercent.put(i, round2(pct));
        }

        return ReviewStatsResponse.builder()
                .avgRating(round2(avg))
                .totalReviews(total)
                .withImages(withImages)
                .withComments(withComments)
                .starsCount(starsCount)
                .starsPercent(starsPercent)
                .build();
    }

    private long nzLong(Long v) {
        return v == null ? 0L : v;
    }

    private long nzNum(Number v) {
        return v == null ? 0L : v.longValue();
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
