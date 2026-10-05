package com.marketplace.ecommerce.shop.controller;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.shop.dto.request.AdminAdjustEscrowFundRequest;
import com.marketplace.ecommerce.shop.dto.request.AdminDeductCompensationRequest;
import com.marketplace.ecommerce.shop.dto.request.TopUpEscrowFundRequest;
import com.marketplace.ecommerce.shop.dto.response.ShopEscrowFundResponse;
import com.marketplace.ecommerce.shop.dto.response.ShopEscrowTransactionResponse;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.entity.ShopEscrowTransaction;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopEscrowFundService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/shop-escrow-fund")
@RequiredArgsConstructor
public class ShopEscrowFundController {

    private final ShopEscrowFundService shopEscrowFundService;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;

    private Shop resolveShopFromAccount(UUID accountId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin người dùng"));
        return shopRepository.findByUserId(user.getId())
                .orElseThrow(() -> new CustomException("Tài khoản chưa sở hữu gian hàng nào"));
    }

    @GetMapping("/my-fund")
    public ResponseEntity<ShopEscrowFundResponse> getMyFund(@CurrentUser CurrentUserInfo currentUser) {
        if (currentUser == null || currentUser.getAccountId() == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(shopEscrowFundService.getFundByAccountId(currentUser.getAccountId()));
    }

    @GetMapping("/my-fund/transactions")
    public ResponseEntity<Page<ShopEscrowTransactionResponse>> getMyTransactions(
            @CurrentUser CurrentUserInfo currentUser,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        if (currentUser == null || currentUser.getAccountId() == null) {
            return ResponseEntity.status(401).build();
        }
        Shop shop = resolveShopFromAccount(currentUser.getAccountId());
        return ResponseEntity.ok(shopEscrowFundService.getTransactionsByShopId(shop.getId(), pageable));
    }

    @PostMapping("/top-up")
    public ResponseEntity<ShopEscrowFundResponse> topUpMyFund(
            @CurrentUser CurrentUserInfo currentUser,
            @Valid @RequestBody TopUpEscrowFundRequest request
    ) {
        if (currentUser == null || currentUser.getAccountId() == null) {
            return ResponseEntity.status(401).build();
        }
        Shop shop = resolveShopFromAccount(currentUser.getAccountId());
        return ResponseEntity.ok(shopEscrowFundService.topUpFund(shop.getId(), request));
    }

    @PostMapping("/vnpay/create-payment")
    public ResponseEntity<Map<String, Object>> createVnpayPayment(
            @CurrentUser CurrentUserInfo currentUser,
            @Valid @RequestBody TopUpEscrowFundRequest request,
            HttpServletRequest httpRequest
    ) {
        if (currentUser == null || currentUser.getAccountId() == null) {
            return ResponseEntity.status(401).build();
        }
        Shop shop = resolveShopFromAccount(currentUser.getAccountId());
        String clientIp = httpRequest.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isEmpty()) {
            clientIp = httpRequest.getRemoteAddr();
        }
        String paymentUrl = shopEscrowFundService.createVnpayPaymentUrl(shop.getId(), request, clientIp);
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "paymentUrl", paymentUrl
        ));
    }

    @PostMapping("/request-refund")
    public ResponseEntity<ShopEscrowFundResponse> requestCloseShopRefund(@CurrentUser CurrentUserInfo currentUser) {
        if (currentUser == null || currentUser.getAccountId() == null) {
            return ResponseEntity.status(401).build();
        }
        Shop shop = resolveShopFromAccount(currentUser.getAccountId());
        return ResponseEntity.ok(shopEscrowFundService.requestCloseShopAndRefund(shop.getId()));
    }

    // ==================== ADMIN ENDPOINTS ====================

    @GetMapping("/admin")
    public ResponseEntity<Page<ShopEscrowFundResponse>> getAllFundsForAdmin(
            @CurrentUser CurrentUserInfo currentUser,
            @RequestParam(required = false) Boolean isDeficit,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        if (currentUser == null || !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            throw new CustomException("Chỉ Quản trị viên sàn mới có quyền truy cập");
        }
        return ResponseEntity.ok(shopEscrowFundService.getAllFunds(isDeficit, pageable));
    }

    @GetMapping("/admin/{fundId}/transactions")
    public ResponseEntity<Page<ShopEscrowTransactionResponse>> getFundTransactionsForAdmin(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable UUID fundId,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        if (currentUser == null || !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            throw new CustomException("Chỉ Quản trị viên sàn mới có quyền truy cập");
        }
        return ResponseEntity.ok(shopEscrowFundService.getTransactionsByFundId(fundId, pageable));
    }

    @PostMapping("/admin/{shopId}/deduct")
    public ResponseEntity<ShopEscrowTransactionResponse> adminDeductCompensation(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable UUID shopId,
            @Valid @RequestBody AdminDeductCompensationRequest request
    ) {
        if (currentUser == null || !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            throw new CustomException("Chỉ Quản trị viên sàn mới có quyền trích quỹ đền bù");
        }
        ShopEscrowTransaction tx = shopEscrowFundService.deductCompensation(
                shopId,
                request.getOrderId(),
                request.getReportId(),
                request.getAmount(),
                request.getReason()
        );
        return ResponseEntity.ok(ShopEscrowTransactionResponse.from(tx));
    }

    @PutMapping("/admin/{shopId}/adjust")
    public ResponseEntity<ShopEscrowFundResponse> adminAdjustFund(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable UUID shopId,
            @Valid @RequestBody AdminAdjustEscrowFundRequest request
    ) {
        if (currentUser == null || !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            throw new CustomException("Chỉ Quản trị viên sàn mới có quyền điều chỉnh Quỹ ký quỹ");
        }
        return ResponseEntity.ok(shopEscrowFundService.adminAdjustFund(shopId, request, currentUser.getAccountId()));
    }
}
