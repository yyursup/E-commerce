package com.marketplace.ecommerce.chat.service.impl;

import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.chat.dto.ChatbotInteractRequest;
import com.marketplace.ecommerce.chat.dto.ChatbotOptionResponse;
import com.marketplace.ecommerce.chat.dto.ChatbotProductCardResponse;
import com.marketplace.ecommerce.chat.dto.ChatbotResponse;
import com.marketplace.ecommerce.chat.entity.ChatbotNode;
import com.marketplace.ecommerce.chat.entity.ChatbotOption;
import com.marketplace.ecommerce.chat.enums.ChatbotNodeType;
import com.marketplace.ecommerce.chat.parser.SearchIntent;
import com.marketplace.ecommerce.chat.parser.SearchQueryParser;
import com.marketplace.ecommerce.chat.repository.ChatbotNodeRepository;
import com.marketplace.ecommerce.chat.repository.ChatbotOptionRepository;
import com.marketplace.ecommerce.chat.service.ChatbotService;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatbotServiceImpl implements ChatbotService {

    private final ChatbotNodeRepository nodeRepository;
    private final ChatbotOptionRepository optionRepository;
    private final QueryProductService queryProductService;
    private final CategoryService categoryService;
    private final RecommendationService recommendationService;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final OrderRepository orderRepository;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Override
    @Transactional(readOnly = true)
    public ChatbotResponse init(CurrentUserInfo principal) {
        String roleContext = getRoleContext(principal);
        String rootNodeId = getRootNodeId(roleContext);

        ChatbotNode node = nodeRepository.findById(rootNodeId)
                .orElseThrow(() -> new IllegalStateException("Root node not found: " + rootNodeId));

        ChatbotResponse resp = buildResponse(node, principal, rootNodeId);
        resp.setCurrentNodeId(rootNodeId);

        UUID userId = principal != null && principal.getAccountId() != null
                ? userRepository.findByAccountId(principal.getAccountId()).map(u -> u.getId()).orElse(null)
                : null;
        String trackingSession = userId != null ? userId.toString() : "guest";
        List<ProductResponse> recs = recommendationService.getRecommendationsForUser(trackingSession, userId, 4);
        if (!recs.isEmpty()) {
            resp.setProductCards(recs.stream().map(this::toProductCard).collect(Collectors.toList()));
        }

        return resp;
    }

    @Override
    @Transactional(readOnly = true)
    public ChatbotResponse interact(ChatbotInteractRequest request, CurrentUserInfo principal) {
        String roleContext = getRoleContext(principal);
        String rootNodeId = getRootNodeId(roleContext);

        String currentNodeId = (request != null && request.getCurrentNodeId() != null && !request.getCurrentNodeId().isBlank())
                ? request.getCurrentNodeId()
                : rootNodeId;

        // Xử lý text input (từ khóa tìm kiếm hoặc chat tự do)
        if (request != null && request.getText() != null && !request.getText().isBlank()) {
            return handleTextInput(currentNodeId, rootNodeId, request.getText().trim(), principal);
        }

        String action = request != null ? request.getAction() : null;
        if (action == null || action.isBlank()) {
            return init(principal);
        }

        // Handoff sang Live Chat
        if ("HUMAN_HANDOFF".equals(action)) {
            return ChatbotResponse.builder()
                    .currentNodeId(rootNodeId)
                    .messageText("Bạn đã yêu cầu gặp nhân viên tư vấn. Vui lòng nhắn tin trong mục Tư vấn viên.")
                    .options(Collections.emptyList())
                    .productCards(Collections.emptyList())
                    .humanHandoffRequired(true)
                    .inputExpected(false)
                    .build();
        }

        if ("BACK_TO_MENU".equals(action)) {
            return init(principal);
        }

        if ("POLICY_SHIPPING".equals(action)) {
            ChatbotNode nextNode = nodeRepository.findById("NODE_POLICY_SHIPPING").orElse(null);
            ChatbotResponse resp = buildResponse(nextNode, principal, rootNodeId);
            resp.setCurrentNodeId("NODE_POLICY_SHIPPING");
            return resp;
        }

        if ("KYC_STATUS".equals(action)) {
            String kycMessage = resolveKycStatus(principal);
            List<ChatbotOptionResponse> backOptions = buildOptionsForNode("NODE_KYC_RESULT", rootNodeId);
            return ChatbotResponse.builder()
                    .currentNodeId("NODE_KYC_RESULT")
                    .messageText(kycMessage)
                    .options(backOptions)
                    .productCards(Collections.emptyList())
                    .humanHandoffRequired(false)
                    .inputExpected(false)
                    .build();
        }

        if ("ONBOARDING".equals(action)) {
            ChatbotNode nextNode = nodeRepository.findById("NODE_ONBOARDING").orElse(null);
            ChatbotResponse resp = buildResponse(nextNode, principal, rootNodeId);
            resp.setCurrentNodeId("NODE_ONBOARDING");
            return resp;
        }

        if ("SELLER_STATS".equals(action)) {
            String statsMessage = resolveSellerStats(principal);
            List<ChatbotOptionResponse> backOptions = buildOptionsForNode("NODE_SELLER_STATS_RESULT", rootNodeId);
            return ChatbotResponse.builder()
                    .currentNodeId("NODE_SELLER_STATS_RESULT")
                    .messageText(statsMessage)
                    .options(backOptions)
                    .productCards(Collections.emptyList())
                    .humanHandoffRequired(false)
                    .inputExpected(false)
                    .build();
        }

        if ("SEARCH_PRODUCTS".equals(action)) {
            ChatbotNode nextNode = nodeRepository.findById("NODE_SEARCH_KEYWORD").orElse(null);
            ChatbotResponse resp = buildResponse(nextNode, principal, rootNodeId);
            resp.setCurrentNodeId("NODE_SEARCH_KEYWORD");
            return resp;
        }

        if ("SEARCH_ALL".equals(action)) {
            ChatbotNode priceNode = nodeRepository.findById("NODE_SEARCH_PRICE").orElse(null);
            ChatbotResponse resp = buildResponse(priceNode, principal, rootNodeId);
            resp.setCurrentNodeId("NODE_SEARCH_PRICE");
            return resp;
        }

        if ("SEARCH_CATEGORY".equals(action)) {
            ChatbotNode priceNode = nodeRepository.findById("NODE_SEARCH_PRICE").orElse(null);
            ChatbotResponse resp = buildResponse(priceNode, principal, rootNodeId);
            resp.setCurrentNodeId("NODE_SEARCH_PRICE");
            return resp;
        }

        if (action.startsWith("SEARCH_PRICE_")) {
            UUID categoryId = null;
            if (request.getCategoryId() != null && !request.getCategoryId().isBlank()) {
                try { categoryId = UUID.fromString(request.getCategoryId()); } catch (Exception ignored) {}
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
            List<ChatbotOptionResponse> menuOptions = buildOptionsForNode(rootNodeId, rootNodeId);
            return ChatbotResponse.builder()
                    .currentNodeId(rootNodeId)
                    .messageText(msg)
                    .options(menuOptions)
                    .productCards(cards)
                    .humanHandoffRequired(false)
                    .inputExpected(false)
                    .build();
        }

        // Generic transition theo option cấu hình trong DB
        List<ChatbotOption> options = optionRepository.findByNodeIdOrderBySortOrderAsc(currentNodeId);
        ChatbotOption chosen = options.stream()
                .filter(o -> action.equals(o.getActionPayload()))
                .findFirst()
                .orElse(null);

        if (chosen != null && chosen.getNextNodeId() != null && !chosen.getNextNodeId().isBlank()) {
            ChatbotNode nextNode = nodeRepository.findById(chosen.getNextNodeId()).orElse(null);
            ChatbotResponse resp = buildResponse(nextNode, principal, rootNodeId);
            resp.setCurrentNodeId(chosen.getNextNodeId());
            return resp;
        }

        ChatbotNode node = nodeRepository.findById(currentNodeId).orElse(null);
        ChatbotResponse resp = buildResponse(node, principal, rootNodeId);
        resp.setCurrentNodeId(currentNodeId);
        return resp;
    }

    private ChatbotResponse handleTextInput(String currentNodeId, String rootNodeId, String text, CurrentUserInfo principal) {
        ChatbotNode node = nodeRepository.findById(currentNodeId).orElse(null);
        if (node == null || node.getNodeType() != ChatbotNodeType.INPUT_EXPECTED) {
            return init(principal);
        }

        if ("NODE_SEARCH_KEYWORD".equals(currentNodeId)) {
            if (text.isBlank()) {
                return ChatbotResponse.builder()
                        .currentNodeId(currentNodeId)
                        .messageText("Vui lòng nhập từ khóa tìm kiếm (có thể kèm giá, VD: laptop dưới 30 triệu).")
                        .options(buildOptionsForNode(currentNodeId, rootNodeId))
                        .productCards(Collections.emptyList())
                        .humanHandoffRequired(false)
                        .inputExpected(true)
                        .inputHint("VD: áo thun, laptop dưới 30 triệu, laptop hãng asus")
                        .build();
            }
            SearchIntent intent = SearchQueryParser.parse(text);
            String keyword = intent.getKeyword() != null && !intent.getKeyword().isBlank()
                    ? intent.getKeyword().trim() : null;
            if (keyword == null && intent.getMinPrice() == null && intent.getMaxPrice() == null) {
                return ChatbotResponse.builder()
                        .currentNodeId(currentNodeId)
                        .messageText("Vui lòng nhập từ khóa sản phẩm (VD: laptop, áo thun) hoặc kèm giá (VD: laptop dưới 30 triệu).")
                        .options(buildOptionsForNode(currentNodeId, rootNodeId))
                        .productCards(Collections.emptyList())
                        .humanHandoffRequired(false)
                        .inputExpected(true)
                        .inputHint("VD: laptop dưới 30 triệu, laptop hãng asus")
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
            String trackingSession = userId != null ? userId.toString() : "guest";
            recommendationService.recordSearch(trackingSession, userId, keyword, null, intent.getMinPrice(), intent.getMaxPrice());
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
                    .currentNodeId(currentNodeId)
                    .messageText(msg)
                    .options(searchOptions)
                    .productCards(cards)
                    .humanHandoffRequired(false)
                    .inputExpected(true)
                    .inputHint("VD: laptop dưới 30 triệu, laptop hãng asus")
                    .build();
        }

        return init(principal);
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

    private ChatbotResponse buildSearchCategoryResponse(String rootNodeId) {
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
                .nextNodeId(rootNodeId)
                .build());

        return ChatbotResponse.builder()
                .currentNodeId("NODE_SEARCH_CATEGORY")
                .messageText("Chọn danh mục hoặc bỏ qua để xem tất cả.")
                .options(options)
                .productCards(Collections.emptyList())
                .humanHandoffRequired(false)
                .inputExpected(false)
                .build();
    }

    private ChatbotResponse buildResponse(ChatbotNode node, CurrentUserInfo principal, String rootNodeId) {
        if (node == null) return init(principal);

        boolean inputExpected = node.getNodeType() == ChatbotNodeType.INPUT_EXPECTED;

        if ("NODE_SEARCH_CATEGORY".equals(node.getId())) {
            return buildSearchCategoryResponse(rootNodeId);
        }

        List<ChatbotOptionResponse> options = buildOptionsForNode(node.getId(), rootNodeId);

        String inputHint = null;
        if (inputExpected && "NODE_SEARCH_KEYWORD".equals(node.getId())) {
            inputHint = "VD: áo thun, laptop";
        }
        return ChatbotResponse.builder()
                .currentNodeId(node.getId())
                .messageText(node.getMessageText())
                .options(options)
                .productCards(Collections.emptyList())
                .humanHandoffRequired(false)
                .inputExpected(inputExpected)
                .inputHint(inputHint)
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
}
