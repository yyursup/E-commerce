package com.marketplace.ecommerce.review.dto.response;

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
    private Boolean isVerifiedPurchase;
    private List<String> imageUrls;
    private LocalDateTime createdAt;
    private ReviewStatus status;
    private int reportCount;
    private boolean flagged;

    public static ReviewResponse fromEntity(Review review) {
        String originalName = review.getUser().getFullName();
        if (originalName == null || originalName.isEmpty()) {
            originalName = review.getUser().getEmail();
        }

        String maskedName = originalName;
        if (originalName.length() > 2) {
            maskedName = originalName.charAt(0) + "****" + originalName.charAt(originalName.length() - 1);
        }

        return ReviewResponse.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .productId(review.getProduct().getId())
                .userFullName(maskedName)
                .userAvatarUrl(review.getUser().getAvatarUrl())
                .rating(review.getRating())
                .comment(review.getComment())
                .isVerifiedPurchase(review.getIsVerifiedPurchase())
                .imageUrls(review.getImages().stream()
                        .map(ReviewImage::getImageUrl)
                        .collect(Collectors.toList()))
                .createdAt(review.getCreatedAt())
                .status(review.getStatus())
                .reportCount(review.getReportCount())
                .flagged(review.isFlagged())
                .build();
    }
}
