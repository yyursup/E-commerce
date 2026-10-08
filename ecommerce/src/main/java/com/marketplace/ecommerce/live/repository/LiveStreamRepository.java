package com.marketplace.ecommerce.live.repository;

import com.marketplace.ecommerce.live.entity.LiveStream;
import com.marketplace.ecommerce.live.entity.LiveStreamStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LiveStreamRepository extends JpaRepository<LiveStream, UUID> {

    Optional<LiveStream> findByRoomName(String roomName);

    List<LiveStream> findByStatusOrderByStartedAtDesc(LiveStreamStatus status);

    List<LiveStream> findByShopIdOrderByCreatedAtDesc(UUID shopId);

    Optional<LiveStream> findFirstByShopIdAndStatus(UUID shopId, LiveStreamStatus status);

    @Query("SELECT l FROM LiveStream l LEFT JOIN FETCH l.products lp LEFT JOIN FETCH lp.product WHERE l.id = :id")
    Optional<LiveStream> findByIdWithProducts(@Param("id") UUID id);
}
