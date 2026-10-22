package com.marketplace.ecommerce.common.exception;

import java.time.LocalDateTime;

public class AccountLockedException extends RuntimeException {
    private final LocalDateTime bannedUntil;

    public AccountLockedException(String message, LocalDateTime bannedUntil) {
        super(message);
        this.bannedUntil = bannedUntil;
    }

    public LocalDateTime getBannedUntil() {
        return bannedUntil;
    }
}
