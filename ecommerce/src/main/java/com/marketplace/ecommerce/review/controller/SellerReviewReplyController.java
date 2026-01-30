package com.marketplace.ecommerce.review.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.review.dto.request.SellerReplyRequest;
import com.marketplace.ecommerce.review.dto.response.SellerReplyResponse;
import com.marketplace.ecommerce.review.service.SellerReviewReplyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/reviews")
@RequiredArgsConstructor
public class SellerReviewReplyController {

    private final SellerReviewReplyService replyService;

    @PostMapping("/{reviewId}/reply")
    @PreAuthorize("hasRole('BUSINESS')")
    public ResponseEntity<SellerReplyResponse> replyToReview(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID reviewId,
            @Valid @RequestBody SellerReplyRequest request
    ) {
        SellerReplyResponse res = replyService.replyToReview(u.getAccountId(), reviewId, request.getReply());
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{reviewId}/reply")
    @PreAuthorize("hasRole('BUSINESS')")
    public ResponseEntity<SellerReplyResponse> updateReply(
            @CurrentUser CurrentUserInfo u,
            @PathVariable UUID reviewId,
            @Valid @RequestBody SellerReplyRequest request
    ) {
        SellerReplyResponse res = replyService.updateReply(u.getAccountId(), reviewId, request.getReply());
        return ResponseEntity.ok(res);
    }
}
