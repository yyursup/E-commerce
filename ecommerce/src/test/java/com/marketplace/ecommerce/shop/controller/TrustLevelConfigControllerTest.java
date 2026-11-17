package com.marketplace.ecommerce.shop.controller;

import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.service.TokenService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.common.exception.GlobalExceptionHandler;
import com.marketplace.ecommerce.config.*;
import com.marketplace.ecommerce.shop.dto.request.TrustLevelConfigRequest;
import com.marketplace.ecommerce.shop.service.TrustLevelConfigService;
import org.junit.jupiter.api.DisplayName;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Cấu hình bậc sao uy tín của shop (ngưỡng ký quỹ, giảm hoa hồng): xem công khai, chỉ ADMIN được sửa.
 */
@WebMvcTest(TrustLevelConfigController.class)
@Import({
        SecurityConfig.class,
        JwtFilter.class,
        WebMvcConfig.class,
        ApiVersioningConfig.class,
        CurrentUserArgumentResolver.class,
        GlobalExceptionHandler.class
})
class TrustLevelConfigControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private TrustLevelConfigService trustLevelConfigService;
    @MockitoBean private AccountRepository accountRepository;
    @MockitoBean private TokenService tokenService;

    private static final String BODY = "{\"tierName\":\"Vàng\",\"minDeposit\":5000000}";

    private static Authentication as(String role, UUID accountId) {
        CurrentUserInfo info = new CurrentUserInfo();
        info.setAccountId(accountId);
        info.setUsername(role.toLowerCase());
        info.setRole(role);
        return new UsernamePasswordAuthenticationToken(info, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }

    @Test
    @DisplayName("Người bán xem được các bậc đang áp dụng")
    void sellersCanReadActiveLevels() throws Exception {
        when(trustLevelConfigService.getActiveConfigs()).thenReturn(List.of());
        mockMvc.perform(get("/api/v1/trust-levels").with(authentication(as("BUSINESS", UUID.randomUUID()))))
                .andExpect(status().isOk());
    }

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "BUSINESS"})
    @DisplayName("Người không phải admin không sửa, không reset, không xem bản quản trị")
    void nonAdminsRejected(String role) throws Exception {
        Authentication auth = as(role, UUID.randomUUID());
        mockMvc.perform(put("/api/v1/trust-levels/admin/{level}", 3).with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/trust-levels/admin/reset-defaults").with(authentication(auth)))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/trust-levels/admin").with(authentication(auth)))
                .andExpect(status().isBadRequest());
        verify(trustLevelConfigService, never()).updateConfig(any(), any(), any());
        verify(trustLevelConfigService, never()).resetDefaultConfigs(any());
        verify(trustLevelConfigService, never()).getAllConfigs();
    }

    @Test
    @DisplayName("ADMIN sửa một bậc, kèm tài khoản admin để ghi vết")
    void adminUpdates() throws Exception {
        UUID admin = UUID.randomUUID();

        mockMvc.perform(put("/api/v1/trust-levels/admin/{level}", 3).with(authentication(as("ADMIN", admin)))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isOk());

        verify(trustLevelConfigService).updateConfig(eq(3), argThat((TrustLevelConfigRequest r) ->
                r.getTierName().equals("Vàng")), eq(admin));
    }

    @ParameterizedTest
    @ValueSource(strings = {"{\"minDeposit\":1}", "{\"tierName\":\" \",\"minDeposit\":1}", "{\"tierName\":\"Vàng\"}"})
    @DisplayName("Thiếu tên bậc hoặc ngưỡng ký quỹ bị từ chối 400")
    void validation(String body) throws Exception {
        mockMvc.perform(put("/api/v1/trust-levels/admin/{level}", 3).with(authentication(as("ADMIN", UUID.randomUUID())))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        verify(trustLevelConfigService, never()).updateConfig(any(), any(), any());
    }

    @Test
    @DisplayName("ADMIN khôi phục cấu hình mặc định")
    void adminResets() throws Exception {
        UUID admin = UUID.randomUUID();
        mockMvc.perform(post("/api/v1/trust-levels/admin/reset-defaults").with(authentication(as("ADMIN", admin))))
                .andExpect(status().isOk());
        verify(trustLevelConfigService).resetDefaultConfigs(admin);
    }
}
