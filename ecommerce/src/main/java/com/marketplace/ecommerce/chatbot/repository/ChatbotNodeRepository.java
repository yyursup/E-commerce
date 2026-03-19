package com.marketplace.ecommerce.chatbot.repository;

import com.marketplace.ecommerce.chatbot.entity.ChatbotNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatbotNodeRepository extends JpaRepository<ChatbotNode, String> {
}
