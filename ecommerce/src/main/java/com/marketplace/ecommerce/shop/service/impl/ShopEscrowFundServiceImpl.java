package com.marketplace.ecommerce.shop.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.notification.entity.Notification;
import com.marketplace.ecommerce.notification.repository.NotificationRepository;
import com.marketplace.ecommerce.notification.valueObjects.NotificationChannelType;
import com.marketplace.ecommerce.notification.valueObjects.NotificationStatus;
import com.marketplace.ecommerce.notification.valueObjects.NotificationType;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.shop.dto.request.TopUpEscrowFundRequest;
import com.marketplace.ecommerce.shop.dto.response.ShopEscrowFundResponse;
import com.marketplace.ecommerce.shop.dto.response.ShopEscrowTransactionResponse;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.entity.ShopEscrowFund;
import com.marketplace.ecommerce.shop.entity.ShopEscrowTransaction;
import com.marketplace.ecommerce.shop.entity.TrustLevelConfig;
import com.marketplace.ecommerce.shop.repository.ShopEscrowFundRepository;
import com.marketplace.ecommerce.shop.repository.ShopEscrowTransactionRepository;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopEscrowFundService;
import com.marketplace.ecommerce.shop.service.TrustLevelConfigService;
import com.marketplace.ecommerce.shop.valueObjects.EscrowFundStatus;
import com.marketplace.ecommerce.shop.valueObjects.EscrowFundTransactionType;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import com.marketplace.ecommerce.config.VNPayConfig;
import com.marketplace.ecommerce.payment.service.VNPayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShopEscrowFundServiceImpl implements ShopEscrowFundService {

    private final ShopEscrowFundRepository shopEscrowFundRepository;
    private final ShopEscrowTransactionRepository shopEscrowTransactionRepository;
    private final ShopRepository shopRepository;
    private final TrustLevelConfigService trustLevelConfigService;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final OrderRepository orderRepository;
    private final VNPayService vnPayService;
    private final VNPayConfig vnPayConfig;

    @Override
    @Transactional
    public ShopEscrowFundResponse getFundByShopId(UUID shopId) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin gian hàng: " + shopId));

        ShopEscrowFund fund = shopEscrowFundRepository.findByShopId(shopId)
                .orElseGet(() -> createDefaultFund(shop));

        TrustLevelConfig config = trustLevelConfigService.getConfigByStarLevel(fund.getCurrentTrustLevel());
        String tierName = config != null ? config.getTierName() : ("Cấp độ " + fund.getCurrentTrustLevel() + " sao");

        return ShopEscrowFundResponse.from(fund, tierName);
    }

    @Override
    @Transactional
    public ShopEscrowFundResponse getFundByAccountId(UUID accountId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin người dùng"));

        Shop shop = shopRepository.findByUserId(user.getId())
                .orElseThrow(() -> new CustomException("Tài khoản của bạn chưa sở hữu gian hàng"));

        return getFundByShopId(shop.getId());
    }

    private ShopEscrowFund createDefaultFund(Shop shop) {
        ShopEscrowFund fund = ShopEscrowFund.builder()
                .shop(shop)
                .balance(BigDecimal.ZERO)
                .committedAmount(BigDecimal.ZERO)
                .currentTrustLevel(1)
                .isDeficit(false)
                .deficitAmount(BigDecimal.ZERO)
                .status(EscrowFundStatus.ACTIVE)
                .build();
        ShopEscrowFund saved = shopEscrowFundRepository.save(fund);
        shop.setTrustLevel(1);
        shopRepository.save(shop);
        return saved;
    }

    @Override
    @Transactional
    public ShopEscrowFund createInitialFund(Shop shop, BigDecimal depositAmount, String refCode) {
        BigDecimal initialDeposit = depositAmount != null && depositAmount.compareTo(BigDecimal.ZERO) > 0
                ? depositAmount
                : BigDecimal.ZERO;

        int targetStarLevel = trustLevelConfigService.resolveTrustLevel(initialDeposit);
        boolean hasCommittedDeposit = initialDeposit.compareTo(BigDecimal.ZERO) > 0;

        ShopEscrowFund fund = ShopEscrowFund.builder()
                .shop(shop)
                .balance(BigDecimal.ZERO) // Tiền thực tế ban đầu là 0đ cho đến khi Seller nạp
                .committedAmount(initialDeposit) // Số tiền cam kết cần nạp để kích hoạt
                .currentTrustLevel(hasCommittedDeposit ? targetStarLevel : 1)
                .isDeficit(false)
                .deficitAmount(BigDecimal.ZERO)
                .status(hasCommittedDeposit ? EscrowFundStatus.PENDING_DEPOSIT : EscrowFundStatus.ACTIVE)
                .build();

        ShopEscrowFund saved = shopEscrowFundRepository.save(fund);

        shop.setTrustLevel(1);
        shop.setStatus(hasCommittedDeposit ? ShopStatus.PENDING_DEPOSIT : ShopStatus.ACTIVE);
        shopRepository.save(shop);

        log.info("Đã tạo Quỹ ký quỹ cho Shop {}: Trạng thái={}, Tiền cọc cam kết={}đ",
                shop.getName(), fund.getStatus(), initialDeposit);
        return saved;
    }

    @Override
    @Transactional
    public ShopEscrowFundResponse topUpFund(UUID shopId, TopUpEscrowFundRequest request) {
        ShopEscrowFund fund = shopEscrowFundRepository.findByShopIdForUpdate(shopId)
                .orElseThrow(() -> new CustomException("Không tìm thấy Quỹ ký quỹ của gian hàng: " + shopId));

        BigDecimal topUpAmount = request.getAmount();
        if (topUpAmount == null || topUpAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new CustomException("Số tiền nạp phải lớn hơn 0");
        }

        BigDecimal oldBalance = fund.getBalance();
        BigDecimal newBalance = oldBalance.add(topUpAmount);
        fund.setBalance(newBalance);

        boolean wasPendingDeposit = fund.getStatus() == EscrowFundStatus.PENDING_DEPOSIT
                || fund.getShop().getStatus() == ShopStatus.PENDING_DEPOSIT;
        EscrowFundTransactionType txType = EscrowFundTransactionType.TOPUP_DEPOSIT;
        String txNote = request.getNote() != null && !request.getNote().isBlank()
                ? request.getNote()
                : "Nạp thêm / Nạp bù tiền Quỹ ký quỹ bảo chứng";

        if (wasPendingDeposit) {
            if (newBalance.compareTo(fund.getCommittedAmount()) >= 0) {
                // ĐÃ NẠP ĐỦ TIỀN KÝ QUỸ CAM KẾT -> KÍCH HOẠT GIAN HÀNG THÀNH CÔNG!
                fund.setStatus(EscrowFundStatus.ACTIVE);
                fund.getShop().setStatus(ShopStatus.ACTIVE);

                int activatedStarLevel = trustLevelConfigService.resolveTrustLevel(newBalance);
                fund.setCurrentTrustLevel(activatedStarLevel);
                fund.getShop().setTrustLevel(activatedStarLevel);
                shopRepository.save(fund.getShop());

                txType = EscrowFundTransactionType.INITIAL_DEPOSIT;
                txNote = "Hoàn tất nạp đủ tiền ký quỹ cam kết (" + fund.getCommittedAmount() + "đ) - Kích hoạt gian hàng thành công";

                log.info("KÍCH HOẠT GIAN HÀNG THÀNH CÔNG: Shop {} đã nạp đủ {}đ. Gian hàng chuyển sang ACTIVE với {} sao!",
                        fund.getShop().getName(), fund.getCommittedAmount(), activatedStarLevel);

                // Gửi thông báo in-app chúc mừng
                try {
                    Notification notif = Notification.builder()
                            .eventId(UUID.randomUUID().toString())
                            .user(fund.getShop().getUser())
                            .title("Kích hoạt gian hàng thành công!")
                            .content("Gian hàng của bạn đã được kích hoạt thành công sau khi nạp đủ tiền ký quỹ cam kết. Cấp độ uy tín đạt: " + activatedStarLevel + " sao. Bạn có thể bắt đầu đăng bán sản phẩm ngay bây giờ!")
                            .type(NotificationType.SYSTEM)
                            .status(NotificationStatus.PENDING)
                            .channel(NotificationChannelType.IN_APP)
                            .createdAt(LocalDateTime.now())
                            .build();
                    notificationRepository.save(notif);
                } catch (Exception ex) {
                    log.warn("Lỗi gửi thông báo kích hoạt shop: {}", ex.getMessage());
                }
            } else {
                BigDecimal remaining = fund.getCommittedAmount().subtract(newBalance);
                txNote = "Nạp một phần ký quỹ cam kết (Đã nạp: " + newBalance + "đ / Cần: " + fund.getCommittedAmount() + "đ - Còn thiếu: " + remaining + "đ)";
            }
        } else {
            // Gian hàng đã active, cập nhật mức cam kết nếu số dư mới vượt mức cam kết cũ
            if (newBalance.compareTo(fund.getCommittedAmount()) > 0) {
                fund.setCommittedAmount(newBalance);
            }

            // Đánh giá lại bậc sao theo số dư mới
            int newStarLevel = trustLevelConfigService.resolveTrustLevel(newBalance);
            if (newStarLevel > fund.getCurrentTrustLevel()) {
                fund.setCurrentTrustLevel(newStarLevel);
                fund.getShop().setTrustLevel(newStarLevel);
                shopRepository.save(fund.getShop());
                log.info("NÂNG HẠNG UY TÍN: Shop {} được thăng hạng lên {} sao sau khi nạp quỹ!",
                        fund.getShop().getName(), newStarLevel);
            }

            // Kiểm tra xóa trạng thái thiếu hụt (nếu có)
            TrustLevelConfig currentTier = trustLevelConfigService.getConfigByStarLevel(fund.getCurrentTrustLevel());
            BigDecimal minRequired = currentTier != null ? currentTier.getMinDeposit() : BigDecimal.ZERO;

            if (newBalance.compareTo(minRequired) >= 0) {
                fund.setIsDeficit(false);
                fund.setDeficitAmount(BigDecimal.ZERO);
                fund.setDeficitDeadline(null);
                if (fund.getStatus() == EscrowFundStatus.DEFICIT) {
                    fund.setStatus(EscrowFundStatus.ACTIVE);
                }
            } else {
                fund.setDeficitAmount(minRequired.subtract(newBalance));
            }
        }

        ShopEscrowFund savedFund = shopEscrowFundRepository.save(fund);

        // Ghi nhận sổ cái giao dịch
        ShopEscrowTransaction tx = ShopEscrowTransaction.builder()
                .fund(savedFund)
                .transactionType(txType)
                .amount(topUpAmount)
                .balanceBefore(oldBalance)
                .balanceAfter(newBalance)
                .referenceCode(request.getReferenceCode() != null ? request.getReferenceCode() : ("TOPUP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()))
                .note(txNote)
                .build();
        shopEscrowTransactionRepository.save(tx);

        TrustLevelConfig config = trustLevelConfigService.getConfigByStarLevel(savedFund.getCurrentTrustLevel());
        String tierName = config != null ? config.getTierName() : ("Cấp độ " + savedFund.getCurrentTrustLevel() + " sao");

        return ShopEscrowFundResponse.from(savedFund, tierName);
    }

    @Override
    @Transactional
    public ShopEscrowTransaction deductCompensation(UUID shopId, UUID orderId, UUID reportId, BigDecimal deductAmount, String reason) {
        if (deductAmount == null || deductAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        ShopEscrowFund fund = shopEscrowFundRepository.findByShopIdForUpdate(shopId)
                .orElseThrow(() -> new CustomException("Không tìm thấy Quỹ ký quỹ của gian hàng: " + shopId));

        BigDecimal oldBalance = fund.getBalance();
        BigDecimal newBalance = oldBalance.subtract(deductAmount);
        BigDecimal actualDeduct = deductAmount;

        // Nếu số dư không đủ trừ về 0 thì balance về 0
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            actualDeduct = oldBalance;
            newBalance = BigDecimal.ZERO;
        }

        fund.setBalance(newBalance);

        // Kiểm tra xem số dư mới có bị rớt xuống dưới mức tối thiểu của Tier hiện tại không
        TrustLevelConfig currentTier = trustLevelConfigService.getConfigByStarLevel(fund.getCurrentTrustLevel());
        BigDecimal minRequired = currentTier != null ? currentTier.getMinDeposit() : BigDecimal.ZERO;

        if (newBalance.compareTo(minRequired) < 0) {
            fund.setIsDeficit(true);
            fund.setDeficitAmount(minRequired.subtract(newBalance));
            if (fund.getDeficitDeadline() == null || fund.getDeficitDeadline().isBefore(LocalDateTime.now())) {
                fund.setDeficitDeadline(LocalDateTime.now().plusHours(72)); // Ân hạn 72 giờ để nạp bù
            }
            fund.setStatus(EscrowFundStatus.DEFICIT);

            // Gửi thông báo khẩn cấp cho chủ gian hàng
            sendDeficitAlertNotification(fund, minRequired);
        }

        ShopEscrowFund savedFund = shopEscrowFundRepository.save(fund);

        // Ghi nhận sổ cái
        ShopEscrowTransaction tx = ShopEscrowTransaction.builder()
                .fund(savedFund)
                .transactionType(EscrowFundTransactionType.COMPENSATION_DEDUCTION)
                .amount(actualDeduct.negate())
                .balanceBefore(oldBalance)
                .balanceAfter(newBalance)
                .orderId(orderId)
                .reportId(reportId)
                .referenceCode("DEDUCT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .note(reason != null ? reason : "Trích Quỹ ký quỹ đền bù cho người mua do tranh chấp/khiếu nại vi phạm")
                .build();

        log.warn("ĐÃ TRÍCH QUỸ KÝ QUỸ: Shop {} bị trích {}đ (Số dư cũ: {}đ -> Mới: {}đ). Lý do: {}",
                fund.getShop().getName(), actualDeduct, oldBalance, newBalance, reason);

        return shopEscrowTransactionRepository.save(tx);
    }

    private void sendDeficitAlertNotification(ShopEscrowFund fund, BigDecimal minRequired) {
        try {
            Shop shop = fund.getShop();
            if (shop == null || shop.getUser() == null) return;
            User owner = shop.getUser();

            Notification notif = Notification.builder()
                    .eventId("ESCROW_DEFICIT_" + UUID.randomUUID())
                    .user(owner)
                    .type(NotificationType.SYSTEM)
                    .channel(NotificationChannelType.IN_APP)
                    .status(NotificationStatus.SENT)
                    .title("Cảnh báo hụt Quỹ Ký Quỹ - Yêu cầu nạp bù!")
                    .content("Quỹ ký quỹ của gian hàng \"" + shop.getName() + "\" vừa bị trích tiền bồi thường. " +
                            "Số dư hiện tại là " + fund.getBalance() + " VNĐ, thiếu " + fund.getDeficitAmount() +
                            " VNĐ so với mức tối thiểu của cấp " + fund.getCurrentTrustLevel() + " sao (" + minRequired + " VNĐ). " +
                            "Vui lòng nạp bù trước " + fund.getDeficitDeadline() + " để không bị giáng cấp uy tín.")
                    .payload(Map.of(
                            "shopId", shop.getId().toString(),
                            "currentTrustLevel", fund.getCurrentTrustLevel(),
                            "deficitAmount", fund.getDeficitAmount().toString(),
                            "deadline", fund.getDeficitDeadline().toString()
                    ))
                    .sentAt(LocalDateTime.now())
                    .build();

            notificationRepository.save(notif);
        } catch (Exception e) {
            log.error("Lỗi gửi thông báo cảnh báo hụt quỹ ký quỹ cho shop: {}", fund.getShop().getId(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ShopEscrowTransactionResponse> getTransactionsByShopId(UUID shopId, Pageable pageable) {
        ShopEscrowFund fund = shopEscrowFundRepository.findByShopId(shopId)
                .orElseThrow(() -> new CustomException("Không tìm thấy Quỹ ký quỹ của gian hàng: " + shopId));

        return shopEscrowTransactionRepository.findByFundIdOrderByCreatedAtDesc(fund.getId(), pageable)
                .map(ShopEscrowTransactionResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ShopEscrowTransactionResponse> getTransactionsByFundId(UUID fundId, Pageable pageable) {
        return shopEscrowTransactionRepository.findByFundIdOrderByCreatedAtDesc(fundId, pageable)
                .map(ShopEscrowTransactionResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ShopEscrowFundResponse> getAllFunds(Boolean isDeficit, Pageable pageable) {
        Page<ShopEscrowFund> page = isDeficit != null
                ? shopEscrowFundRepository.findByIsDeficit(isDeficit, pageable)
                : shopEscrowFundRepository.findAll(pageable);

        return page.map(fund -> {
            TrustLevelConfig config = trustLevelConfigService.getConfigByStarLevel(fund.getCurrentTrustLevel());
            String tierName = config != null ? config.getTierName() : ("Cấp độ " + fund.getCurrentTrustLevel() + " sao");
            return ShopEscrowFundResponse.from(fund, tierName);
        });
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 0 * * * *") // Chạy mỗi giờ kiểm tra hạn nạp bù
    public void checkAndAutoDowngradeDeficitShops() {
        LocalDateTime now = LocalDateTime.now();
        List<ShopEscrowFund> expiredDeficitFunds = shopEscrowFundRepository.findByIsDeficitTrueAndDeficitDeadlineBefore(now);

        for (ShopEscrowFund fund : expiredDeficitFunds) {
            try {
                int oldStar = fund.getCurrentTrustLevel();
                int realStar = trustLevelConfigService.resolveTrustLevel(fund.getBalance());

                if (realStar < oldStar) {
                    fund.setCurrentTrustLevel(realStar);
                    Shop shop = fund.getShop();
                    if (shop != null) {
                        shop.setTrustLevel(realStar);
                        shopRepository.save(shop);
                    }

                    // Reset trạng thái hụt quỹ theo mức sao mới
                    TrustLevelConfig newTier = trustLevelConfigService.getConfigByStarLevel(realStar);
                    BigDecimal newMin = newTier != null ? newTier.getMinDeposit() : BigDecimal.ZERO;
                    if (fund.getBalance().compareTo(newMin) >= 0) {
                        fund.setIsDeficit(false);
                        fund.setDeficitAmount(BigDecimal.ZERO);
                        fund.setDeficitDeadline(null);
                        fund.setStatus(EscrowFundStatus.ACTIVE);
                    } else {
                        fund.setDeficitAmount(newMin.subtract(fund.getBalance()));
                    }

                    shopEscrowFundRepository.save(fund);

                    log.warn("TỰ ĐỘNG GIÁNG CẤP UY TÍN: Gian hàng {} đã bị hạ từ {} sao xuống {} sao do hết hạn nạp bù quỹ ký quỹ!",
                            shop != null ? shop.getName() : fund.getId(), oldStar, realStar);

                    // Gửi thông báo giáng cấp
                    if (shop != null && shop.getUser() != null) {
                        Notification notif = Notification.builder()
                                .eventId("ESCROW_DOWNGRADED_" + UUID.randomUUID())
                                .user(shop.getUser())
                                .type(NotificationType.SYSTEM)
                                .channel(NotificationChannelType.IN_APP)
                                .status(NotificationStatus.SENT)
                                .title("Thông báo: Độ uy tín gian hàng đã bị giáng cấp!")
                                .content("Gian hàng \"" + shop.getName() + "\" đã hết thời hạn 72 giờ nạp bù Quỹ ký quỹ. " +
                                        "Hệ thống đã tự động điều chỉnh Cấp độ uy tín từ " + oldStar + " sao xuống " + realStar + " sao " +
                                        "tương ứng với số dư thực tế còn lại (" + fund.getBalance() + " VNĐ).")
                                .payload(Map.of("shopId", shop.getId().toString(), "newTrustLevel", realStar))
                                .sentAt(LocalDateTime.now())
                                .build();
                        notificationRepository.save(notif);
                    }
                }
            } catch (Exception e) {
                log.error("Lỗi khi tự động giáng cấp cho quỹ: {}", fund.getId(), e);
            }
        }
    }

    @Override
    @Transactional
    public ShopEscrowFundResponse requestCloseShopAndRefund(UUID shopId) {
        ShopEscrowFund fund = shopEscrowFundRepository.findByShopIdForUpdate(shopId)
                .orElseThrow(() -> new CustomException("Không tìm thấy Quỹ ký quỹ của gian hàng: " + shopId));

        // Kiểm tra còn đơn hàng nào chưa hoàn thành không
        List<Order> activeOrders = orderRepository.findByShopIdOrderByCreatedAtDesc(shopId).stream()
                .filter(o -> o.getStatus() != OrderStatus.COMPLETED && o.getStatus() != OrderStatus.CANCELLED)
                .toList();

        if (!activeOrders.isEmpty()) {
            throw new CustomException("Gian hàng còn " + activeOrders.size() + " đơn hàng chưa hoàn tất. " +
                    "Vui lòng xử lý toàn bộ đơn hàng trước khi yêu cầu hoàn Quỹ ký quỹ đóng shop.");
        }

        fund.setStatus(EscrowFundStatus.REFUND_PENDING);
        ShopEscrowFund saved = shopEscrowFundRepository.save(fund);

        log.info("Gian hàng {} đã gửi yêu cầu đóng shop và hoàn trả Quỹ ký quỹ (Số dư: {} VNĐ)",
                fund.getShop().getName(), fund.getBalance());

        TrustLevelConfig config = trustLevelConfigService.getConfigByStarLevel(saved.getCurrentTrustLevel());
        String tierName = config != null ? config.getTierName() : ("Cấp độ " + saved.getCurrentTrustLevel() + " sao");

        return ShopEscrowFundResponse.from(saved, tierName);
    }

    @Override
    public String createVnpayPaymentUrl(UUID shopId, TopUpEscrowFundRequest request, String clientIp) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin gian hàng: " + shopId));

        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new CustomException("Số tiền nạp ký quỹ phải lớn hơn 0");
        }

        String txnRef = "ESCROW_" + shopId.toString() + "_" + System.currentTimeMillis();
        String orderInfo = "Nap tien ky quy gian hang " + shop.getName();
        String ipAddr = (clientIp != null && !clientIp.isBlank()) ? clientIp : "127.0.0.1";

        return vnPayService.buildPaymentUrl(
                txnRef,
                amount,
                orderInfo,
                vnPayConfig.returnUrl,
                ipAddr
        );
    }

    @Override
    @Transactional
    public void processVnpayCallback(Map<String, String> params, String rawQueryString) {
        boolean isChecksumValid;
        if (rawQueryString != null && !rawQueryString.trim().isEmpty()) {
            isChecksumValid = vnPayService.verifyChecksumFromQueryString(rawQueryString);
        } else {
            isChecksumValid = vnPayService.verifyChecksumFromMap(params);
        }

        if (!isChecksumValid) {
            log.error("Xác thực chữ ký VNPay không hợp lệ cho nạp ký quỹ");
            throw new CustomException("Invalid VNPay checksum");
        }

        String txnRef = params.get("vnp_TxnRef");
        if (txnRef == null && rawQueryString != null) {
            Map<String, String> parsed = org.springframework.web.util.UriComponentsBuilder
                    .fromUriString("?" + rawQueryString).build().getQueryParams().toSingleValueMap();
            txnRef = parsed.get("vnp_TxnRef");
        }

        if (txnRef == null || !txnRef.startsWith("ESCROW_")) {
            log.warn("Bỏ qua callback vì txnRef không thuộc giao dịch ký quỹ: {}", txnRef);
            return;
        }

        // Idempotency: Kiểm tra nếu giao dịch đã được ghi nhận trước đó thì bỏ qua
        if (shopEscrowTransactionRepository.existsByReferenceCode(txnRef)) {
            log.info("Giao dịch nạp ký quỹ VNPay {} đã được xử lý trước đó, bỏ qua", txnRef);
            return;
        }

        String responseCode = params.get("vnp_ResponseCode");
        if (!"00".equals(responseCode)) {
            log.warn("Giao dịch nạp ký quỹ VNPay {} thất bại hoặc bị hủy (responseCode: {})", txnRef, responseCode);
            return;
        }

        String[] parts = txnRef.split("_");
        if (parts.length < 2) {
            log.error("txnRef ký quỹ không đúng định dạng: {}", txnRef);
            return;
        }

        UUID shopId;
        try {
            shopId = UUID.fromString(parts[1]);
        } catch (IllegalArgumentException e) {
            log.error("Không thể trích xuất shopId từ txnRef: {}", txnRef, e);
            return;
        }

        String amountStr = params.get("vnp_Amount");
        if (amountStr == null) {
            log.error("vnp_Amount trống trong callback VNPay: {}", params);
            return;
        }

        BigDecimal amount = new BigDecimal(amountStr).divide(BigDecimal.valueOf(100));

        TopUpEscrowFundRequest topUpRequest = new TopUpEscrowFundRequest();
        topUpRequest.setAmount(amount);
        topUpRequest.setReferenceCode(txnRef);
        topUpRequest.setNote("Nạp tiền Quỹ ký quỹ qua cổng VNPay (Mã GD: " + txnRef + ")");

        log.info("Đang xử lý nạp ký quỹ thành công qua VNPay cho Shop {}: Số tiền={} VNĐ", shopId, amount);
        topUpFund(shopId, topUpRequest);
    }
}
