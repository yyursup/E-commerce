package com.marketplace.ecommerce.auth.service.impl;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.marketplace.ecommerce.auth.dto.MailBody;
import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Optional;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EmailServiceImplTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TemplateEngine templateEngine;

    @Mock
    private JavaMailSender javaMailSender;

    @InjectMocks
    private EmailServiceImpl emailService;

    private Account sampleAccount;
    private MailBody mailBody;

    @BeforeEach
    void setUp() {
        sampleAccount = new Account();
        sampleAccount.setEmail("customer@example.com");

        mailBody = new MailBody();
        mailBody.setTo(sampleAccount);
        mailBody.setSubject("Test Subject");
        mailBody.setOtp("123456");
    }

    @Test
    @DisplayName("generateOTP sinh chuỗi 6 chữ số")
    void testGenerateOTP() {
        String otp = emailService.generateOTP();
        assertNotNull(otp);
        assertEquals(6, otp.length());
        assertTrue(otp.matches("\\d{6}"));
    }

    @Test
    @DisplayName("storageOtp lưu OTP vào Map và verifyOtp kiểm tra chính xác")
    void testStorageAndVerifyOtp() {
        emailService.storageOtp(mailBody, "654321");

        assertTrue(emailService.verifyOtp("customer@example.com", "654321"));
        assertFalse(emailService.verifyOtp("customer@example.com", "000000"));
        assertFalse(emailService.verifyOtp("customer@example.com", null));
        assertFalse(emailService.verifyOtp(null, "654321"));

        emailService.clearOtp("customer@example.com");
        assertFalse(emailService.verifyOtp("customer@example.com", "654321"));
    }

    @Test
    @DisplayName("clearOtp: email null, rỗng hoặc không tồn tại trong map")
    void testClearOtp_EdgeCases() {
        assertDoesNotThrow(() -> emailService.clearOtp(null));
        assertDoesNotThrow(() -> emailService.clearOtp(""));
        assertDoesNotThrow(() -> emailService.clearOtp("nonexistent@example.com"));
    }

    @Test
    @DisplayName("storageOtp: các trường hợp tham số null")
    void testStorageOtp_NullParams() {
        assertNull(emailService.storageOtp(null, null));

        MailBody nullTo = new MailBody();
        nullTo.setTo(null);
        assertEquals("111111", emailService.storageOtp(nullTo, "111111"));

        MailBody nullEmail = new MailBody();
        Account accNoEmail = new Account();
        accNoEmail.setEmail(null);
        nullEmail.setTo(accNoEmail);
        assertEquals("222222", emailService.storageOtp(nullEmail, "222222"));

        assertNull(emailService.storageOtp(mailBody, null));
    }

    @Test
    @DisplayName("sendOtpForVerifyAccount gửi email đăng ký thành công")
    void testSendOtpForVerifyAccount_Success() {
        when(templateEngine.process(eq("REGIS"), any(Context.class))).thenReturn("<html>Hello</html>");
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.sendOtpForVerifyAccount(mailBody, "123456");

        verify(javaMailSender).send(mimeMessage);
        assertEquals("123456", emailService.storageMap.get("customer@example.com"));
    }

    @Test
    @DisplayName("sendOtpForVerifyAccount bắt lỗi MessagingException an toàn khi địa chỉ email không hợp lệ")
    void testSendOtpForVerifyAccount_MessagingException() {
        when(templateEngine.process(eq("REGIS"), any(Context.class))).thenReturn("<html>Hello</html>");
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

        MailBody invalidMail = new MailBody();
        Account acc = new Account();
        acc.setEmail("invalid-email-address@@@bad");
        invalidMail.setTo(acc);
        invalidMail.setSubject("Subject");

        assertDoesNotThrow(() -> emailService.sendOtpForVerifyAccount(invalidMail, "123456"));
    }

    @Test
    @DisplayName("sendOtpForForgotPassword gửi email quên mật khẩu thành công")
    void testSendOtpForForgotPassword_Success() {
        when(templateEngine.process(eq("FORGOT_PASSWORD"), any(Context.class))).thenReturn("<html>Reset</html>");
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.sendOtpForForgotPassword(mailBody, "888999");

        verify(javaMailSender).send(mimeMessage);
        assertEquals("888999", emailService.storageMap.get("customer@example.com"));
    }

    @Test
    @DisplayName("sendOtpForForgotPassword bắt lỗi MessagingException an toàn khi email không hợp lệ")
    void testSendOtpForForgotPassword_MessagingException() {
        when(templateEngine.process(eq("FORGOT_PASSWORD"), any(Context.class))).thenReturn("<html>Reset</html>");
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

        MailBody invalidMail = new MailBody();
        Account acc = new Account();
        acc.setEmail("invalid-email-address@@@bad");
        invalidMail.setTo(acc);
        invalidMail.setSubject("Subject");

        assertDoesNotThrow(() -> emailService.sendOtpForForgotPassword(invalidMail, "888999"));
    }

    @Test
    @DisplayName("resendOtp: các trường hợp email null, rỗng, không tìm thấy hoặc thành công")
    void testResendOtp() {
        // email null hoặc rỗng
        assertDoesNotThrow(() -> emailService.resendOtp(null));
        assertDoesNotThrow(() -> emailService.resendOtp("   "));

        // không tìm thấy account
        when(accountRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());
        assertDoesNotThrow(() -> emailService.resendOtp("notfound@example.com"));

        // thành công
        when(accountRepository.findByEmail("customer@example.com")).thenReturn(Optional.of(sampleAccount));
        when(templateEngine.process(eq("REGIS"), any(Context.class))).thenReturn("<html>Hello</html>");
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.resendOtp("customer@example.com");
        verify(javaMailSender).send(mimeMessage);
    }
}
