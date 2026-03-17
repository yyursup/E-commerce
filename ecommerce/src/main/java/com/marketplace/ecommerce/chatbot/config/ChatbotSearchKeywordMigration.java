package com.marketplace.ecommerce.chatbot.config;

import com.marketplace.ecommerce.chatbot.entity.ChatbotNode;
import com.marketplace.ecommerce.chatbot.entity.ChatbotOption;
import com.marketplace.ecommerce.chatbot.repository.ChatbotNodeRepository;
import com.marketplace.ecommerce.chatbot.repository.ChatbotOptionRepository;
import com.marketplace.ecommerce.chatbot.valueobject.ChatbotNodeType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Migration: add NODE_SEARCH_KEYWORD and point "Tìm sản phẩm" to full-text search
 * for DBs that were seeded before this change.
 */
@Component
@Order(101)
@RequiredArgsConstructor
@Slf4j
public class ChatbotSearchKeywordMigration implements CommandLineRunner {

    private final ChatbotNodeRepository nodeRepository;
    private final ChatbotOptionRepository optionRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (nodeRepository.findById("NODE_SEARCH_KEYWORD").isPresent()) {
            return;
        }
        log.info("Chatbot migration: adding NODE_SEARCH_KEYWORD (full-text search)...");

        ChatbotNode searchKeyword = new ChatbotNode();
        searchKeyword.setId("NODE_SEARCH_KEYWORD");
        searchKeyword.setMessageText("Nhập từ khóa sản phẩm bạn muốn tìm (ví dụ: áo thun, laptop)...");
        searchKeyword.setNodeType(ChatbotNodeType.INPUT_EXPECTED);
        searchKeyword.setRoleContext(null);
        searchKeyword.setSortOrder(0);
        nodeRepository.save(searchKeyword);

        ChatbotOption backOpt = new ChatbotOption();
        backOpt.setNodeId("NODE_SEARCH_KEYWORD");
        backOpt.setButtonLabel("Về menu");
        backOpt.setNextNodeId(null);
        backOpt.setActionPayload("BACK_TO_MENU");
        backOpt.setSortOrder(0);
        optionRepository.save(backOpt);

        for (String nodeId : List.of("NODE_GREETING_GUEST", "NODE_GREETING_BUYER")) {
            optionRepository.findByNodeIdOrderBySortOrderAsc(nodeId).stream()
                    .filter(o -> "SEARCH_PRODUCTS".equals(o.getActionPayload()))
                    .forEach(o -> {
                        o.setNextNodeId("NODE_SEARCH_KEYWORD");
                        optionRepository.save(o);
                    });
        }
        log.info("✓ NODE_SEARCH_KEYWORD migration done.");
    }
}
