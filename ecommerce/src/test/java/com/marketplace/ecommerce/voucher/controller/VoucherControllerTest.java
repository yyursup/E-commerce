package com.marketplace.ecommerce.voucher.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.service.TokenService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.common.exception.GlobalExceptionHandler;
import com.marketplace.ecommerce.config.*;
import com.marketplace.ecommerce.voucher.dto.*;
import com.marketplace.ecommerce.voucher.service.VoucherService;
import com.marketplace.ecommerce.voucher.valueObjects.UserVoucherStatus;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherScope;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherStatus;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherType;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VoucherController.class)
@Import({
        SecurityConfig.class,
        JwtFilter.class,
        WebMvcConfig.class,
        ApiVersioningConfig.class,
        CurrentUserArgumentResolver.class,
        GlobalExceptionHandler.class
})
class VoucherControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private VoucherService voucherService;

    @MockitoBean
    private AccountRepository accountRepository;

    @MockitoBean
    private TokenService tokenService;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private UUID adminId;
    private UUID businessId;
    private UUID customerId;
    private UUID voucherId;
    private UUID shopId;

    @BeforeEach
    void setUp() {
        adminId = UUID.randomUUID();
        businessId = UUID.randomUUID();
        customerId = UUID.randomUUID();
        voucherId = UUID.randomUUID();
        shopId = UUID.randomUUID();
    }

    private Authentication createAuth(UUID accountId, String username, String roleName) {
        CurrentUserInfo info = new CurrentUserInfo();
        info.setAccountId(accountId);
        info.setUsername(username);
        info.setRole(roleName);

        return new UsernamePasswordAuthenticationToken(
                info,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + roleName))
        );
    }

    private CreateVoucherRequest buildCreateRequest() {
        return CreateVoucherRequest.builder()
                .code("DISCOUNT20")
                .title("Giảm 20K cho đơn từ 100K")
                .voucherType(VoucherType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(20000))
                .minOrderValue(BigDecimal.valueOf(100000))
                .startDate(LocalDateTime.now().plusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .build();
    }

    private UpdateVoucherRequest buildUpdateRequest() {
        return UpdateVoucherRequest.builder()
                .title("Tiêu đề voucher cập nhật")
                .discountValue(BigDecimal.valueOf(25000))
                .build();
    }

    private VoucherResponse buildVoucherResponse(UUID id, String code, VoucherStatus status) {
        return VoucherResponse.builder()
                .id(id)
                .code(code)
                .title("Test Voucher")
                .voucherType(VoucherType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(20000))
                .status(status)
                .build();
    }

    // =========================================================================
    // A. UNAUTHENTICATED TESTS (Không gửi Token / Authentication)
    // =========================================================================
    @Nested
    @DisplayName("A. Unauthenticated Requests — Toàn bộ Endpoint Quản lý phải bị từ chối")
    class UnauthenticatedTests {

        @Test
        @DisplayName("POST /api/v1/vouchers (Tạo mới) — Bị từ chối 403 bởi Method Security, không gọi Service, không NPE")
        void createVoucher_Unauthenticated_Rejected() throws Exception {
            CreateVoucherRequest req = buildCreateRequest();

            mockMvc.perform(post("/api/v1/vouchers")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden());

            verify(voucherService, never()).createVoucher(any(), any());
        }

        @Test
        @DisplayName("POST /api/v1/vouchers/calculate — Unauthenticated bị từ chối 401, không gọi Service")
        void calculateDiscount_Unauthenticated_Rejected() throws Exception {
            ApplyVoucherRequest req = ApplyVoucherRequest.builder()
                    .code("VOUCHER_CODE")
                    .shopId(shopId)
                    .subtotal(BigDecimal.valueOf(200000))
                    .shippingFee(BigDecimal.valueOf(30000))
                    .build();

            mockMvc.perform(post("/api/v1/vouchers/calculate")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isUnauthorized());

            verify(voucherService, never()).validateAndCalculate(any(), any(), any(), any(), any());
            verify(voucherService, never()).validateAndCalculateMulti(any(), any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("GET /api/v1/vouchers/shop-manage — Bị từ chối 401, không gọi Service")
        void getShopManage_Unauthenticated_Rejected() throws Exception {
            mockMvc.perform(get("/api/v1/vouchers/shop-manage"))
                    .andExpect(status().isUnauthorized());

            verify(voucherService, never()).getShopManageVouchers(any());
        }

        @Test
        @DisplayName("GET /api/v1/vouchers/my-vouchers — Bị từ chối 401, không gọi Service")
        void getMyVouchers_Unauthenticated_Rejected() throws Exception {
            mockMvc.perform(get("/api/v1/vouchers/my-vouchers"))
                    .andExpect(status().isUnauthorized());

            verify(voucherService, never()).getMyVouchers(any());
        }

        @Test
        @DisplayName("POST /api/v1/vouchers/{id}/claim — Bị từ chối 401, không gọi Service")
        void claimVoucher_Unauthenticated_Rejected() throws Exception {
            mockMvc.perform(post("/api/v1/vouchers/{voucherId}/claim", voucherId))
                    .andExpect(status().isUnauthorized());

            verify(voucherService, never()).claimVoucher(any(), any());
        }

        @Test
        @DisplayName("PUT /api/v1/vouchers/{id} — Bị từ chối 401, không gọi Service")
        void updateVoucher_Unauthenticated_Rejected() throws Exception {
            UpdateVoucherRequest req = buildUpdateRequest();

            mockMvc.perform(put("/api/v1/vouchers/{voucherId}", voucherId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isUnauthorized());

            verify(voucherService, never()).updateVoucher(any(), any(), any());
        }

        @Test
        @DisplayName("DELETE /api/v1/vouchers/{id} — Bị từ chối 401, không gọi Service")
        void deleteVoucher_Unauthenticated_Rejected() throws Exception {
            mockMvc.perform(delete("/api/v1/vouchers/{voucherId}", voucherId))
                    .andExpect(status().isUnauthorized());

            verify(voucherService, never()).deleteVoucher(any(), any());
        }

        @Test
        @DisplayName("GET /api/v1/vouchers/platform-manage — Bị từ chối 401, không gọi Service")
        void getPlatformManage_Unauthenticated_Rejected() throws Exception {
            mockMvc.perform(get("/api/v1/vouchers/platform-manage"))
                    .andExpect(status().isUnauthorized());

            verify(voucherService, never()).getPlatformManageVouchers(any());
        }
    }

    // =========================================================================
    // B. CUSTOMER TESTS
    // =========================================================================
    @Nested
    @DisplayName("B. CUSTOMER Requests — Bị cấm gọi API Quản lý, được phép gọi ví & claim")
    class CustomerTests {

        private Authentication customerAuth;

        @BeforeEach
        void init() {
            customerAuth = createAuth(customerId, "customer_test", "CUSTOMER");
        }

        @Test
        @DisplayName("POST /api/v1/vouchers — CUSTOMER bị 403 Forbidden")
        void customer_createVoucher_Forbidden() throws Exception {
            CreateVoucherRequest req = buildCreateRequest();

            mockMvc.perform(post("/api/v1/vouchers")
                            .with(authentication(customerAuth))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden());

            verify(voucherService, never()).createVoucher(any(), any());
        }

        @Test
        @DisplayName("GET /api/v1/vouchers/shop-manage — CUSTOMER bị 403 Forbidden")
        void customer_getShopManage_Forbidden() throws Exception {
            mockMvc.perform(get("/api/v1/vouchers/shop-manage")
                            .with(authentication(customerAuth)))
                    .andExpect(status().isForbidden());

            verify(voucherService, never()).getShopManageVouchers(any());
        }

        @Test
        @DisplayName("PUT /api/v1/vouchers/{id} — CUSTOMER bị 403 Forbidden")
        void customer_updateVoucher_Forbidden() throws Exception {
            UpdateVoucherRequest req = buildUpdateRequest();

            mockMvc.perform(put("/api/v1/vouchers/{voucherId}", voucherId)
                            .with(authentication(customerAuth))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden());

            verify(voucherService, never()).updateVoucher(any(), any(), any());
        }

        @Test
        @DisplayName("DELETE /api/v1/vouchers/{id} — CUSTOMER bị 403 Forbidden")
        void customer_deleteVoucher_Forbidden() throws Exception {
            mockMvc.perform(delete("/api/v1/vouchers/{voucherId}", voucherId)
                            .with(authentication(customerAuth)))
                    .andExpect(status().isForbidden());

            verify(voucherService, never()).deleteVoucher(any(), any());
        }

        @Test
        @DisplayName("GET /api/v1/vouchers/platform-manage — CUSTOMER bị 403 Forbidden")
        void customer_getPlatformManage_Forbidden() throws Exception {
            mockMvc.perform(get("/api/v1/vouchers/platform-manage")
                            .with(authentication(customerAuth)))
                    .andExpect(status().isForbidden());

            verify(voucherService, never()).getPlatformManageVouchers(any());
        }

        @Test
        @DisplayName("GET /api/v1/vouchers/my-vouchers — CUSTOMER được phép 200 OK")
        void customer_getMyVouchers_Allowed() throws Exception {
            when(voucherService.getMyVouchers(customerId)).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/vouchers/my-vouchers")
                            .with(authentication(customerAuth)))
                    .andExpect(status().isOk());

            verify(voucherService, times(1)).getMyVouchers(customerId);
        }

        @Test
        @DisplayName("POST /api/v1/vouchers/{id}/claim — CUSTOMER được phép 200 OK")
        void customer_claimVoucher_Allowed() throws Exception {
            UserVoucherResponse resp = UserVoucherResponse.builder()
                    .id(UUID.randomUUID())
                    .voucher(buildVoucherResponse(voucherId, "CLAIM_TEST", VoucherStatus.ACTIVE))
                    .status(UserVoucherStatus.UNUSED)
                    .build();
            when(voucherService.claimVoucher(customerId, voucherId)).thenReturn(resp);

            mockMvc.perform(post("/api/v1/vouchers/{voucherId}/claim", voucherId)
                            .with(authentication(customerAuth)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.voucher.code").value("CLAIM_TEST"));

            verify(voucherService, times(1)).claimVoucher(customerId, voucherId);
        }

        @Test
        @DisplayName("POST /api/v1/vouchers/calculate — CUSTOMER đã đăng nhập được phép tính toán voucher (200 OK)")
        void customer_calculateDiscount_Allowed() throws Exception {
            ApplyVoucherRequest req = ApplyVoucherRequest.builder()
                    .code("VOUCHER_CODE")
                    .shopId(shopId)
                    .subtotal(BigDecimal.valueOf(200000))
                    .shippingFee(BigDecimal.valueOf(30000))
                    .build();

            VoucherCalculationResponse resp = VoucherCalculationResponse.builder()
                    .valid(true)
                    .discountAmount(BigDecimal.valueOf(20000))
                    .finalTotal(BigDecimal.valueOf(210000))
                    .build();

            when(voucherService.validateAndCalculate(eq(customerId), eq("VOUCHER_CODE"), eq(shopId), any(), any()))
                    .thenReturn(resp);

            mockMvc.perform(post("/api/v1/vouchers/calculate")
                            .with(authentication(customerAuth))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.discountAmount").value(20000));

            verify(voucherService, times(1))
                    .validateAndCalculate(eq(customerId), eq("VOUCHER_CODE"), eq(shopId), any(), any());
        }
    }

    // =========================================================================
    // C. BUSINESS TESTS
    // =========================================================================
    @Nested
    @DisplayName("C. BUSINESS Requests — Được phép tạo, sửa, xóa, quản lý shop; cấm quản lý sàn")
    class BusinessTests {

        private Authentication businessAuth;

        @BeforeEach
        void init() {
            businessAuth = createAuth(businessId, "seller_test", "BUSINESS");
        }

        @Test
        @DisplayName("POST /api/v1/vouchers — BUSINESS được phép qua Controller, gọi Service với businessId")
        void business_createVoucher_Allowed() throws Exception {
            CreateVoucherRequest req = buildCreateRequest();
            VoucherResponse resp = buildVoucherResponse(voucherId, "DISCOUNT20", VoucherStatus.ACTIVE);
            when(voucherService.createVoucher(eq(businessId), any(CreateVoucherRequest.class))).thenReturn(resp);

            mockMvc.perform(post("/api/v1/vouchers")
                            .with(authentication(businessAuth))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("DISCOUNT20"));

            verify(voucherService, times(1)).createVoucher(eq(businessId), any(CreateVoucherRequest.class));
        }

        @Test
        @DisplayName("GET /api/v1/vouchers/shop-manage — BUSINESS được phép qua Controller")
        void business_getShopManage_Allowed() throws Exception {
            when(voucherService.getShopManageVouchers(businessId)).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/vouchers/shop-manage")
                            .with(authentication(businessAuth)))
                    .andExpect(status().isOk());

            verify(voucherService, times(1)).getShopManageVouchers(businessId);
        }

        @Test
        @DisplayName("PUT /api/v1/vouchers/{id} — BUSINESS được phép qua Controller")
        void business_updateVoucher_Allowed() throws Exception {
            UpdateVoucherRequest req = buildUpdateRequest();
            VoucherResponse resp = buildVoucherResponse(voucherId, "UPDATED_CODE", VoucherStatus.ACTIVE);
            when(voucherService.updateVoucher(eq(businessId), eq(voucherId), any(UpdateVoucherRequest.class))).thenReturn(resp);

            mockMvc.perform(put("/api/v1/vouchers/{voucherId}", voucherId)
                            .with(authentication(businessAuth))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("UPDATED_CODE"));

            verify(voucherService, times(1)).updateVoucher(eq(businessId), eq(voucherId), any(UpdateVoucherRequest.class));
        }

        @Test
        @DisplayName("DELETE /api/v1/vouchers/{id} — BUSINESS được phép qua Controller")
        void business_deleteVoucher_Allowed() throws Exception {
            VoucherResponse resp = buildVoucherResponse(voucherId, "DELETED_CODE", VoucherStatus.DELETED);
            when(voucherService.deleteVoucher(businessId, voucherId)).thenReturn(resp);

            mockMvc.perform(delete("/api/v1/vouchers/{voucherId}", voucherId)
                            .with(authentication(businessAuth)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("DELETED"));

            verify(voucherService, times(1)).deleteVoucher(businessId, voucherId);
        }

        @Test
        @DisplayName("GET /api/v1/vouchers/platform-manage — BUSINESS bị 403 Forbidden")
        void business_getPlatformManage_Forbidden() throws Exception {
            mockMvc.perform(get("/api/v1/vouchers/platform-manage")
                            .with(authentication(businessAuth)))
                    .andExpect(status().isForbidden());

            verify(voucherService, never()).getPlatformManageVouchers(any());
        }

        @Test
        @DisplayName("GET /api/v1/vouchers/my-vouchers — BUSINESS được phép 200 OK")
        void business_getMyVouchers_Allowed() throws Exception {
            when(voucherService.getMyVouchers(businessId)).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/vouchers/my-vouchers")
                            .with(authentication(businessAuth)))
                    .andExpect(status().isOk());

            verify(voucherService, times(1)).getMyVouchers(businessId);
        }

        @Test
        @DisplayName("POST /api/v1/vouchers/{id}/claim — BUSINESS được phép 200 OK")
        void business_claimVoucher_Allowed() throws Exception {
            UserVoucherResponse resp = UserVoucherResponse.builder()
                    .voucher(buildVoucherResponse(voucherId, "CLAIM_BIZ", VoucherStatus.ACTIVE))
                    .build();
            when(voucherService.claimVoucher(businessId, voucherId)).thenReturn(resp);

            mockMvc.perform(post("/api/v1/vouchers/{voucherId}/claim", voucherId)
                            .with(authentication(businessAuth)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.voucher.code").value("CLAIM_BIZ"));

            verify(voucherService, times(1)).claimVoucher(businessId, voucherId);
        }
    }

    // =========================================================================
    // D. ADMIN TESTS
    // =========================================================================
    @Nested
    @DisplayName("D. ADMIN Requests — Được phép tạo, sửa, xóa, quản lý sàn; cấm quản lý shop riêng lẻ")
    class AdminTests {

        private Authentication adminAuth;

        @BeforeEach
        void init() {
            adminAuth = createAuth(adminId, "admin_test", "ADMIN");
        }

        @Test
        @DisplayName("POST /api/v1/vouchers — ADMIN được phép qua Controller")
        void admin_createVoucher_Allowed() throws Exception {
            CreateVoucherRequest req = buildCreateRequest();
            VoucherResponse resp = buildVoucherResponse(voucherId, "PLAT_VOUCHER", VoucherStatus.ACTIVE);
            when(voucherService.createVoucher(eq(adminId), any(CreateVoucherRequest.class))).thenReturn(resp);

            mockMvc.perform(post("/api/v1/vouchers")
                            .with(authentication(adminAuth))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("PLAT_VOUCHER"));

            verify(voucherService, times(1)).createVoucher(eq(adminId), any(CreateVoucherRequest.class));
        }

        @Test
        @DisplayName("GET /api/v1/vouchers/platform-manage — ADMIN được phép qua Controller")
        void admin_getPlatformManage_Allowed() throws Exception {
            when(voucherService.getPlatformManageVouchers(adminId)).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/vouchers/platform-manage")
                            .with(authentication(adminAuth)))
                    .andExpect(status().isOk());

            verify(voucherService, times(1)).getPlatformManageVouchers(adminId);
        }

        @Test
        @DisplayName("PUT /api/v1/vouchers/{id} — ADMIN được phép qua Controller")
        void admin_updateVoucher_Allowed() throws Exception {
            UpdateVoucherRequest req = buildUpdateRequest();
            VoucherResponse resp = buildVoucherResponse(voucherId, "ADMIN_UPDATED", VoucherStatus.ACTIVE);
            when(voucherService.updateVoucher(eq(adminId), eq(voucherId), any(UpdateVoucherRequest.class))).thenReturn(resp);

            mockMvc.perform(put("/api/v1/vouchers/{voucherId}", voucherId)
                            .with(authentication(adminAuth))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value("ADMIN_UPDATED"));

            verify(voucherService, times(1)).updateVoucher(eq(adminId), eq(voucherId), any(UpdateVoucherRequest.class));
        }

        @Test
        @DisplayName("DELETE /api/v1/vouchers/{id} — ADMIN được phép qua Controller")
        void admin_deleteVoucher_Allowed() throws Exception {
            VoucherResponse resp = buildVoucherResponse(voucherId, "ADMIN_INACTIVE", VoucherStatus.INACTIVE);
            when(voucherService.deleteVoucher(adminId, voucherId)).thenReturn(resp);

            mockMvc.perform(delete("/api/v1/vouchers/{voucherId}", voucherId)
                            .with(authentication(adminAuth)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("INACTIVE"));

            verify(voucherService, times(1)).deleteVoucher(adminId, voucherId);
        }

        @Test
        @DisplayName("GET /api/v1/vouchers/shop-manage — ADMIN bị 403 Forbidden")
        void admin_getShopManage_Forbidden() throws Exception {
            mockMvc.perform(get("/api/v1/vouchers/shop-manage")
                            .with(authentication(adminAuth)))
                    .andExpect(status().isForbidden());

            verify(voucherService, never()).getShopManageVouchers(any());
        }
    }

    // =========================================================================
    // E. PUBLIC APIS & ROUTING TESTS
    // =========================================================================
    @Nested
    @DisplayName("E. Public APIs & Request Mapping Tests")
    class PublicApiAndRoutingTests {

        @Test
        @DisplayName("GET /api/v1/vouchers — Guest không token được phép xem voucher toàn sàn (200 OK)")
        void listActiveVouchers_Guest_Allowed() throws Exception {
            when(voucherService.listActiveVouchers(any(), any(), any(), any())).thenReturn(new PageImpl<>(List.of()));

            mockMvc.perform(get("/api/v1/vouchers"))
                    .andExpect(status().isOk());

            verify(voucherService, times(1)).listActiveVouchers(eq(null), eq(null), eq(null), any());
        }

        @Test
        @DisplayName("GET /api/v1/vouchers/shop/{shopId} — Guest không token được phép xem voucher shop (200 OK)")
        void getShopVouchers_Guest_Allowed() throws Exception {
            when(voucherService.getShopVouchers(eq(shopId), eq(null))).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/vouchers/shop/{shopId}", shopId))
                    .andExpect(status().isOk());

            verify(voucherService, times(1)).getShopVouchers(eq(shopId), eq(null));
        }

        @Test
        @DisplayName("Xác minh routing: /platform-manage không bị nhầm lẫn thành /{voucherId}")
        void verifyPlatformManage_NotConfusedWithPathVar() throws Exception {
            Authentication adminAuth = createAuth(adminId, "admin_user", "ADMIN");
            when(voucherService.getPlatformManageVouchers(adminId)).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/vouchers/platform-manage")
                            .with(authentication(adminAuth)))
                    .andExpect(status().isOk());

            verify(voucherService, times(1)).getPlatformManageVouchers(adminId);
            // Xác minh không gọi getShopVouchers hay endpoint có path variable
            verify(voucherService, never()).getShopVouchers(any(), any());
        }
    }
}