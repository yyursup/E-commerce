package com.marketplace.ecommerce.chatbot.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.ecommerce.auth.dto.response.UserAddressResponse;
import com.marketplace.ecommerce.auth.service.UserAddressService;
import com.marketplace.ecommerce.cart.dto.response.CartItemResponse;
import com.marketplace.ecommerce.cart.dto.response.CartResponse;
import com.marketplace.ecommerce.cart.service.CartService;
import com.marketplace.ecommerce.chatbot.dto.request.AiChatRequest;
import com.marketplace.ecommerce.chatbot.dto.response.AiChatResponse;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.order.dto.request.CreateOrderRequest;
import com.marketplace.ecommerce.order.dto.request.QuoteRequest;
import com.marketplace.ecommerce.order.dto.response.OrderItemResponse;
import com.marketplace.ecommerce.order.dto.response.OrderResponse;
import com.marketplace.ecommerce.order.dto.response.QuoteResponse;
import com.marketplace.ecommerce.order.service.CheckoutService;
import com.marketplace.ecommerce.order.service.OrderService;
import com.marketplace.ecommerce.order.service.QueryOrderService;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.service.PaymentService;
import com.marketplace.ecommerce.product.dto.request.PageQueryRequest;
import com.marketplace.ecommerce.product.dto.response.CategoryResponse;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.product.service.CategoryService;
import com.marketplace.ecommerce.product.service.QueryProductService;
import com.marketplace.ecommerce.recommendation.service.RecommendationService;
import com.marketplace.ecommerce.shipping.dto.response.GHNDistrictResponse;
import com.marketplace.ecommerce.shipping.dto.response.GHNProvinceResponse;
import com.marketplace.ecommerce.shipping.dto.response.GHNWardResponse;
import com.marketplace.ecommerce.shipping.usecase.GHNClient;
import com.marketplace.ecommerce.voucher.dto.VoucherResponse;
import com.marketplace.ecommerce.voucher.service.VoucherService;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.dto.response.ProductVariantResponse;
import com.marketplace.ecommerce.product.dto.response.ProductImageResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AiChatServiceImplTest {

    @Mock
    private AiCompletionClient aiClient;
    @Mock
    private QueryProductService queryProductService;
    @Mock
    private CategoryService categoryService;
    @Mock
    private RecommendationService recommendationService;
    @Mock
    private VoucherService voucherService;
    @Mock
    private QueryOrderService queryOrderService;
    @Mock
    private UserAddressService userAddressService;
    @Mock
    private GHNClient ghnClient;
    @Mock
    private CartService cartService;
    @Mock
    private CheckoutService checkoutService;
    @Mock
    private OrderService orderService;
    @Mock
    private PaymentService paymentService;

    private ObjectMapper objectMapper;
    private Validator validator;
    private AiChatServiceImpl aiChatService;

    private CurrentUserInfo principal;
    private UUID userId;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        validator = Validation.buildDefaultValidatorFactory().getValidator();

        aiChatService = new AiChatServiceImpl(
                aiClient,
                objectMapper,
                queryProductService,
                categoryService,
                recommendationService,
                voucherService,
                queryOrderService,
                userAddressService,
                ghnClient,
                cartService,
                checkoutService,
                orderService,
                paymentService,
                validator
        );
        ReflectionTestUtils.setField(aiChatService, "frontendBaseUrl", "http://localhost:3000");

        userId = UUID.randomUUID();
        principal = new CurrentUserInfo();
        principal.setAccountId(userId);
        principal.setUsername("user@test.com");
        principal.setRole("BUYER");
    }

    @Test
    @DisplayName("chat trả về tin nhắn văn bản thông thường và lọc thẻ <think>")
    void testChat_TextResponseWithThinkTag() throws Exception {
        String json = """
                {
                    "content": "<think>Suy nghĩ nội bộ của model</think>Xin chào bạn! Tôi có thể giúp gì cho bạn hôm nay?"
                }
                """;
        JsonNode modelMessage = objectMapper.readTree(json);
        when(aiClient.complete(any())).thenReturn(modelMessage);

        AiChatRequest req = new AiChatRequest(List.of(new AiChatRequest.Message("user", "Xin chào")));

        AiChatResponse response = aiChatService.chat(req, principal);
        assertNotNull(response);
        assertEquals("Xin chào bạn! Tôi có thể giúp gì cho bạn hôm nay?", response.reply());
        assertFalse(response.reply().contains("<think>"));
    }

    @Test
    @DisplayName("chat thực thi chuỗi tool call: list_categories và search_products")
    void testChat_WithToolCalls() throws Exception {
        UUID catId = UUID.randomUUID();
        CategoryResponse cat = new CategoryResponse();
        cat.setId(catId);
        cat.setName("Laptop");
        when(categoryService.getAllCategories()).thenReturn(List.of(cat));

        ProductResponse prod = new ProductResponse();
        UUID prodId = UUID.randomUUID();
        prod.setId(prodId);
        prod.setName("MacBook Pro M3");
        prod.setBasePrice(BigDecimal.valueOf(35000000));
        when(queryProductService.getPublishedProducts(any(PageQueryRequest.class)))
                .thenReturn(new PageImpl<>(List.of(prod)));

        String callJson1 = """
                {
                    "tool_calls": [
                        {
                            "id": "call_1",
                            "type": "function",
                            "function": {
                                "name": "list_categories",
                                "arguments": "{}"
                            }
                        }
                    ]
                }
                """;
        JsonNode message1 = objectMapper.readTree(callJson1);

        String callJson2 = """
                {
                    "tool_calls": [
                        {
                            "id": "call_2",
                            "type": "function",
                            "function": {
                                "name": "search_products",
                                "arguments": "{\\"keyword\\": \\"macbook\\", \\"limit\\": 5}"
                            }
                        }
                    ]
                }
                """;
        JsonNode message2 = objectMapper.readTree(callJson2);

        String finalJson = """
                {
                    "content": "Tôi tìm thấy MacBook Pro M3 giá 35 triệu phù hợp với bạn."
                }
                """;
        JsonNode message3 = objectMapper.readTree(finalJson);

        when(aiClient.complete(any()))
                .thenReturn(message1)
                .thenReturn(message2)
                .thenReturn(message3);

        AiChatRequest req = new AiChatRequest(List.of(new AiChatRequest.Message("user", "Tìm cho tôi laptop macbook")));

        AiChatResponse response = aiChatService.chat(req, principal);
        assertNotNull(response);
        assertTrue(response.reply().contains("MacBook Pro M3"));
        verify(categoryService).getAllCategories();
        verify(queryProductService).getPublishedProducts(any(PageQueryRequest.class));
    }

    @Test
    @DisplayName("chat thực thi tool show_product_cards và show_choices")
    void testChat_ShowProductCardsAndChoices() throws Exception {
        UUID prodId = UUID.randomUUID();
        String callJson = String.format("""
                {
                    "tool_calls": [
                        {
                            "id": "call_cards",
                            "type": "function",
                            "function": {
                                "name": "show_product_cards",
                                "arguments": "{\\"productIds\\": [\\"%s\\"]}"
                            }
                        },
                        {
                            "id": "call_choices",
                            "type": "function",
                            "function": {
                                "name": "show_choices",
                                "arguments": "{\\"choices\\": [\\"Mua ngay\\", \\"Xem thêm\\"]}"
                            }
                        }
                    ]
                }
                """, prodId);
        JsonNode message1 = objectMapper.readTree(callJson);

        String finalJson = """
                {
                    "content": "Dưới đây là thẻ sản phẩm chuột Logitech dành cho bạn."
                }
                """;
        JsonNode message2 = objectMapper.readTree(finalJson);

        when(aiClient.complete(any()))
                .thenReturn(message1)
                .thenReturn(message2);

        AiChatRequest req = new AiChatRequest(List.of(new AiChatRequest.Message("user", "Cho xem chuột logitech")));

        AiChatResponse response = aiChatService.chat(req, principal);
        assertNotNull(response);
        assertEquals(List.of("Mua ngay", "Xem thêm"), response.choices());
    }

    @Test
    @DisplayName("chat thực thi tool get_my_addresses và prepare_checkout và place_order qua WALLET")
    void testChat_OrderFlow() throws Exception {
        UUID shopId = UUID.randomUUID();
        UUID prodId = UUID.randomUUID();
        UUID addrId = UUID.randomUUID();

        UserAddressResponse addr = UserAddressResponse.builder()
                .id(addrId)
                .receiverName("Nguyen Van A")
                .receiverPhone("0912345678")
                .addressLine("123 To Hien Thanh")
                .districtId(1442)
                .wardCode("20101")
                .build();
        when(userAddressService.listMyAddresses(userId)).thenReturn(List.of(addr));

        ProductResponse prod = new ProductResponse();
        prod.setId(prodId);
        prod.setShopId(shopId);
        prod.setShopName("Shop Test");
        prod.setName("Bàn phím cơ");
        prod.setBasePrice(BigDecimal.valueOf(500000));
        when(queryProductService.getPublishedProductById(prodId)).thenReturn(prod);

        CartResponse cart = new CartResponse();
        cart.setItems(Collections.emptyList());
        when(cartService.getCartByAccountId(userId)).thenReturn(cart);

        QuoteResponse quote = new QuoteResponse();
        quote.setSubtotal(BigDecimal.valueOf(500000));
        quote.setShippingFee(BigDecimal.valueOf(30000));
        quote.setTotal(BigDecimal.valueOf(530000));
        when(checkoutService.quote(eq(userId), any(QuoteRequest.class))).thenReturn(quote);

        OrderResponse orderRes = new OrderResponse();
        UUID orderId = UUID.randomUUID();
        orderRes.setId(orderId);
        orderRes.setOrderNumber("ORD-AI-123");
        orderRes.setStatus(OrderStatus.CONFIRMED);
        orderRes.setTotal(BigDecimal.valueOf(530000));
        orderRes.setSubtotal(BigDecimal.valueOf(500000));
        orderRes.setShippingFee(BigDecimal.valueOf(30000));
        orderRes.setPaymentMethod("WALLET");
        when(orderService.convertCartToOrder(eq(userId), any(CreateOrderRequest.class))).thenReturn(orderRes);

        String json1 = """
                {
                    "tool_calls": [
                        {"id": "c1", "type": "function", "function": {"name": "get_my_addresses", "arguments": "{}"}}
                    ]
                }
                """;
        String json2 = String.format("""
                {
                    "tool_calls": [
                        {
                            "id": "c2",
                            "type": "function",
                            "function": {
                                "name": "prepare_checkout",
                                "arguments": "{\\"productId\\": \\"%s\\", \\"addressId\\": \\"%s\\", \\"quantity\\": 1}"
                            }
                        }
                    ]
                }
                """, prodId, addrId);
        String json3 = String.format("""
                {
                    "tool_calls": [
                        {
                            "id": "c3",
                            "type": "function",
                            "function": {
                                "name": "place_order",
                                "arguments": "{\\"shopId\\": \\"%s\\", \\"addressId\\": \\"%s\\", \\"paymentMethod\\": \\"WALLET\\"}"
                            }
                        }
                    ]
                }
                """, shopId, addrId);
        String json4 = """
                {
                    "content": "Đơn hàng ORD-AI-123 của bạn đã được đặt thành công!"
                }
                """;

        when(aiClient.complete(any()))
                .thenReturn(objectMapper.readTree(json1))
                .thenReturn(objectMapper.readTree(json2))
                .thenReturn(objectMapper.readTree(json3))
                .thenReturn(objectMapper.readTree(json4));

        AiChatRequest req = new AiChatRequest(List.of(new AiChatRequest.Message("user", "Tôi muốn đặt hàng")));

        AiChatResponse response = aiChatService.chat(req, principal);
        assertNotNull(response);
        assertTrue(response.reply().contains("ORD-AI-123"));
        verify(orderService).convertCartToOrder(eq(userId), any());
    }

    @Test
    @DisplayName("chat thực thi tool lookup_location và list_vouchers")
    void testChat_LocationAndVouchers() throws Exception {
        GHNProvinceResponse p = new GHNProvinceResponse();
        p.setProvinceID(201);
        p.setProvinceName("Hồ Chí Minh");
        when(ghnClient.getProvinces()).thenReturn(List.of(p));

        VoucherResponse v = new VoucherResponse();
        v.setCode("GIAM20");
        v.setTitle("Giảm 20k");
        v.setDiscountValue(BigDecimal.valueOf(20000));
        when(voucherService.listActiveVouchers(eq(null), any(), any())).thenReturn(List.of(v));

        String json1 = """
                {
                    "tool_calls": [
                        {
                            "id": "c_loc",
                            "type": "function",
                            "function": {
                                "name": "lookup_location",
                                "arguments": "{\\"level\\": \\"province\\"}"
                            }
                        },
                        {
                            "id": "c_vouch",
                            "type": "function",
                            "function": {
                                "name": "list_vouchers",
                                "arguments": "{}"
                            }
                        }
                    ]
                }
                """;
        String json2 = """
                {
                    "content": "Tôi đã tìm thấy voucher GIAM20 cho bạn."
                }
                """;

        when(aiClient.complete(any()))
                .thenReturn(objectMapper.readTree(json1))
                .thenReturn(objectMapper.readTree(json2));

        AiChatRequest req = new AiChatRequest(List.of(new AiChatRequest.Message("user", "Có mã giảm giá nào không?")));

        AiChatResponse response = aiChatService.chat(req, principal);
        assertNotNull(response);
        assertTrue(response.reply().contains("GIAM20"));
        verify(voucherService).listActiveVouchers(eq(null), any(), any());
    }

    @Test
    @DisplayName("chat thực thi tool get_product_detail và get_similar_products")
    void testChat_ProductDetailAndSimilar() throws Exception {
        UUID prodId = UUID.randomUUID();
        ProductResponse prod = new ProductResponse();
        prod.setId(prodId);
        prod.setName("Bàn phím cơ AKKO");
        prod.setDescription("Bàn phím cơ gõ êm, switch Jelly Pink");
        prod.setBasePrice(BigDecimal.valueOf(1200000));
        when(queryProductService.getPublishedProductById(prodId)).thenReturn(prod);

        ProductResponse sim = new ProductResponse();
        sim.setId(UUID.randomUUID());
        sim.setName("Bàn phím DareU");
        sim.setBasePrice(BigDecimal.valueOf(800000));
        when(recommendationService.getSimilarProducts(prodId, 6)).thenReturn(List.of(sim));

        String json1 = String.format("""
                {
                    "tool_calls": [
                        {
                            "id": "c_detail",
                            "type": "function",
                            "function": {
                                "name": "get_product_detail",
                                "arguments": "{\\"productId\\": \\"%s\\"}"
                            }
                        },
                        {
                            "id": "c_sim",
                            "type": "function",
                            "function": {
                                "name": "get_similar_products",
                                "arguments": "{\\"productId\\": \\"%s\\"}"
                            }
                        }
                    ]
                }
                """, prodId, prodId);
        String json2 = """
                {"content": "Chi tiết bàn phím AKKO và gợi ý phím DareU tương tự."}
                """;

        when(aiClient.complete(any()))
                .thenReturn(objectMapper.readTree(json1))
                .thenReturn(objectMapper.readTree(json2));

        AiChatRequest req = new AiChatRequest(List.of(new AiChatRequest.Message("user", "Xem chi tiết bàn phím")));
        AiChatResponse response = aiChatService.chat(req, principal);
        assertNotNull(response);
        verify(queryProductService).getPublishedProductById(prodId);
        verify(recommendationService).getSimilarProducts(prodId, 6);
    }

    @Test
    @DisplayName("chat thực thi tool get_my_orders xem danh sách đơn hàng")
    void testChat_GetMyOrders() throws Exception {
        OrderResponse o = new OrderResponse();
        o.setId(UUID.randomUUID());
        o.setOrderNumber("ORD-MY-999");
        o.setStatus(OrderStatus.DELIVERED);
        o.setTotal(BigDecimal.valueOf(250000));

        when(queryOrderService.listOrdersForUser(eq(userId), any())).thenReturn(List.of(o));

        String json1 = """
                {
                    "tool_calls": [
                        {"id": "c_orders", "type": "function", "function": {"name": "get_my_orders", "arguments": "{}"}}
                    ]
                }
                """;
        String json2 = """
                {"content": "Bạn có đơn hàng ORD-MY-999 đã giao thành công."}
                """;

        when(aiClient.complete(any()))
                .thenReturn(objectMapper.readTree(json1))
                .thenReturn(objectMapper.readTree(json2));

        AiChatRequest req = new AiChatRequest(List.of(new AiChatRequest.Message("user", "Xem đơn hàng của tôi")));
        AiChatResponse response = aiChatService.chat(req, principal);
        assertNotNull(response);
        verify(queryOrderService).listOrdersForUser(eq(userId), any());
    }

    @Test
    @DisplayName("chat thực thi tool create_address lưu địa chỉ mới")
    void testChat_CreateAddress() throws Exception {
        UserAddressResponse created = UserAddressResponse.builder()
                .id(UUID.randomUUID())
                .receiverName("Le Van C")
                .receiverPhone("0987654321")
                .addressLine("456 Nguyen Trai")
                .ward("Phường 7")
                .district("Quận 5")
                .city("TP. Hồ Chí Minh")
                .districtId(1443)
                .wardCode("20202")
                .isDefault(true)
                .build();

        when(userAddressService.createMyAddress(eq(userId), any())).thenReturn(created);

        String json1 = """
                {
                    "tool_calls": [
                        {
                            "id": "c_addr",
                            "type": "function",
                            "function": {
                                "name": "create_address",
                                "arguments": "{\\"receiverName\\": \\"Le Van C\\", \\"receiverPhone\\": \\"0987654321\\", \\"addressLine\\": \\"456 Nguyen Trai\\", \\"districtId\\": 1443, \\"wardCode\\": \\"20202\\", \\"city\\": \\"TP. HCM\\", \\"district\\": \\"Quan 5\\", \\"ward\\": \\"Phuong 7\\", \\"isDefault\\": true}"
                            }
                        }
                    ]
                }
                """;
        String json2 = """
                {"content": "Đã lưu địa chỉ mới của bạn tại 456 Nguyen Trai."}
                """;

        when(aiClient.complete(any()))
                .thenReturn(objectMapper.readTree(json1))
                .thenReturn(objectMapper.readTree(json2));

        AiChatRequest req = new AiChatRequest(List.of(new AiChatRequest.Message("user", "Thêm địa chỉ giao hàng")));
        AiChatResponse response = aiChatService.chat(req, principal);
        assertNotNull(response);
        verify(userAddressService).createMyAddress(eq(userId), any());
    }

    @Test
    @DisplayName("chat đặt hàng qua VNPay tạo link thanh toán")
    void testChat_OrderFlow_VnPay() throws Exception {
        UUID shopId = UUID.randomUUID();
        UUID addrId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();

        OrderResponse orderRes = new OrderResponse();
        orderRes.setId(orderId);
        orderRes.setOrderNumber("ORD-VNPAY-01");
        orderRes.setStatus(OrderStatus.PENDING_PAYMENT);
        orderRes.setTotal(BigDecimal.valueOf(1000000));
        orderRes.setPaymentMethod("VNPAY");

        when(orderService.convertCartToOrder(eq(userId), any())).thenReturn(orderRes);
        when(paymentService.createPayment(orderId, userId)).thenReturn("https://sandbox.vnpayment.vn/pay");

        String json1 = String.format("""
                {
                    "tool_calls": [
                        {
                            "id": "c_vn",
                            "type": "function",
                            "function": {
                                "name": "place_order",
                                "arguments": "{\\"shopId\\": \\"%s\\", \\"addressId\\": \\"%s\\", \\"paymentMethod\\": \\"VNPAY\\"}"
                            }
                        }
                    ]
                }
                """, shopId, addrId);
        String json2 = """
                {"content": "Đơn hàng đã tạo, vui lòng bấm link thanh toán VNPay."}
                """;

        when(aiClient.complete(any()))
                .thenReturn(objectMapper.readTree(json1))
                .thenReturn(objectMapper.readTree(json2));

        AiChatRequest req = new AiChatRequest(List.of(new AiChatRequest.Message("user", "Thanh toán qua VNPay")));
        AiChatResponse response = aiChatService.chat(req, principal);
        assertNotNull(response);
        assertEquals("https://sandbox.vnpayment.vn/pay", response.paymentUrl());
    }

    @Test
    @DisplayName("chat lookup_location tìm quận và phường và xử lý khi tool lỗi")
    void testChat_LocationDistrictAndWardAndErrors() throws Exception {
        GHNDistrictResponse d = new GHNDistrictResponse();
        d.setDistrictID(1442);
        d.setDistrictName("Quận 10");
        when(ghnClient.getDistricts(201)).thenReturn(List.of(d));

        GHNWardResponse w = new GHNWardResponse();
        w.setWardCode("20101");
        w.setWardName("Phường 14");
        when(ghnClient.getWards(1442)).thenReturn(List.of(w));

        String json1 = """
                {
                    "tool_calls": [
                        {"id": "c_dist", "type": "function", "function": {"name": "lookup_location", "arguments": "{\\"level\\": \\"district\\", \\"parentId\\": 201}"}},
                        {"id": "c_ward", "type": "function", "function": {"name": "lookup_location", "arguments": "{\\"level\\": \\"ward\\", \\"parentId\\": 1442}"}},
                        {"id": "c_err", "type": "function", "function": {"name": "unknown_tool", "arguments": "{}"}}
                    ]
                }
                """;
        String json2 = """
                {"content": "Đã tìm thấy quận phường"}
                """;

        when(aiClient.complete(any()))
                .thenReturn(objectMapper.readTree(json1))
                .thenReturn(objectMapper.readTree(json2));

        AiChatRequest req = new AiChatRequest(List.of(new AiChatRequest.Message("user", "Tìm quận phường")));
        AiChatResponse response = aiChatService.chat(req, principal);
        assertNotNull(response);
        verify(ghnClient).getDistricts(201);
        verify(ghnClient).getWards(1442);
    }

    @Test
    @DisplayName("toMessages validation và AI 429 / 500 error handling")
    void testToMessagesAndErrorHandling() {
        // toMessages empty throws
        assertThrows(CustomException.class, () -> aiChatService.chat(null, principal));
        assertThrows(CustomException.class, () -> aiChatService.chat(new AiChatRequest(null), principal));
        assertThrows(CustomException.class, () -> aiChatService.chat(new AiChatRequest(List.of()), principal));

        // trailing assistant message throws
        AiChatRequest trailingModel = new AiChatRequest(List.of(
                new AiChatRequest.Message("user", "Hello"),
                new AiChatRequest.Message("assistant", "Hi there")
        ));
        assertThrows(CustomException.class, () -> aiChatService.chat(trailingModel, principal));

        // Long text truncation and role mapping
        String longText = "a".repeat(1500);
        AiChatRequest longReq = new AiChatRequest(List.of(
                new AiChatRequest.Message("model", "b".repeat(4500)),
                new AiChatRequest.Message("user", longText)
        ));
        when(aiClient.complete(any())).thenReturn(objectMapper.createObjectNode()
                .put("content", "Xin chào!"));
        AiChatResponse resp = aiChatService.chat(longReq, principal);
        assertNotNull(resp);

        // 429 Too Many Requests
        doThrow(new IllegalStateException("HTTP 429 Rate limit exceeded")).when(aiClient).complete(any());
        CustomException ex429 = assertThrows(CustomException.class, () -> aiChatService.chat(longReq, principal));
        assertTrue(ex429.getMessage().contains("quá tải"));

        // 500 Internal Error
        doThrow(new IllegalStateException("HTTP 500 Server error")).when(aiClient).complete(any());
        CustomException ex500 = assertThrows(CustomException.class, () -> aiChatService.chat(longReq, principal));
        assertTrue(ex500.getMessage().contains("tạm thời không phản hồi"));
    }

    @Test
    @DisplayName("prepareCheckout tool: missing params, variants list, and quantity adjust")
    void testPrepareCheckout_AllBranches() throws Exception {
        UUID prodId = UUID.randomUUID();
        UUID varId = UUID.randomUUID();
        UUID addrId = UUID.randomUUID();
        UUID shopId = UUID.randomUUID();

        ProductVariantResponse variant = new ProductVariantResponse();
        variant.setId(varId);
        variant.setColor("Đen");
        variant.setSize("256GB");
        variant.setPrice(new BigDecimal("25000000"));
        variant.setStock(10);

        ProductResponse prod = new ProductResponse();
        prod.setId(prodId);
        prod.setName("iPhone 15 Pro");
        prod.setShopId(shopId);
        prod.setShopName("Apple Store");
        prod.setVariants(List.of(variant));
        ProductImageResponse img = new ProductImageResponse();
        img.setImageUrl("http://img.jpg");
        prod.setImages(List.of(img));

        when(queryProductService.getPublishedProductById(prodId)).thenReturn(prod);

        // 1. Tool call missing variantId -> returns variants choices
        com.fasterxml.jackson.databind.node.ObjectNode call1 = objectMapper.createObjectNode();
        call1.putNull("content");
        com.fasterxml.jackson.databind.node.ObjectNode fn1 = call1.putArray("tool_calls").addObject();
        fn1.put("id", "c1");
        fn1.put("type", "function");
        fn1.putObject("function")
                .put("name", "prepare_checkout")
                .put("arguments", "{\"productId\": \"" + prodId + "\", \"addressId\": \"" + addrId + "\"}");

        com.fasterxml.jackson.databind.node.ObjectNode finalNode = objectMapper.createObjectNode();
        finalNode.put("content", "Vui lòng chọn màu");

        when(aiClient.complete(any()))
                .thenReturn(call1)
                .thenReturn(finalNode);

        AiChatRequest req = new AiChatRequest(List.of(new AiChatRequest.Message("user", "Đặt hàng iPhone")));
        AiChatResponse res = aiChatService.chat(req, principal);
        assertNotNull(res);

        // 2. Line exists and quantity adjust: line.quantity = 1, requested = 3 -> calls cartService.add twice
        CartItemResponse line = new CartItemResponse();
        line.setId(UUID.randomUUID());
        line.setProductId(prodId);
        line.setVariantId(varId);
        line.setQuantity(1);
        line.setShopId(shopId);

        CartItemResponse otherLine = new CartItemResponse();
        otherLine.setId(UUID.randomUUID());
        otherLine.setProductId(UUID.randomUUID());
        otherLine.setShopId(shopId);
        otherLine.setProductName("Ốp lưng");
        otherLine.setQuantity(1);
        otherLine.setTotalPrice(new BigDecimal("100000"));

        CartResponse cart = new CartResponse();
        cart.setItems(List.of(line, otherLine));
        when(cartService.getCartByAccountId(principal.getAccountId())).thenReturn(cart);

        QuoteResponse quote = new QuoteResponse();
        quote.setSubtotal(new BigDecimal("75000000"));
        quote.setShippingFee(new BigDecimal("30000"));
        quote.setDiscountAmount(BigDecimal.ZERO);
        quote.setTotal(new BigDecimal("75030000"));
        when(checkoutService.quote(eq(principal.getAccountId()), any())).thenReturn(quote);

        com.fasterxml.jackson.databind.node.ObjectNode call2 = objectMapper.createObjectNode();
        call2.putNull("content");
        com.fasterxml.jackson.databind.node.ObjectNode fn2 = call2.putArray("tool_calls").addObject();
        fn2.put("id", "c2");
        fn2.put("type", "function");
        fn2.putObject("function")
                .put("name", "prepare_checkout")
                .put("arguments", "{\"productId\": \"" + prodId + "\", \"variantId\": \"" + varId + "\", \"addressId\": \"" + addrId + "\", \"quantity\": 3}");

        when(aiClient.complete(any()))
                .thenReturn(call2)
                .thenReturn(finalNode);

        AiChatResponse res2 = aiChatService.chat(req, principal);
        assertNotNull(res2);
        verify(cartService, times(2)).add(eq(principal.getAccountId()), eq(line.getId()));

        // 3. Line quantity = 5, requested = 2 -> calls cartService.minus 3 times
        line.setQuantity(5);
        com.fasterxml.jackson.databind.node.ObjectNode call3 = objectMapper.createObjectNode();
        call3.putNull("content");
        com.fasterxml.jackson.databind.node.ObjectNode fn3 = call3.putArray("tool_calls").addObject();
        fn3.put("id", "c3");
        fn3.put("type", "function");
        fn3.putObject("function")
                .put("name", "prepare_checkout")
                .put("arguments", "{\"productId\": \"" + prodId + "\", \"variantId\": \"" + varId + "\", \"addressId\": \"" + addrId + "\", \"quantity\": 2}");

        when(aiClient.complete(any()))
                .thenReturn(call3)
                .thenReturn(finalNode);

        AiChatResponse res3 = aiChatService.chat(req, principal);
        assertNotNull(res3);
        verify(cartService, times(3)).minus(eq(principal.getAccountId()), eq(line.getId()));
    }

    @Test
    @DisplayName("placeOrder tool: missing args and VNPay creation exception")
    void testPlaceOrder_MissingArgsAndVnPayException() throws Exception {
        UUID shopId = UUID.randomUUID();
        UUID addrId = UUID.randomUUID();

        // 1. Missing args
        com.fasterxml.jackson.databind.node.ObjectNode callFail = objectMapper.createObjectNode();
        callFail.putNull("content");
        com.fasterxml.jackson.databind.node.ObjectNode fnFail = callFail.putArray("tool_calls").addObject();
        fnFail.put("id", "c_fail");
        fnFail.put("type", "function");
        fnFail.putObject("function")
                .put("name", "place_order")
                .put("arguments", "{}");

        com.fasterxml.jackson.databind.node.ObjectNode finalNode = objectMapper.createObjectNode();
        finalNode.put("content", "Thiếu thông tin đặt hàng");

        when(aiClient.complete(any()))
                .thenReturn(callFail)
                .thenReturn(finalNode);

        AiChatRequest req = new AiChatRequest(List.of(new AiChatRequest.Message("user", "Đặt hàng ngay")));
        AiChatResponse res = aiChatService.chat(req, principal);
        assertNotNull(res);

        // 2. VNPAY creation throws exception
        OrderResponse o = new OrderResponse();
        o.setId(UUID.randomUUID());
        o.setOrderNumber("ORD-VNP-ERR");
        o.setPaymentMethod("VNPAY");
        o.setSubtotal(new BigDecimal("100000"));
        o.setShippingFee(BigDecimal.ZERO);
        o.setTotal(new BigDecimal("100000"));

        when(orderService.convertCartToOrder(eq(principal.getAccountId()), any())).thenReturn(o);
        when(paymentService.createPayment(eq(o.getId()), eq(principal.getAccountId())))
                .thenThrow(new RuntimeException("VNPay service offline"));

        com.fasterxml.jackson.databind.node.ObjectNode callVnp = objectMapper.createObjectNode();
        callVnp.putNull("content");
        com.fasterxml.jackson.databind.node.ObjectNode fnVnp = callVnp.putArray("tool_calls").addObject();
        fnVnp.put("id", "c_vnp");
        fnVnp.put("type", "function");
        fnVnp.putObject("function")
                .put("name", "place_order")
                .put("arguments", "{\"shopId\": \"" + shopId + "\", \"addressId\": \"" + addrId + "\", \"paymentMethod\": \"VNPAY\"}");

        when(aiClient.complete(any()))
                .thenReturn(callVnp)
                .thenReturn(finalNode);

        AiChatResponse resVnPay = aiChatService.chat(req, principal);
        assertNotNull(resVnPay);
    }

    @Test
    @DisplayName("show_product_cards tool va buildCards tao danh sach the san pham")
    void testShowProductCardsAndBuildCards() throws Exception {
        UUID pId = UUID.randomUUID();
        ProductResponse p = new ProductResponse();
        p.setId(pId);
        p.setName("iPhone 15 Pro");
        p.setBasePrice(new BigDecimal("25000000"));
        ProductImageResponse img = new ProductImageResponse();
        img.setImageUrl("http://image.com/p.jpg");
        p.setImages(List.of(img));

        when(queryProductService.getPublishedProductsByIds(any())).thenReturn(List.of(p));

        com.fasterxml.jackson.databind.node.ObjectNode call = objectMapper.createObjectNode();
        call.putNull("content");
        com.fasterxml.jackson.databind.node.ObjectNode fn = call.putArray("tool_calls").addObject();
        fn.put("id", "c_cards");
        fn.put("type", "function");
        fn.putObject("function")
                .put("name", "show_product_cards")
                .put("arguments", "{\"productIds\": [\"" + pId + "\"]}");

        com.fasterxml.jackson.databind.node.ObjectNode finalNode = objectMapper.createObjectNode();
        finalNode.put("content", "Day la danh sach san pham ban quan tam.");

        when(aiClient.complete(any()))
                .thenReturn(call)
                .thenReturn(finalNode);

        AiChatRequest req = new AiChatRequest(List.of(new AiChatRequest.Message("user", "Goi y san pham")));
        AiChatResponse res = aiChatService.chat(req, principal);

        assertNotNull(res);
        assertNotNull(res.productCards());
        assertEquals(1, res.productCards().size());
        assertEquals("iPhone 15 Pro", res.productCards().get(0).getName());
        assertEquals("http://image.com/p.jpg", res.productCards().get(0).getThumbnailUrl());
        assertEquals("http://localhost:3000/products/" + pId, res.productCards().get(0).getProductUrl());
    }

    @Test
    @DisplayName("show_choices tool hien thi cac goi y bam nhanh")
    void testShowChoices() throws Exception {
        com.fasterxml.jackson.databind.node.ObjectNode call = objectMapper.createObjectNode();
        call.putNull("content");
        com.fasterxml.jackson.databind.node.ObjectNode fn = call.putArray("tool_calls").addObject();
        fn.put("id", "c_choices");
        fn.put("type", "function");
        fn.putObject("function")
                .put("name", "show_choices")
                .put("arguments", "{\"choices\": [\"Tu van cau hinh\", \"Xem khuyen mai\"]}");

        com.fasterxml.jackson.databind.node.ObjectNode finalNode = objectMapper.createObjectNode();
        finalNode.put("content", "Ban co muon tiep tuc khong?");

        when(aiClient.complete(any()))
                .thenReturn(call)
                .thenReturn(finalNode);

        AiChatRequest req = new AiChatRequest(List.of(new AiChatRequest.Message("user", "Lua chon")));
        AiChatResponse res = aiChatService.chat(req, principal);

        assertNotNull(res);
        assertNotNull(res.choices());
        assertEquals(2, res.choices().size());
        assertTrue(res.choices().contains("Tu van cau hinh"));
    }

    @Test
    @DisplayName("get_product_detail tool phu chi tiet san pham va cac bien the")
    void testGetProductDetail_WithVariants() throws Exception {
        UUID prodId = UUID.randomUUID();
        ProductResponse p = new ProductResponse();
        p.setId(prodId);
        p.setName("Laptop Gaming Asus ROG");
        p.setShopId(UUID.randomUUID());
        p.setShopName("ROG Store");
        p.setDescription("Mo ta laptop gaming");
        p.setSpecifications("Core i7, RTX 4060");
        p.setBatteryHealth(98);
        p.setIsRepaired(false);
        p.setRepairDetails("Chua qua sua chua");

        ProductVariantResponse var = ProductVariantResponse.builder()
                .id(UUID.randomUUID())
                .color("Eclipse Gray")
                .size("16GB-512GB")
                .price(new BigDecimal("30000000"))
                .stock(15)
                .build();
        p.setVariants(List.of(var));

        when(queryProductService.getPublishedProductById(prodId)).thenReturn(p);

        com.fasterxml.jackson.databind.node.ObjectNode call = objectMapper.createObjectNode();
        call.putNull("content");
        com.fasterxml.jackson.databind.node.ObjectNode fn = call.putArray("tool_calls").addObject();
        fn.put("id", "c_detail");
        fn.put("type", "function");
        fn.putObject("function")
                .put("name", "get_product_detail")
                .put("arguments", "{\"productId\": \"" + prodId + "\"}");

        com.fasterxml.jackson.databind.node.ObjectNode finalNode = objectMapper.createObjectNode();
        finalNode.put("content", "Chi tiet laptop Asus ROG cau hinh manh");

        when(aiClient.complete(any()))
                .thenReturn(call)
                .thenReturn(finalNode);

        AiChatRequest req = new AiChatRequest(List.of(new AiChatRequest.Message("user", "Xem chi tiet may Asus")));
        AiChatResponse res = aiChatService.chat(req, principal);

        assertNotNull(res);
        assertEquals("Chi tiet laptop Asus ROG cau hinh manh", res.reply());
    }

    @Test
    @DisplayName("lookup_location tool phu cac cap tinh, quan, phuong va loc theo ten co dau/khong dau")
    void testLookupLocation_AllLevels() throws Exception {
        // 1. Province lookup with norm search
        GHNProvinceResponse p1 = new GHNProvinceResponse();
        p1.setProvinceID(201);
        p1.setProvinceName("Hà Nội");
        GHNProvinceResponse p2 = new GHNProvinceResponse();
        p2.setProvinceID(202);
        p2.setProvinceName("Đà Nẵng");
        when(ghnClient.getProvinces()).thenReturn(List.of(p1, p2));

        com.fasterxml.jackson.databind.node.ObjectNode callProv = objectMapper.createObjectNode();
        callProv.putNull("content");
        com.fasterxml.jackson.databind.node.ObjectNode fnProv = callProv.putArray("tool_calls").addObject();
        fnProv.put("id", "c_prov");
        fnProv.put("type", "function");
        fnProv.putObject("function")
                .put("name", "lookup_location")
                .put("arguments", "{\"level\": \"province\", \"query\": \"Ha Noi\"}");

        com.fasterxml.jackson.databind.node.ObjectNode finalNode = objectMapper.createObjectNode();
        finalNode.put("content", "Da tim thay tinh Ha Noi");

        when(aiClient.complete(any()))
                .thenReturn(callProv)
                .thenReturn(finalNode);

        AiChatRequest req = new AiChatRequest(List.of(new AiChatRequest.Message("user", "Tim tinh Ha Noi")));
        AiChatResponse res = aiChatService.chat(req, principal);
        assertNotNull(res);

        // 2. District lookup
        GHNDistrictResponse d1 = new GHNDistrictResponse();
        d1.setDistrictID(1442);
        d1.setDistrictName("Quan Ba Dinh");
        when(ghnClient.getDistricts(201)).thenReturn(List.of(d1));

        com.fasterxml.jackson.databind.node.ObjectNode callDist = objectMapper.createObjectNode();
        callDist.putNull("content");
        com.fasterxml.jackson.databind.node.ObjectNode fnDist = callDist.putArray("tool_calls").addObject();
        fnDist.put("id", "c_dist");
        fnDist.put("type", "function");
        fnDist.putObject("function")
                .put("name", "lookup_location")
                .put("arguments", "{\"level\": \"district\", \"parentId\": 201}");

        when(aiClient.complete(any()))
                .thenReturn(callDist)
                .thenReturn(finalNode);

        AiChatResponse resDist = aiChatService.chat(req, principal);
        assertNotNull(resDist);

        // 3. Ward lookup
        GHNWardResponse w1 = new GHNWardResponse();
        w1.setWardCode("1A0101");
        w1.setWardName("Phuong Cong Vi");
        when(ghnClient.getWards(1442)).thenReturn(List.of(w1));

        com.fasterxml.jackson.databind.node.ObjectNode callWard = objectMapper.createObjectNode();
        callWard.putNull("content");
        com.fasterxml.jackson.databind.node.ObjectNode fnWard = callWard.putArray("tool_calls").addObject();
        fnWard.put("id", "c_ward");
        fnWard.put("type", "function");
        fnWard.putObject("function")
                .put("name", "lookup_location")
                .put("arguments", "{\"level\": \"ward\", \"parentId\": 1442, \"query\": \"Cong Vi\"}");

        when(aiClient.complete(any()))
                .thenReturn(callWard)
                .thenReturn(finalNode);

        AiChatResponse resWard = aiChatService.chat(req, principal);
        assertNotNull(resWard);

        // 4. Invalid level or missing parentId
        com.fasterxml.jackson.databind.node.ObjectNode callInvalid = objectMapper.createObjectNode();
        callInvalid.putNull("content");
        com.fasterxml.jackson.databind.node.ObjectNode fnInvalid = callInvalid.putArray("tool_calls").addObject();
        fnInvalid.put("id", "c_inv");
        fnInvalid.put("type", "function");
        fnInvalid.putObject("function")
                .put("name", "lookup_location")
                .put("arguments", "{\"level\": \"unknown\"}");

        when(aiClient.complete(any()))
                .thenReturn(callInvalid)
                .thenReturn(finalNode);

        AiChatResponse resInv = aiChatService.chat(req, principal);
        assertNotNull(resInv);
    }

    @Test
    @DisplayName("get_my_orders tool bao phu danh sach don va danh sach mat hang OrderItemResponse")
    void testGetMyOrders_WithOrderItems() throws Exception {
        OrderResponse o = new OrderResponse();
        o.setId(UUID.randomUUID());
        o.setOrderNumber("ORD-99999");
        o.setStatus(OrderStatus.DELIVERED);
        o.setTotal(new BigDecimal("1500000"));
        o.setShopName("Gaming Shop");
        o.setPaymentMethod("COD");

        OrderItemResponse item = OrderItemResponse.builder()
                .productName("Chuot khong day Logitech G Pro")
                .quantity(2)
                .build();
        o.setItems(List.of(item));

        when(queryOrderService.listOrdersForUser(eq(principal.getAccountId()), any())).thenReturn(List.of(o));

        com.fasterxml.jackson.databind.node.ObjectNode call = objectMapper.createObjectNode();
        call.putNull("content");
        com.fasterxml.jackson.databind.node.ObjectNode fn = call.putArray("tool_calls").addObject();
        fn.put("id", "c_orders");
        fn.put("type", "function");
        fn.putObject("function")
                .put("name", "get_my_orders")
                .put("arguments", "{\"status\": \"DELIVERED\"}");

        com.fasterxml.jackson.databind.node.ObjectNode finalNode = objectMapper.createObjectNode();
        finalNode.put("content", "Ban co don hang ORD-99999 da giao thanh cong");

        when(aiClient.complete(any()))
                .thenReturn(call)
                .thenReturn(finalNode);

        AiChatRequest req = new AiChatRequest(List.of(new AiChatRequest.Message("user", "Kiem tra don hang cua toi")));
        AiChatResponse res = aiChatService.chat(req, principal);

        assertNotNull(res);
        assertTrue(res.reply().contains("ORD-99999"));
    }

    @Test
    @DisplayName("chat voi nguoi dung chua dang nhap")
    void testChat_AnonymousUser() throws Exception {
        com.fasterxml.jackson.databind.node.ObjectNode finalNode = objectMapper.createObjectNode();
        finalNode.put("content", "Xin chao quy khach vang lai!");

        when(aiClient.complete(any())).thenReturn(finalNode);

        AiChatRequest req = new AiChatRequest(List.of(new AiChatRequest.Message("user", "Xin chao")));
        AiChatResponse res = aiChatService.chat(req, null);

        assertNotNull(res);
        assertEquals("Xin chao quy khach vang lai!", res.reply());
    }
}
