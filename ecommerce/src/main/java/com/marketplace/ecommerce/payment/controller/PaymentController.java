package com.marketplace.ecommerce.payment.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.payment.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {
        private final PaymentService paymentService;

        @Value("${app.frontend.base-url}")
        private String frontendBaseUrl;

        @PostMapping("/orders/{orderId}/vnpay")
        public ResponseEntity<Map<String, Object>> createVnpayPayment(
                        @PathVariable UUID orderId,
                        @CurrentUser CurrentUserInfo u) {
                String url = paymentService.createPayment(orderId, u.getAccountId());
                return ResponseEntity.ok(Map.of(
                                "ok", true,
                                "paymentUrl", url));
        }

        @GetMapping("/vnpay/return")
        public ResponseEntity<Void> handleVnpayReturn(
                        @RequestParam Map<String, String> params,
                        HttpServletRequest request) {
                try {
                        paymentService.processCallback(params, request.getQueryString());
                } catch (Exception e) {
                        log.error("Error processing VNPay return callback: {}", e.getMessage());
                }
                String queryString = request.getQueryString();
                String targetUrl = frontendBaseUrl + "/payment/vnpay_return"
                                + (queryString != null && !queryString.isEmpty() ? "?" + queryString : "");
                return ResponseEntity.status(HttpStatus.FOUND)
                                .location(URI.create(targetUrl))
                                .build();
        }

}