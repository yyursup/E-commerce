package com.marketplace.ecommerce.auth.service.impl;


import com.marketplace.ecommerce.auth.constant.AuthConstant;
import com.marketplace.ecommerce.auth.dto.MailBody;
import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;


@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {
    private final AccountRepository accountRepository;

    private final TemplateEngine templateEngine;

    private final JavaMailSender javaMailSender;

    public final Map<String, String> storageMap = new ConcurrentHashMap<>();

    @Override
    @Async
    public void sendOtpForVerifyAccount(MailBody mailBody, String otp) {
        try {
            storageOtp(mailBody, otp);
            log.info("Sending welcome email to: {}", mailBody.getTo().getEmail());
            Context context = new Context();
            context.setVariable("name", mailBody.getTo().getEmail());
            context.setVariable("otp", otp);
            String template = templateEngine.process("REGIS", context);
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage);
            mimeMessageHelper.setFrom("movietheater8888@gmail.com");
            mimeMessageHelper.setTo(mailBody.getTo().getEmail());
            mimeMessageHelper.setText(template, true);
            mimeMessageHelper.setSubject(mailBody.getSubject());
            javaMailSender.send(mimeMessage);
            log.info("Welcome email sent successfully to: {}", mailBody.getTo().getEmail());
        } catch (MessagingException e) {
            log.error("Failed to send email to: {}, error: {}", mailBody.getTo().getEmail(), e.getMessage());
        }
    }

    public void resendOtp(String email) {
        if (email == null || email.trim().isEmpty()) {
            log.warn("OTP resend request received with null or empty email. Aborting.");
            return;
        }
        String otp = generateOTP();
        Account account = accountRepository.findByEmail(email).orElse(null);

        if (account == null) {
            log.warn("Account not found for email: {}. Cannot resend OTP.", email);
            return;
        }

        MailBody mailBody = MailBody.builder()
                .to(account)
                .otp(otp)
                .subject("Your New OTP Verification Code")
                .build();

        sendOtpForVerifyAccount(mailBody, otp);
        log.info("OTP resend process completed for email: {}", email);
    }


    @Override
    public boolean verifyOtp(String email, String otpVerify) {
        if (email == null || otpVerify == null) {
            log.warn("Email or OTP to verify is null.");
            return false;
        }
        String storedOtp = storageMap.get(email);
        if (storedOtp != null && storedOtp.equals(otpVerify)) {
            log.info("OTP verification successful for email: {}", email);

            return true;
        }
        log.warn("OTP verification failed for email: {}. Stored OTP: {}, Provided OTP: {}", email, storedOtp, otpVerify);
        return false;

    }

    @Override
    public void clearOtp(String email) {
        if (email != null) {
            if (email.isEmpty()) {
                log.warn("Cannot clear OTP. Email is null.");
                return;
            }
            String removedOtp = storageMap.remove(email);
            if (removedOtp != null) {
                log.info("OTP for {} cleared successfully.", email);
            } else {
                log.info("No OTP found for {} to clear.", email);
            }
        }
    }

    @Override
    public String storageOtp(MailBody mailBody, String otp) {
        if (mailBody != null && mailBody.getTo() != null && mailBody.getTo().getEmail() != null && otp != null) {
            storageMap.put(mailBody.getTo().getEmail(), otp);
            log.info("OTP for {} stored successfully.", mailBody.getTo().getEmail());
        } else {
            log.warn("Could not store OTP. MailBody, recipient email, or OTP is null.");

            if (mailBody == null || mailBody.getTo() == null || mailBody.getTo().getEmail() == null) {
                log.error("Cannot send email because mail body or recipient email is null.");
            }
        }
        return otp;
    }

    @Override
    public String generateOTP() {
        Random random = new Random();
        int otpValue = AuthConstant.numberOTP + random.nextInt(900000);
        return String.valueOf(otpValue);
    }



}
