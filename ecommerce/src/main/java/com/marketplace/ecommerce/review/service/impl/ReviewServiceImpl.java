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
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.service.ReviewService;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import com.marketplace.ecommerce.shipping.valueObjects.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final FileService fileService;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ReviewResponse createReview(UUID accountId, UUID productId, CreateReviewRequest request) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        Product product = productRepository.findByIdAndDeletedFalse(productId)
                .orElseThrow(() -> new CustomException("Product not found"));

        if (request.getSubOrderId() == null) {
            throw new CustomException("Order is required to review");
        }

        Order order = orderRepository.findByIdAndUserId(request.getSubOrderId(), user.getId())
                .orElseThrow(() -> new CustomException("Order not found"));

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new CustomException("Order is not delivered");
        }

        boolean hasProduct = order.getItems().stream()
                .anyMatch(item -> item.getProduct().getId().equals(productId));
        if (!hasProduct) {
            throw new CustomException("Product not found in order");
        }

        Optional<Review> existingReviewOpt = reviewRepository.findByUserIdAndProductIdAndSubOrderId(
                user.getId(), productId, request.getSubOrderId());

        Review review;
        if (existingReviewOpt.isPresent()) {
            Review existingReview = existingReviewOpt.get();
            if (existingReview.getStatus() == ReviewStatus.ACTIVE) {
                throw new CustomException("Review already exists");
            }
            if (existingReview.getStatus() != ReviewStatus.DELETED) {
                throw new CustomException("Review is under moderation");
            }
            review = existingReview;
            review.setStatus(ReviewStatus.ACTIVE);
            review.setCreatedAt(LocalDateTime.now());
        } else {
            review = new Review();
            review.setUser(user);
            review.setProduct(product);
            review.setSubOrderId(request.getSubOrderId());
            review.setStatus(ReviewStatus.ACTIVE);
            review.setIsVerifiedPurchase(true);
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());

        review = reviewRepository.save(review);

        if (existingReviewOpt.isPresent()) {
            review.getImages().clear();
        }
        processImages(review, request.getImages());

        return ReviewResponse.fromEntity(review);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getProductReviews(UUID productId, int page, int size, Integer rating, Boolean hasImages, String sortBy) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        if ("oldest".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.ASC, "createdAt");
        }
        Pageable pageable = PageRequest.of(page, size, sort);

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
    public ReviewResponse updateReview(UUID accountId, UUID reviewId, UpdateReviewRequest request) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException("Review not found"));

        if (!review.getUser().getId().equals(user.getId())) {
            throw new CustomException("You don't have permission to update this review");
        }

        if (review.getCreatedAt().plusDays(7).isBefore(LocalDateTime.now())) {
            throw new CustomException("Update window expired");
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        processImages(review, request.getNewImages());

        review = reviewRepository.save(review);
        return ReviewResponse.fromEntity(review);
    }

    @Override
    @Transactional
    public void deleteReview(UUID accountId, UUID reviewId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException("Review not found"));

        if (!review.getUser().getId().equals(user.getId())) {
            throw new CustomException("You don't have permission to delete this review");
        }

        review.setStatus(ReviewStatus.DELETED);
        reviewRepository.save(review);
    }

    @Override
    public ReviewResponse getReviewById(UUID reviewId) {
        return ReviewResponse.fromEntity(reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException("Review not found")));
    }

    @Override
    public Double getAverageRating(UUID productId) {
        return reviewRepository.getAverageRating(productId);
    }

    @Override
    public long getTotalReviews(UUID productId) {
        return reviewRepository.countByProductId(productId);
    }

    private void processImages(Review review, List<org.springframework.web.multipart.MultipartFile> files) {
        if (files == null || files.isEmpty()) return;

        List<ReviewImage> images = review.getImages();
        if (images == null) images = new ArrayList<>();

        for (var file : files) {
            if (file == null || file.isEmpty()) continue;
            try {
                String url = fileService.getFileUrl(fileService.uploadFile(file, "reviews"));
                images.add(ReviewImage.builder()
                        .review(review)
                        .imageUrl(url)
                        .displayOrder(images.size())
                        .build());
            } catch (Exception e) {
                throw new CustomException("Failed to upload review image");
            }
        }
        review.setImages(images);
    }
}
