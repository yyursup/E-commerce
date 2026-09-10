package com.marketplace.ecommerce.chat.config;

import com.marketplace.ecommerce.chat.entity.ChatbotNode;
import com.marketplace.ecommerce.chat.entity.ChatbotOption;
import com.marketplace.ecommerce.chat.enums.ChatbotNodeType;
import com.marketplace.ecommerce.chat.repository.ChatbotNodeRepository;
import com.marketplace.ecommerce.chat.repository.ChatbotOptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(100)
@RequiredArgsConstructor
@Slf4j
public class ChatbotDataInitializer implements CommandLineRunner {

    private final ChatbotNodeRepository nodeRepository;
    private final ChatbotOptionRepository optionRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (nodeRepository.count() > 0) {
            log.info("→ Chatbot nodes already exist, skip seed.");
            return;
        }
        seedChatbotNodesAndOptions();
    }

    private void seedChatbotNodesAndOptions() {
        log.info("Seeding chatbot nodes and options...");

        // ---- GUEST / BUYER root ----
        ChatbotNode greetingGuest = new ChatbotNode();
        greetingGuest.setId("NODE_GREETING_GUEST");
        greetingGuest.setMessageText("Xin chào! Tôi có thể giúp bạn: tìm sản phẩm, xem chính sách. Bạn cần gì?");
        greetingGuest.setNodeType(ChatbotNodeType.MENU);
        greetingGuest.setRoleContext("GUEST");
        greetingGuest.setSortOrder(0);
        nodeRepository.save(greetingGuest);

        ChatbotNode greetingBuyer = new ChatbotNode();
        greetingBuyer.setId("NODE_GREETING_BUYER");
        greetingBuyer.setMessageText("Xin chào! Tôi có thể giúp bạn: tìm sản phẩm, xem chính sách. Bạn cần gì?");
        greetingBuyer.setNodeType(ChatbotNodeType.MENU);
        greetingBuyer.setRoleContext("BUYER");
        greetingBuyer.setSortOrder(0);
        nodeRepository.save(greetingBuyer);

        // Policy
        ChatbotNode policy = new ChatbotNode();
        policy.setId("NODE_POLICY_SHIPPING");
        policy.setMessageText("Chính sách vận chuyển: Phí ship theo GHN. Hoàn trả trong 7 ngày nếu sản phẩm lỗi. Chi tiết xem tại trang Chính sách.");
        policy.setNodeType(ChatbotNodeType.MENU);
        policy.setRoleContext(null);
        policy.setSortOrder(0);
        nodeRepository.save(policy);

        // SELLER root
        ChatbotNode greetingSeller = new ChatbotNode();
        greetingSeller.setId("NODE_GREETING_SELLER");
        greetingSeller.setMessageText("Xin chào Seller! Bạn có thể: kiểm tra KYC, xem hướng dẫn onboarding, thống kê nhanh, hoặc gặp nhân viên.");
        greetingSeller.setNodeType(ChatbotNodeType.MENU);
        greetingSeller.setRoleContext("SELLER");
        greetingSeller.setSortOrder(0);
        nodeRepository.save(greetingSeller);

        // KYC result (dynamic message)
        ChatbotNode kycResult = new ChatbotNode();
        kycResult.setId("NODE_KYC_RESULT");
        kycResult.setMessageText("");
        kycResult.setNodeType(ChatbotNodeType.TEXT_ONLY);
        kycResult.setRoleContext(null);
        kycResult.setSortOrder(0);
        nodeRepository.save(kycResult);

        // Onboarding
        ChatbotNode onboarding = new ChatbotNode();
        onboarding.setId("NODE_ONBOARDING");
        onboarding.setMessageText("Hướng dẫn đăng sản phẩm chuẩn SEO: 1) Tiêu đề rõ ràng, có từ khóa. 2) Mô tả đầy đủ, ảnh chất lượng. 3) Giá và biến thể nhất quán. Vào Seller → Sản phẩm để thêm mới.");
        onboarding.setNodeType(ChatbotNodeType.MENU);
        onboarding.setRoleContext(null);
        onboarding.setSortOrder(0);
        nodeRepository.save(onboarding);

        // Seller stats result (dynamic)
        ChatbotNode sellerStatsResult = new ChatbotNode();
        sellerStatsResult.setId("NODE_SELLER_STATS_RESULT");
        sellerStatsResult.setMessageText("");
        sellerStatsResult.setNodeType(ChatbotNodeType.TEXT_ONLY);
        sellerStatsResult.setRoleContext(null);
        sellerStatsResult.setSortOrder(0);
        nodeRepository.save(sellerStatsResult);

        // Search: choose category
        ChatbotNode searchCategory = new ChatbotNode();
        searchCategory.setId("NODE_SEARCH_CATEGORY");
        searchCategory.setMessageText("Chọn danh mục hoặc bỏ qua để xem tất cả.");
        searchCategory.setNodeType(ChatbotNodeType.MENU);
        searchCategory.setRoleContext(null);
        searchCategory.setSortOrder(0);
        nodeRepository.save(searchCategory);

        // Search: choose price (simplified: 3 ranges)
        ChatbotNode searchPrice = new ChatbotNode();
        searchPrice.setId("NODE_SEARCH_PRICE");
        searchPrice.setMessageText("Chọn mức giá (VNĐ).");
        searchPrice.setNodeType(ChatbotNodeType.MENU);
        searchPrice.setRoleContext(null);
        searchPrice.setSortOrder(0);
        nodeRepository.save(searchPrice);

        // Search by keyword (full-text, chat-like)
        ChatbotNode searchKeyword = new ChatbotNode();
        searchKeyword.setId("NODE_SEARCH_KEYWORD");
        searchKeyword.setMessageText("Nhập từ khóa sản phẩm bạn muốn tìm (ví dụ: áo thun, laptop)...");
        searchKeyword.setNodeType(ChatbotNodeType.INPUT_EXPECTED);
        searchKeyword.setRoleContext(null);
        searchKeyword.setSortOrder(0);
        nodeRepository.save(searchKeyword);

        // ---- Options for GUEST/BUYER root ----
        saveOption(greetingGuest.getId(), "Tìm sản phẩm", "NODE_SEARCH_KEYWORD", "SEARCH_PRODUCTS");
        saveOption(greetingGuest.getId(), "Chính sách & Hỗ trợ", "NODE_POLICY_SHIPPING", "POLICY_SHIPPING");
        saveOption(greetingGuest.getId(), "Gặp nhân viên", null, "HUMAN_HANDOFF");

        saveOption(greetingBuyer.getId(), "Tìm sản phẩm", "NODE_SEARCH_KEYWORD", "SEARCH_PRODUCTS");
        saveOption(greetingBuyer.getId(), "Chính sách & Hỗ trợ", "NODE_POLICY_SHIPPING", "POLICY_SHIPPING");
        saveOption(greetingBuyer.getId(), "Gặp nhân viên", null, "HUMAN_HANDOFF");

        // Option for NODE_SEARCH_KEYWORD (back to menu; nextNodeId null = use session root)
        saveOption(searchKeyword.getId(), "Về menu", null, "BACK_TO_MENU");

        // Options for policy (back to guest/buyer menu)
        saveOption(policy.getId(), "Về menu", "NODE_GREETING_GUEST", "BACK_TO_MENU");

        // SELLER options
        saveOption(greetingSeller.getId(), "Kiểm tra trạng thái KYC", "NODE_KYC_RESULT", "KYC_STATUS");
        saveOption(greetingSeller.getId(), "Hướng dẫn Onboarding", "NODE_ONBOARDING", "ONBOARDING");
        saveOption(greetingSeller.getId(), "Thống kê nhanh", "NODE_SELLER_STATS_RESULT", "SELLER_STATS");
        saveOption(greetingSeller.getId(), "Gặp nhân viên", null, "HUMAN_HANDOFF");

        saveOption(kycResult.getId(), "Về menu", "NODE_GREETING_SELLER", "BACK_TO_MENU");
        saveOption(onboarding.getId(), "Về menu", "NODE_GREETING_SELLER", "BACK_TO_MENU");
        saveOption(sellerStatsResult.getId(), "Về menu", "NODE_GREETING_SELLER", "BACK_TO_MENU");

        // Search flow: options for NODE_SEARCH_CATEGORY will be built dynamically (categories) in service.
        saveOption(searchCategory.getId(), "Xem tất cả danh mục", "NODE_SEARCH_PRICE", "SEARCH_ALL");
        saveOption(searchPrice.getId(), "Dưới 1 triệu", null, "SEARCH_PRICE_UNDER_1M");
        saveOption(searchPrice.getId(), "1 - 5 triệu", null, "SEARCH_PRICE_1M_5M");
        saveOption(searchPrice.getId(), "Trên 5 triệu", null, "SEARCH_PRICE_OVER_5M");
        saveOption(searchPrice.getId(), "Về menu", "NODE_GREETING_GUEST", "BACK_TO_MENU");

        log.info("✓ Chatbot nodes and options seeded.");
    }

    private void saveOption(String nodeId, String buttonLabel, String nextNodeId, String actionPayload) {
        ChatbotOption opt = new ChatbotOption();
        opt.setNodeId(nodeId);
        opt.setButtonLabel(buttonLabel);
        opt.setNextNodeId(nextNodeId);
        opt.setActionPayload(actionPayload);
        opt.setSortOrder(0);
        optionRepository.save(opt);
    }
}
