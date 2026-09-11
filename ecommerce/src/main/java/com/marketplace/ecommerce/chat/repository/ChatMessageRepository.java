package com.marketplace.ecommerce.chat.repository;

import com.marketplace.ecommerce.chat.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    Page<ChatMessage> findByThread_IdOrderByCreatedAtDesc(UUID threadId, Pageable pageable);

    List<ChatMessage> findByThread_IdOrderByCreatedAtAsc(UUID threadId);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.readAt = :readAt WHERE m.thread.id = :threadId AND m.readAt IS NULL AND m.senderId != :userId")
    int markAllAsRead(@Param("threadId") UUID threadId, @Param("userId") UUID userId, @Param("readAt") LocalDateTime readAt);

    long countByThread_IdAndReadAtIsNullAndSenderIdNot(UUID threadId, UUID senderId);
}
