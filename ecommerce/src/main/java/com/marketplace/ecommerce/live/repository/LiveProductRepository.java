package com.marketplace.ecommerce.live.repository;

import com.marketplace.ecommerce.live.entity.LiveProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LiveProductRepository extends JpaRepository<LiveProduct, UUID> {

    List<LiveProduct> findByLiveStreamIdOrderByDisplayOrderAsc(UUID liveStreamId);

    Optional<LiveProduct> findByLiveStreamIdAndIsPinnedTrue(UUID liveStreamId);

    Optional<LiveProduct> findByLiveStreamIdAndProductId(UUID liveStreamId, UUID productId);
}
