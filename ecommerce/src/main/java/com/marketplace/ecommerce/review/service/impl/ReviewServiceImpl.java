package com.marketplace.ecommerce.review.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.file.service.FileService;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.review.dto.request.CreateReviewRequest;
import com.marketplace.ecommerce.review.dto.request.UpdateReviewRequest;
import com.marketplace.ecommerce.review.dto.response.ReviewResponse;
import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.entity.ReviewImage;
import com.marketplace.ecommerce.review.repository.ReplyRepository;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.service.ReviewService;
import com.marketplace.ecommerce.review.validate.ReviewValidation;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {
    private final ReviewRepository reviewRepository;
    private final ReplyRepository replyRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ReviewValidation reviewValidation;
    private final FileService fileService;

    @Override
    public ReviewResponse getMyReview(UUID accountId, UUID productId, UUID subOrderId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Account not found"));

        Review review = reviewRepository.findByUserIdAndProductIdAndSubOrderId(user.getId(), productId, subOrderId)
                .orElseThrow(() -> new CustomException("Review not found"));

        return ReviewResponse.fromEntity(review);
    }


    @Override
    public Page<ReviewResponse> getProductReviews(UUID productId, Integer rating, Boolean hasImages, Pageable pageable) {

        Page<Review> reviewPage = reviewRepository.findWithFilters(
                productId,
                ReviewStatus.ACTIVE,
                rating,
                hasImages,
                pageable
        );
        return reviewPage.map(ReviewResponse::fromEntity);
    }


    @Override
    @Transactional
    public void deleteReview(UUID accountId, UUID reviewId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Account not found"));
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException("Review not found"));

        if (!review.getUser().getId().equals(user.getId())) {
            throw new CustomException("You don't have permission to delete this review.");
        }

        review.setStatus(ReviewStatus.DELETED);
        reviewRepository.save(review);
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(UUID accountId, UUID reviewId, UpdateReviewRequest request) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Account not found"));
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException("Review not found"));

        if (!review.getUser().getId().equals(user.getId())) {
            throw new CustomException("You don't have permission to update this review.");
        }

        if (review.getCreatedAt().plusDays(7).isBefore(LocalDateTime.now())) {
            throw new CustomException(" Review can only be updated within 7 days.");
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        processImages(review, request.getNewImages());

        reviewRepository.save(review);
        return ReviewResponse.fromEntity(review);
    }

    @Override
    public ReviewResponse createReview(UUID accountId, UUID productId, CreateReviewRequest request) {
        UUID orderId = reviewValidation.requireOrderId(request);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new CustomException("Product not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Order not found"));

        reviewValidation.validateCanReview(accountId, order, productId);

        UUID userId = order.getUser().getId();

        if (reviewRepository.existsByUserIdAndProductIdAndSubOrderIdAndStatus(
                userId, productId, orderId, ReviewStatus.ACTIVE)) {
            throw new CustomException("You are already reviewing this product.");
        }

        Review review = Review.builder()
                .user(order.getUser())
                .product(product)
                .subOrderId(orderId)
                .status(ReviewStatus.ACTIVE)
                .rating(request.getRating())
                .comment(request.getComment())
                .createdAt(LocalDateTime.now())
                .build();

        processImages(review, request.getImages());

        reviewRepository.save(review);

        return ReviewResponse.fromEntity(review);
    }


    private void processImages(Review review, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) return;

        List<ReviewImage> images = review.getImages();
        if (images == null) images = new ArrayList<>();

        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                try {
                    String url = fileService.getFileUrl(fileService.uploadFile(file, "reviews"));
                    images.add(ReviewImage.builder()
                            .review(review)
                            .imageUrl(url)
                            .displayOrder(images.size())
                            .build());
                } catch (Exception e) {
                    System.err.println("Upload failed: " + e.getMessage());
                }
            }
        }
        review.setImages(images);
    }
}
