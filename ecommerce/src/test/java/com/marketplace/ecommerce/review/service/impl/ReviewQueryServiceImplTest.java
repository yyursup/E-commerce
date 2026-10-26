package com.marketplace.ecommerce.review.service.impl;

import com.marketplace.ecommerce.review.dto.projection.ReviewStatsProjection;
import com.marketplace.ecommerce.review.dto.response.ReviewStatsResponse;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewQueryServiceImplTest {

    @Mock
    private ReviewRepository reviewRepository;

    @InjectMocks
    private ReviewQueryServiceImpl reviewQueryService;

    @Test
    @DisplayName("getProductReviewStats tính toán thống kê đánh giá đầy đủ từ projection")
    void testGetProductReviewStats_Success() {
        UUID productId = UUID.randomUUID();
        ReviewStatsProjection proj = mock(ReviewStatsProjection.class);
        when(proj.getAvgRating()).thenReturn(4.567);
        when(proj.getTotalReviews()).thenReturn(10L);
        when(proj.getWithImages()).thenReturn(3L);
        when(proj.getWithComments()).thenReturn(8L);
        when(proj.getStar1()).thenReturn(1);
        when(proj.getStar2()).thenReturn(0);
        when(proj.getStar3()).thenReturn(1);
        when(proj.getStar4()).thenReturn(3);
        when(proj.getStar5()).thenReturn(5);

        when(reviewRepository.getStats(productId, ReviewStatus.ACTIVE)).thenReturn(proj);

        ReviewStatsResponse res = reviewQueryService.getProductReviewStats(productId);

        assertNotNull(res);
        assertEquals(4.57, res.getAvgRating());
        assertEquals(10L, res.getTotalReviews());
        assertEquals(3L, res.getWithImages());
        assertEquals(8L, res.getWithComments());

        assertEquals(1L, res.getStarsCount().get(1));
        assertEquals(5L, res.getStarsCount().get(5));
        assertEquals(10.0, res.getStarsPercent().get(1));
        assertEquals(50.0, res.getStarsPercent().get(5));
    }

    @Test
    @DisplayName("getProductReviewStats xử lý an toàn khi projection null hoặc các giá trị null")
    void testGetProductReviewStats_NullProjection() {
        UUID productId = UUID.randomUUID();
        when(reviewRepository.getStats(productId, ReviewStatus.ACTIVE)).thenReturn(null);

        ReviewStatsResponse res = reviewQueryService.getProductReviewStats(productId);

        assertNotNull(res);
        assertEquals(0.0, res.getAvgRating());
        assertEquals(0L, res.getTotalReviews());
        assertEquals(0L, res.getWithImages());
        assertEquals(0L, res.getWithComments());
        assertEquals(0L, res.getStarsCount().get(1));
        assertEquals(0.0, res.getStarsPercent().get(1));
    }
}
