package com.marketplace.ecommerce.review.repository;

import com.marketplace.ecommerce.review.dto.response.ReviewResponse;
import com.marketplace.ecommerce.review.entity.Reply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReplyRepository extends JpaRepository<Reply, UUID> {

    boolean existsByReviewId(UUID reviewId);

    Optional<Reply> findByReviewId(UUID reviewId);



}
