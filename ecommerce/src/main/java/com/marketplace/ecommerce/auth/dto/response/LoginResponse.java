package com.marketplace.ecommerce.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private String email;
    private String token;
    private String refreshToken;
    private String role;
    private UUID accountId;
    private Boolean hasShop;
    private UUID shopId;
    private String shopName;
    private String sellerStatus; // NONE, PENDING, APPROVED, REJECTED
    private String shopStatus; // ACTIVE, WARNED, SUSPENDED, BANNED, CLOSED
    private String phoneNumber;
    private String username;
    private Integer violationCount;
    private String disciplineLevel;
    private LocalDateTime bannedUntil;
}
