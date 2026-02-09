package com.marketplace.ecommerce.review.dto.projection;

public interface ReviewStatsProjection {
    Double getAvgRating();
    Long getTotalReviews();
    Long getWithImages();
    Long getWithComments();

    Number getStar1();
    Number getStar2();
    Number getStar3();
    Number getStar4();
    Number getStar5();
}
