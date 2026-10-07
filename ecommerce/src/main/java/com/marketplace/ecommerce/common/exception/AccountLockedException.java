package com.marketplace.ecommerce.common.exception;

import java.time.LocalDateTime;

public class AccountLockedException extends RuntimeException {
    private final String appealToken;
    private final LocalDateTime bannedUntil;

    public AccountLockedException(String message, String appealToken, LocalDateTime bannedUntil) {
        super(message);
        this.appealToken = appealToken;
        this.bannedUntil = bannedUntil;
    }

    public String getAppealToken() {
        return appealToken;
    }

    public LocalDateTime getBannedUntil() {
        return bannedUntil;
    }
}
