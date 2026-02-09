package com.marketplace.ecommerce.review.service;

import com.marketplace.ecommerce.review.dto.request.ReplyRequest;
import com.marketplace.ecommerce.review.dto.response.ReviewResponse;
import com.marketplace.ecommerce.review.dto.response.SellerReplyResponse;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface ReplyService {

    SellerReplyResponse replyToReview(UUID accountId, ReplyRequest request);

    SellerReplyResponse updateReply(UUID accountId, ReplyRequest request);

}
