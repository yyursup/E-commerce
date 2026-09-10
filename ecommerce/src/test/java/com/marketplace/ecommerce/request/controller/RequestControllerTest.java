package com.marketplace.ecommerce.request.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.ecommerce.auth.service.TokenService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.ApiVersioningConfig;
import com.marketplace.ecommerce.config.CurrentUserArgumentResolver;
import com.marketplace.ecommerce.config.WebMvcConfig;
import com.marketplace.ecommerce.request.dto.request.RegisterSellerRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.dto.response.RegisterSellerResponse;
import com.marketplace.ecommerce.request.dto.response.RequestDetailsResponse;
import com.marketplace.ecommerce.request.dto.response.RequestResponse;
import com.marketplace.ecommerce.request.service.RegisterSellerService;
import com.marketplace.ecommerce.request.service.RequestService;
import com.marketplace.ecommerce.request.valueObjects.BusinessType;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.SellerType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RequestController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({ApiVersioningConfig.class, WebMvcConfig.class, CurrentUserArgumentResolver.class})
class RequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private RequestService requestService;

    @MockitoBean
    private RegisterSellerService registerSellerService;

    @MockitoBean
    private TokenService tokenService;

    private CurrentUserInfo mockUser;
    private UUID accountId;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        mockUser = new CurrentUserInfo();
        mockUser.setAccountId(accountId);
        mockUser.setUsername("testuser");
        mockUser.setRole("ADMIN");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        mockUser,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                )
        );
    }

    @Test
    @DisplayName("POST /api/v1/request/regis-seller - Đăng ký người bán Cá nhân thành công")
    void register_Individual_Success() throws Exception {
        RegisterSellerRequest request = RegisterSellerRequest.builder()
                .sellerType(SellerType.INDIVIDUAL)
                .shopName("Shop Cá Nhân")
                .shopPhone("0912345678")
                .shopEmail("shop@test.com")
                .pickupAddress("Địa chỉ lấy hàng")
                .returnAddress("Địa chỉ trả hàng")
                .taxCode("0123456789")
                .bankName("Vietcombank")
                .bankAccountNumber("1234567890")
                .bankAccountName("NGUYEN VAN A")
                .build();

        CreateRequestResponse mockResponse = CreateRequestResponse.builder()
                .requestId(UUID.randomUUID())
                .accountId(accountId)
                .type(RequestType.SELLER_REGISTRATION)
                .status(RequestStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        when(registerSellerService.createSellerRegistration(eq(accountId), any(RegisterSellerRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/request/regis-seller")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestId").value(mockResponse.getRequestId().toString()))
                .andExpect(jsonPath("$.status").value("PENDING"));

        verify(registerSellerService).createSellerRegistration(eq(accountId), any(RegisterSellerRequest.class));
    }

    @Test
    @DisplayName("POST /api/v1/request/regis-seller - Đăng ký người bán Doanh nghiệp thành công")
    void register_Business_Success() throws Exception {
        RegisterSellerRequest request = RegisterSellerRequest.builder()
                .sellerType(SellerType.BUSINESS)
                .businessType(BusinessType.ENTERPRISE)
                .businessName("Công Ty TNHH ABC")
                .businessAddress("Hà Nội")
                .businessLicenseUrl("https://example.com/gpkd.pdf")
                .shopName("Shop Doanh Nghiệp")
                .shopPhone("0987654321")
                .shopEmail("company@test.com")
                .pickupAddress("Kho tổng Hà Nội")
                .returnAddress("Kho tổng Hà Nội")
                .taxCode("0101234567")
                .bankName("Techcombank")
                .bankAccountNumber("9876543210")
                .bankAccountName("CONG TY TNHH ABC")
                .build();

        CreateRequestResponse mockResponse = CreateRequestResponse.builder()
                .requestId(UUID.randomUUID())
                .accountId(accountId)
                .type(RequestType.SELLER_REGISTRATION)
                .status(RequestStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        when(registerSellerService.createSellerRegistration(eq(accountId), any(RegisterSellerRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/request/regis-seller")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestId").value(mockResponse.getRequestId().toString()))
                .andExpect(jsonPath("$.status").value("PENDING"));

        verify(registerSellerService).createSellerRegistration(eq(accountId), any(RegisterSellerRequest.class));
    }

    @Test
    @DisplayName("PUT /api/v1/request/approve - Admin duyệt đơn đăng ký bán hàng")
    void approve_Success() throws Exception {
        UUID requestId = UUID.randomUUID();
        RequestResponse mockResponse = RequestResponse.builder()
                .requestId(requestId)
                .status(RequestStatus.APPROVED)
                .response("Duyệt thành công")
                .build();

        when(requestService.approveSellerRegistration(eq(requestId), eq(accountId), eq("Duyệt thành công")))
                .thenReturn(mockResponse);

        mockMvc.perform(put("/api/v1/request/approve")
                        .param("requestId", requestId.toString())
                        .param("response", "Duyệt thành công"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestId").value(requestId.toString()))
                .andExpect(jsonPath("$.status").value("APPROVED"));

        verify(requestService).approveSellerRegistration(eq(requestId), eq(accountId), eq("Duyệt thành công"));
    }

    @Test
    @DisplayName("PUT /api/v1/request/reject - Admin từ chối đơn đăng ký")
    void reject_Success() throws Exception {
        UUID requestId = UUID.randomUUID();
        RequestResponse mockResponse = RequestResponse.builder()
                .requestId(requestId)
                .status(RequestStatus.REJECTED)
                .response("Từ chối do thiếu thông tin")
                .build();

        when(requestService.rejectRequest(eq(accountId), eq(requestId), eq("Từ chối do thiếu thông tin")))
                .thenReturn(mockResponse);

        mockMvc.perform(put("/api/v1/request/reject")
                        .param("requestId", requestId.toString())
                        .param("response", "Từ chối do thiếu thông tin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestId").value(requestId.toString()))
                .andExpect(jsonPath("$.status").value("REJECTED"));

        verify(requestService).rejectRequest(eq(accountId), eq(requestId), eq("Từ chối do thiếu thông tin"));
    }

    @Test
    @DisplayName("GET /api/v1/request/{id} - Lấy chi tiết đơn đăng ký bán hàng")
    void getDetails_Success() throws Exception {
        UUID requestId = UUID.randomUUID();
        RegisterSellerResponse sellerDetails = RegisterSellerResponse.builder()
                .sellerType(SellerType.BUSINESS)
                .businessType(BusinessType.ENTERPRISE)
                .businessName("Công Ty ABC")
                .shopName("Shop ABC")
                .taxCode("0312345678")
                .bankName("Techcombank")
                .bankAccountNumber("987654321")
                .bankAccountName("CONG TY ABC")
                .build();

        RequestDetailsResponse detailsResponse = RequestDetailsResponse.builder()
                .requestId(requestId)
                .type(RequestType.SELLER_REGISTRATION)
                .status(RequestStatus.PENDING)
                .detail(sellerDetails)
                .build();

        when(requestService.getDetails(requestId)).thenReturn(detailsResponse);

        mockMvc.perform(get("/api/v1/request/{id}", requestId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestId").value(requestId.toString()))
                .andExpect(jsonPath("$.detail.sellerType").value("BUSINESS"))
                .andExpect(jsonPath("$.detail.businessName").value("Công Ty ABC"))
                .andExpect(jsonPath("$.detail.shopName").value("Shop ABC"));

        verify(requestService).getDetails(requestId);
    }
}
