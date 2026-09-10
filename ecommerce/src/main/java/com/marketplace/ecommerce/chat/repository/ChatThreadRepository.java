package com.marketplace.ecommerce.chat.repository;

import com.marketplace.ecommerce.chat.entity.ChatThread;
import com.marketplace.ecommerce.chat.enums.ThreadStatus;
import com.marketplace.ecommerce.chat.enums.ThreadType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatThreadRepository extends JpaRepository<ChatThread, UUID> {

    @Query("SELECT t FROM ChatThread t WHERE t.customer.id = :customerId ORDER BY COALESCE(t.lastMessageAt, t.createdAt) DESC")
    List<ChatThread> findByCustomerId(@Param("customerId") UUID customerId);

    @Query("SELECT t FROM ChatThread t ORDER BY COALESCE(t.lastMessageAt, t.createdAt) DESC")
    List<ChatThread> findAllOrderByLastMessageAtDesc();

    @Query("SELECT t FROM ChatThread t WHERE t.status = :status ORDER BY COALESCE(t.lastMessageAt, t.createdAt) DESC")
    List<ChatThread> findByStatusOrderByLastMessageAtDesc(@Param("status") ThreadStatus status);

    @Query("SELECT t FROM ChatThread t WHERE t.shop.id = :shopId ORDER BY COALESCE(t.lastMessageAt, t.createdAt) DESC")
    List<ChatThread> findByShopId(@Param("shopId") UUID shopId);

    Optional<ChatThread> findFirstByCustomer_IdAndTypeAndStatus(UUID customerId, ThreadType type, ThreadStatus status);

    Optional<ChatThread> findFirstByCustomer_IdAndShop_IdAndStatus(UUID customerId, UUID shopId, ThreadStatus status);
}
