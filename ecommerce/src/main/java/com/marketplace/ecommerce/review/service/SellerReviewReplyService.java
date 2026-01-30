package com.marketplace.ecommerce.review.service;

import com.marketplace.ecommerce.review.dto.response.SellerReplyResponse;

import java.util.UUID;

public interface SellerReviewReplyService {
    SellerReplyResponse replyToReview(UUID accountId, UUID reviewId, String reply);

    SellerReplyResponse updateReply(UUID accountId, UUID reviewId, String reply);
}
