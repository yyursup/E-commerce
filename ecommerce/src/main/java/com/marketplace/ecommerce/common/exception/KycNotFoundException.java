package com.marketplace.ecommerce.common.exception;

public class KycNotFoundException extends RuntimeException {
    public KycNotFoundException(String message, String message2) {
        super(message);
    }
}
