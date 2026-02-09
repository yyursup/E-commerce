package com.marketplace.ecommerce.review.repository;

import com.marketplace.ecommerce.review.entity.ReviewImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReviewImageRepository extends JpaRepository<ReviewImage, UUID> {
}
