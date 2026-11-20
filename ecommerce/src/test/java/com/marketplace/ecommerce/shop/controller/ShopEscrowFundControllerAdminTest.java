package com.marketplace.ecommerce.shop.controller;

import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.service.TokenService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.common.exception.GlobalExceptionHandler;
import com.marketplace.ecommerce.config.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.shop.dto.request.AdminAdjustEscrowFundRequest;
import com.marketplace.ecommerce.shop.dto.response.ShopEscrowFundResponse;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopEscrowFundService;

/**
 * Các thao tác admin trên quỹ ký quỹ của shop. Controller này tự kiểm tra role trong code
 * (không dùng @PreAuthorize), nên người không phải admin nhận 400 thay vì 403.
 */
@WebMvcTest(ShopEscrowFundController.class)
@Import({
        SecurityConfig.class,
        JwtFilter.class,
        WebMvcConfig.class,
        ApiVersioningConfig.class,
        CurrentUserArgumentResolver.class,
        GlobalExceptionHandler.class
})
class ShopEscrowFundControllerAdminTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private ShopEscrowFundService shopEscrowFundService;
    @MockitoBean private UserRepository userRepository;
    @MockitoBean private ShopRepository shopRepository;
    @MockitoBean private AccountRepository accountRepository;
    @MockitoBean private TokenService tokenService;

    private final UUID shopId = UUID.randomUUID();

    private static Authentication as(String role, UUID accountId) {
        CurrentUserInfo info = new CurrentUserInfo();
        info.setAccountId(accountId);
        info.setUsername(role.toLowerCase());
        info.setRole(role);
        return new UsernamePasswordAuthenticationToken(info, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }

    private static Authentication as(String role) {
        return as(role, UUID.randomUUID());
    }

    private static final String DEDUCT_BODY = "{\"orderId\":\"" + UUID.randomUUID()
            + "\",\"amount\":50000,\"reason\":\"Bồi thường khách\",\"clientRequestId\":\"req-1\"}";
    private static final String ADJUST_BODY = "{\"balance\":1000000,\"targetTrustLevel\":3,\"reason\":\"Điều chỉnh tay\"}";

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "BUSINESS"})
    @DisplayName("Người không phải admin không trích, điều chỉnh, duyệt hay xem quỹ của shop khác")
    void nonAdminsRejected(String role) throws Exception {
        Authentication auth = as(role);
        mockMvc.perform(post("/api/v1/shop-escrow-fund/admin/{id}/deduct", shopId).with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON).content(DEDUCT_BODY))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/v1/shop-escrow-fund/admin/{id}/adjust", shopId).with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON).content(ADJUST_BODY))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/shop-escrow-fund/admin/{id}/approve-close-refund", shopId).with(authentication(auth)))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/shop-escrow-fund/admin/{id}/reject-close-refund", shopId).with(authentication(auth)))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/shop-escrow-fund/admin").with(authentication(auth)))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/shop-escrow-fund/admin/shop/{id}", shopId).with(authentication(auth)))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(shopEscrowFundService);
    }

    @Test
    @DisplayName("ADMIN điều chỉnh quỹ, kèm tài khoản admin để ghi vết")
    void adminAdjusts() throws Exception {
        UUID admin = UUID.randomUUID();
        when(shopEscrowFundService.adminAdjustFund(eq(shopId), any(), eq(admin)))
                .thenReturn(ShopEscrowFundResponse.builder().build());

        mockMvc.perform(put("/api/v1/shop-escrow-fund/admin/{id}/adjust", shopId).with(authentication(as("ADMIN", admin)))
                        .contentType(MediaType.APPLICATION_JSON).content(ADJUST_BODY))
                .andExpect(status().isOk());

        verify(shopEscrowFundService).adminAdjustFund(eq(shopId), any(AdminAdjustEscrowFundRequest.class), eq(admin));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{\"balance\":-1,\"reason\":\"x\"}",
            "{\"targetTrustLevel\":6,\"reason\":\"x\"}",
            "{\"targetTrustLevel\":0,\"reason\":\"x\"}",
            "{\"balance\":1000}"
    })
    @DisplayName("Điều chỉnh quỹ: số dư âm, bậc sao ngoài 1–5 hoặc thiếu lý do bị từ chối 400")
    void adjustValidation(String body) throws Exception {
        mockMvc.perform(put("/api/v1/shop-escrow-fund/admin/{id}/adjust", shopId).with(authentication(as("ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(shopEscrowFundService);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{\"amount\":50000,\"reason\":\"x\",\"clientRequestId\":\"r\"}",
            "{\"orderId\":\"00000000-0000-0000-0000-000000000001\",\"amount\":999,\"reason\":\"x\",\"clientRequestId\":\"r\"}",
            "{\"orderId\":\"00000000-0000-0000-0000-000000000001\",\"amount\":50000,\"clientRequestId\":\"r\"}",
            "{\"orderId\":\"00000000-0000-0000-0000-000000000001\",\"amount\":50000,\"reason\":\"x\"}"
    })
    @DisplayName("Trích bồi thường: thiếu đơn, dưới 1.000đ, thiếu lý do hoặc mã chống trùng bị từ chối 400")
    void deductValidation(String body) throws Exception {
        mockMvc.perform(post("/api/v1/shop-escrow-fund/admin/{id}/deduct", shopId).with(authentication(as("ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(shopEscrowFundService);
    }

    @Test
    @DisplayName("ADMIN từ chối đóng shop, lý do lấy từ body; đường dẫn cũ /reject-close-shop vẫn chạy")
    void adminRejectsCloseWithReason() throws Exception {
        when(shopEscrowFundService.adminRejectCloseShopRefund(eq(shopId), any())).thenReturn(ShopEscrowFundResponse.builder().build());

        mockMvc.perform(post("/api/v1/shop-escrow-fund/admin/{id}/reject-close-shop", shopId).with(authentication(as("ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Còn đơn chưa xử lý\"}"))
                .andExpect(status().isOk());

        verify(shopEscrowFundService).adminRejectCloseShopRefund(shopId, "Còn đơn chưa xử lý");
    }
}
