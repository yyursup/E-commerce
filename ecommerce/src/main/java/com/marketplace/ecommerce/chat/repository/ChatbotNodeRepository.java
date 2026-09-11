package com.marketplace.ecommerce.chat.repository;

import com.marketplace.ecommerce.chat.entity.ChatbotNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatbotNodeRepository extends JpaRepository<ChatbotNode, String> {
}
