package com.marketplace.ecommerce.auth.service;


import com.marketplace.ecommerce.auth.dto.MailBody;

public interface EmailService {
    void sendOtpForVerifyAccount(MailBody mailBody, String otp);

    String generateOTP();

    String storageOtp(MailBody mailBody, String otp);

    boolean verifyOtp(String email, String otpVerify);

    void clearOtp(String email);

    void resendOtp(String email);

}
