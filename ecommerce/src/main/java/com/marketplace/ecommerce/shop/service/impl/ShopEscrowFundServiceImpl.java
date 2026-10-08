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
import com.marketplace.ecommerce.shop.dto.request.AdminAdjustEscrowFundRequest;
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
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.entity.Transaction;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.repository.TransactionRepository;
import com.marketplace.ecommerce.payment.service.VNPayService;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.payment.valueObjects.ReferenceType;
import com.marketplace.ecommerce.payment.valueObjects.TransactionStatus;
import com.marketplace.ecommerce.payment.valueObjects.TransactionType;
import com.marketplace.ecommerce.order.repository.OrderReturnRepository;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.shop.dto.request.AdminDeductCompensationRequest;
import com.marketplace.ecommerce.wallet.entity.Wallet;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import com.marketplace.ecommerce.wallet.valueObjects.WalletType;
import com.marketplace.ecommerce.voucher.service.VoucherService;
import com.marketplace.ecommerce.product.service.ProductService;
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
import java.util.Optional;
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
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final EscrowRepository escrowRepository;
    private final OrderReturnRepository orderReturnRepository;
    private final ReportRepository reportRepository;
    private final RequestRepository requestRepository;
    private final VoucherService voucherService;
    private final ProductService productService;

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
                txNote = "Hoàn tất nạp đủ tiền ký quỹ cam kết (" + fund.getCommittedAmount()
                        + "đ) - Kích hoạt gian hàng thành công";

                log.info(
                        "KÍCH HOẠT GIAN HÀNG THÀNH CÔNG: Shop {} đã nạp đủ {}đ. Gian hàng chuyển sang ACTIVE với {} sao!",
                        fund.getShop().getName(), fund.getCommittedAmount(), activatedStarLevel);

                // Gửi thông báo in-app chúc mừng
                try {
                    Notification notif = Notification.builder()
                            .eventId(UUID.randomUUID().toString())
                            .user(fund.getShop().getUser())
                            .title("Kích hoạt gian hàng thành công!")
                            .content(
                                    "Gian hàng của bạn đã được kích hoạt thành công sau khi nạp đủ tiền ký quỹ cam kết. Cấp độ uy tín đạt: "
                                            + activatedStarLevel
                                            + " sao. Bạn có thể bắt đầu đăng bán sản phẩm ngay bây giờ!")
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
                txNote = "Nạp một phần ký quỹ cam kết (Đã nạp: " + newBalance + "đ / Cần: " + fund.getCommittedAmount()
                        + "đ - Còn thiếu: " + remaining + "đ)";
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
                .referenceCode(request.getReferenceCode() != null ? request.getReferenceCode()
                        : ("TOPUP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()))
                .note(txNote)
                .build();
        shopEscrowTransactionRepository.save(tx);

        TrustLevelConfig config = trustLevelConfigService.getConfigByStarLevel(savedFund.getCurrentTrustLevel());
        String tierName = config != null ? config.getTierName()
                : ("Cấp độ " + savedFund.getCurrentTrustLevel() + " sao");

        return ShopEscrowFundResponse.from(savedFund, tierName);
    }

    @Override
    @Transactional
    public ShopEscrowTransaction deductCompensation(UUID shopId, AdminDeductCompensationRequest request) {
        if (request == null) {
            throw new CustomException("Dữ liệu yêu cầu bồi thường không hợp lệ");
        }
        BigDecimal deductAmount = request.getAmount();
        if (deductAmount == null || deductAmount.compareTo(BigDecimal.valueOf(1000)) < 0) {
            throw new CustomException("Số tiền trích bồi thường tối thiểu là 1.000 VNĐ");
        }

        // 1. Lock ShopEscrowFund
        ShopEscrowFund fund = shopEscrowFundRepository.findByShopIdForUpdate(shopId)
                .orElseThrow(() -> new CustomException("Không tìm thấy Quỹ ký quỹ của gian hàng: " + shopId));

        // 2. Validate shop/fund
        if (fund.getBalance() == null || fund.getBalance().compareTo(BigDecimal.ZERO) <= 0) {
            throw new CustomException("Quỹ ký quỹ của gian hàng đã hết số dư (0 VNĐ), không thể trích bồi thường.");
        }

        // 3. Load Order bằng orderId
        UUID orderId = request.getOrderId();
        if (orderId == null) {
            throw new CustomException("Mã đơn hàng không được để trống khi thực hiện bồi thường.");
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Không tìm thấy đơn hàng: " + orderId));
        if (order.getShop() == null || !order.getShop().getId().equals(shopId)) {
            throw new CustomException("Đơn hàng " + order.getOrderNumber() + " không thuộc gian hàng này.");
        }

        // 4. Xác định Buyer
        User buyer = order.getUser();
        if (buyer == null) {
            throw new CustomException("Không tìm thấy thông tin người mua của đơn hàng: " + orderId);
        }

        // 5. Lock Buyer Wallet
        Wallet buyerWallet = walletRepository.findByUserIdForUpdate(buyer.getId())
                .orElseGet(() -> {
                    Wallet w = Wallet.builder()
                            .user(buyer)
                            .currency("VND")
                            .availableBalance(BigDecimal.ZERO)
                            .lockedBalance(BigDecimal.ZERO)
                            .walletType(WalletType.USER)
                            .createdAt(LocalDateTime.now())
                            .build();
                    return walletRepository.save(w);
                });

        // 6. Build dedupeKey
        String dedupeKey;
        if (request.getReportId() != null) {
            dedupeKey = "COMPENSATION:REPORT:" + request.getReportId();
        } else {
            String clientReqId = request.getClientRequestId() != null && !request.getClientRequestId().isBlank()
                    ? request.getClientRequestId().trim()
                    : UUID.randomUUID().toString();
            dedupeKey = "COMPENSATION:ORDER:" + orderId + ":" + clientReqId;
        }

        // 7. Check idempotency
        if (transactionRepository.existsByDedupeKey(dedupeKey)) {
            throw new CustomException(
                    "Giao dịch bồi thường này đã được xử lý trước đó (Dedupe key: " + dedupeKey + ")");
        }

        // 8. Tính refundAlreadyPaid (chỉ tính khoản Buyer thực tế đã nhận về ví từ
        // Escrow đơn hàng)
        BigDecimal refundAlreadyPaid = BigDecimal.ZERO;
        Optional<Escrow> escrowOpt = escrowRepository.findByOrderId(orderId);
        if (escrowOpt.isPresent()) {
            Escrow escrow = escrowOpt.get();
            refundAlreadyPaid = transactionRepository
                    .findByReferenceTypeAndReferenceId(ReferenceType.ESCROW, escrow.getId())
                    .stream()
                    .filter(tx -> tx.getType() == TransactionType.REFUND
                            && tx.getStatus() == TransactionStatus.SUCCESS
                            && tx.getToWallet() != null
                            && tx.getToWallet().getId().equals(buyerWallet.getId()))
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        // 9. Tính compensationAlreadyPaid (lũy kế các khoản bồi thường trước đó cho đơn
        // hàng)
        BigDecimal compensationAlreadyPaid = shopEscrowTransactionRepository.sumCompensationByOrderId(orderId);
        if (compensationAlreadyPaid == null) {
            compensationAlreadyPaid = BigDecimal.ZERO;
        }

        // 10. Tính remainingRecoverable = max(0, order.total - refundAlreadyPaid -
        // compensationAlreadyPaid)
        BigDecimal orderTotal = order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO;
        BigDecimal totalAlreadyRecovered = refundAlreadyPaid.add(compensationAlreadyPaid);
        BigDecimal remainingRecoverable = orderTotal.subtract(totalAlreadyRecovered);
        if (remainingRecoverable.compareTo(BigDecimal.ZERO) < 0) {
            remainingRecoverable = BigDecimal.ZERO;
        }

        if (remainingRecoverable.compareTo(BigDecimal.ZERO) <= 0) {
            throw new CustomException("Đơn hàng đã được hoàn tiền/bồi thường tối đa ("
                    + orderTotal + " VNĐ). Không thể bồi thường thêm.");
        }

        // 11. Tính allowedAmount = min(requestedAmount, remainingRecoverable,
        // fund.balance)
        BigDecimal allowedAmount = deductAmount
                .min(remainingRecoverable)
                .min(fund.getBalance());

        // 12. Nếu allowedAmount <= 0 -> reject
        if (allowedAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new CustomException("Số tiền bồi thường hợp lệ phải lớn hơn 0");
        }

        BigDecimal actualDeduct = allowedAmount;
        BigDecimal oldBalance = fund.getBalance();
        BigDecimal newBalance = oldBalance.subtract(actualDeduct);

        // 13. Trừ ShopEscrowFund
        fund.setBalance(newBalance);

        // 14. Nếu fund không còn đủ mức yêu cầu -> DEFICIT + deficitDeadline 72h
        TrustLevelConfig currentTier = trustLevelConfigService.getConfigByStarLevel(fund.getCurrentTrustLevel());
        BigDecimal minRequired = currentTier != null ? currentTier.getMinDeposit() : BigDecimal.ZERO;

        if (newBalance.compareTo(minRequired) < 0) {
            fund.setIsDeficit(true);
            fund.setDeficitAmount(minRequired.subtract(newBalance));
            if (fund.getDeficitDeadline() == null || fund.getDeficitDeadline().isBefore(LocalDateTime.now())) {
                fund.setDeficitDeadline(LocalDateTime.now().plusHours(72)); // Ân hạn 72 giờ để nạp bù
            }
            fund.setStatus(EscrowFundStatus.DEFICIT);
            sendDeficitAlertNotification(fund, minRequired);
        }

        ShopEscrowFund savedFund = shopEscrowFundRepository.save(fund);

        // 15. Cộng actualDeduct vào Buyer Wallet
        buyerWallet.addAvailable(actualDeduct);
        walletRepository.save(buyerWallet);

        // 16. Tạo ShopEscrowTransaction: COMPENSATION_DEDUCTION
        ShopEscrowTransaction shopTx = ShopEscrowTransaction.builder()
                .fund(savedFund)
                .transactionType(EscrowFundTransactionType.COMPENSATION_DEDUCTION)
                .amount(actualDeduct.negate())
                .balanceBefore(oldBalance)
                .balanceAfter(newBalance)
                .orderId(orderId)
                .reportId(request.getReportId())
                .referenceCode("DEDUCT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .note(request.getReason() != null ? request.getReason() : "Trích Quỹ ký quỹ đền bù cho người mua")
                .build();
        ShopEscrowTransaction savedShopTx = shopEscrowTransactionRepository.save(shopTx);

        // 17. Tạo Wallet Transaction: TransactionType.COMPENSATION,
        // ReferenceType.ORDER, referenceId = orderId
        Transaction walletTx = Transaction.builder()
                .fromWallet(null)
                .toWallet(buyerWallet)
                .amount(actualDeduct)
                .type(TransactionType.COMPENSATION)
                .status(TransactionStatus.SUCCESS)
                .referenceType(ReferenceType.ORDER)
                .referenceId(orderId)
                .dedupeKey(dedupeKey)
                .createdAt(LocalDateTime.now())
                .note("Bồi thường từ Quỹ ký quỹ gian hàng " + fund.getShop().getName()
                        + " cho đơn hàng " + order.getOrderNumber() + ": " + request.getReason())
                .build();
        transactionRepository.save(walletTx);

        log.warn("ĐÃ TRÍCH QUỸ KÝ QUỸ ĐỀN BÙ: Shop {} bị trích {}đ cho Buyer {}. Số dư: {}đ -> {}đ. DedupeKey: {}",
                fund.getShop().getName(), actualDeduct, buyer.getId(), oldBalance, newBalance, dedupeKey);

        return savedShopTx;
    }

    private void sendDeficitAlertNotification(ShopEscrowFund fund, BigDecimal minRequired) {
        try {
            Shop shop = fund.getShop();
            if (shop == null || shop.getUser() == null)
                return;
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
                            " VNĐ so với mức tối thiểu của cấp " + fund.getCurrentTrustLevel() + " sao (" + minRequired
                            + " VNĐ). " +
                            "Vui lòng nạp bù trước " + fund.getDeficitDeadline() + " để không bị giáng cấp uy tín.")
                    .payload(Map.of(
                            "shopId", shop.getId().toString(),
                            "currentTrustLevel", fund.getCurrentTrustLevel(),
                            "deficitAmount", fund.getDeficitAmount().toString(),
                            "deadline", fund.getDeficitDeadline().toString()))
                    .sentAt(LocalDateTime.now())
                    .build();

            notificationRepository.save(notif);
        } catch (Exception e) {
            log.error("Lỗi gửi thông báo cảnh báo hụt quỹ ký quỹ cho shop: {}", fund.getShop().getId(), e);
        }
    }

    @Override
    @Transactional
    public ShopEscrowFundResponse adminAdjustFund(UUID shopId, AdminAdjustEscrowFundRequest request, UUID adminId) {
        ShopEscrowFund fund = shopEscrowFundRepository.findByShopIdForUpdate(shopId)
                .orElseThrow(() -> new CustomException("Không tìm thấy Quỹ ký quỹ của gian hàng: " + shopId));

        BigDecimal oldBalance = fund.getBalance();
        BigDecimal newBalance = request.getBalance() != null ? request.getBalance() : oldBalance;
        BigDecimal oldCommitted = fund.getCommittedAmount() != null ? fund.getCommittedAmount() : BigDecimal.ZERO;
        BigDecimal newCommitted = request.getCommittedAmount() != null ? request.getCommittedAmount() : oldCommitted;

        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new CustomException("Số dư quỹ ký quỹ không được âm");
        }
        if (newCommitted.compareTo(BigDecimal.ZERO) < 0) {
            throw new CustomException("Hạn mức cam kết ký quỹ không được âm");
        }

        fund.setCommittedAmount(newCommitted);

        // Nếu số dư thay đổi, ghi nhận giao dịch sổ cái loại ADMIN_ADJUSTMENT
        if (newBalance.compareTo(oldBalance) != 0) {
            fund.setBalance(newBalance);
            BigDecimal diff = newBalance.subtract(oldBalance);
            ShopEscrowTransaction tx = ShopEscrowTransaction.builder()
                    .fund(fund)
                    .transactionType(EscrowFundTransactionType.ADMIN_ADJUSTMENT)
                    .amount(diff)
                    .balanceBefore(oldBalance)
                    .balanceAfter(newBalance)
                    .referenceCode("ADMIN-ADJ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .note(request.getReason() != null ? request.getReason().trim()
                            : "Quản trị viên điều chỉnh số dư ký quỹ")
                    .build();
            shopEscrowTransactionRepository.save(tx);
        }

        // Cập nhật Cấp sao uy tín (nếu Admin chỉ định, hoặc tự động tính theo số dư
        // mới)
        int targetStarLevel;
        if (request.getTargetTrustLevel() != null) {
            if (request.getTargetTrustLevel() < 1 || request.getTargetTrustLevel() > 5) {
                throw new CustomException("Cấp bậc sao không hợp lệ (1-5 sao)");
            }
            targetStarLevel = request.getTargetTrustLevel();
        } else {
            targetStarLevel = trustLevelConfigService.resolveTrustLevel(newBalance);
        }

        fund.setCurrentTrustLevel(targetStarLevel);
        fund.getShop().setTrustLevel(targetStarLevel);

        // Đánh giá tình trạng hụt quỹ so với mức cam kết
        if (newBalance.compareTo(newCommitted) < 0) {
            fund.setIsDeficit(true);
            fund.setDeficitAmount(newCommitted.subtract(newBalance));
            if (fund.getDeficitDeadline() == null) {
                fund.setDeficitDeadline(LocalDateTime.now().plusHours(72));
            }
            fund.setStatus(EscrowFundStatus.DEFICIT);
        } else {
            fund.setIsDeficit(false);
            fund.setDeficitAmount(BigDecimal.ZERO);
            fund.setDeficitDeadline(null);
            fund.setStatus(EscrowFundStatus.ACTIVE);
            fund.getShop().setStatus(ShopStatus.ACTIVE);
        }

        shopRepository.save(fund.getShop());
        ShopEscrowFund saved = shopEscrowFundRepository.save(fund);

        log.info(
                "Admin {} đã điều chỉnh Quỹ ký quỹ shop {}: Balance ({} -> {}), Committed ({} -> {}), StarLevel={}, Status={}",
                adminId, fund.getShop().getName(), oldBalance, newBalance, oldCommitted, newCommitted, targetStarLevel,
                saved.getStatus());

        TrustLevelConfig config = trustLevelConfigService.getConfigByStarLevel(saved.getCurrentTrustLevel());
        String tierName = config != null ? config.getTierName() : ("Cấp độ " + saved.getCurrentTrustLevel() + " sao");

        return ShopEscrowFundResponse.from(saved, tierName);
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
    public Page<ShopEscrowFundResponse> getAllFunds(Boolean isDeficit, EscrowFundStatus status, Pageable pageable) {
        Page<ShopEscrowFund> page;
        if (status != null) {
            page = shopEscrowFundRepository.findByStatus(status, pageable);
        } else if (isDeficit != null) {
            page = shopEscrowFundRepository.findByIsDeficit(isDeficit, pageable);
        } else {
            page = shopEscrowFundRepository.findAll(pageable);
        }

        return page.map(fund -> {
            TrustLevelConfig config = trustLevelConfigService.getConfigByStarLevel(fund.getCurrentTrustLevel());
            String tierName = config != null ? config.getTierName()
                    : ("Cấp độ " + fund.getCurrentTrustLevel() + " sao");
            return ShopEscrowFundResponse.from(fund, tierName);
        });
    }

    private void validateCanCloseShopInternal(UUID shopId, boolean isApprovalStep) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new CustomException("Không tìm thấy gian hàng: " + shopId));

        ShopEscrowFund fund = shopEscrowFundRepository.findByShopId(shopId)
                .orElseThrow(() -> new CustomException("Không tìm thấy Quỹ ký quỹ của gian hàng: " + shopId));

        // 1. Shop status hợp lệ
        if (!isApprovalStep) {
            if (shop.getStatus() != ShopStatus.ACTIVE) {
                throw new CustomException(
                        "Chỉ gian hàng đang ở trạng thái Hoạt động (ACTIVE) mới được yêu cầu đóng shop. Trạng thái hiện tại: "
                                + shop.getStatus());
            }
        } else {
            if (shop.getStatus() != ShopStatus.INACTIVE && shop.getStatus() != ShopStatus.ACTIVE) {
                throw new CustomException("Trạng thái gian hàng không hợp lệ để phê duyệt đóng: " + shop.getStatus());
            }
            if (fund.getStatus() != EscrowFundStatus.REFUND_PENDING) {
                throw new CustomException(
                        "Quỹ ký quỹ không ở trạng thái chờ hoàn tiền (REFUND_PENDING): " + fund.getStatus());
            }
        }

        // 8. ShopEscrowFund không DEFICIT hoặc LOCKED
        if (fund.getStatus() == EscrowFundStatus.DEFICIT || Boolean.TRUE.equals(fund.getIsDeficit())) {
            throw new CustomException(
                    "Quỹ ký quỹ đang bị thiếu hụt (DEFICIT). Vui lòng xử lý nạp bù trước khi đóng gian hàng.");
        }
        if (fund.getStatus() == EscrowFundStatus.LOCKED) {
            throw new CustomException("Quỹ ký quỹ đang bị khóa (LOCKED). Không thể thực hiện thủ tục đóng gian hàng.");
        }

        // 2. Không còn Order: PENDING_PAYMENT, CONFIRMED, PROCESSING, SHIPPED,
        // DELIVERED
        List<OrderStatus> activeOrderStatuses = List.of(
                OrderStatus.PENDING_PAYMENT,
                OrderStatus.CONFIRMED,
                OrderStatus.PROCESSING,
                OrderStatus.SHIPPED,
                OrderStatus.DELIVERED);
        if (orderRepository.existsByShopIdAndStatusIn(shopId, activeOrderStatuses)) {
            throw new CustomException(
                    "Gian hàng còn đơn hàng đang xử lý (chưa hoàn thành hoặc chưa hủy/hoàn tiền). Không thể đóng shop.");
        }

        // 3. Mọi COMPLETED order: deliveredAt <= now - 7 days (Cooling period 7 ngày)
        LocalDateTime coolingCutoff = LocalDateTime.now().minusDays(7);
        if (orderRepository.existsCompletedOrderWithinCoolingPeriod(shopId, coolingCutoff)) {
            throw new CustomException(
                    "Gian hàng còn đơn hàng hoàn thành chưa qua thời hạn 7 ngày bảo đảm (Cooling Period). Vui lòng đợi hết thời hạn khiếu nại của người mua.");
        }

        // 4. Không có Escrow: HELD, DISPUTED
        List<EscrowStatus> activeEscrowStatuses = List.of(EscrowStatus.HELD, EscrowStatus.DISPUTED);
        if (escrowRepository.existsByOrderShopIdAndStatusIn(shopId, activeEscrowStatuses)) {
            throw new CustomException(
                    "Gian hàng còn tiền ký quỹ đơn hàng đang bị tạm giữ (HELD) hoặc tranh chấp (DISPUTED).");
        }

        // 5. Không có OrderReturn: WAITING_FOR_SHIPMENT, SHIPPED, RETURNED, DISPUTED
        List<ReturnStatus> activeReturnStatuses = List.of(
                ReturnStatus.WAITING_FOR_SHIPMENT,
                ReturnStatus.SHIPPED,
                ReturnStatus.RETURNED,
                ReturnStatus.DISPUTED);
        if (orderReturnRepository.existsByOrderShopIdAndStatusIn(shopId, activeReturnStatuses)) {
            throw new CustomException("Gian hàng còn yêu cầu trả hàng / hoàn tiền đang được xử lý.");
        }

        // 6. Không có Report đang PENDING
        if (reportRepository.existsPendingReportsForShop(shopId)) {
            throw new CustomException("Gian hàng còn báo cáo vi phạm hoặc khiếu nại đang chờ xử lý.");
        }

        // 7. Không có Appeal/Request đang PENDING
        if (shop.getUser() != null && shop.getUser().getAccount() != null) {
            UUID ownerAccountId = shop.getUser().getAccount().getId();
            if (requestRepository.existsByAccountIdAndTypeAndStatus(ownerAccountId, RequestType.APPEAL,
                    RequestStatus.PENDING)) {
                throw new CustomException("Gian hàng đang có đơn khiếu nại/kháng cáo (APPEAL) chờ giải quyết.");
            }
        }
    }

    @Override
    @Transactional
    public ShopEscrowFundResponse requestCloseShopAndRefund(UUID shopId) {
        ShopEscrowFund fund = shopEscrowFundRepository.findByShopIdForUpdate(shopId)
                .orElseThrow(() -> new CustomException("Không tìm thấy Quỹ ký quỹ của gian hàng: " + shopId));

        Shop shop = fund.getShop();
        if (shop == null) {
            throw new CustomException("Không tìm thấy thông tin gian hàng: " + shopId);
        }

        validateCanCloseShopInternal(shopId, false);

        fund.setStatus(EscrowFundStatus.REFUND_PENDING);
        shop.setStatus(ShopStatus.INACTIVE);

        shopRepository.save(shop);
        ShopEscrowFund savedFund = shopEscrowFundRepository.save(fund);

        log.info("YÊU CẦU ĐÓNG SHOP: Gian hàng {} chuyển INACTIVE, quỹ REFUND_PENDING (Số dư: {} VNĐ)",
                shop.getName(), fund.getBalance());

        TrustLevelConfig config = trustLevelConfigService.getConfigByStarLevel(savedFund.getCurrentTrustLevel());
        String tierName = config != null ? config.getTierName()
                : ("Cấp độ " + savedFund.getCurrentTrustLevel() + " sao");

        return ShopEscrowFundResponse.from(savedFund, tierName);
    }

    @Override
    @Transactional
    public ShopEscrowFundResponse adminApproveCloseShopRefund(UUID shopId) {
        // 1. Lock ShopEscrowFund
        ShopEscrowFund fund = shopEscrowFundRepository.findByShopIdForUpdate(shopId)
                .orElseThrow(() -> new CustomException("Không tìm thấy Quỹ ký quỹ của gian hàng: " + shopId));

        // 2. Validate fund.status == REFUND_PENDING (Chống double approve)
        if (fund.getStatus() != EscrowFundStatus.REFUND_PENDING) {
            throw new CustomException(
                    "Yêu cầu đóng shop không ở trạng thái chờ duyệt (REFUND_PENDING). Trạng thái hiện tại: "
                            + fund.getStatus());
        }

        Shop shop = fund.getShop();
        if (shop == null || shop.getUser() == null) {
            throw new CustomException("Không tìm thấy thông tin chủ gian hàng");
        }

        // 3. Lock Seller Wallet
        Wallet sellerWallet = walletRepository.findByUserIdForUpdate(shop.getUser().getId())
                .orElseGet(() -> {
                    Wallet w = Wallet.builder()
                            .user(shop.getUser())
                            .currency("VND")
                            .availableBalance(BigDecimal.ZERO)
                            .lockedBalance(BigDecimal.ZERO)
                            .walletType(WalletType.USER)
                            .createdAt(LocalDateTime.now())
                            .build();
                    return walletRepository.save(w);
                });

        // 4. Revalidate canCloseShop(shopId)
        validateCanCloseShopInternal(shopId, true);

        // 5. refundAmount = fund.balance
        BigDecimal refundAmount = fund.getBalance() != null ? fund.getBalance() : BigDecimal.ZERO;
        BigDecimal oldBalance = fund.getBalance();

        // 6. fund.balance = 0
        fund.setBalance(BigDecimal.ZERO);

        // 7. fund.status = REFUNDED
        fund.setStatus(EscrowFundStatus.REFUNDED);

        // 8. sellerWallet.addAvailable(refundAmount)
        if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
            sellerWallet.addAvailable(refundAmount);
            walletRepository.save(sellerWallet);
        }

        // 9. shop.status = CLOSED
        shop.setStatus(ShopStatus.CLOSED);
        shopRepository.save(shop);
        ShopEscrowFund savedFund = shopEscrowFundRepository.save(fund);

        // Vô hiệu hóa toàn bộ voucher và sản phẩm của Shop thông qua Domain Service tương ứng
        voucherService.deactivateVouchersOnShopClose(shop.getId());
        productService.deactivateProductsOnShopClose(shop.getId());

        // 10. Ghi ShopEscrowTransaction (WITHDRAWAL_ON_CLOSE)
        ShopEscrowTransaction shopTx = ShopEscrowTransaction.builder()
                .fund(savedFund)
                .transactionType(EscrowFundTransactionType.WITHDRAWAL_ON_CLOSE)
                .amount(refundAmount.negate())
                .balanceBefore(oldBalance)
                .balanceAfter(BigDecimal.ZERO)
                .referenceCode("CLOSE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .note("Hoàn trả toàn bộ Quỹ ký quỹ cho chủ gian hàng khi đóng shop thành công")
                .build();
        shopEscrowTransactionRepository.save(shopTx);

        // 11. Ghi Wallet Transaction type REFUND
        String dedupeKey = "CLOSE_REFUND:" + fund.getId();
        if (!transactionRepository.existsByDedupeKey(dedupeKey)) {
            Transaction walletTx = Transaction.builder()
                    .fromWallet(null)
                    .toWallet(sellerWallet)
                    .amount(refundAmount)
                    .type(TransactionType.REFUND)
                    .status(TransactionStatus.SUCCESS)
                    .referenceType(ReferenceType.WITHDRAWAL)
                    .referenceId(fund.getId())
                    .dedupeKey(dedupeKey)
                    .createdAt(LocalDateTime.now())
                    .note("Hoàn trả Quỹ ký quỹ khi đóng gian hàng " + shop.getName())
                    .build();
            transactionRepository.save(walletTx);
        }

        // Gửi thông báo
        try {
            Notification notif = Notification.builder()
                    .eventId("SHOP_CLOSED_" + UUID.randomUUID())
                    .user(shop.getUser())
                    .type(NotificationType.SYSTEM)
                    .channel(NotificationChannelType.IN_APP)
                    .status(NotificationStatus.SENT)
                    .title("Phê duyệt đóng gian hàng và hoàn ký quỹ thành công")
                    .content("Yêu cầu đóng gian hàng \"" + shop.getName() + "\" đã được Ban Quản Trị phê duyệt. " +
                            "Số tiền ký quỹ " + refundAmount + " VNĐ đã được hoàn trả về ví của bạn.")
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notif);
        } catch (Exception e) {
            log.error("Lỗi gửi thông báo đóng shop cho user {}", shop.getUser().getId(), e);
        }

        log.info("ADMIN PHÊ DUYỆT ĐÓNG SHOP THÀNH CÔNG: Shop {} chuyển CLOSED, quỹ REFUNDED, hoàn {}đ về ví Seller",
                shop.getName(), refundAmount);

        TrustLevelConfig config = trustLevelConfigService.getConfigByStarLevel(savedFund.getCurrentTrustLevel());
        String tierName = config != null ? config.getTierName()
                : ("Cấp độ " + savedFund.getCurrentTrustLevel() + " sao");

        return ShopEscrowFundResponse.from(savedFund, tierName);
    }

    @Override
    @Transactional
    public ShopEscrowFundResponse adminRejectCloseShopRefund(UUID shopId, String reason) {
        ShopEscrowFund fund = shopEscrowFundRepository.findByShopIdForUpdate(shopId)
                .orElseThrow(() -> new CustomException("Không tìm thấy Quỹ ký quỹ của gian hàng: " + shopId));

        if (fund.getStatus() != EscrowFundStatus.REFUND_PENDING) {
            throw new CustomException(
                    "Yêu cầu đóng shop không ở trạng thái chờ duyệt (REFUND_PENDING). Trạng thái hiện tại: "
                            + fund.getStatus());
        }

        Shop shop = fund.getShop();
        if (shop == null) {
            throw new CustomException("Không tìm thấy thông tin gian hàng: " + shopId);
        }

        fund.setStatus(EscrowFundStatus.ACTIVE);
        shop.setStatus(ShopStatus.ACTIVE);

        shopRepository.save(shop);
        ShopEscrowFund savedFund = shopEscrowFundRepository.save(fund);

        // Gửi thông báo từ chối
        try {
            if (shop.getUser() != null) {
                Notification notif = Notification.builder()
                        .eventId("SHOP_CLOSE_REJECTED_" + UUID.randomUUID())
                        .user(shop.getUser())
                        .type(NotificationType.SYSTEM)
                        .channel(NotificationChannelType.IN_APP)
                        .status(NotificationStatus.SENT)
                        .title("Yêu cầu đóng gian hàng bị từ chối")
                        .content("Yêu cầu đóng gian hàng \"" + shop.getName() + "\" đã bị Ban Quản Trị từ chối. " +
                                (reason != null && !reason.isBlank() ? "Lý do: " + reason : "") +
                                " Gian hàng đã được khôi phục trạng thái hoạt động bình thường.")
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(notif);
            }
        } catch (Exception e) {
            log.error("Lỗi gửi thông báo từ chối đóng shop cho user {}", shop.getUser().getId(), e);
        }

        log.info("ADMIN TỪ CHỐI ĐÓNG SHOP: Shop {} khôi phục ACTIVE, quỹ ACTIVE. Lý do: {}", shop.getName(), reason);

        TrustLevelConfig config = trustLevelConfigService.getConfigByStarLevel(savedFund.getCurrentTrustLevel());
        String tierName = config != null ? config.getTierName()
                : ("Cấp độ " + savedFund.getCurrentTrustLevel() + " sao");

        return ShopEscrowFundResponse.from(savedFund, tierName);
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
                ipAddr);
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