package com.marketplace.ecommerce.chatbot.config;

import com.marketplace.ecommerce.chatbot.entity.ChatbotOption;
import com.marketplace.ecommerce.chatbot.repository.ChatbotNodeRepository;
import com.marketplace.ecommerce.chatbot.repository.ChatbotOptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Migration: xóa hoàn toàn chức năng tra cứu đơn hàng khỏi chatbot (nodes + options).
 */
@Component
@Order(102)
@RequiredArgsConstructor
@Slf4j
public class ChatbotOrderTrackingRemovalMigration implements CommandLineRunner {

    private final ChatbotNodeRepository nodeRepository;
    private final ChatbotOptionRepository optionRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (nodeRepository.findById("NODE_ASK_ORDER_ID").isEmpty()) {
            return;
        }
        log.info("Chatbot migration: removing order-tracking feature...");

        optionRepository.deleteAll(optionRepository.findByNodeIdOrderBySortOrderAsc("NODE_ASK_ORDER_ID"));
        optionRepository.deleteAll(optionRepository.findByNodeIdOrderBySortOrderAsc("NODE_ORDER_RESULT"));

        List<String> rootIds = List.of("NODE_GREETING_GUEST", "NODE_GREETING_BUYER");
        for (String nodeId : rootIds) {
            List<ChatbotOption> toRemove = optionRepository.findByNodeIdOrderBySortOrderAsc(nodeId).stream()
                    .filter(o -> "TRACK_ORDER".equals(o.getActionPayload()))
                    .collect(Collectors.toList());
            optionRepository.deleteAll(toRemove);
        }

        nodeRepository.deleteById("NODE_ASK_ORDER_ID");
        nodeRepository.deleteById("NODE_ORDER_RESULT");

        log.info("✓ Order-tracking removal migration done.");
    }
}
