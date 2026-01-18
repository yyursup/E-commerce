package com.marketplace.ecommerce.auth.service;

import com.marketplace.ecommerce.auth.entity.Account;

public interface TokenService {
    public String createToken(Account account);

    public Account getAccountFromToken(String token);

    public String refreshToken(Account account);
}
