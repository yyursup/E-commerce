package com.marketplace.ecommerce.platform.controller;

import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.service.TokenService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.common.exception.GlobalExceptionHandler;
import com.marketplace.ecommerce.config.*;
import com.marketplace.ecommerce.platform.service.CommissionService;
import com.marketplace.ecommerce.platform.service.CommissionStatisticsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Thống kê và ghi nhận hoa hồng sàn: toàn bộ controller chỉ dành cho ADMIN.
 */
@WebMvcTest(CommissionStatisticsController.class)
@Import({
        SecurityConfig.class,
        JwtFilter.class,
        WebMvcConfig.class,
        ApiVersioningConfig.class,
        CurrentUserArgumentResolver.class,
        GlobalExceptionHandler.class
})
class CommissionStatisticsControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private CommissionStatisticsService commissionStatisticsService;
    @MockitoBean private CommissionService commissionService;
    @MockitoBean private AccountRepository accountRepository;
    @MockitoBean private TokenService tokenService;

    private static Authentication as(String role) {
        CurrentUserInfo info = new CurrentUserInfo();
        info.setAccountId(UUID.randomUUID());
        info.setUsername(role.toLowerCase());
        info.setRole(role);
        return new UsernamePasswordAuthenticationToken(info, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "BUSINESS"})
    @DisplayName("Khách hàng và người bán không xem được doanh thu hoa hồng, không tạo hoa hồng cho đơn")
    void nonAdminsForbidden(String role) throws Exception {
        for (String path : List.of("/overview", "/by-month", "/by-category", "/top-sellers", "")) {
            mockMvc.perform(get("/api/v1/commissions" + path).with(authentication(as(role))))
                    .andExpect(status().isForbidden());
        }
        mockMvc.perform(post("/api/v1/commissions/orders/{id}", UUID.randomUUID()).with(authentication(as(role))))
                .andExpect(status().isForbidden());
        verifyNoInteractions(commissionStatisticsService, commissionService);
    }

    @Test
    @DisplayName("ADMIN xem top người bán, mặc định 5 người")
    void topSellersDefaultLimit() throws Exception {
        mockMvc.perform(get("/api/v1/commissions/top-sellers").with(authentication(as("ADMIN"))))
                .andExpect(status().isOk());
        verify(commissionStatisticsService).getTopSellers(5);
    }

    @Test
    @DisplayName("ADMIN ghi nhận hoa hồng cho một đơn")
    void adminCreatesCommission() throws Exception {
        UUID orderId = UUID.randomUUID();
        mockMvc.perform(post("/api/v1/commissions/orders/{id}", orderId).with(authentication(as("ADMIN"))))
                .andExpect(status().isOk());
        verify(commissionService).createCommission(orderId);
    }
}
