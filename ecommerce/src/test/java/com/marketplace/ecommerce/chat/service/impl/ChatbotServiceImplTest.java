package com.marketplace.ecommerce.chat.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.chat.dto.ChatbotInteractRequest;
import com.marketplace.ecommerce.chat.dto.ChatbotResponse;
import com.marketplace.ecommerce.chat.entity.ChatbotNode;
import com.marketplace.ecommerce.chat.entity.ChatbotOption;
import com.marketplace.ecommerce.chat.enums.ChatbotNodeType;
import com.marketplace.ecommerce.chat.repository.ChatbotNodeRepository;
import com.marketplace.ecommerce.chat.repository.ChatbotOptionRepository;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.product.dto.request.PageQueryRequest;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.product.service.CategoryService;
import com.marketplace.ecommerce.product.service.QueryProductService;
import com.marketplace.ecommerce.recommendation.service.RecommendationService;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ChatbotServiceImplTest {

    @Mock
    private ChatbotNodeRepository nodeRepository;
    @Mock
    private ChatbotOptionRepository optionRepository;
    @Mock
    private QueryProductService queryProductService;
    @Mock
    private CategoryService categoryService;
    @Mock
    private RecommendationService recommendationService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ShopRepository shopRepository;
    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private ChatbotServiceImpl chatbotService;

    private CurrentUserInfo buyerPrincipal;
    private CurrentUserInfo sellerPrincipal;
    private UUID accountId;
    private ChatbotNode buyerRootNode;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        buyerPrincipal = new CurrentUserInfo();
        buyerPrincipal.setAccountId(accountId);
        buyerPrincipal.setUsername("buyer@test.com");
        buyerPrincipal.setRole("CUSTOMER");

        sellerPrincipal = new CurrentUserInfo();
        sellerPrincipal.setAccountId(accountId);
        sellerPrincipal.setUsername("seller@test.com");
        sellerPrincipal.setRole("BUSINESS");

        buyerRootNode = new ChatbotNode();
        buyerRootNode.setId("NODE_GREETING_BUYER");
        buyerRootNode.setNodeType(ChatbotNodeType.MENU);
        buyerRootNode.setMessageText("Xin chào bạn đến với sàn thương mại điện tử!");

        ChatbotNode sellerRootNode = new ChatbotNode();
        sellerRootNode.setId("NODE_GREETING_SELLER");
        sellerRootNode.setNodeType(ChatbotNodeType.MENU);
        sellerRootNode.setMessageText("Xin chào người bán!");

        lenient().when(nodeRepository.findById("NODE_GREETING_BUYER")).thenReturn(Optional.of(buyerRootNode));
        lenient().when(nodeRepository.findById("NODE_GREETING_SELLER")).thenReturn(Optional.of(sellerRootNode));
        ChatbotNode guestRootNode = new ChatbotNode();
        guestRootNode.setId("NODE_GREETING_GUEST");
        guestRootNode.setNodeType(ChatbotNodeType.MENU);
        guestRootNode.setMessageText("Xin chào quý khách!");
        lenient().when(nodeRepository.findById("NODE_GREETING_GUEST")).thenReturn(Optional.of(guestRootNode));


        ReflectionTestUtils.setField(chatbotService, "frontendBaseUrl", "http://localhost:5173");
    }

    @Test
    @DisplayName("init trả về menu gốc và sản phẩm gợi ý")
    void testInit_Success() {
        when(nodeRepository.findById("NODE_GREETING_BUYER")).thenReturn(Optional.of(buyerRootNode));
        ChatbotOption opt = new ChatbotOption();
        opt.setId(UUID.randomUUID());
        opt.setNodeId("NODE_GREETING_BUYER");
        opt.setButtonLabel("Tìm kiếm sản phẩm");
        opt.setActionPayload("SEARCH_PRODUCTS");
        opt.setSortOrder(1);
        when(optionRepository.findByNodeIdOrderBySortOrderAsc("NODE_GREETING_BUYER")).thenReturn(List.of(opt));

        User user = new User();
        user.setId(UUID.randomUUID());
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));

        ProductResponse rec = new ProductResponse();
        rec.setId(UUID.randomUUID());
        rec.setName("Tai nghe Bluetooth");
        rec.setBasePrice(BigDecimal.valueOf(500000));
        when(recommendationService.getRecommendationsForUser(any(), any(), eq(4))).thenReturn(List.of(rec));

        ChatbotResponse res = chatbotService.init(buyerPrincipal);
        assertNotNull(res);
        assertEquals("NODE_GREETING_BUYER", res.getCurrentNodeId());
        assertEquals(1, res.getOptions().size());
        assertEquals("Tìm kiếm sản phẩm", res.getOptions().get(0).getButtonLabel());
        assertEquals(1, res.getProductCards().size());
        assertEquals("Tai nghe Bluetooth", res.getProductCards().get(0).getName());
    }

    @Test
    @DisplayName("interact xử lý yêu cầu gặp nhân viên HUMAN_HANDOFF")
    void testInteract_HumanHandoff() {
        ChatbotInteractRequest req = new ChatbotInteractRequest();
        req.setAction("HUMAN_HANDOFF");

        ChatbotResponse res = chatbotService.interact(req, buyerPrincipal);
        assertNotNull(res);
        assertTrue(res.isHumanHandoffRequired());
        assertTrue(res.getMessageText().contains("nhân viên tư vấn"));
    }

    @Test
    @DisplayName("interact điều hướng chính sách giao hàng POLICY_SHIPPING")
    void testInteract_PolicyShipping() {
        ChatbotNode policyNode = new ChatbotNode();
        policyNode.setId("NODE_POLICY_SHIPPING");
        policyNode.setNodeType(ChatbotNodeType.MENU);
        policyNode.setMessageText("Chính sách giao hàng toàn quốc qua GHN");
        when(nodeRepository.findById("NODE_POLICY_SHIPPING")).thenReturn(Optional.of(policyNode));

        ChatbotInteractRequest req = new ChatbotInteractRequest();
        req.setAction("POLICY_SHIPPING");

        ChatbotResponse res = chatbotService.interact(req, buyerPrincipal);
        assertNotNull(res);
        assertEquals("NODE_POLICY_SHIPPING", res.getCurrentNodeId());
        assertTrue(res.getMessageText().contains("GHN"));
    }

    @Test
    @DisplayName("interact kiểm tra trạng thái KYC cho Seller")
    void testInteract_KycStatus() {
        ChatbotInteractRequest req = new ChatbotInteractRequest();
        req.setAction("KYC_STATUS");

        ChatbotResponse res = chatbotService.interact(req, sellerPrincipal);
        assertNotNull(res);
        assertTrue(res.getMessageText().contains("Cài đặt / KYC"));
    }

    @Test
    @DisplayName("interact xem thống kê người bán SELLER_STATS")
    void testInteract_SellerStats() {
        User user = new User();
        user.setId(UUID.randomUUID());
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));

        Shop shop = new Shop();
        shop.setId(UUID.randomUUID());
        shop.setName("Gadget Store");
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.of(shop));

        when(orderRepository.countByShop_IdAndCreatedAtAfter(eq(shop.getId()), any())).thenReturn(5L);

        ChatbotInteractRequest req = new ChatbotInteractRequest();
        req.setAction("SELLER_STATS");

        ChatbotResponse res = chatbotService.interact(req, sellerPrincipal);
        assertNotNull(res);
        assertTrue(res.getMessageText().contains("Đơn hàng mới trong ngày hôm nay: 5"));
    }

    @Test
    @DisplayName("interact tìm kiếm theo giá SEARCH_PRICE_UNDER_500K")
    void testInteract_SearchPriceUnder500k() {
        ProductResponse prod = new ProductResponse();
        prod.setId(UUID.randomUUID());
        prod.setName("Cáp sạc nhanh Type C");
        prod.setBasePrice(BigDecimal.valueOf(150000));

        when(queryProductService.getPublishedProducts(any(PageQueryRequest.class)))
                .thenReturn(new PageImpl<>(List.of(prod)));

        ChatbotInteractRequest req = new ChatbotInteractRequest();
        req.setAction("SEARCH_PRICE_UNDER_500K");

        ChatbotResponse res = chatbotService.interact(req, buyerPrincipal);
        assertNotNull(res);
        assertEquals(1, res.getProductCards().size());
        assertEquals("Cáp sạc nhanh Type C", res.getProductCards().get(0).getName());
    }

    @Test
    @DisplayName("interact xử lý text input tự nhiên của người dùng")
    void testInteract_TextInput() {
        ChatbotNode searchNode = new ChatbotNode();
        searchNode.setId("NODE_SEARCH_KEYWORD");
        searchNode.setNodeType(ChatbotNodeType.INPUT_EXPECTED);
        when(nodeRepository.findById("NODE_SEARCH_KEYWORD")).thenReturn(Optional.of(searchNode));

        ProductResponse prod = new ProductResponse();
        prod.setId(UUID.randomUUID());
        prod.setName("iPhone 15");
        prod.setBasePrice(BigDecimal.valueOf(18000000));

        when(queryProductService.getPublishedProducts(any(PageQueryRequest.class)))
                .thenReturn(new PageImpl<>(List.of(prod)));

        ChatbotInteractRequest req = new ChatbotInteractRequest();
        req.setCurrentNodeId("NODE_SEARCH_KEYWORD");
        req.setText("Tìm cho tôi iPhone 15 dưới 20 triệu");

        ChatbotResponse res = chatbotService.interact(req, buyerPrincipal);
        assertNotNull(res);
        assertEquals(1, res.getProductCards().size());
        assertTrue(res.getMessageText().contains("phù hợp"));
    }

    @Test
    @DisplayName("interact tìm kiếm theo các khoảng giá khác nhau và trường hợp không có sản phẩm")
    void testInteract_SearchPriceVariants() {
        ProductResponse prod = new ProductResponse();
        prod.setId(UUID.randomUUID());
        prod.setName("Chuột không dây");
        prod.setBasePrice(BigDecimal.valueOf(350000));

        when(queryProductService.getPublishedProducts(any(PageQueryRequest.class)))
                .thenReturn(new PageImpl<>(List.of(prod)))
                .thenReturn(new PageImpl<>(List.of(prod)))
                .thenReturn(new PageImpl<>(List.of(prod)))
                .thenReturn(new PageImpl<>(List.of())); // Rỗng

        // UNDER_1M
        ChatbotInteractRequest req1 = new ChatbotInteractRequest();
        req1.setAction("SEARCH_PRICE_UNDER_1M");
        ChatbotResponse res1 = chatbotService.interact(req1, buyerPrincipal);
        assertNotNull(res1);
        assertEquals(1, res1.getProductCards().size());

        // 1M_5M
        ChatbotInteractRequest req2 = new ChatbotInteractRequest();
        req2.setAction("SEARCH_PRICE_1M_5M");
        ChatbotResponse res2 = chatbotService.interact(req2, buyerPrincipal);
        assertNotNull(res2);
        assertEquals(1, res2.getProductCards().size());

        // OVER_5M
        ChatbotInteractRequest req3 = new ChatbotInteractRequest();
        req3.setAction("SEARCH_PRICE_OVER_5M");
        ChatbotResponse res3 = chatbotService.interact(req3, buyerPrincipal);
        assertNotNull(res3);
        assertEquals(1, res3.getProductCards().size());

        // Khi kết quả rỗng
        ChatbotInteractRequest req4 = new ChatbotInteractRequest();
        req4.setAction("SEARCH_PRICE_OVER_5M");
        ChatbotResponse res4 = chatbotService.interact(req4, buyerPrincipal);
        assertNotNull(res4);
        assertTrue(res4.getProductCards().isEmpty());
        assertTrue(res4.getMessageText().contains("Không tìm thấy sản phẩm"));
    }

    @Test
    @DisplayName("interact các action điều hướng ONBOARDING, SEARCH_PRODUCTS, SEARCH_ALL, SEARCH_CATEGORY")
    void testInteract_NavigationActions() {
        ChatbotNode nextNode = new ChatbotNode();
        nextNode.setId("NODE_ONBOARDING");
        nextNode.setMessageText("Hướng dẫn người bán");
        when(nodeRepository.findById(anyString())).thenReturn(Optional.of(nextNode));

        ChatbotInteractRequest req1 = new ChatbotInteractRequest();
        req1.setAction("ONBOARDING");
        ChatbotResponse res1 = chatbotService.interact(req1, sellerPrincipal);
        assertEquals("NODE_ONBOARDING", res1.getCurrentNodeId());

        ChatbotInteractRequest req2 = new ChatbotInteractRequest();
        req2.setAction("SEARCH_PRODUCTS");
        ChatbotResponse res2 = chatbotService.interact(req2, buyerPrincipal);
        assertEquals("NODE_SEARCH_KEYWORD", res2.getCurrentNodeId());

        ChatbotInteractRequest req3 = new ChatbotInteractRequest();
        req3.setAction("SEARCH_ALL");
        ChatbotResponse res3 = chatbotService.interact(req3, buyerPrincipal);
        assertEquals("NODE_SEARCH_PRICE", res3.getCurrentNodeId());

        ChatbotInteractRequest req4 = new ChatbotInteractRequest();
        req4.setAction("SEARCH_CATEGORY");
        ChatbotResponse res4 = chatbotService.interact(req4, buyerPrincipal);
        assertEquals("NODE_SEARCH_PRICE", res4.getCurrentNodeId());
    }

    @Test
    @DisplayName("interact Generic Transition và Fallback khi không khớp action")
    void testInteract_GenericOptionsAndFallback() {
        ChatbotOption option = new ChatbotOption();
        option.setActionPayload("CUSTOM_ACTION");
        option.setNextNodeId("NODE_CUSTOM_NEXT");

        ChatbotNode customNextNode = new ChatbotNode();
        customNextNode.setId("NODE_CUSTOM_NEXT");
        customNextNode.setMessageText("Nội dung bước tiếp theo");

        when(optionRepository.findByNodeIdOrderBySortOrderAsc("NODE_CURRENT")).thenReturn(List.of(option));
        when(nodeRepository.findById("NODE_CUSTOM_NEXT")).thenReturn(Optional.of(customNextNode));

        // Khớp option trong DB
        ChatbotInteractRequest req1 = new ChatbotInteractRequest();
        req1.setCurrentNodeId("NODE_CURRENT");
        req1.setAction("CUSTOM_ACTION");

        ChatbotResponse res1 = chatbotService.interact(req1, buyerPrincipal);
        assertEquals("NODE_CUSTOM_NEXT", res1.getCurrentNodeId());

        // Fallback khi không khớp action nào
        ChatbotInteractRequest req2 = new ChatbotInteractRequest();
        req2.setCurrentNodeId("NODE_CURRENT");
        req2.setAction("UNKNOWN_ACTION");

        when(nodeRepository.findById("NODE_CURRENT")).thenReturn(Optional.of(buyerRootNode));

        ChatbotResponse res2 = chatbotService.interact(req2, buyerPrincipal);
        assertEquals("NODE_CURRENT", res2.getCurrentNodeId());
    }

    @Test
    @DisplayName("interact TextInput các nhánh ngoại lệ (blank text, không intent, kết quả rỗng)")
    void testInteract_TextInputBranches() {
        ChatbotNode searchNode = new ChatbotNode();
        searchNode.setId("NODE_SEARCH_KEYWORD");
        searchNode.setNodeType(ChatbotNodeType.INPUT_EXPECTED);
        when(nodeRepository.findById("NODE_SEARCH_KEYWORD")).thenReturn(Optional.of(searchNode));

        // 1. Text blank -> fallback init
        ChatbotInteractRequest req1 = new ChatbotInteractRequest();
        req1.setCurrentNodeId("NODE_SEARCH_KEYWORD");
        req1.setText("   ");
        ChatbotResponse res1 = chatbotService.interact(req1, buyerPrincipal);
        assertEquals("NODE_GREETING_BUYER", res1.getCurrentNodeId());

        // 2. Không có kết quả tìm kiếm
        when(queryProductService.getPublishedProducts(any(PageQueryRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));

        ChatbotInteractRequest req2 = new ChatbotInteractRequest();
        req2.setCurrentNodeId("NODE_SEARCH_KEYWORD");
        req2.setText("Sản phẩm không hề tồn tại trên đời này");
        ChatbotResponse res2 = chatbotService.interact(req2, buyerPrincipal);
        assertTrue(res2.getProductCards().isEmpty());

        // 3. Node không phải INPUT_EXPECTED -> fallback init
        ChatbotNode menuNode = new ChatbotNode();
        menuNode.setId("NODE_MENU");
        menuNode.setNodeType(ChatbotNodeType.MENU);
        when(nodeRepository.findById("NODE_MENU")).thenReturn(Optional.of(menuNode));
        when(nodeRepository.findById("NODE_GREETING_BUYER")).thenReturn(Optional.of(buyerRootNode));

        ChatbotInteractRequest req3 = new ChatbotInteractRequest();
        req3.setCurrentNodeId("NODE_MENU");
        req3.setText("Hello");
        ChatbotResponse res3 = chatbotService.interact(req3, buyerPrincipal);
        assertEquals("NODE_GREETING_BUYER", res3.getCurrentNodeId());
    }

    @Test
    @DisplayName("resolveSellerStats khi user hoặc shop không tồn tại")
    void testInteract_SellerStats_NoShop() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());

        ChatbotInteractRequest req = new ChatbotInteractRequest();
        req.setAction("SELLER_STATS");

        ChatbotResponse res = chatbotService.interact(req, sellerPrincipal);
        assertNotNull(res);
        assertTrue(res.getMessageText().contains("Không tìm thấy thông tin user"));

        // User có nhưng không có shop
        User user = new User();
        user.setId(UUID.randomUUID());
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.empty());

        ChatbotResponse res2 = chatbotService.interact(req, sellerPrincipal);
        assertTrue(res2.getMessageText().contains("Bạn chưa có shop"));
    }

    @Test
    @DisplayName("Bao phủ đầy đủ buildSearchCategoryResponse")
    void testBuildSearchCategoryResponse_Full() {
        ChatbotNode catNode = new ChatbotNode();
        catNode.setId("NODE_SEARCH_CATEGORY");
        catNode.setNodeType(ChatbotNodeType.MENU);
        when(nodeRepository.findById("NODE_SEARCH_CATEGORY")).thenReturn(Optional.of(catNode));

        com.marketplace.ecommerce.product.dto.response.CategoryResponse c1 = new com.marketplace.ecommerce.product.dto.response.CategoryResponse();
        c1.setId(UUID.randomUUID());
        c1.setName("Điện tử");

        com.marketplace.ecommerce.product.dto.response.CategoryResponse c2 = new com.marketplace.ecommerce.product.dto.response.CategoryResponse();
        c2.setId(null);
        c2.setName("Thời trang");

        when(categoryService.getAllCategories()).thenReturn(List.of(c1, c2));

        ChatbotInteractRequest req = new ChatbotInteractRequest();
        req.setCurrentNodeId("NODE_SEARCH_CATEGORY");
        req.setAction("VIEW");

        ChatbotResponse res = chatbotService.interact(req, buyerPrincipal);
        assertNotNull(res);
        assertEquals("NODE_SEARCH_CATEGORY", res.getCurrentNodeId());
        assertEquals("Chọn danh mục hoặc bỏ qua để xem tất cả.", res.getMessageText());
        assertEquals(4, res.getOptions().size());
        assertEquals("Điện tử", res.getOptions().get(0).getButtonLabel());
        assertEquals("NODE_SEARCH_PRICE", res.getOptions().get(0).getNextNodeId());
        assertEquals("Xem tất cả danh mục", res.getOptions().get(2).getButtonLabel());
        assertEquals("Về menu", res.getOptions().get(3).getButtonLabel());
    }

    @Test
    @DisplayName("Bao phủ các nhánh buildNoResultMessage và formatPrice qua tìm kiếm không ra kết quả")
    void testSearchIntent_NoResultMessages() {
        ChatbotNode searchNode = new ChatbotNode();
        searchNode.setId("NODE_SEARCH_KEYWORD");
        searchNode.setNodeType(ChatbotNodeType.INPUT_EXPECTED);
        when(nodeRepository.findById("NODE_SEARCH_KEYWORD")).thenReturn(Optional.of(searchNode));
        when(queryProductService.getPublishedProducts(any(PageQueryRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));

        // Case 1: Có minPrice và maxPrice
        ChatbotInteractRequest req1 = new ChatbotInteractRequest();
        req1.setCurrentNodeId("NODE_SEARCH_KEYWORD");
        req1.setText("laptop từ 10 đến 20 triệu");
        ChatbotResponse res1 = chatbotService.interact(req1, buyerPrincipal);
        assertNotNull(res1);
        assertTrue(res1.getMessageText().contains("trong khoảng"));

        // Case 2: Chỉ có maxPrice
        ChatbotInteractRequest req2 = new ChatbotInteractRequest();
        req2.setCurrentNodeId("NODE_SEARCH_KEYWORD");
        req2.setText("laptop dưới 15 triệu");
        ChatbotResponse res2 = chatbotService.interact(req2, buyerPrincipal);
        assertNotNull(res2);
        assertTrue(res2.getMessageText().contains("dưới"));

        // Case 3: Chỉ có minPrice
        ChatbotInteractRequest req3 = new ChatbotInteractRequest();
        req3.setCurrentNodeId("NODE_SEARCH_KEYWORD");
        req3.setText("laptop trên 25 triệu");
        ChatbotResponse res3 = chatbotService.interact(req3, buyerPrincipal);
        assertNotNull(res3);
        assertTrue(res3.getMessageText().contains("trên"));

        // Case 4: Chỉ có keyword
        ChatbotInteractRequest req4 = new ChatbotInteractRequest();
        req4.setCurrentNodeId("NODE_SEARCH_KEYWORD");
        req4.setText("bàn phím cơ");
        ChatbotResponse res4 = chatbotService.interact(req4, buyerPrincipal);
        assertNotNull(res4);
        assertTrue(res4.getMessageText().contains("Không tìm thấy sản phẩm nào"));
        assertTrue(res4.getMessageText().contains("bàn phím cơ"));
    }

    @Test
    @DisplayName("Bao phủ tìm kiếm thành công và chuyển đổi ProductCard với các định dạng ảnh khác nhau")
    void testSearchSuccess_ProductCardVariations() {
        ChatbotNode searchNode = new ChatbotNode();
        searchNode.setId("NODE_SEARCH_KEYWORD");
        searchNode.setNodeType(ChatbotNodeType.INPUT_EXPECTED);
        when(nodeRepository.findById("NODE_SEARCH_KEYWORD")).thenReturn(Optional.of(searchNode));

        User user = new User();
        user.setId(UUID.randomUUID());
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));

        // p1: ảnh tuyệt đối http
        ProductResponse p1 = new ProductResponse();
        p1.setId(UUID.randomUUID());
        p1.setName("Laptop Asus");
        p1.setBasePrice(BigDecimal.valueOf(20000000));
        com.marketplace.ecommerce.product.dto.response.ProductImageResponse img1 = new com.marketplace.ecommerce.product.dto.response.ProductImageResponse();
        img1.setImageUrl("https://cdn.example.com/laptop.jpg");
        p1.setImages(List.of(img1));

        // p2: ảnh tương đối bắt đầu bằng /
        ProductResponse p2 = new ProductResponse();
        p2.setId(UUID.randomUUID());
        p2.setName("Laptop Dell");
        p2.setBasePrice(BigDecimal.valueOf(18000000));
        com.marketplace.ecommerce.product.dto.response.ProductImageResponse img2 = new com.marketplace.ecommerce.product.dto.response.ProductImageResponse();
        img2.setImageUrl("/uploads/dell.jpg");
        p2.setImages(List.of(img2));

        // p3: ảnh tương đối không bắt đầu bằng /
        ProductResponse p3 = new ProductResponse();
        p3.setId(UUID.randomUUID());
        p3.setName("Laptop HP");
        p3.setBasePrice(BigDecimal.valueOf(15000000));
        com.marketplace.ecommerce.product.dto.response.ProductImageResponse img3 = new com.marketplace.ecommerce.product.dto.response.ProductImageResponse();
        img3.setImageUrl("uploads/hp.jpg");
        p3.setImages(List.of(img3));

        // p4: không có ảnh
        ProductResponse p4 = new ProductResponse();
        p4.setId(UUID.randomUUID());
        p4.setName("Laptop Lenovo");
        p4.setBasePrice(BigDecimal.valueOf(12000000));
        p4.setImages(null);

        when(queryProductService.getPublishedProducts(any(PageQueryRequest.class)))
                .thenReturn(new PageImpl<>(List.of(p1, p2, p3, p4)));

        ChatbotInteractRequest req = new ChatbotInteractRequest();
        req.setCurrentNodeId("NODE_SEARCH_KEYWORD");
        req.setText("laptop dưới 25 triệu");

        ChatbotResponse res = chatbotService.interact(req, buyerPrincipal);
        assertNotNull(res);
        assertEquals(4, res.getProductCards().size());
        assertEquals("https://cdn.example.com/laptop.jpg", res.getProductCards().get(0).getThumbnailUrl());
        assertEquals("http://localhost:5173/uploads/dell.jpg", res.getProductCards().get(1).getThumbnailUrl());
        assertEquals("http://localhost:5173/uploads/hp.jpg", res.getProductCards().get(2).getThumbnailUrl());
        assertNull(res.getProductCards().get(3).getThumbnailUrl());
        verify(recommendationService).recordSearch(any(), eq(user.getId()), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Bao phủ getRoleContext và getRootNodeId với mọi vai trò")
    void testRoleContextAndRootNodeId() {
        // ADMIN
        CurrentUserInfo admin = new CurrentUserInfo();
        admin.setRole("ADMIN");
        ChatbotResponse resAdmin = chatbotService.init(admin);
        assertNotNull(resAdmin);

        CurrentUserInfo roleAdmin = new CurrentUserInfo();
        roleAdmin.setRole("ROLE_ADMIN");
        ChatbotResponse resRoleAdmin = chatbotService.init(roleAdmin);
        assertNotNull(resRoleAdmin);

        // SELLER
        CurrentUserInfo roleSeller = new CurrentUserInfo();
        roleSeller.setRole("ROLE_SELLER");
        ChatbotResponse resRoleSeller = chatbotService.init(roleSeller);
        assertNotNull(resRoleSeller);

        // BUYER
        CurrentUserInfo roleUser = new CurrentUserInfo();
        roleUser.setRole("ROLE_USER");
        ChatbotResponse resRoleUser = chatbotService.init(roleUser);
        assertNotNull(resRoleUser);

        CurrentUserInfo roleBuyer = new CurrentUserInfo();
        roleBuyer.setRole("ROLE_BUYER");
        ChatbotResponse resRoleBuyer = chatbotService.init(roleBuyer);
        assertNotNull(resRoleBuyer);

        // GUEST
        CurrentUserInfo guestRoleNull = new CurrentUserInfo();
        guestRoleNull.setRole(null);
        ChatbotResponse resGuestNull = chatbotService.init(guestRoleNull);
        assertNotNull(resGuestNull);

        CurrentUserInfo unknownRole = new CurrentUserInfo();
        unknownRole.setRole("OTHER_ROLE");
        ChatbotResponse resOther = chatbotService.init(unknownRole);
        assertNotNull(resOther);

        // Principal null
        ChatbotResponse resNull = chatbotService.init(null);
        assertNotNull(resNull);
    }

    @Test
    @DisplayName("Bao phủ resolveKycStatus và formatPrice trực tiếp")
    void testDirectHelperMethods() throws Exception {
        java.lang.reflect.Method resolveKyc = ChatbotServiceImpl.class.getDeclaredMethod("resolveKycStatus", CurrentUserInfo.class);
        resolveKyc.setAccessible(true);
        String kyc1 = (String) resolveKyc.invoke(chatbotService, (Object) null);
        assertTrue(kyc1.contains("Bạn cần đăng nhập"));
        String kyc2 = (String) resolveKyc.invoke(chatbotService, buyerPrincipal);
        assertTrue(kyc2.contains("Xem trạng thái KYC"));

        java.lang.reflect.Method formatPrice = ChatbotServiceImpl.class.getDeclaredMethod("formatPrice", BigDecimal.class);
        formatPrice.setAccessible(true);
        String p1 = (String) formatPrice.invoke(chatbotService, (BigDecimal) null);
        assertEquals("", p1);
        String p2 = (String) formatPrice.invoke(chatbotService, BigDecimal.valueOf(1500000));
        assertTrue(p2.contains("1,500,000 đ"));

        // handleTextInput với text blank hoặc rỗng qua reflection
        java.lang.reflect.Method handleTextInput = ChatbotServiceImpl.class.getDeclaredMethod("handleTextInput", String.class, String.class, String.class, CurrentUserInfo.class);
        handleTextInput.setAccessible(true);
        ChatbotNode searchNode = new ChatbotNode();
        searchNode.setId("NODE_SEARCH_KEYWORD");
        searchNode.setNodeType(ChatbotNodeType.INPUT_EXPECTED);
        when(nodeRepository.findById("NODE_SEARCH_KEYWORD")).thenReturn(Optional.of(searchNode));
        ChatbotResponse resBlank = (ChatbotResponse) handleTextInput.invoke(chatbotService, "NODE_SEARCH_KEYWORD", "NODE_GREETING_BUYER", "   ", buyerPrincipal);
        assertTrue(resBlank.getMessageText().contains("Vui lòng nhập từ khóa tìm kiếm"));

        // Options với action BACK_TO_MENU và nextNodeId rỗng
        ChatbotOption opt = new ChatbotOption();
        opt.setButtonLabel("Quay lại");
        opt.setActionPayload("BACK_TO_MENU");
        opt.setNextNodeId("");
        when(optionRepository.findByNodeIdOrderBySortOrderAsc("TEST_NODE")).thenReturn(List.of(opt));

        java.lang.reflect.Method buildOptions = ChatbotServiceImpl.class.getDeclaredMethod("buildOptionsForNode", String.class, String.class);
        buildOptions.setAccessible(true);
        List<?> opts = (List<?>) buildOptions.invoke(chatbotService, "TEST_NODE", "ROOT_NODE");
        assertEquals(1, opts.size());
    }

    @Test
    @DisplayName("Bao phủ các nhánh còn lại của interact, handleTextInput, buildResponse, resolveSellerStats")
    void testRemainingChatbotBranches() throws Exception {
        // 1. BACK_TO_MENU action
        ChatbotInteractRequest backReq = new ChatbotInteractRequest();
        backReq.setAction("BACK_TO_MENU");
        assertNotNull(chatbotService.interact(backReq, buyerPrincipal));

        // 2. interact null hoặc action blank
        assertNotNull(chatbotService.interact(null, buyerPrincipal));
        ChatbotInteractRequest emptyActionReq = new ChatbotInteractRequest();
        emptyActionReq.setAction("  ");
        assertNotNull(chatbotService.interact(emptyActionReq, buyerPrincipal));

        // 3. SEARCH_PRICE_ với categoryId hợp lệ và không hợp lệ
        when(queryProductService.getPublishedProducts(any(PageQueryRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));
        ChatbotInteractRequest priceCatReq = new ChatbotInteractRequest();
        priceCatReq.setAction("SEARCH_PRICE_UNDER_1M");
        priceCatReq.setCategoryId(UUID.randomUUID().toString());
        assertNotNull(chatbotService.interact(priceCatReq, buyerPrincipal));

        priceCatReq.setCategoryId("invalid-uuid");
        assertNotNull(chatbotService.interact(priceCatReq, buyerPrincipal));

        // 4. SEARCH_PRODUCTS khi NODE_SEARCH_KEYWORD là INPUT_EXPECTED -> có inputHint
        ChatbotNode searchKwNode = new ChatbotNode();
        searchKwNode.setId("NODE_SEARCH_KEYWORD");
        searchKwNode.setNodeType(ChatbotNodeType.INPUT_EXPECTED);
        searchKwNode.setMessageText("Nhập từ khóa:");
        when(nodeRepository.findById("NODE_SEARCH_KEYWORD")).thenReturn(Optional.of(searchKwNode));

        ChatbotInteractRequest searchProdReq = new ChatbotInteractRequest();
        searchProdReq.setAction("SEARCH_PRODUCTS");
        ChatbotResponse searchProdRes = chatbotService.interact(searchProdReq, buyerPrincipal);
        assertEquals("VD: áo thun, laptop", searchProdRes.getInputHint());

        // 5. handleTextInput khi chỉ có stopword (keyword == null && minPrice == null && maxPrice == null)
        ChatbotInteractRequest stopwordReq = new ChatbotInteractRequest();
        stopwordReq.setCurrentNodeId("NODE_SEARCH_KEYWORD");
        stopwordReq.setText("tôi cần");
        ChatbotResponse stopwordRes = chatbotService.interact(stopwordReq, buyerPrincipal);
        assertTrue(stopwordRes.getMessageText().contains("Vui lòng nhập từ khóa sản phẩm"));

        // 6. handleTextInput khi node là INPUT_EXPECTED nhưng không phải NODE_SEARCH_KEYWORD
        ChatbotNode otherInputNode = new ChatbotNode();
        otherInputNode.setId("NODE_OTHER_INPUT");
        otherInputNode.setNodeType(ChatbotNodeType.INPUT_EXPECTED);
        when(nodeRepository.findById("NODE_OTHER_INPUT")).thenReturn(Optional.of(otherInputNode));

        ChatbotInteractRequest otherInputReq = new ChatbotInteractRequest();
        otherInputReq.setCurrentNodeId("NODE_OTHER_INPUT");
        otherInputReq.setText("Hello");
        assertNotNull(chatbotService.interact(otherInputReq, buyerPrincipal));

        // 7. buildResponse khi node == null (VD: POLICY_SHIPPING không tìm thấy node)
        when(nodeRepository.findById("NODE_POLICY_SHIPPING")).thenReturn(Optional.empty());
        ChatbotInteractRequest policyNullReq = new ChatbotInteractRequest();
        policyNullReq.setAction("POLICY_SHIPPING");
        assertNotNull(chatbotService.interact(policyNullReq, buyerPrincipal));

        // 8. resolveSellerStats khi principal == null
        ChatbotInteractRequest statsNullPrincipalReq = new ChatbotInteractRequest();
        statsNullPrincipalReq.setAction("SELLER_STATS");
        ChatbotResponse statsNullRes = chatbotService.interact(statsNullPrincipalReq, null);
        assertTrue(statsNullRes.getMessageText().contains("Bạn cần đăng nhập"));
    }

}
