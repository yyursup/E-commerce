package com.marketplace.ecommerce.review.dto.response;

import com.marketplace.ecommerce.review.entity.Reply;
import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.entity.ReviewImage;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
public class ReviewResponse {
    private UUID id;
    private UUID userId;
    private UUID productId;
    private String userFullName;
    private String userAvatarUrl;
    private Integer rating;
    private String comment;
    private SellerReplyResponse sellerReply;
    private Boolean sellerCanReply;
    private Boolean isVerifiedPurchase;
    private List<String> imageUrls;
    private LocalDateTime createdAt;
    private boolean warning;
    private int flagCount;
    private ReviewStatus status;
    private String productName;
    private String productThumbnail;


    public static ReviewResponse fromEntity(Review review) {
        String originalName = review.getUser() != null ? review.getUser().getFullName() : null;
        if (originalName == null || originalName.isEmpty()) {
            originalName = review.getUser() != null ? review.getUser().getEmail() : "Người dùng";
        }

        String maskedName = originalName;
        if (originalName.length() > 2) {
            maskedName = originalName.charAt(0) + "****" + originalName.charAt(originalName.length() - 1);
        }
        Reply reply = review.getReply();

        String prodName = null;
        String prodThumb = null;
        if (review.getProduct() != null) {
            prodName = review.getProduct().getName();
            if (review.getProduct().getImages() != null && !review.getProduct().getImages().isEmpty()) {
                prodThumb = review.getProduct().getImages().iterator().next().getImageUrl();
            }
        }

        return ReviewResponse.builder()
                .id(review.getId())
                .userId(review.getUser() != null ? review.getUser().getId() : null)
                .productId(review.getProduct() != null ? review.getProduct().getId() : null)
                .productName(prodName)
                .productThumbnail(prodThumb)
                .userFullName(maskedName)
                .userAvatarUrl(review.getUser() != null ? review.getUser().getAvatarUrl() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .sellerReply(reply == null ? null : SellerReplyResponse.from(reply))
                .isVerifiedPurchase(review.getSubOrderId() != null)
                .imageUrls(review.getImages() != null ? review.getImages().stream()
                        .map(ReviewImage::getImageUrl)
                        .collect(Collectors.toList()) : java.util.Collections.emptyList())
                .createdAt(review.getCreatedAt())
                .status(review.getStatus())
                .warning(review.isFlagged())
                .flagCount(review.getReportCount())
                .build();
    }

}