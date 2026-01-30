package com.marketplace.ecommerce.review.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.review.dto.response.SellerReplyResponse;
import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.entity.SellerReviewReply;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.repository.SellerReviewReplyRepository;
import com.marketplace.ecommerce.review.service.SellerReviewReplyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SellerReviewReplyServiceImpl implements SellerReviewReplyService {

    private final ReviewRepository reviewRepository;
    private final SellerReviewReplyRepository replyRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public SellerReplyResponse replyToReview(UUID accountId, UUID reviewId, String reply) {
        User seller = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException("Review not found"));

        if (!review.getProduct().getShop().getUser().getId().equals(seller.getId())) {
            throw new CustomException("You don't have permission to reply to this review");
        }

        if (replyRepository.existsByReviewId(reviewId)) {
            throw new CustomException("Review already has a reply");
        }

        if (reply == null || reply.isBlank() || reply.length() > 1000) {
            throw new CustomException("Invalid reply content");
        }

        SellerReviewReply entity = SellerReviewReply.builder()
                .review(review)
                .reply(reply.trim())
                .build();

        replyRepository.save(entity);

        return SellerReplyResponse.builder()
                .reply(entity.getReply())
                .repliedAt(entity.getRepliedAt())
                .editable(true)
                .build();
    }

    @Override
    @Transactional
    public SellerReplyResponse updateReply(UUID accountId, UUID reviewId, String reply) {
        User seller = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        SellerReviewReply entity = replyRepository.findByReviewId(reviewId)
                .orElseThrow(() -> new CustomException("Reply not found"));

        if (!entity.getReview().getProduct().getShop().getUser().getId().equals(seller.getId())) {
            throw new CustomException("You don't have permission to update this reply");
        }

        if (entity.getRepliedAt().plusDays(7).isBefore(LocalDateTime.now())) {
            throw new CustomException("Update window expired");
        }

        if (reply == null || reply.isBlank() || reply.length() > 1000) {
            throw new CustomException("Invalid reply content");
        }

        entity.setReply(reply.trim());
        replyRepository.save(entity);

        return SellerReplyResponse.builder()
                .reply(entity.getReply())
                .repliedAt(entity.getRepliedAt())
                .editable(true)
                .build();
    }
}
