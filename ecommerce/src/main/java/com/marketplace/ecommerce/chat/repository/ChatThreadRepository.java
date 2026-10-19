package com.marketplace.ecommerce.chat.repository;

import com.marketplace.ecommerce.chat.entity.ChatThread;
import com.marketplace.ecommerce.chat.enums.ThreadStatus;
import com.marketplace.ecommerce.chat.enums.ThreadType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
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

    @Query("SELECT t FROM ChatThread t WHERE t.type = :type ORDER BY COALESCE(t.lastMessageAt, t.createdAt) DESC")
    List<ChatThread> findByType(@Param("type") ThreadType type);

    Optional<ChatThread> findFirstByCustomer_IdAndTypeAndStatus(UUID customerId, ThreadType type, ThreadStatus status);

    Optional<ChatThread> findFirstByCustomer_IdAndShop_IdAndStatus(UUID customerId, UUID shopId, ThreadStatus status);

    Optional<ChatThread> findFirstByRequestIdAndType(UUID requestId, ThreadType type);

    Optional<ChatThread> findFirstByOrderIdAndType(UUID orderId, ThreadType type);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"shop.user.account", "customer"})
    @Query("SELECT t FROM ChatThread t WHERE t.requestId = :requestId AND t.type = com.marketplace.ecommerce.chat.enums.ThreadType.DISPUTE")
    Optional<ChatThread> findByRequestIdForUpdate(@Param("requestId") UUID requestId);

    @Modifying
    @Query(value = """
        INSERT INTO chat_threads (
            id, type, customer_account_id, shop_id, order_id, request_id, 
            customer_name, customer_avatar, title, status, unread_customer, unread_admin, 
            created_at, updated_at
        )
        VALUES (
            :id, 'DISPUTE', :customerId, :shopId, :orderId, :requestId, 
            :customerName, :customerAvatar, :title, 'OPEN', 0, 0, 
            :now, :now
        )
        ON CONFLICT (request_id) WHERE type = 'DISPUTE' DO NOTHING
    """, nativeQuery = true)
    int insertDisputeThreadSafe(
            @Param("id") UUID id,
            @Param("customerId") UUID customerId,
            @Param("shopId") UUID shopId,
            @Param("orderId") UUID orderId,
            @Param("requestId") UUID requestId,
            @Param("customerName") String customerName,
            @Param("customerAvatar") String customerAvatar,
            @Param("title") String title,
            @Param("now") LocalDateTime now
    );
}
