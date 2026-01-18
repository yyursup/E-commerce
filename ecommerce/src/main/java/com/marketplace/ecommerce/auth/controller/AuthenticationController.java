package com.marketplace.ecommerce.auth.controller;

import com.marketplace.ecommerce.auth.dto.request.AccountCreateRequest;
import com.marketplace.ecommerce.auth.dto.request.LoginRequest;
import com.marketplace.ecommerce.auth.dto.request.VerifyRequest;
import com.marketplace.ecommerce.auth.dto.response.AccountCreateResponse;
import com.marketplace.ecommerce.auth.dto.response.LoginResponse;
import com.marketplace.ecommerce.auth.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(version = "1", path = "/auth")
@RequiredArgsConstructor
public class AuthenticationController {
    private final AuthenticationService authenticationService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authenticationService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Iterable<LoginResponse>> getAllUsers() {
        return ResponseEntity.ok(authenticationService.getAllUsers());
    }

    @PostMapping("/register")
    public ResponseEntity<AccountCreateResponse> regis(@RequestBody @Valid AccountCreateRequest request) {
        AccountCreateResponse response = authenticationService.register(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<AccountCreateResponse> verifyAccount(
            @Valid @RequestBody VerifyRequest request) {
        AccountCreateResponse response = authenticationService.verifyAccount(request);
        return ResponseEntity.ok(response);
    }
}
