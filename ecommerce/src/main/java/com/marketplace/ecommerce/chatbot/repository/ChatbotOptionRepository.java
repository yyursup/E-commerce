package com.marketplace.ecommerce.chatbot.repository;

import com.marketplace.ecommerce.chatbot.entity.ChatbotOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatbotOptionRepository extends JpaRepository<ChatbotOption, UUID> {
    List<ChatbotOption> findByNodeIdOrderBySortOrderAsc(String nodeId);
}
