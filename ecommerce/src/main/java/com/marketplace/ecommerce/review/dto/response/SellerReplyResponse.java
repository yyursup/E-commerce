package com.marketplace.ecommerce.review.dto.response;

import com.marketplace.ecommerce.review.entity.Reply;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SellerReplyResponse {
    private String reply;
    private LocalDateTime repliedAt;
    private Boolean editable;

    public static SellerReplyResponse from(Reply reply) {
        return SellerReplyResponse.builder()
                .reply(reply.getReply())
                .repliedAt(reply.getRepliedAt())
                .editable(true)
                .build();
    }
}
