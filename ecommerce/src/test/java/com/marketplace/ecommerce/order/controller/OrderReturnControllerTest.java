package com.marketplace.ecommerce.order.controller;

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
import com.marketplace.ecommerce.order.dto.request.AdminResolveReturnDisputeRequest;
import com.marketplace.ecommerce.order.dto.request.SellerCompleteReturnRequest;
import com.marketplace.ecommerce.order.dto.request.SellerDisputeReturnRequest;
import com.marketplace.ecommerce.order.dto.request.SubmitReturnTrackingRequest;
import com.marketplace.ecommerce.order.dto.response.OrderReturnResponse;
import com.marketplace.ecommerce.order.service.OrderReturnService;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;

/**
 * Quy trình hoàn hàng: ai được làm bước nào, và dữ liệu đầu vào được kiểm tra trước khi tới service.
 */
@WebMvcTest(OrderReturnController.class)
@Import({
        SecurityConfig.class,
        JwtFilter.class,
        WebMvcConfig.class,
        ApiVersioningConfig.class,
        CurrentUserArgumentResolver.class,
        GlobalExceptionHandler.class
})
class OrderReturnControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private OrderReturnService orderReturnService;
    @MockitoBean private AccountRepository accountRepository;
    @MockitoBean private TokenService tokenService;

    private final UUID returnId = UUID.randomUUID();

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

    private static OrderReturnResponse response(ReturnStatus status) {
        return OrderReturnResponse.builder().id(UUID.randomUUID()).status(status).build();
    }

    @Nested
    @DisplayName("POST /{id}/tracking — người mua gửi mã vận đơn hoàn")
    class SubmitTracking {

        @Test
        @DisplayName("Truyền đúng tài khoản đang đăng nhập xuống service")
        void passesCurrentAccount() throws Exception {
            UUID buyer = UUID.randomUUID();
            when(orderReturnService.submitTracking(eq(buyer), eq(returnId), any())).thenReturn(response(ReturnStatus.SHIPPED));

            mockMvc.perform(post("/api/v1/returns/{id}/tracking", returnId).with(authentication(as("CUSTOMER", buyer)))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"carrierName\":\"GHN\",\"returnTrackingCode\":\"GHN123\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SHIPPED"));

            verify(orderReturnService).submitTracking(eq(buyer), eq(returnId), any(SubmitReturnTrackingRequest.class));
        }

        @Test
        @DisplayName("ADMIN không gửi vận đơn thay người mua")
        void adminForbidden() throws Exception {
            mockMvc.perform(post("/api/v1/returns/{id}/tracking", returnId).with(authentication(as("ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isForbidden());
            verifyNoInteractions(orderReturnService);
        }

        @Test
        @DisplayName("Mã vận đơn quá 100 ký tự bị từ chối 400")
        void rejectsLongTrackingCode() throws Exception {
            mockMvc.perform(post("/api/v1/returns/{id}/tracking", returnId).with(authentication(as("CUSTOMER")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"returnTrackingCode\":\"" + "X".repeat(101) + "\"}"))
                    .andExpect(status().isBadRequest());
            verifyNoInteractions(orderReturnService);
        }
    }

    @Nested
    @DisplayName("POST /{id}/complete và /{id}/dispute — người bán kiểm hàng hoàn")
    class SellerInspection {

        @ParameterizedTest
        @ValueSource(strings = {"CUSTOMER", "ADMIN"})
        @DisplayName("Chỉ người bán được kết luận kiểm hàng")
        void onlySellers(String role) throws Exception {
            mockMvc.perform(post("/api/v1/returns/{id}/complete", returnId).with(authentication(as(role)))
                            .contentType(MediaType.APPLICATION_JSON).content("{\"conditionStatus\":\"INTACT\",\"isRestocked\":true}"))
                    .andExpect(status().isForbidden());
            mockMvc.perform(post("/api/v1/returns/{id}/dispute", returnId).with(authentication(as(role)))
                            .contentType(MediaType.APPLICATION_JSON).content("{\"conditionStatus\":\"DAMAGED\",\"conditionNote\":\"Vỡ màn\"}"))
                    .andExpect(status().isForbidden());
            verifyNoInteractions(orderReturnService);
        }

        @Test
        @DisplayName("Người bán xác nhận hàng nguyên vẹn và nhập lại kho")
        void sellerCompletes() throws Exception {
            UUID seller = UUID.randomUUID();
            when(orderReturnService.completeReturn(eq(seller), eq(returnId), any())).thenReturn(response(ReturnStatus.COMPLETED));

            mockMvc.perform(post("/api/v1/returns/{id}/complete", returnId).with(authentication(as("BUSINESS", seller)))
                            .contentType(MediaType.APPLICATION_JSON).content("{\"conditionStatus\":\"INTACT\",\"isRestocked\":true}"))
                    .andExpect(status().isOk());

            verify(orderReturnService).completeReturn(eq(seller), eq(returnId), argThat((SellerCompleteReturnRequest r) ->
                    r.getIsRestocked() && r.getConditionStatus().name().equals("INTACT")));
        }

        @ParameterizedTest
        @ValueSource(strings = {
                "{\"isRestocked\":true}",
                "{\"conditionStatus\":\"INTACT\"}"
        })
        @DisplayName("Kết luận kiểm hàng thiếu tình trạng hoặc thiếu lựa chọn nhập kho bị từ chối 400")
        void completeValidation(String body) throws Exception {
            mockMvc.perform(post("/api/v1/returns/{id}/complete", returnId).with(authentication(as("BUSINESS")))
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
            verifyNoInteractions(orderReturnService);
        }

        @ParameterizedTest
        @ValueSource(strings = {
                "{\"conditionStatus\":\"DAMAGED\"}",
                "{\"conditionStatus\":\"DAMAGED\",\"conditionNote\":\"   \"}",
                "{\"conditionNote\":\"Vỡ màn\"}"
        })
        @DisplayName("Khiếu nại hàng hoàn phải có tình trạng và lý do")
        void disputeValidation(String body) throws Exception {
            mockMvc.perform(post("/api/v1/returns/{id}/dispute", returnId).with(authentication(as("BUSINESS")))
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
            verifyNoInteractions(orderReturnService);
        }

        @Test
        @DisplayName("Người bán khiếu nại hàng hoàn bị hỏng")
        void sellerDisputes() throws Exception {
            when(orderReturnService.disputeReturn(any(), eq(returnId), any())).thenReturn(response(ReturnStatus.DISPUTED));

            mockMvc.perform(post("/api/v1/returns/{id}/dispute", returnId).with(authentication(as("BUSINESS")))
                            .contentType(MediaType.APPLICATION_JSON).content("{\"conditionStatus\":\"DAMAGED\",\"conditionNote\":\"Vỡ màn\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("DISPUTED"));

            verify(orderReturnService).disputeReturn(any(), eq(returnId), any(SellerDisputeReturnRequest.class));
        }
    }

    @Nested
    @DisplayName("POST /{id}/resolve-dispute — admin phân xử tranh chấp hàng hoàn")
    class ResolveDispute {

        @ParameterizedTest
        @ValueSource(strings = {"CUSTOMER", "BUSINESS"})
        @DisplayName("Chỉ ADMIN được phân xử")
        void onlyAdmin(String role) throws Exception {
            mockMvc.perform(post("/api/v1/returns/{id}/resolve-dispute", returnId).with(authentication(as(role)))
                            .contentType(MediaType.APPLICATION_JSON).content("{\"decision\":\"APPROVE_RETURN\"}"))
                    .andExpect(status().isForbidden());
            verifyNoInteractions(orderReturnService);
        }

        @Test
        @DisplayName("ADMIN chấp nhận hoàn hàng")
        void adminResolves() throws Exception {
            UUID admin = UUID.randomUUID();
            when(orderReturnService.resolveDispute(eq(admin), eq(returnId), any())).thenReturn(response(ReturnStatus.COMPLETED));

            mockMvc.perform(post("/api/v1/returns/{id}/resolve-dispute", returnId).with(authentication(as("ADMIN", admin)))
                            .contentType(MediaType.APPLICATION_JSON).content("{\"decision\":\"APPROVE_RETURN\",\"adminNote\":\"Đúng mô tả\"}"))
                    .andExpect(status().isOk());

            verify(orderReturnService).resolveDispute(eq(admin), eq(returnId), argThat((AdminResolveReturnDisputeRequest r) ->
                    r.getDecision() == AdminResolveReturnDisputeRequest.AdminReturnDecision.APPROVE_RETURN));
        }

        @Test
        @DisplayName("Thiếu quyết định bị từ chối 400")
        void requiresDecision() throws Exception {
            mockMvc.perform(post("/api/v1/returns/{id}/resolve-dispute", returnId).with(authentication(as("ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON).content("{\"adminNote\":\"x\"}"))
                    .andExpect(status().isBadRequest());
            verifyNoInteractions(orderReturnService);
        }
    }

    @Test
    @DisplayName("POST /{id}/confirm-returned — ADMIN không xác nhận thay người mua")
    void confirmReturnedNotForAdmin() throws Exception {
        mockMvc.perform(post("/api/v1/returns/{id}/confirm-returned", returnId).with(authentication(as("ADMIN"))))
                .andExpect(status().isForbidden());
        verifyNoInteractions(orderReturnService);
    }

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "BUSINESS", "ADMIN"})
    @DisplayName("POST /{id}/confirm-delivered — cả ba vai trò đều xác nhận được")
    void confirmDeliveredAllRoles(String role) throws Exception {
        when(orderReturnService.confirmDelivered(any(), eq(returnId))).thenReturn(response(ReturnStatus.RETURNED));
        mockMvc.perform(post("/api/v1/returns/{id}/confirm-delivered", returnId).with(authentication(as(role))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Chưa đăng nhập không thực hiện được bước nào")
    void anonymousRejected() throws Exception {
        mockMvc.perform(post("/api/v1/returns/{id}/confirm-returned", returnId)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/returns/{id}", returnId)).andExpect(status().isUnauthorized());
        verifyNoInteractions(orderReturnService);
    }
}
