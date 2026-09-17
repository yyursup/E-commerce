package com.marketplace.ecommerce.request.repository;

import com.marketplace.ecommerce.request.entity.Seller;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SellerRepository extends JpaRepository<Seller, UUID> {
    Seller findByRequestId(UUID requestId);

    @Query("select count(s) > 0 from Seller s where lower(trim(s.shopName)) = lower(trim(:shopName)) and s.request.status = com.marketplace.ecommerce.request.valueObjects.RequestStatus.PENDING")
    boolean existsPendingByShopNameIgnoreCase(@Param("shopName") String shopName);

    @Query("select count(s) > 0 from Seller s where trim(s.taxCode) = trim(:taxCode) and s.request.status = com.marketplace.ecommerce.request.valueObjects.RequestStatus.PENDING")
    boolean existsPendingByTaxCode(@Param("taxCode") String taxCode);

    @Query("select count(s) > 0 from Seller s where trim(s.shopPhone) = trim(:shopPhone) and s.request.status = com.marketplace.ecommerce.request.valueObjects.RequestStatus.PENDING")
    boolean existsPendingByShopPhone(@Param("shopPhone") String shopPhone);
}
