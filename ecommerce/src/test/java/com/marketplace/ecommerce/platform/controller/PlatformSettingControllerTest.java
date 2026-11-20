package com.marketplace.ecommerce.platform.controller;

import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.service.TokenService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.common.exception.GlobalExceptionHandler;
import com.marketplace.ecommerce.config.*;
import com.marketplace.ecommerce.platform.dto.PlatformSettingResponse;
import com.marketplace.ecommerce.platform.service.CommissionCalculationService;
import com.marketplace.ecommerce.platform.service.PlatformSettingService;
import com.marketplace.ecommerce.product.repository.ProductCategoryRepository;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Cài đặt sàn (tỷ lệ hoa hồng...): ai cũng đọc được, chỉ ADMIN được sửa.
 */
@WebMvcTest(PlatformSettingController.class)
@Import({
        SecurityConfig.class,
        JwtFilter.class,
        WebMvcConfig.class,
        ApiVersioningConfig.class,
        CurrentUserArgumentResolver.class,
        GlobalExceptionHandler.class
})
class PlatformSettingControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private PlatformSettingService platformSettingService;
    @MockitoBean private CommissionCalculationService commissionCalculationService;
    @MockitoBean private ShopRepository shopRepository;
    @MockitoBean private ProductCategoryRepository productCategoryRepository;
    @MockitoBean private AccountRepository accountRepository;
    @MockitoBean private TokenService tokenService;

    private static Authentication as(String role) {
        CurrentUserInfo info = new CurrentUserInfo();
        info.setAccountId(UUID.randomUUID());
        info.setUsername(role.toLowerCase());
        info.setRole(role);
        return new UsernamePasswordAuthenticationToken(info, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }

    private static PlatformSettingResponse setting(String key, String value) {
        return PlatformSettingResponse.builder().id(UUID.randomUUID()).key(key).value(value).build();
    }

    @Test
    @DisplayName("GET /api/v1/platform — mọi tài khoản đã đăng nhập đều xem được cài đặt")
    void anyoneCanReadSettings() throws Exception {
        when(platformSettingService.getPlatformSetting()).thenReturn(setting("COMMISSION_RATE", "5"));

        mockMvc.perform(get("/api/v1/platform").with(authentication(as("CUSTOMER"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.value").value("5"));
    }

    @Nested
    @DisplayName("PATCH /api/v1/platform — đổi tỷ lệ hoa hồng")
    class UpdateCommissionRate {

        private static final String BODY = "{\"commissionRate\": 7.5}";

        @Test
        @DisplayName("ADMIN đổi được tỷ lệ")
        void adminCanUpdate() throws Exception {
            when(platformSettingService.setCommissionRate(any())).thenReturn(setting("COMMISSION_RATE", "7.5"));

            mockMvc.perform(patch("/api/v1/platform").with(authentication(as("ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON).content(BODY))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.value").value("7.5"));

            verify(platformSettingService).setCommissionRate(new BigDecimal("7.5"));
        }

        @ParameterizedTest
        @ValueSource(strings = {"CUSTOMER", "BUSINESS"})
        @DisplayName("Khách hàng và người bán bị chặn 403")
        void otherRolesForbidden(String role) throws Exception {
            mockMvc.perform(patch("/api/v1/platform").with(authentication(as(role)))
                            .contentType(MediaType.APPLICATION_JSON).content(BODY))
                    .andExpect(status().isForbidden());

            verify(platformSettingService, never()).setCommissionRate(any());
        }

        @Test
        @DisplayName("Chưa đăng nhập bị chặn 401")
        void anonymousRejected() throws Exception {
            mockMvc.perform(patch("/api/v1/platform")
                            .contentType(MediaType.APPLICATION_JSON).content(BODY))
                    .andExpect(status().isUnauthorized());

            verify(platformSettingService, never()).setCommissionRate(any());
        }

        @ParameterizedTest
        @ValueSource(strings = {"-1", "100.01"})
        @DisplayName("Tỷ lệ ngoài khoảng 0–100% bị từ chối 400")
        void rejectsOutOfRangeRate(String rate) throws Exception {
            mockMvc.perform(patch("/api/v1/platform").with(authentication(as("ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON).content("{\"commissionRate\": " + rate + "}"))
                    .andExpect(status().isBadRequest());

            verify(platformSettingService, never()).setCommissionRate(any());
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/platform/setting — sửa một cài đặt bất kỳ")
    class UpdateSetting {

        @Test
        @DisplayName("ADMIN sửa được")
        void adminCanUpdate() throws Exception {
            when(platformSettingService.updateSetting("MIN_WITHDRAWAL", "50000")).thenReturn(setting("MIN_WITHDRAWAL", "50000"));

            mockMvc.perform(put("/api/v1/platform/setting").with(authentication(as("ADMIN")))
                            .param("key", "MIN_WITHDRAWAL").param("value", "50000"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.key").value("MIN_WITHDRAWAL"));
        }

        @ParameterizedTest
        @ValueSource(strings = {"CUSTOMER", "BUSINESS"})
        @DisplayName("Khách hàng và người bán bị chặn 403")
        void otherRolesForbidden(String role) throws Exception {
            mockMvc.perform(put("/api/v1/platform/setting").with(authentication(as(role)))
                            .param("key", "COMMISSION_RATE").param("value", "0"))
                    .andExpect(status().isForbidden());

            verify(platformSettingService, never()).updateSetting(anyString(), anyString());
        }

        @Test
        @DisplayName("Chưa đăng nhập bị chặn")
        void anonymousRejected() throws Exception {
            mockMvc.perform(put("/api/v1/platform/setting").param("key", "COMMISSION_RATE").param("value", "0"))
                    .andExpect(status().is4xxClientError());

            verify(platformSettingService, never()).updateSetting(anyString(), anyString());
        }
    }

    @Test
    @DisplayName("GET /commission/calculate-preview — tính thử hoa hồng, bỏ qua shop/danh mục không tồn tại")
    void calculatePreview() throws Exception {
        UUID shopId = UUID.randomUUID();
        when(shopRepository.findById(shopId)).thenReturn(java.util.Optional.empty());

        mockMvc.perform(get("/api/v1/platform/commission/calculate-preview").param("shopId", shopId.toString())
                        .with(authentication(as("BUSINESS"))))
                .andExpect(status().isOk());

        verify(commissionCalculationService).calculateRateBreakdown(null, null, null);
    }
}
