package com.marketplace.ecommerce.review.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.review.dto.request.ReplyRequest;
import com.marketplace.ecommerce.review.dto.response.SellerReplyResponse;
import com.marketplace.ecommerce.review.entity.Reply;
import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.repository.ReplyRepository;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.service.ReplyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReplyServiceImpl implements ReplyService {

    private final ReviewRepository reviewRepository;
    private final ReplyRepository replyRepository;
    private final UserRepository userRepository;


    @Override
    public SellerReplyResponse updateReply(UUID accountId, ReplyRequest request) {

        User seller = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Account not found"));

        Reply reply = replyRepository.findByReviewId(request.getReviewId())
                .orElseThrow(() -> new CustomException("Review not found"));

        if (!reply.getReview().getProduct().getShop().getUser().getId()
                .equals(seller.getId())) {
            throw new CustomException("You don't have permission to update this reply.");
        }

        if (reply.getRepliedAt()
                .plusDays(7)
                .isBefore(LocalDateTime.now())) {
            throw new CustomException("Reply can only be updated within 7 days.");
        }

        reply.setReply(request.getReply());

        return SellerReplyResponse.from(replyRepository.save(reply));
    }


    @Override
    @Transactional
    public SellerReplyResponse replyToReview(UUID accountId, ReplyRequest request) {

        User seller = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Account not found"));

        Review review = reviewRepository.findById(request.getReviewId())
                .orElseThrow(() -> new CustomException("Review not found"));

        if (!review.getProduct().getShop().getUser().getId()
                .equals(seller.getId())) {
            throw new CustomException("You don't have permission to reply to this review.");
        }

        if (replyRepository.existsByReviewId(request.getReviewId())) {
            throw new CustomException("This review has already been replied to.");
        }

        Reply reply = Reply.builder()
                .review(review)
                .reply(request.getReply())
                .build();

        replyRepository.save(reply);
        return SellerReplyResponse.from(reply);
    }


}
