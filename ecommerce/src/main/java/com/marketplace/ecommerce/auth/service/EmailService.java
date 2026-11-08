package com.marketplace.ecommerce.auth.service;

import com.marketplace.ecommerce.auth.dto.MailBody;

import java.math.BigDecimal;

public interface EmailService {
    void sendOtpForVerifyAccount(MailBody mailBody, String otp);

    void sendOtpForForgotPassword(MailBody mailBody, String otp);

    String generateOTP();

    String storageOtp(MailBody mailBody, String otp);

    boolean verifyOtp(String email, String otpVerify);

    void clearOtp(String email);

    void resendOtp(String email);

    void sendWithdrawalEmail(String toEmail, String recipientName, BigDecimal amount,
                             String bankName, String bankAccountNumber,
                             String txRef, String status, String note);
}
