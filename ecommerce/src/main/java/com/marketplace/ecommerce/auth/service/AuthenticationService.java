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

    AccountCreateResponse verifyAccount(VerifyRequest request);
}
