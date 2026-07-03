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

@Component
@Order(102)
@RequiredArgsConstructor
@Slf4j
public class ChatbotAiChatMigration implements CommandLineRunner {

    private final ChatbotNodeRepository nodeRepository;
    private final ChatbotOptionRepository optionRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (nodeRepository.findById("NODE_AI_CHAT").isPresent()) {
            log.info("→ Chatbot AI migration: NODE_AI_CHAT already exists, skip.");
            return;
        }
        log.info("Chatbot migration: adding NODE_AI_CHAT (Gemini AI Chatbot)...");

        // 1. Tạo node NODE_AI_CHAT nếu chưa có
        if (!nodeRepository.findById("NODE_AI_CHAT").isPresent()) {
            ChatbotNode aiNode = new ChatbotNode();
            aiNode.setId("NODE_AI_CHAT");
            aiNode.setMessageText("Tôi là Trợ lý AI được tích hợp mô hình Gemini. Tôi có thể giúp bạn giải đáp thắc mắc về sản phẩm, chính sách bán hàng, hoặc hỗ trợ mua sắm. Hãy nhập câu hỏi của bạn!");
            aiNode.setNodeType(ChatbotNodeType.INPUT_EXPECTED);
            aiNode.setRoleContext(null);
            aiNode.setSortOrder(0);
            nodeRepository.save(aiNode);

            // 2. Option cho NODE_AI_CHAT quay lại menu chính
            ChatbotOption backOpt = new ChatbotOption();
            backOpt.setNodeId("NODE_AI_CHAT");
            backOpt.setButtonLabel("Về menu");
            backOpt.setNextNodeId(null);
            backOpt.setActionPayload("BACK_TO_MENU");
            backOpt.setSortOrder(99);
            optionRepository.save(backOpt);
        }

        // 3. Xoá mọi option AI_CHAT cũ trong DB (để dọn dẹp menu chính)
        optionRepository.findAll().stream()
                .filter(o -> "AI_CHAT".equals(o.getActionPayload()))
                .forEach(optionRepository::delete);

        log.info("✓ NODE_AI_CHAT migration successfully applied (no action buttons seeded).");
    }
}
