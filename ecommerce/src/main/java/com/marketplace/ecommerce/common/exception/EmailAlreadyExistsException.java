package com.marketplace.ecommerce.common.exception;

public class EmailAlreadyExistsException extends CustomException {
    public EmailAlreadyExistsException(String email) {
        super("Email đã tồn tại: " + email);
    }
}
