package com.marketplace.ecommerce.request.repository;

import com.marketplace.ecommerce.request.entity.Seller;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SellerRepository extends JpaRepository<Seller, UUID> {
    Seller findByRequestId(UUID requestId);
}
