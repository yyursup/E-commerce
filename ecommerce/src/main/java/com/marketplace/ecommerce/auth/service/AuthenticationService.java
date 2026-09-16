package com.marketplace.ecommerce.auth.service;

import com.marketplace.ecommerce.auth.dto.request.AccountCreateRequest;
import com.marketplace.ecommerce.auth.dto.request.LoginRequest;
import com.marketplace.ecommerce.auth.dto.request.VerifyRequest;
import com.marketplace.ecommerce.auth.dto.response.AccountCreateResponse;
import com.marketplace.ecommerce.auth.dto.response.LoginResponse;

import java.util.List;

public interface AuthenticationService {
    LoginResponse login(LoginRequest request);

    List<LoginResponse> getAllUsers();

    AccountCreateResponse register(AccountCreateRequest request);

    void forgotPasswordSendOtp(String email);
    
    void forgotPasswordReset(String email, String otp, String newPassword);

    AccountCreateResponse verifyAccount(VerifyRequest request);

    LoginResponse getMyProfile(java.util.UUID accountId);
}
