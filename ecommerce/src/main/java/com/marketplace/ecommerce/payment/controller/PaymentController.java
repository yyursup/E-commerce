package com.marketplace.ecommerce.payment.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.payment.service.PaymentService;
import com.marketplace.ecommerce.shop.service.ShopEscrowFundService;
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
        private final ShopEscrowFundService shopEscrowFundService;

        @Value("${app.frontend.base-url}")
        private String frontendBaseUrl;

        @Value("${app.seller-frontend.base-url:http://localhost:3001}")
        private String sellerFrontendBaseUrl;

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
                String queryString = request.getQueryString();
                String txnRef = params.get("vnp_TxnRef");
                if (txnRef == null && queryString != null) {
                        Map<String, String> parsed = org.springframework.web.util.UriComponentsBuilder
                                        .fromUriString("?" + queryString).build().getQueryParams().toSingleValueMap();
                        txnRef = parsed.get("vnp_TxnRef");
                }

                if (txnRef != null && txnRef.startsWith("ESCROW_")) {
                        try {
                                shopEscrowFundService.processVnpayCallback(params, queryString);
                        } catch (Exception e) {
                                log.error("Lỗi xử lý callback nạp ký quỹ VNPay: {}", e.getMessage());
                        }
                        String targetUrl = sellerFrontendBaseUrl + "/escrow-fund"
                                        + (queryString != null && !queryString.isEmpty() ? "?" + queryString : "");
                        return ResponseEntity.status(HttpStatus.FOUND)
                                        .location(URI.create(targetUrl))
                                        .build();
                }

                try {
                        paymentService.processCallback(params, queryString);
                } catch (Exception e) {
                        log.error("Error processing VNPay return callback: {}", e.getMessage());
                }
                String targetUrl = frontendBaseUrl + "/payment/vnpay_return"
                                + (queryString != null && !queryString.isEmpty() ? "?" + queryString : "");
                return ResponseEntity.status(HttpStatus.FOUND)
                                .location(URI.create(targetUrl))
                                .build();
        }

}