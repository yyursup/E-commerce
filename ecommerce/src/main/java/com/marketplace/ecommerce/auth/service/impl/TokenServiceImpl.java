package com.marketplace.ecommerce.auth.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.service.TokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class TokenServiceImpl implements TokenService {

    private final AccountRepository accountRepository;

    @Value("${jwt.secret}")
    private String SECRET_KEY;

    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    @Override
    public String createToken(Account account) {
        long currentTime = System.currentTimeMillis();
        return Jwts.builder()
                .subject(account.getUsername() + "")
                .issuedAt(new Date(currentTime))
                .claim("role", account.getRole().getRoleName())
                .claim("accountId", account.getId())
                .expiration(new Date(currentTime + 1000 * 60 * 60 * 12))
                .signWith(getSignInKey())
                .compact();
    }

    @Override
    public Account getAccountFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        String username = claims.getSubject();
        return accountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Account not found"));
    }

    @Override
    public String refreshToken(Account account) {
        long currentTime = System.currentTimeMillis();
        return Jwts.builder()
                .subject(account.getUsername() + "")
                .issuedAt(new Date(currentTime))
                .expiration(new Date(currentTime + 1000 * 60 * 60 * 12))
                .signWith(getSignInKey())
                .compact();
    }
}
