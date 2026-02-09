package com.marketplace.ecommerce.review.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.review.dto.request.ReplyRequest;
import com.marketplace.ecommerce.review.dto.response.SellerReplyResponse;
import com.marketplace.ecommerce.review.service.ReplyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(version = "1", path = "/reply")
@RequiredArgsConstructor
public class ReplyController {
    private final ReplyService replyService;

    @PostMapping("/reviews/reply")
    @PreAuthorize("hasAnyRole('ADMIN','BUSINESS')")
    public ResponseEntity<SellerReplyResponse> replyToReview(
            @CurrentUser CurrentUserInfo u,
            @Valid @RequestBody ReplyRequest request
    ) {
        SellerReplyResponse res = replyService.replyToReview(u.getAccountId(), request);
        return ResponseEntity.ok(res);
    }

    @PutMapping("/reviews/update")
    @PreAuthorize("hasAnyRole('ADMIN','BUSINESS')")
    public ResponseEntity<SellerReplyResponse> updateReply(
            @CurrentUser CurrentUserInfo u,
            @Valid @RequestBody ReplyRequest request
    ) {
        return ResponseEntity.ok(replyService.updateReply(u.getAccountId(), request));
    }
}
