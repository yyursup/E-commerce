package com.marketplace.ecommerce.chatbot.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.chatbot.dto.response.ChatbotOptionResponse;
import com.marketplace.ecommerce.chatbot.dto.response.ChatbotProductCardResponse;
import com.marketplace.ecommerce.chatbot.dto.response.ChatbotResponse;
import com.marketplace.ecommerce.chatbot.dto.request.ChatbotInteractRequest;
import com.marketplace.ecommerce.chatbot.entity.ChatbotNode;
import com.marketplace.ecommerce.chatbot.parser.SearchIntent;
import com.marketplace.ecommerce.chatbot.parser.SearchQueryParser;
import com.marketplace.ecommerce.chatbot.entity.ChatbotOption;
import com.marketplace.ecommerce.chatbot.repository.ChatbotNodeRepository;
import com.marketplace.ecommerce.chatbot.constant.LiveChatConstants;
import com.marketplace.ecommerce.chatbot.repository.ChatbotOptionRepository;
import com.marketplace.ecommerce.chatbot.service.ChatbotService;
import com.marketplace.ecommerce.chatbot.service.GeminiService;
import com.marketplace.ecommerce.chatbot.valueobject.ChatbotNodeType;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.product.dto.request.PageQueryRequest;
import com.marketplace.ecommerce.product.dto.response.CategoryResponse;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.product.service.CategoryService;
import com.marketplace.ecommerce.product.service.QueryProductService;
import com.marketplace.ecommerce.recommendation.service.RecommendationService;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpSession;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatbotServiceImpl implements ChatbotService {

    private static final String SESSION_CURRENT_NODE = "chatbotCurrentNode";
    private static final String SESSION_ROOT_NODE = "chatbotRootNode";
    private static final String SESSION_LIVE_CHAT = "chatbotLiveChat";
    private static final String SESSION_SEARCH_CATEGORY_ID = "chatbotSearchCategoryId";

    private final ChatbotNodeRepository nodeRepository;
    private final ChatbotOptionRepository optionRepository;
    private final QueryProductService queryProductService;
    private final CategoryService categoryService;
    private final RecommendationService recommendationService;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final OrderRepository orderRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final GeminiService geminiService;

    // Base URL for frontend links returned by chatbot (product detail, etc.)
    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Override
    @Transactional(readOnly = true)
    public ChatbotResponse init(HttpSession session, CurrentUserInfo principal) {
        String current = (String) session.getAttribute(SESSION_CURRENT_NODE);
        String roleContext = getRoleContext(principal);
        String rootNodeId = getRootNodeId(roleContext);

        if (current == null || current.isBlank()) {
            session.setAttribute(SESSION_ROOT_NODE, rootNodeId);
            session.setAttribute(SESSION_CURRENT_NODE, rootNodeId);
            current = rootNodeId;
        }

        ChatbotNode node = nodeRepository.findById(current).orElse(null);
        if (node == null) {
            session.setAttribute(SESSION_CURRENT_NODE, rootNodeId);
            node = nodeRepository.findById(rootNodeId).orElseThrow(() -> new IllegalStateException("Root node not found: " + rootNodeId));
        }

        ChatbotResponse resp = buildResponse(session, node, principal);
        if (rootNodeId.equals(current)) {
            session.removeAttribute("chatbotHistory");
            session.removeAttribute("chatbotLastAiProducts");
            UUID userId = principal != null && principal.getAccountId() != null
                    ? userRepository.findByAccountId(principal.getAccountId()).map(u -> u.getId()).orElse(null)
                    : null;
            List<ProductResponse> recs = recommendationService.getRecommendationsForUser(session.getId(), userId, 4);
            if (!recs.isEmpty()) {
                resp.setProductCards(recs.stream().map(this::toProductCard).collect(Collectors.toList()));
            }
        }
        return resp;
    }

    @Override
    @Transactional(readOnly = true)
    public ChatbotResponse interact(HttpSession session, ChatbotInteractRequest request, CurrentUserInfo principal) {
        String rootNodeId = (String) session.getAttribute(SESSION_ROOT_NODE);
        if (rootNodeId == null) rootNodeId = getRootNodeId(getRoleContext(principal));

        String currentNodeId = (String) session.getAttribute(SESSION_CURRENT_NODE);
        if (currentNodeId == null || currentNodeId.isBlank()) {
            currentNodeId = rootNodeId;
            session.setAttribute(SESSION_CURRENT_NODE, rootNodeId);
        }

        if (request.getText() != null && !request.getText().isBlank()) {
            String text = request.getText().trim();
            if (Boolean.TRUE.equals(session.getAttribute(SESSION_LIVE_CHAT))) {
                String sessionId = session.getId();
                Map<String, Object> payload = Map.of(
                        "sessionId", sessionId,
                        "text", text,
                        "from", "Khách",
                        "fromUser", false
                );
                messagingTemplate.convertAndSend(LiveChatConstants.TOPIC_ADMIN_LIVE_CHAT, (Object) payload);
                log.debug("Live chat message via REST from session {}: {}", sessionId, text);
                return ChatbotResponse.builder()
                        .messageText("")
                        .options(Collections.emptyList())
                        .productCards(Collections.emptyList())
                        .humanHandoffRequired(true)
                        .liveChatSessionId(sessionId)
                        .inputExpected(false)
                        .currentNodeId(currentNodeId)
                        .build();
            }
            return handleTextInput(session, currentNodeId, rootNodeId, text, principal);
        }

        String action = request.getAction();
        if (action == null || action.isBlank()) {
            return init(session, principal);
        }

        if (Boolean.TRUE.equals(session.getAttribute(SESSION_LIVE_CHAT))
                && ("BACK_TO_MENU".equals(action) || "END_LIVE_CHAT".equals(action))) {
            session.removeAttribute(SESSION_LIVE_CHAT);
            session.setAttribute(SESSION_CURRENT_NODE, rootNodeId);
            return init(session, principal);
        }

        ChatbotNode node = nodeRepository.findById(currentNodeId).orElse(null);
        if (node == null) {
            session.setAttribute(SESSION_CURRENT_NODE, rootNodeId);
            return init(session, principal);
        }

        List<ChatbotOption> options = optionRepository.findByNodeIdOrderBySortOrderAsc(currentNodeId);
        ChatbotOption chosen = options.stream()
                .filter(o -> action.equals(o.getActionPayload()))
                .findFirst()
                .orElse(null);

        if (chosen == null) {
            return buildResponse(session, node, principal);
        }

        if ("HUMAN_HANDOFF".equals(action)) {
            session.setAttribute(SESSION_LIVE_CHAT, true);
            return ChatbotResponse.builder()
                    .messageText("Bạn đã chuyển sang chat với nhân viên. Vui lòng nhập tin nhắn bên dưới.")
                    .options(Collections.emptyList())
                    .productCards(Collections.emptyList())
                    .humanHandoffRequired(true)
                    .liveChatSessionId(session.getId())
                    .inputExpected(false)
                    .currentNodeId(currentNodeId)
                    .build();
        }

        if ("BACK_TO_MENU".equals(action)) {
            session.removeAttribute("chatbotHistory");
            session.removeAttribute("chatbotLastAiProducts");
            String nextId = chosen.getNextNodeId();
            if (nextId == null || nextId.isBlank()) nextId = rootNodeId;
            session.setAttribute(SESSION_CURRENT_NODE, nextId);
            ChatbotNode nextNode = nodeRepository.findById(nextId).orElse(null);
            if (nextNode != null) return buildResponse(session, nextNode, principal);
            return init(session, principal);
        }

        if ("POLICY_SHIPPING".equals(action)) {
            session.setAttribute(SESSION_CURRENT_NODE, chosen.getNextNodeId());
            return buildResponse(session, nodeRepository.findById(chosen.getNextNodeId()).orElse(null), principal);
        }

        if ("AI_CHAT".equals(action)) {
            session.setAttribute(SESSION_CURRENT_NODE, "NODE_AI_CHAT");
            ChatbotNode aiNode = nodeRepository.findById("NODE_AI_CHAT").orElse(null);
            if (aiNode != null) return buildResponse(session, aiNode, principal);
            return init(session, principal);
        }

        if ("KYC_STATUS".equals(action)) {
            String kycMessage = resolveKycStatus(principal);
            ChatbotNode kycResult = nodeRepository.findById("NODE_KYC_RESULT").orElse(null);
            if (kycResult != null) {
                session.setAttribute(SESSION_CURRENT_NODE, "NODE_KYC_RESULT");
                return ChatbotResponse.builder()
                        .messageText(kycMessage)
                        .options(buildOptionsForNode("NODE_KYC_RESULT", rootNodeId))
                        .productCards(Collections.emptyList())
                        .humanHandoffRequired(false)
                        .inputExpected(false)
                        .currentNodeId("NODE_KYC_RESULT")
                        .build();
            }
        }

        if ("ONBOARDING".equals(action)) {
            session.setAttribute(SESSION_CURRENT_NODE, chosen.getNextNodeId());
            return buildResponse(session, nodeRepository.findById(chosen.getNextNodeId()).orElse(null), principal);
        }

        if ("SELLER_STATS".equals(action)) {
            String statsMessage = resolveSellerStats(principal);
            session.setAttribute(SESSION_CURRENT_NODE, "NODE_SELLER_STATS_RESULT");
            List<ChatbotOptionResponse> backOptions = buildOptionsForNode("NODE_SELLER_STATS_RESULT", rootNodeId);
            return ChatbotResponse.builder()
                    .messageText(statsMessage)
                    .options(backOptions)
                    .productCards(Collections.emptyList())
                    .humanHandoffRequired(false)
                    .inputExpected(false)
                    .currentNodeId("NODE_SELLER_STATS_RESULT")
                    .build();
        }

        if ("SEARCH_PRODUCTS".equals(action)) {
            session.setAttribute(SESSION_SEARCH_CATEGORY_ID, null);
            session.setAttribute(SESSION_CURRENT_NODE, chosen.getNextNodeId());
            ChatbotNode nextNode = nodeRepository.findById(chosen.getNextNodeId()).orElse(null);
            return buildResponse(session, nextNode, principal);
        }

        if ("SEARCH_ALL".equals(action)) {
            session.setAttribute(SESSION_SEARCH_CATEGORY_ID, null);
            session.setAttribute(SESSION_CURRENT_NODE, chosen.getNextNodeId());
            ChatbotNode priceNode = nodeRepository.findById(chosen.getNextNodeId()).orElse(null);
            return buildResponse(session, priceNode, principal);
        }

        if ("SEARCH_CATEGORY".equals(action) && request.getCategoryId() != null && !request.getCategoryId().isBlank()) {
            session.setAttribute(SESSION_SEARCH_CATEGORY_ID, request.getCategoryId());
            session.setAttribute(SESSION_CURRENT_NODE, "NODE_SEARCH_PRICE");
            return buildResponse(session, nodeRepository.findById("NODE_SEARCH_PRICE").orElse(null), principal);
        }

        if (action.startsWith("SEARCH_PRICE_")) {
            UUID categoryId = null;
            String catIdStr = (String) session.getAttribute(SESSION_SEARCH_CATEGORY_ID);
            if (catIdStr != null && !catIdStr.isBlank()) {
                try { categoryId = UUID.fromString(catIdStr); } catch (Exception ignored) {}
            }
            BigDecimal min = null, max = null;
            switch (action) {
                case "SEARCH_PRICE_UNDER_1M" -> { min = BigDecimal.ZERO; max = new BigDecimal("1000000"); }
                case "SEARCH_PRICE_1M_5M" -> { min = new BigDecimal("1000000"); max = new BigDecimal("5000000"); }
                case "SEARCH_PRICE_OVER_5M" -> { min = new BigDecimal("5000000"); max = null; }
                default -> {}
            }
            PageQueryRequest req = PageQueryRequest.builder()
                    .page(0)
                    .size(8)
                    .categoryId(categoryId)
                    .minPrice(min)
                    .maxPrice(max)
                    .build();
            Page<ProductResponse> page = queryProductService.getPublishedProducts(req);
            List<ChatbotProductCardResponse> cards = page.getContent().stream()
                    .map(this::toProductCard)
                    .collect(Collectors.toList());
            String msg = cards.isEmpty() ? "Không tìm thấy sản phẩm nào trong khoảng giá này." : "Dưới đây là một số sản phẩm phù hợp:";
            session.setAttribute(SESSION_CURRENT_NODE, rootNodeId);
            List<ChatbotOptionResponse> menuOptions = buildOptionsForNode(rootNodeId, rootNodeId);
            return ChatbotResponse.builder()
                    .messageText(msg)
                    .options(menuOptions)
                    .productCards(cards)
                    .humanHandoffRequired(false)
                    .inputExpected(false)
                    .currentNodeId(rootNodeId)
                    .build();
        }

        if (chosen.getNextNodeId() != null && !chosen.getNextNodeId().isBlank()) {
            session.setAttribute(SESSION_CURRENT_NODE, chosen.getNextNodeId());
            ChatbotNode nextNode = nodeRepository.findById(chosen.getNextNodeId()).orElse(null);
            return buildResponse(session, nextNode, principal);
        }

        return buildResponse(session, node, principal);
    }

    private ChatbotResponse handleTextInput(HttpSession session, String currentNodeId, String rootNodeId, String text, CurrentUserInfo principal) {
        if (currentNodeId == null || currentNodeId.isBlank()) {
            currentNodeId = rootNodeId;
            session.setAttribute(SESSION_CURRENT_NODE, rootNodeId);
        }

        if ("NODE_SEARCH_KEYWORD".equals(currentNodeId)) {
            if (text.isBlank()) {
                return ChatbotResponse.builder()
                        .messageText("Vui lòng nhập từ khóa tìm kiếm (có thể kèm giá, VD: laptop dưới 30 triệu).")
                        .options(buildOptionsForNode(currentNodeId, rootNodeId))
                        .productCards(Collections.emptyList())
                        .humanHandoffRequired(false)
                        .inputExpected(true)
                        .inputHint("VD: áo thun, laptop dưới 30 triệu, laptop hãng asus")
                        .currentNodeId(currentNodeId)
                        .build();
            }
            SearchIntent intent = SearchQueryParser.parse(text);
            String keyword = intent.getKeyword() != null && !intent.getKeyword().isBlank()
                    ? intent.getKeyword().trim() : null;
            if (keyword == null && intent.getMinPrice() == null && intent.getMaxPrice() == null) {
                return ChatbotResponse.builder()
                        .messageText("Vui lòng nhập từ khóa sản phẩm (VD: laptop, áo thun) hoặc kèm giá (VD: laptop dưới 30 triệu).")
                        .options(buildOptionsForNode(currentNodeId, rootNodeId))
                        .productCards(Collections.emptyList())
                        .humanHandoffRequired(false)
                        .inputExpected(true)
                        .inputHint("VD: laptop dưới 30 triệu, laptop hãng asus")
                        .currentNodeId(currentNodeId)
                        .build();
            }
            PageQueryRequest req = PageQueryRequest.builder()
                    .page(0)
                    .size(8)
                    .search(keyword)
                    .minPrice(intent.getMinPrice())
                    .maxPrice(intent.getMaxPrice())
                    .build();
            Page<ProductResponse> page = queryProductService.getPublishedProducts(req);
            UUID userId = principal != null && principal.getAccountId() != null
                    ? userRepository.findByAccountId(principal.getAccountId()).map(u -> u.getId()).orElse(null)
                    : null;
            recommendationService.recordSearch(session.getId(), userId, keyword, null, intent.getMinPrice(), intent.getMaxPrice());
            List<ChatbotProductCardResponse> cards = page.getContent().stream()
                    .map(this::toProductCard)
                    .collect(Collectors.toList());
            List<ChatbotOptionResponse> searchOptions = buildOptionsForNode("NODE_SEARCH_KEYWORD", rootNodeId);
            String confirmation = intent.toConfirmationSummary();
            String msg;
            if (cards.isEmpty()) {
                msg = buildNoResultMessage(intent);
            } else {
                msg = (confirmation != null ? "Đang tìm: " + confirmation + ".\n\n" : "")
                        + "Dưới đây là một số sản phẩm phù hợp:";
            }
            return ChatbotResponse.builder()
                    .messageText(msg)
                    .options(searchOptions)
                    .productCards(cards)
                    .humanHandoffRequired(false)
                    .inputExpected(true)
                    .inputHint("VD: laptop dưới 30 triệu, laptop hãng asus")
                    .currentNodeId(currentNodeId)
                    .build();
        }

        // Với tất cả các node khác, gán session sang NODE_AI_CHAT
        session.setAttribute(SESSION_CURRENT_NODE, "NODE_AI_CHAT");
        
        // Lấy lịch sử chat từ session
        List<Map<String, Object>> history = (List<Map<String, Object>>) session.getAttribute("chatbotHistory");
        if (history == null) {
            history = new ArrayList<>();
        }

        // Gọi prepareAiChatContext để lấy ngữ cảnh sản phẩm từ DB và lưu cache
        String context = prepareAiChatContext(session, text, principal);
        String fullPrompt = text;
        if (context != null && !context.isBlank()) {
            fullPrompt = context + "\n\nCâu hỏi của khách hàng: " + text;
        }

        // Tạo contents gửi cho Gemini API bao gồm lịch sử cũ và câu hỏi hiện tại
        List<Map<String, Object>> contents = new ArrayList<>(history);
        contents.add(Map.of(
            "role", "user",
            "parts", List.of(Map.of("text", fullPrompt))
        ));

        String aiResponse = geminiService.generateResponse(contents);
        List<ChatbotOptionResponse> aiOptions = buildOptionsForNode("NODE_AI_CHAT", rootNodeId);

        // Lưu câu hỏi gốc của user và phản hồi của AI vào lịch sử session
        history.add(Map.of(
            "role", "user",
            "parts", List.of(Map.of("text", text))
        ));
        history.add(Map.of(
            "role", "model",
            "parts", List.of(Map.of("text", aiResponse))
        ));
        session.setAttribute("chatbotHistory", history);
        
        // Lấy cards từ session cache đã lưu trong prepareAiChatContext (không fallback lấy tai nghe bluetooth bừa bãi)
        List<ChatbotProductCardResponse> cards = (List<ChatbotProductCardResponse>) session.getAttribute("chatbotLastAiProducts");
        if (cards == null) {
            cards = Collections.emptyList();
        } else {
            session.removeAttribute("chatbotLastAiProducts"); // Xoá cache ngay sau khi dùng
        }

        return ChatbotResponse.builder()
                .messageText(aiResponse)
                .options(aiOptions)
                .productCards(cards)
                .humanHandoffRequired(false)
                .inputExpected(true)
                .inputHint("Hỏi AI tiếp...")
                .currentNodeId("NODE_AI_CHAT")
                .build();
    }

    private String buildNoResultMessage(SearchIntent intent) {
        StringBuilder sb = new StringBuilder("Không tìm thấy sản phẩm nào");
        if (intent.getKeyword() != null && !intent.getKeyword().isBlank()) {
            sb.append(" cho \"").append(intent.getKeyword()).append("\"");
        }
        if (intent.getMinPrice() != null || intent.getMaxPrice() != null) {
            if (intent.getMinPrice() != null && intent.getMaxPrice() != null) {
                sb.append(" trong khoảng ").append(formatPrice(intent.getMinPrice()))
                        .append(" - ").append(formatPrice(intent.getMaxPrice()));
            } else if (intent.getMaxPrice() != null) {
                sb.append(" dưới ").append(formatPrice(intent.getMaxPrice()));
            } else {
                sb.append(" trên ").append(formatPrice(intent.getMinPrice()));
            }
        }
        sb.append(".");
        sb.append("\n\nThử bỏ bớt từ khóa hoặc mở rộng khoảng giá.");
        return sb.toString();
    }

    private String formatPrice(BigDecimal price) {
        if (price == null) return "";
        DecimalFormat df = new DecimalFormat("#,###", DecimalFormatSymbols.getInstance(java.util.Locale.US));
        return df.format(price) + " đ";
    }

    private ChatbotResponse buildSearchCategoryResponse(HttpSession session, CurrentUserInfo principal) {
        List<CategoryResponse> categories = categoryService.getAllCategories();
        List<ChatbotOptionResponse> options = new ArrayList<>();
        for (CategoryResponse c : categories) {
            options.add(ChatbotOptionResponse.builder()
                    .buttonLabel(c.getName())
                    .actionPayload("SEARCH_CATEGORY")
                    .nextNodeId("NODE_SEARCH_PRICE")
                    .categoryId(c.getId() != null ? c.getId().toString() : null)
                    .build());
        }
        options.add(ChatbotOptionResponse.builder()
                .buttonLabel("Xem tất cả danh mục")
                .actionPayload("SEARCH_ALL")
                .nextNodeId("NODE_SEARCH_PRICE")
                .build());
        options.add(ChatbotOptionResponse.builder()
                .buttonLabel("Về menu")
                .actionPayload("BACK_TO_MENU")
                .nextNodeId((String) session.getAttribute(SESSION_ROOT_NODE))
                .build());

        return ChatbotResponse.builder()
                .messageText("Chọn danh mục hoặc bỏ qua để xem tất cả.")
                .options(options)
                .productCards(Collections.emptyList())
                .humanHandoffRequired(false)
                .inputExpected(false)
                .currentNodeId("NODE_SEARCH_CATEGORY")
                .build();
    }

    private ChatbotResponse buildResponse(HttpSession session, ChatbotNode node, CurrentUserInfo principal) {
        if (node == null) return init(session, principal);

        boolean inputExpected = node.getNodeType() == ChatbotNodeType.INPUT_EXPECTED;
        List<ChatbotOptionResponse> options;

        if ("NODE_SEARCH_CATEGORY".equals(node.getId())) {
            return buildSearchCategoryResponse(session, principal);
        }

        options = buildOptionsForNode(node.getId(), (String) session.getAttribute(SESSION_ROOT_NODE));

        String inputHint = null;
        if (inputExpected && "NODE_SEARCH_KEYWORD".equals(node.getId())) {
            inputHint = "VD: áo thun, laptop";
        }
        List<ChatbotProductCardResponse> cards = (List<ChatbotProductCardResponse>) session.getAttribute("chatbotLastAiProducts");
        if ("NODE_AI_CHAT".equals(node.getId())) {
            if (cards == null) {
                cards = Collections.emptyList();
            } else {
                session.removeAttribute("chatbotLastAiProducts"); // Xoá sau khi đồng bộ
            }
        } else {
            cards = Collections.emptyList();
        }

        return ChatbotResponse.builder()
                .messageText(node.getMessageText())
                .options(options)
                .productCards(cards)
                .humanHandoffRequired(false)
                .inputExpected(inputExpected)
                .inputHint(inputHint)
                .currentNodeId(node.getId())
                .build();
    }

    private List<ChatbotOptionResponse> buildOptionsForNode(String nodeId, String rootNodeId) {
        List<ChatbotOption> opts = optionRepository.findByNodeIdOrderBySortOrderAsc(nodeId);
        return opts.stream()
                .map(o -> {
                    String next = o.getNextNodeId();
                    if ("BACK_TO_MENU".equals(o.getActionPayload()) && (next == null || next.isBlank())) next = rootNodeId;
                    return ChatbotOptionResponse.builder()
                            .buttonLabel(o.getButtonLabel())
                            .actionPayload(o.getActionPayload())
                            .nextNodeId(next != null ? next : rootNodeId)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private ChatbotProductCardResponse toProductCard(ProductResponse p) {
        String thumb = null;
        if (p.getImages() != null && !p.getImages().isEmpty() && p.getImages().get(0).getImageUrl() != null) {
            String url = p.getImages().get(0).getImageUrl();
            // Keep absolute URLs (MinIO/CDN). For relative paths (if any), prefix with backend base.
            thumb = url.startsWith("http") ? url : frontendBaseUrl + (url.startsWith("/") ? url : "/" + url);
        }
        String productUrl = frontendBaseUrl + "/products/" + p.getId();
        return ChatbotProductCardResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .basePrice(p.getBasePrice())
                .productUrl(productUrl)
                .thumbnailUrl(thumb)
                .build();
    }

    private String resolveKycStatus(CurrentUserInfo principal) {
        if (principal == null) return "Bạn cần đăng nhập để kiểm tra KYC.";
        return "Xem trạng thái KYC và đăng ký bán hàng tại Cài đặt / KYC.";
    }

    private String resolveSellerStats(CurrentUserInfo principal) {
        if (principal == null) return "Bạn cần đăng nhập.";
        var userOpt = userRepository.findByAccountId(principal.getAccountId());
        if (userOpt.isEmpty()) return "Không tìm thấy thông tin user.";
        Optional<Shop> shopOpt = shopRepository.findByUserId(userOpt.get().getId());
        if (shopOpt.isEmpty()) return "Bạn chưa có shop.";
        UUID shopId = shopOpt.get().getId();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long count = orderRepository.countByShop_IdAndCreatedAtAfter(shopId, startOfDay);
        return "Đơn hàng mới trong ngày hôm nay: " + count + ".";
    }

    private String getRoleContext(CurrentUserInfo principal) {
        if (principal == null) return "GUEST";
        String role = principal.getRole();
        if (role == null) return "GUEST";
        // E-commerce: ADMIN, BUSINESS, CUSTOMER (from RoleType); hoặc ROLE_* từ Spring
        if ("ADMIN".equals(role) || "ROLE_ADMIN".equals(role)) return "ADMIN";
        if ("BUSINESS".equals(role) || "ROLE_SELLER".equals(role)) return "SELLER";
        if ("CUSTOMER".equals(role) || "ROLE_USER".equals(role) || "ROLE_BUYER".equals(role)) return "BUYER";
        return "GUEST";
    }

    private String getRootNodeId(String roleContext) {
        return switch (roleContext) {
            case "BUYER" -> "NODE_GREETING_BUYER";
            case "SELLER" -> "NODE_GREETING_SELLER";
            case "ADMIN" -> "NODE_GREETING_BUYER";
            default -> "NODE_GREETING_GUEST";
        };
    }

    @Override
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public String prepareAiChatContext(HttpSession session, String text, CurrentUserInfo principal) {
        if (text == null || text.isBlank()) return "";

        // Lấy danh sách danh mục thực tế từ DB để AI ánh xạ
        List<CategoryResponse> categories = categoryService.getAllCategories();
        
        UUID matchedCategoryId = null;
        String searchKeyword = null;
        try {
            StringBuilder catList = new StringBuilder();
            for (CategoryResponse cat : categories) {
                catList.append("- ID: ").append(cat.getId()).append(" | Tên: ").append(cat.getName()).append("\n");
            }
            
            String intentPrompt = "Bạn là bộ phân tích ý định tìm kiếm sản phẩm. Hãy phân tích tin nhắn của khách hàng và trích xuất ý định dưới dạng JSON.\n\n"
                    + "Danh sách danh mục sản phẩm hiện có trong cửa hàng:\n"
                    + catList.toString() + "\n"
                    + "Tin nhắn của khách hàng: \"" + text + "\"\n\n"
                    + "Hãy trả về một đối tượng JSON duy nhất có cấu trúc sau (nêu rõ categoryId khớp từ danh sách trên nếu có, nếu không khớp danh mục nào hãy để categoryId là null. Nếu khách hàng tìm hãng hoặc sản phẩm cụ thể, trích xuất tên hãng hoặc tên máy đó vào keyword, ngược lại nếu chỉ hỏi chung chung hãy để keyword là null):\n"
                    + "{\n"
                    + "  \"categoryId\": \"UUID hoặc null\",\n"
                    + "  \"keyword\": \"tên hãng/tên sản phẩm cụ thể hoặc null\"\n"
                    + "}\n"
                    + "Tuyệt đối không trả về bất kỳ văn bản giải thích nào khác ngoài JSON sạch.";

            List<Map<String, Object>> parseContents = List.of(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", intentPrompt))
            ));
            
            // Gọi Gemini để phân tích ý định (luồng này rất nhanh vì prompt và output ngắn)
            String intentResponse = geminiService.generateResponse(parseContents);
            
            // Làm sạch JSON markdown block nếu có
            String cleanJson = intentResponse.replaceAll("(?s)```json\\s*|\\s*```", "").trim();
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> map = mapper.readValue(cleanJson, Map.class);
            
            String catIdStr = (String) map.get("categoryId");
            if (catIdStr != null && !catIdStr.equalsIgnoreCase("null") && !catIdStr.isBlank()) {
                matchedCategoryId = UUID.fromString(catIdStr);
            }
            String kw = (String) map.get("keyword");
            if (kw != null && !kw.equalsIgnoreCase("null") && !kw.isBlank()) {
                searchKeyword = kw.trim();
            }
        } catch (Exception e) {
            log.error("Error parsing intent with AI", e);
        }

        // Thực hiện tìm kiếm sản phẩm thực tế trong DB dựa trên kết quả phân tích của AI
        if (matchedCategoryId != null || searchKeyword != null) {
            SearchIntent searchIntent = SearchQueryParser.parse(text); // Lấy khoảng giá nếu có
            PageQueryRequest req = PageQueryRequest.builder()
                    .page(0)
                    .size(8)
                    .search(searchKeyword)
                    .categoryId(matchedCategoryId)
                    .minPrice(searchIntent.getMinPrice())
                    .maxPrice(searchIntent.getMaxPrice())
                    .build();
            try {
                Page<ProductResponse> page = queryProductService.getPublishedProducts(req);
                List<ChatbotProductCardResponse> cards = page.getContent().stream()
                        .map(this::toProductCard)
                        .collect(Collectors.toList());

                // Ghi nhận lượt tìm kiếm vào lịch sử của người dùng
                UUID userId = principal != null && principal.getAccountId() != null
                        ? userRepository.findByAccountId(principal.getAccountId()).map(u -> u.getId()).orElse(null)
                        : null;
                recommendationService.recordSearch(session.getId(), userId, searchKeyword != null ? searchKeyword : "category", matchedCategoryId, searchIntent.getMinPrice(), searchIntent.getMaxPrice());

                if (!cards.isEmpty()) {
                    session.setAttribute("chatbotLastAiProducts", cards);
                    
                    // Build context mô tả sản phẩm cho AI
                    StringBuilder sb = new StringBuilder();
                    sb.append("Dưới đây là danh sách sản phẩm thực tế đang bán trên trang web của chúng tôi liên quan đến yêu cầu của khách hàng. Hãy sử dụng thông tin này để giới thiệu trực tiếp cho khách hàng (nêu rõ tên và giá sản phẩm), tuyệt đối không bắt họ tự đi tìm kiếm nếu sản phẩm đã có dưới đây:\n");
                    for (ProductResponse p : page.getContent()) {
                        sb.append("- ").append(p.getName())
                          .append(" | Giá: ").append(formatPrice(p.getBasePrice())).append("\n");
                    }
                    return sb.toString();
                }
            } catch (Exception e) {
                log.error("Error preparing AI chat context", e);
            }
        }
        session.removeAttribute("chatbotLastAiProducts");
        return "";
    }
}
