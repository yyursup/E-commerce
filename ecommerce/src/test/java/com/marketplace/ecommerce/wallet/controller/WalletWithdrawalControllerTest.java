package com.marketplace.ecommerce.wallet.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.service.TokenService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.common.exception.GlobalExceptionHandler;
import com.marketplace.ecommerce.config.*;
import com.marketplace.ecommerce.wallet.dto.request.AdminReviewWithdrawalRequest;
import com.marketplace.ecommerce.wallet.dto.request.BankInfoRequest;
import com.marketplace.ecommerce.wallet.dto.request.CreateWithdrawalRequest;
import com.marketplace.ecommerce.wallet.dto.response.WithdrawalResponse;
import com.marketplace.ecommerce.wallet.service.WalletService;
import com.marketplace.ecommerce.wallet.valueObjects.WithdrawalStatus;
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

@WebMvcTest(WalletController.class)
@Import({
        SecurityConfig.class,
        JwtFilter.class,
        WebMvcConfig.class,
        ApiVersioningConfig.class,
        CurrentUserArgumentResolver.class,
        GlobalExceptionHandler.class
})
class WalletWithdrawalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WalletService walletService;

    @MockitoBean
    private AccountRepository accountRepository;

    @MockitoBean
    private TokenService tokenService;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private UUID customerId;
    private UUID adminId;
    private UUID withdrawalId;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        adminId = UUID.randomUUID();
        withdrawalId = UUID.randomUUID();
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

    private WithdrawalResponse buildResponse(UUID id, BigDecimal amount, WithdrawalStatus status) {
        return WithdrawalResponse.builder()
                .id(id)
                .txRef("WDR" + System.currentTimeMillis())
                .amount(amount)
                .bankName("Vietcombank")
                .bankAccountNumber("9988776655")
                .bankAccountName("NGUYEN VAN A")
                .status(status)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("PUT /api/v1/wallet/bank-info — Cập nhật tài khoản ngân hàng")
    class UpdateBankInfoTests {

        @Test
        @DisplayName("Hợp lệ — Trả về 200 OK")
        void updateBankInfo_Valid_Returns200() throws Exception {
            BankInfoRequest req = BankInfoRequest.builder()
                    .bankName("Techcombank")
                    .bankAccountNumber("19036888888")
                    .bankAccountName("TRAN VAN B")
                    .build();

            doNothing().when(walletService).updateBankInfo(eq(customerId), any(BankInfoRequest.class));

            mockMvc.perform(put("/api/v1/wallet/bank-info")
                            .with(authentication(createAuth(customerId, "customer", "CUSTOMER")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk());

            verify(walletService, times(1)).updateBankInfo(eq(customerId), any(BankInfoRequest.class));
        }

        @Test
        @DisplayName("Thiếu tên ngân hàng — Validation ném 400 Bad Request")
        void updateBankInfo_BlankBankName_Returns400() throws Exception {
            BankInfoRequest req = BankInfoRequest.builder()
                    .bankName("")
                    .bankAccountNumber("19036888888")
                    .bankAccountName("TRAN VAN B")
                    .build();

            mockMvc.perform(put("/api/v1/wallet/bank-info")
                            .with(authentication(createAuth(customerId, "customer", "CUSTOMER")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());

            verify(walletService, never()).updateBankInfo(any(), any());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/wallet/withdraw — Tạo yêu cầu rút tiền")
    class RequestWithdrawalTests {

        @Test
        @DisplayName("Số tiền hợp lệ (>= 100.000 VNĐ) — Trả về 200 OK kèm DTO")
        void requestWithdrawal_ValidAmount_Returns200() throws Exception {
            CreateWithdrawalRequest req = CreateWithdrawalRequest.builder()
                    .amount(BigDecimal.valueOf(150000))
                    .note("Rút tiền tiêu dùng")
                    .build();

            WithdrawalResponse res = buildResponse(withdrawalId, BigDecimal.valueOf(150000), WithdrawalStatus.PENDING);
            when(walletService.requestWithdrawal(eq(customerId), any(CreateWithdrawalRequest.class))).thenReturn(res);

            mockMvc.perform(post("/api/v1/wallet/withdraw")
                            .with(authentication(createAuth(customerId, "customer", "CUSTOMER")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(withdrawalId.toString()))
                    .andExpect(jsonPath("$.amount").value(150000))
                    .andExpect(jsonPath("$.status").value("PENDING"));

            verify(walletService, times(1)).requestWithdrawal(eq(customerId), any(CreateWithdrawalRequest.class));
        }

        @Test
        @DisplayName("Số tiền dưới 100.000 VNĐ — Bị chặn bởi Validation @DecimalMin, trả về 400 Bad Request")
        void requestWithdrawal_Under100k_Returns400() throws Exception {
            CreateWithdrawalRequest req = CreateWithdrawalRequest.builder()
                    .amount(BigDecimal.valueOf(99999))
                    .note("Rút ít hơn tối thiểu")
                    .build();

            mockMvc.perform(post("/api/v1/wallet/withdraw")
                            .with(authentication(createAuth(customerId, "customer", "CUSTOMER")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());

            verify(walletService, never()).requestWithdrawal(any(), any());
        }

        @Test
        @DisplayName("Không đăng nhập — Bị chặn 401 Unauthorized")
        void requestWithdrawal_Unauthenticated_Returns401() throws Exception {
            CreateWithdrawalRequest req = CreateWithdrawalRequest.builder()
                    .amount(BigDecimal.valueOf(200000))
                    .build();

            mockMvc.perform(post("/api/v1/wallet/withdraw")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isUnauthorized());

            verify(walletService, never()).requestWithdrawal(any(), any());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/wallet/withdrawals — Xem lịch sử rút tiền cá nhân")
    class GetMyWithdrawalsTests {

        @Test
        @DisplayName("Người dùng đã đăng nhập — Trả về danh sách phân trang 200 OK")
        void getMyWithdrawals_Authenticated_Returns200() throws Exception {
            WithdrawalResponse res = buildResponse(withdrawalId, BigDecimal.valueOf(100000), WithdrawalStatus.PENDING);
            when(walletService.getMyWithdrawals(eq(customerId), any())).thenReturn(new PageImpl<>(List.of(res)));

            mockMvc.perform(get("/api/v1/wallet/withdrawals")
                            .with(authentication(createAuth(customerId, "customer", "CUSTOMER"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].id").value(withdrawalId.toString()))
                    .andExpect(jsonPath("$.content[0].amount").value(100000));

            verify(walletService, times(1)).getMyWithdrawals(eq(customerId), any());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/wallet/withdrawals/{id}/cancel — Người dùng hủy yêu cầu rút tiền")
    class CancelWithdrawalTests {

        @Test
        @DisplayName("Hủy yêu cầu PENDING — Trả về 200 OK với trạng thái CANCELLED")
        void cancelWithdrawal_Valid_Returns200() throws Exception {
            WithdrawalResponse res = buildResponse(withdrawalId, BigDecimal.valueOf(100000), WithdrawalStatus.CANCELLED);
            when(walletService.cancelWithdrawal(eq(customerId), eq(withdrawalId))).thenReturn(res);

            mockMvc.perform(post("/api/v1/wallet/withdrawals/{id}/cancel", withdrawalId)
                            .with(authentication(createAuth(customerId, "customer", "CUSTOMER"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(withdrawalId.toString()))
                    .andExpect(jsonPath("$.status").value("CANCELLED"));

            verify(walletService, times(1)).cancelWithdrawal(eq(customerId), eq(withdrawalId));
        }
    }

    @Nested
    @DisplayName("Quản trị viên (Admin) API — Duyệt & Từ chối rút tiền")
    class AdminWithdrawalTests {

        @Test
        @DisplayName("GET /api/v1/wallet/admin/withdrawals — Quyền ADMIN truy cập được 200 OK")
        void adminGetWithdrawals_AsAdmin_Returns200() throws Exception {
            WithdrawalResponse res = buildResponse(withdrawalId, BigDecimal.valueOf(200000), WithdrawalStatus.PENDING);
            when(walletService.adminGetWithdrawals(any(), any())).thenReturn(new PageImpl<>(List.of(res)));

            mockMvc.perform(get("/api/v1/wallet/admin/withdrawals")
                            .with(authentication(createAuth(adminId, "admin", "ADMIN"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].id").value(withdrawalId.toString()));

            verify(walletService, times(1)).adminGetWithdrawals(any(), any());
        }

        @Test
        @DisplayName("GET /api/v1/wallet/admin/withdrawals — Quyền CUSTOMER bị từ chối 403 Forbidden")
        void adminGetWithdrawals_AsCustomer_Returns403() throws Exception {
            mockMvc.perform(get("/api/v1/wallet/admin/withdrawals")
                            .with(authentication(createAuth(customerId, "customer", "CUSTOMER"))))
                    .andExpect(status().isForbidden());

            verify(walletService, never()).adminGetWithdrawals(any(), any());
        }

        @Test
        @DisplayName("POST /api/v1/wallet/admin/withdrawals/{id}/approve — Admin duyệt thành công 200 OK")
        void adminApprove_AsAdmin_Returns200() throws Exception {
            AdminReviewWithdrawalRequest reviewReq = AdminReviewWithdrawalRequest.builder()
                    .bankTxNo("FT26110901")
                    .note("Đã chuyển khoản thành công")
                    .build();

            WithdrawalResponse res = buildResponse(withdrawalId, BigDecimal.valueOf(200000), WithdrawalStatus.APPROVED);
            when(walletService.adminApproveWithdrawal(eq(adminId), eq(withdrawalId), any())).thenReturn(res);

            mockMvc.perform(post("/api/v1/wallet/admin/withdrawals/{id}/approve", withdrawalId)
                            .with(authentication(createAuth(adminId, "admin", "ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(reviewReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(withdrawalId.toString()))
                    .andExpect(jsonPath("$.status").value("APPROVED"));

            verify(walletService, times(1)).adminApproveWithdrawal(eq(adminId), eq(withdrawalId), any());
        }

        @Test
        @DisplayName("POST /api/v1/wallet/admin/withdrawals/{id}/approve — Customer cố tình gọi bị chặn 403")
        void adminApprove_AsCustomer_Returns403() throws Exception {
            mockMvc.perform(post("/api/v1/wallet/admin/withdrawals/{id}/approve", withdrawalId)
                            .with(authentication(createAuth(customerId, "customer", "CUSTOMER"))))
                    .andExpect(status().isForbidden());

            verify(walletService, never()).adminApproveWithdrawal(any(), any(), any());
        }

        @Test
        @DisplayName("POST /api/v1/wallet/admin/withdrawals/{id}/reject — Admin từ chối thành công 200 OK")
        void adminReject_AsAdmin_Returns200() throws Exception {
            AdminReviewWithdrawalRequest reviewReq = AdminReviewWithdrawalRequest.builder()
                    .note("Sai số tài khoản nhận tiền")
                    .build();

            WithdrawalResponse res = buildResponse(withdrawalId, BigDecimal.valueOf(200000), WithdrawalStatus.REJECTED);
            when(walletService.adminRejectWithdrawal(eq(adminId), eq(withdrawalId), any())).thenReturn(res);

            mockMvc.perform(post("/api/v1/wallet/admin/withdrawals/{id}/reject", withdrawalId)
                            .with(authentication(createAuth(adminId, "admin", "ADMIN")))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(reviewReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(withdrawalId.toString()))
                    .andExpect(jsonPath("$.status").value("REJECTED"));

            verify(walletService, times(1)).adminRejectWithdrawal(eq(adminId), eq(withdrawalId), any());
        }

        @Test
        @DisplayName("POST /api/v1/wallet/admin/withdrawals/{id}/reject — Customer cố tình gọi bị chặn 403")
        void adminReject_AsCustomer_Returns403() throws Exception {
            mockMvc.perform(post("/api/v1/wallet/admin/withdrawals/{id}/reject", withdrawalId)
                            .with(authentication(createAuth(customerId, "customer", "CUSTOMER"))))
                    .andExpect(status().isForbidden());

            verify(walletService, never()).adminRejectWithdrawal(any(), any(), any());
        }
    }
}

