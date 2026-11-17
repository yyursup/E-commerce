package com.marketplace.ecommerce.payment.controller;

import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.service.TokenService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.common.exception.GlobalExceptionHandler;
import com.marketplace.ecommerce.config.*;
import com.marketplace.ecommerce.order.service.OrderReturnService;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;
import com.marketplace.ecommerce.payment.policy.EscrowPolicy;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Admin quyết toán ký quỹ: giải ngân cho shop, hoàn tiền cho khách, chia tỷ lệ.
 */
@WebMvcTest(EscrowController.class)
@Import({
        SecurityConfig.class,
        JwtFilter.class,
        WebMvcConfig.class,
        ApiVersioningConfig.class,
        CurrentUserArgumentResolver.class,
        GlobalExceptionHandler.class
})
class EscrowControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private EscrowService escrowService;
    @MockitoBean private EscrowPolicy escrowPolicy;
    @MockitoBean private OrderReturnService orderReturnService;
    @MockitoBean private AccountRepository accountRepository;
    @MockitoBean private TokenService tokenService;

    private final UUID orderId = UUID.randomUUID();

    private static Authentication as(String role) {
        CurrentUserInfo info = new CurrentUserInfo();
        info.setAccountId(UUID.randomUUID());
        info.setUsername(role.toLowerCase());
        info.setRole(role);
        return new UsernamePasswordAuthenticationToken(info, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }

    @Nested
    @DisplayName("Chỉ ADMIN được quyết toán ký quỹ")
    class Authorization {

        @ParameterizedTest
        @ValueSource(strings = {"CUSTOMER", "BUSINESS"})
        @DisplayName("Khách hàng và người bán không giải ngân, hoàn tiền hay chia tiền được")
        void nonAdminsForbidden(String role) throws Exception {
            mockMvc.perform(post("/api/v1/escrow/orders/{id}/release", orderId).with(authentication(as(role))))
                    .andExpect(status().isForbidden());
            mockMvc.perform(post("/api/v1/escrow/orders/{id}/refund", orderId).with(authentication(as(role))))
                    .andExpect(status().isForbidden());
            mockMvc.perform(post("/api/v1/escrow/orders/{id}/split-settle", orderId).with(authentication(as(role)))
                            .contentType(MediaType.APPLICATION_JSON).content("{\"buyerPercentage\":50,\"sellerPercentage\":50}"))
                    .andExpect(status().isForbidden());
            mockMvc.perform(get("/api/v1/escrow").with(authentication(as(role))))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(escrowService, escrowPolicy, orderReturnService);
        }

        @Test
        @DisplayName("Chưa đăng nhập bị chặn")
        void anonymousRejected() throws Exception {
            mockMvc.perform(post("/api/v1/escrow/orders/{id}/release", orderId))
                    .andExpect(status().is4xxClientError());
            verifyNoInteractions(escrowService);
        }
    }

    @Nested
    @DisplayName("POST /orders/{id}/release — giải ngân cho shop")
    class Release {

        @Test
        @DisplayName("Kiểm tra điều kiện, giải ngân rồi đóng yêu cầu hoàn hàng là CANCELLED")
        void releasesAndClosesReturn() throws Exception {
            mockMvc.perform(post("/api/v1/escrow/orders/{id}/release", orderId).param("reason", "Khách không gửi hàng")
                            .with(authentication(as("ADMIN"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.ok").value(true))
                    .andExpect(jsonPath("$.orderId").value(orderId.toString()));

            InOrder inOrder = inOrder(escrowPolicy, escrowService, orderReturnService);
            inOrder.verify(escrowPolicy).validateSettlementPreconditions(orderId);
            inOrder.verify(escrowService).releaseByOrder(orderId);
            inOrder.verify(orderReturnService).closeReturnOnEscrowSettled(orderId, ReturnStatus.CANCELLED,
                    "Ban Quản Trị giải ngân ký quỹ cho Shop: Khách không gửi hàng");
        }

        @Test
        @DisplayName("Không có lý do: dùng ghi chú mặc định")
        void defaultNote() throws Exception {
            mockMvc.perform(post("/api/v1/escrow/orders/{id}/release", orderId).with(authentication(as("ADMIN"))))
                    .andExpect(status().isOk());

            verify(orderReturnService).closeReturnOnEscrowSettled(orderId, ReturnStatus.CANCELLED,
                    "Ban Quản Trị giải ngân ký quỹ cho Shop");
        }

        @Test
        @DisplayName("Điều kiện quyết toán không đạt: không đụng tới tiền")
        void stopsWhenPreconditionsFail() throws Exception {
            doThrow(new CustomException("Đơn đang trong thời gian khiếu nại"))
                    .when(escrowPolicy).validateSettlementPreconditions(orderId);

            mockMvc.perform(post("/api/v1/escrow/orders/{id}/release", orderId).with(authentication(as("ADMIN"))))
                    .andExpect(status().isBadRequest());

            verifyNoInteractions(escrowService, orderReturnService);
        }
    }

    @Test
    @DisplayName("POST /orders/{id}/refund — hoàn tiền cho khách và đóng yêu cầu hoàn hàng là COMPLETED")
    void refund() throws Exception {
        mockMvc.perform(post("/api/v1/escrow/orders/{id}/refund", orderId).param("reason", "Shop lừa đảo")
                        .with(authentication(as("ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));

        verify(escrowService).refundByOrder(orderId, "Shop lừa đảo");
        verify(orderReturnService).closeReturnOnEscrowSettled(orderId, ReturnStatus.COMPLETED,
                "Ban Quản Trị hoàn tiền ký quỹ cho Người mua: Shop lừa đảo");
    }

    @Nested
    @DisplayName("POST /orders/{id}/split-settle — chia tiền theo tỷ lệ")
    class SplitSettle {

        @Test
        @DisplayName("Chia tiền và ghi tỷ lệ vào ghi chú đóng yêu cầu hoàn hàng")
        void splits() throws Exception {
            mockMvc.perform(post("/api/v1/escrow/orders/{id}/split-settle", orderId).with(authentication(as("ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"buyerPercentage\":30,\"sellerPercentage\":70,\"note\":\"Trầy nhẹ\"}"))
                    .andExpect(status().isOk());

            verify(escrowService).splitSettleByOrder(orderId, 30, 70, "Trầy nhẹ");
            verify(orderReturnService).closeReturnOnEscrowSettled(orderId, ReturnStatus.COMPLETED,
                    "Admin phân chia ký quỹ: Người mua 30%, Người bán 70%. Trầy nhẹ");
        }

        @ParameterizedTest
        @ValueSource(strings = {
                "{\"sellerPercentage\":50}",
                "{\"buyerPercentage\":50}",
                "{\"buyerPercentage\":-1,\"sellerPercentage\":101}",
                "{\"buyerPercentage\":150,\"sellerPercentage\":0}"
        })
        @DisplayName("Thiếu tỷ lệ hoặc tỷ lệ ngoài 0–100 bị từ chối 400")
        void rejectsInvalidPercentages(String body) throws Exception {
            mockMvc.perform(post("/api/v1/escrow/orders/{id}/split-settle", orderId).with(authentication(as("ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());

            verifyNoInteractions(escrowService);
        }
    }

    @Test
    @DisplayName("GET /api/v1/escrow — ADMIN lọc danh sách ký quỹ theo trạng thái")
    void adminList() throws Exception {
        when(escrowService.adminList(eq(EscrowStatus.DISPUTED), any())).thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/escrow").param("status", "DISPUTED").with(authentication(as("ADMIN"))))
                .andExpect(status().isOk());

        verify(escrowService).adminList(eq(EscrowStatus.DISPUTED), any());
    }
}
