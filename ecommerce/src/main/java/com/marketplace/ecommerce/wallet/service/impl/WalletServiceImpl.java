package com.marketplace.ecommerce.wallet.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.service.EmailService;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.notification.entity.Notification;
import com.marketplace.ecommerce.notification.repository.NotificationRepository;
import com.marketplace.ecommerce.notification.valueObjects.NotificationChannelType;
import com.marketplace.ecommerce.notification.valueObjects.NotificationStatus;
import com.marketplace.ecommerce.notification.valueObjects.NotificationType;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.entity.Payment;
import com.marketplace.ecommerce.payment.entity.Transaction;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.repository.TransactionRepository;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.payment.valueObjects.ReferenceType;
import com.marketplace.ecommerce.payment.valueObjects.TransactionStatus;
import com.marketplace.ecommerce.payment.valueObjects.TransactionType;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.wallet.dto.request.AdminReviewWithdrawalRequest;
import com.marketplace.ecommerce.wallet.dto.request.BankInfoRequest;
import com.marketplace.ecommerce.wallet.dto.request.CreateWithdrawalRequest;
import com.marketplace.ecommerce.wallet.dto.response.WalletResponse;
import com.marketplace.ecommerce.wallet.dto.response.WithdrawalResponse;
import com.marketplace.ecommerce.wallet.entity.Wallet;
import com.marketplace.ecommerce.wallet.entity.WithdrawalRequest;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import com.marketplace.ecommerce.wallet.repository.WithdrawalRequestRepository;
import com.marketplace.ecommerce.wallet.service.WalletService;
import com.marketplace.ecommerce.wallet.valueObjects.WalletType;
import com.marketplace.ecommerce.wallet.valueObjects.WithdrawalStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.marketplace.ecommerce.payment.repository.PaymentRepository;
import com.marketplace.ecommerce.payment.valueObjects.PaymentMethod;
import com.marketplace.ecommerce.payment.valueObjects.PaymentStatus;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {
    private final WalletRepository walletRepo;
    private final EscrowRepository escrowRepo;
    private final TransactionRepository txRepo;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final ShopRepository shopRepository;

    @Override
    public WalletResponse getWalletByUserName(String username) {
        User user = userRepository.findByAccountUsername(username)
                .orElseThrow(() -> new CustomException("User not found"));

        Wallet w = walletRepo.findByUserId(user.getId())
                .orElseThrow(() -> new CustomException("Wallet not found for userName=" + user.getAccount().getUsername()));

        return WalletResponse.from(w);
    }


    @Override
    @Transactional(readOnly = true)
    public WalletResponse getWallet(UUID accountId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        Wallet w = walletRepo.findByUserId(user.getId())
                .orElseThrow(() -> new CustomException("Wallet not found for userId=" + user.getId()));

        return WalletResponse.from(w);
    }


    @Override
    @Transactional
    public void recordPaymentAndHoldEscrow(Payment payment) {
        Order order = payment.getOrder();
        BigDecimal amount = payment.getAmount();

        Wallet buyerWallet = walletRepo.findByUserIdForUpdate(order.getUser().getId())
                .orElseThrow(() -> new CustomException("Buyer wallet not found"));

        Wallet sellerWallet = walletRepo.findByUserIdForUpdate(order.getShop().getUser().getId())
                .orElseThrow(() -> new CustomException("Seller wallet not found"));

        Wallet escrowWallet = walletRepo.findSystemWalletForUpdate(WalletType.ESCROW)
                .orElseThrow(() -> new CustomException("System ESCROW wallet not found"));

        Escrow escrow = escrowRepo.findByOrderId(order.getId())
                .orElseGet(() -> Escrow.builder()
                        .order(order)
                        .buyerWallet(buyerWallet)
                        .sellerWallet(sellerWallet)
                        .escrowWallet(escrowWallet)
                        .amount(amount)
                        .status(EscrowStatus.HELD)
                        .createdAt(LocalDateTime.now())
                        .build());

        if (escrow.getId() == null) {
            escrowRepo.save(escrow);
        }

        String payDedupe = "PAYMENT:" + payment.getId();
        if (!txRepo.existsByDedupeKey(payDedupe)) {
            Transaction tx1 = Transaction.builder()
                    .fromWallet(null) // external
                    .toWallet(buyerWallet)
                    .amount(amount)
                    .type(TransactionType.PAYMENT)
                    .status(TransactionStatus.SUCCESS)
                    .referenceType(ReferenceType.PAYMENT)
                    .referenceId(payment.getId())
                    .dedupeKey(payDedupe)
                    .providerTxnNo(payment.getProviderTxnNo())
                    .createdAt(LocalDateTime.now())
                    .note("VNPay success, credit buyer wallet")
                    .build();

            buyerWallet.addAvailable(amount);
            txRepo.save(tx1);
        }

        // ---------- TX #2 ESCROW_HOLD ----------
        String holdDedupe = "ESCROW_HOLD:" + escrow.getId();
        if (!txRepo.existsByDedupeKey(holdDedupe)) {
            if (buyerWallet.getAvailableBalance().compareTo(amount) < 0) {
                throw new CustomException("Buyer available balance insufficient for escrow hold");
            }

            Transaction tx2 = Transaction.builder()
                    .fromWallet(buyerWallet)
                    .toWallet(escrowWallet)
                    .amount(amount)
                    .type(TransactionType.HOLD)
                    .status(TransactionStatus.SUCCESS)
                    .referenceType(ReferenceType.ESCROW)
                    .referenceId(escrow.getId())
                    .dedupeKey(holdDedupe)
                    .createdAt(LocalDateTime.now())
                    .note("Hold money to escrow for order " + order.getOrderNumber())
                    .build();

            buyerWallet.subAvailable(amount);
            escrowWallet.addLocked(amount);

            txRepo.save(tx2);
        }

        walletRepo.save(buyerWallet);
        walletRepo.save(escrowWallet);
    }

    @Override
    @Transactional
    public void payOrderWithWallet(Order order) {
        BigDecimal amount = order.getTotal();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new CustomException("Số tiền thanh toán đơn hàng không hợp lệ");
        }

        // 1. Khóa bi quan ví người mua
        Wallet buyerWallet = walletRepo.findByUserIdForUpdate(order.getUser().getId())
                .orElseThrow(() -> new CustomException("Ví người mua không tồn tại hoặc chưa được kích hoạt"));

        if (buyerWallet.getAvailableBalance() == null || buyerWallet.getAvailableBalance().compareTo(amount) < 0) {
            BigDecimal currentBal = buyerWallet.getAvailableBalance() != null ? buyerWallet.getAvailableBalance() : BigDecimal.ZERO;
            throw new CustomException("Số dư ví không đủ để thanh toán đơn hàng. Hiện có: "
                    + currentBal.toPlainString() + " VND, Cần thanh toán: " + amount.toPlainString() + " VND");
        }

        // 2. Lấy ví Escrow sàn (Tuyệt đối không đụng vào ví người bán lúc thanh toán)
        Wallet escrowWallet = walletRepo.findSystemWalletForUpdate(WalletType.ESCROW)
                .orElseThrow(() -> new CustomException("Hệ thống ví ký quỹ ESCROW không tồn tại"));

        // 3. Trừ tiền ví buyer, cộng tiền khóa vào escrowWallet
        buyerWallet.subAvailable(amount);
        escrowWallet.addLocked(amount);
        walletRepo.saveAll(List.of(buyerWallet, escrowWallet));

        // 4. Tạo hoặc cập nhật Payment record
        String payDedupe = "WALLET_PAY:" + order.getId();
        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .amount(amount)
                        .method(PaymentMethod.WALLET)
                        .status(PaymentStatus.SUCCESS)
                        .txnRef("WAL-" + order.getOrderNumber() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                        .providerTxnNo(payDedupe)
                        .createdAt(LocalDateTime.now())
                        .build());
        payment.setMethod(PaymentMethod.WALLET);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setAmount(amount);
        payment.setProviderTxnNo(payDedupe);
        paymentRepository.save(payment);

        // 5. Tạo Escrow record (chỉ lưu buyerWallet và escrowWallet, không đụng ví người bán)
        Escrow escrow = escrowRepo.findByOrderId(order.getId())
                .orElseGet(() -> Escrow.builder()
                        .order(order)
                        .buyerWallet(buyerWallet)
                        .escrowWallet(escrowWallet)
                        .amount(amount)
                        .status(EscrowStatus.HELD)
                        .createdAt(LocalDateTime.now())
                        .build());
        escrow.setStatus(EscrowStatus.HELD);
        escrow.setAmount(amount);
        escrowRepo.save(escrow);

        // 7. Ghi nhận Transaction HOLD vào Ký quỹ
        String holdDedupe = "WALLET_HOLD:" + escrow.getId();
        if (!txRepo.existsByDedupeKey(holdDedupe)) {
            Transaction tx = Transaction.builder()
                    .fromWallet(buyerWallet)
                    .toWallet(escrowWallet)
                    .amount(amount)
                    .type(TransactionType.HOLD)
                    .status(TransactionStatus.SUCCESS)
                    .referenceType(ReferenceType.ESCROW)
                    .referenceId(escrow.getId())
                    .dedupeKey(holdDedupe)
                    .createdAt(LocalDateTime.now())
                    .note("Thanh toán đơn hàng " + order.getOrderNumber() + " bằng ví số dư tài khoản")
                    .build();
            txRepo.save(tx);
        }
    }

    @Override
    @Transactional
    public void updateBankInfo(UUID accountId, BankInfoRequest request) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin người dùng"));

        user.setBankName(request.getBankName().trim());
        user.setBankAccountNumber(request.getBankAccountNumber().trim());
        user.setBankAccountName(request.getBankAccountName().trim().toUpperCase());
        userRepository.save(user);

        // Sync bank info to Shop if this user owns a Shop
        if (shopRepository != null) {
            shopRepository.findByUserId(user.getId()).ifPresent(shop -> {
                shop.setBankName(user.getBankName());
                shop.setBankAccountNumber(user.getBankAccountNumber());
                shop.setBankAccountName(user.getBankAccountName());
                shopRepository.save(shop);
            });
        }
    }

    @Override
    @Transactional
    public WithdrawalResponse requestWithdrawal(UUID accountId, CreateWithdrawalRequest request) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin người dùng"));

        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(new BigDecimal("100000")) < 0) {
            throw new CustomException("Số tiền rút tối thiểu là 100.000 VNĐ");
        }

        // Ưu tiên thông tin ngân hàng trong request nếu có, hoặc dùng thông tin ngân hàng đã lưu trong hồ sơ user
        String bankName = (request.getBankName() != null && !request.getBankName().isBlank())
                ? request.getBankName().trim() : user.getBankName();
        String bankAccountNumber = (request.getBankAccountNumber() != null && !request.getBankAccountNumber().isBlank())
                ? request.getBankAccountNumber().trim() : user.getBankAccountNumber();
        String bankAccountName = (request.getBankAccountName() != null && !request.getBankAccountName().isBlank())
                ? request.getBankAccountName().trim().toUpperCase() : user.getBankAccountName();

        if (bankName == null || bankName.isBlank() ||
                bankAccountNumber == null || bankAccountNumber.isBlank() ||
                bankAccountName == null || bankAccountName.isBlank()) {
            throw new CustomException("Vui lòng cung cấp đầy đủ thông tin tài khoản ngân hàng nhận tiền");
        }

        // Cập nhật lại thông tin ngân hàng cho user nếu chưa có
        if (user.getBankName() == null || user.getBankName().isBlank()) {
            user.setBankName(bankName);
            user.setBankAccountNumber(bankAccountNumber);
            user.setBankAccountName(bankAccountName);
            userRepository.save(user);
        }

        // Khóa bi quan ví người dùng
        Wallet wallet = walletRepo.findByUserIdForUpdate(user.getId())
                .orElseThrow(() -> new CustomException("Không tìm thấy ví người dùng"));

        if (wallet.getAvailableBalance() == null || wallet.getAvailableBalance().compareTo(amount) < 0) {
            BigDecimal currentBal = wallet.getAvailableBalance() != null ? wallet.getAvailableBalance() : BigDecimal.ZERO;
            throw new CustomException("Số dư khả dụng trong ví không đủ. Hiện có: "
                    + formatVND(currentBal) + ", Yêu cầu rút: " + formatVND(amount));
        }

        // Khóa số dư rút tiền (trừ available, tăng locked)
        wallet.subAvailable(amount);
        wallet.addLocked(amount);
        walletRepo.save(wallet);

        String txRef = "WD-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-"
                + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        WithdrawalRequest withdrawal = WithdrawalRequest.builder()
                .user(user)
                .wallet(wallet)
                .amount(amount)
                .bankName(bankName)
                .bankAccountNumber(bankAccountNumber)
                .bankAccountName(bankAccountName)
                .status(WithdrawalStatus.PENDING)
                .txRef(txRef)
                .note(request.getNote())
                .build();
        withdrawal = withdrawalRequestRepository.save(withdrawal);

        // Ghi transaction WITHDRAWAL trạng thái PENDING
        String dedupeKey = "WITHDRAWAL_INIT:" + withdrawal.getId();
        if (!txRepo.existsByDedupeKey(dedupeKey)) {
            Transaction tx = Transaction.builder()
                    .fromWallet(wallet)
                    .toWallet(null)
                    .amount(amount)
                    .type(TransactionType.WITHDRAWAL)
                    .status(TransactionStatus.PENDING)
                    .referenceType(ReferenceType.WITHDRAWAL)
                    .referenceId(withdrawal.getId())
                    .dedupeKey(dedupeKey)
                    .createdAt(LocalDateTime.now())
                    .note("Yêu cầu rút tiền về " + bankName + " (" + bankAccountNumber + ")")
                    .build();
            txRepo.save(tx);
        }

        // Gửi email thông báo tiếp nhận yêu cầu rút tiền qua SMTP
        try {
            String recipientEmail = user.getEmail() != null ? user.getEmail() : (user.getAccount() != null ? user.getAccount().getEmail() : null);
            emailService.sendWithdrawalEmail(recipientEmail, user.getFullName(), amount, bankName, bankAccountNumber, txRef, "PENDING", withdrawal.getNote());
        } catch (Exception e) {
            log.warn("Không thể gửi email thông báo rút tiền cho user {}: {}", user.getId(), e.getMessage());
        }

        return WithdrawalResponse.from(withdrawal);
    }

    @Override
    @Transactional
    public WithdrawalResponse cancelWithdrawal(UUID accountId, UUID withdrawalId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin người dùng"));

        WithdrawalRequest withdrawal = withdrawalRequestRepository.findById(withdrawalId)
                .orElseThrow(() -> new CustomException("Không tìm thấy yêu cầu rút tiền"));

        if (!withdrawal.getUser().getId().equals(user.getId())) {
            throw new CustomException("Bạn không có quyền thao tác trên yêu cầu rút tiền này");
        }

        if (withdrawal.getStatus() != WithdrawalStatus.PENDING) {
            throw new CustomException("Chỉ có thể hủy yêu cầu rút tiền ở trạng thái chờ duyệt (PENDING)");
        }

        Wallet wallet = walletRepo.findByUserIdForUpdate(user.getId())
                .orElseThrow(() -> new CustomException("Không tìm thấy ví người dùng"));

        BigDecimal amount = withdrawal.getAmount();
        wallet.subLocked(amount);
        wallet.addAvailable(amount);
        walletRepo.save(wallet);

        withdrawal.setStatus(WithdrawalStatus.CANCELLED);
        withdrawal.setAdminNote("Người dùng tự hủy yêu cầu rút tiền");
        WithdrawalRequest saved = withdrawalRequestRepository.save(withdrawal);

        // Cập nhật transaction status FAILED
        txRepo.findByReferenceTypeAndReferenceId(ReferenceType.WITHDRAWAL, withdrawal.getId())
                .stream()
                .filter(tx -> tx.getType() == TransactionType.WITHDRAWAL && tx.getStatus() == TransactionStatus.PENDING)
                .forEach(tx -> {
                    tx.setStatus(TransactionStatus.FAILED);
                    tx.setNote(tx.getNote() + " (Đã hủy)");
                    txRepo.save(tx);
                });

        // Gửi email thông báo hủy rút tiền qua SMTP
        try {
            String recipientEmail = user.getEmail() != null ? user.getEmail() : (user.getAccount() != null ? user.getAccount().getEmail() : null);
            emailService.sendWithdrawalEmail(recipientEmail, user.getFullName(), amount, withdrawal.getBankName(), withdrawal.getBankAccountNumber(), withdrawal.getTxRef(), "CANCELLED", "Người dùng đã tự hủy yêu cầu rút tiền");
        } catch (Exception e) {
            log.warn("Không thể gửi email thông báo hủy rút tiền cho user {}: {}", user.getId(), e.getMessage());
        }

        return WithdrawalResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WithdrawalResponse> getMyWithdrawals(UUID accountId, Pageable pageable) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin người dùng"));

        return withdrawalRequestRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(WithdrawalResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WithdrawalResponse> adminGetWithdrawals(WithdrawalStatus status, Pageable pageable) {
        if (status != null) {
            return withdrawalRequestRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                    .map(WithdrawalResponse::from);
        }
        return withdrawalRequestRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(WithdrawalResponse::from);
    }

    @Override
    @Transactional
    public WithdrawalResponse adminApproveWithdrawal(UUID adminAccountId, UUID withdrawalId, AdminReviewWithdrawalRequest request) {
        WithdrawalRequest withdrawal = withdrawalRequestRepository.findById(withdrawalId)
                .orElseThrow(() -> new CustomException("Không tìm thấy yêu cầu rút tiền"));

        if (withdrawal.getStatus() != WithdrawalStatus.PENDING) {
            throw new CustomException("Yêu cầu rút tiền không ở trạng thái chờ duyệt (PENDING)");
        }

        User user = withdrawal.getUser();
        Wallet wallet = walletRepo.findByUserIdForUpdate(user.getId())
                .orElseThrow(() -> new CustomException("Không tìm thấy ví người dùng"));

        BigDecimal amount = withdrawal.getAmount();
        if (wallet.getLockedBalance().compareTo(amount) < 0) {
            wallet.setLockedBalance(amount);
        }
        wallet.subLocked(amount);
        walletRepo.save(wallet);

        withdrawal.setStatus(WithdrawalStatus.APPROVED);
        withdrawal.setReviewedBy(adminAccountId);
        withdrawal.setReviewedAt(LocalDateTime.now());
        if (request != null && request.getNote() != null && !request.getNote().isBlank()) {
            withdrawal.setAdminNote(request.getNote().trim());
        } else {
            withdrawal.setAdminNote("Đã chuyển khoản thành công");
        }
        WithdrawalRequest saved = withdrawalRequestRepository.save(withdrawal);

        // Cập nhật transaction status SUCCESS
        txRepo.findByReferenceTypeAndReferenceId(ReferenceType.WITHDRAWAL, withdrawal.getId())
                .stream()
                .filter(tx -> tx.getType() == TransactionType.WITHDRAWAL && tx.getStatus() == TransactionStatus.PENDING)
                .forEach(tx -> {
                    tx.setStatus(TransactionStatus.SUCCESS);
                    if (request != null && request.getBankTxNo() != null && !request.getBankTxNo().isBlank()) {
                        tx.setProviderTxnNo(request.getBankTxNo().trim());
                    }
                    txRepo.save(tx);
                });

        // Gửi notification in-app
        try {
            Notification notif = Notification.builder()
                    .eventId("WITHDRAWAL_APPROVED_" + UUID.randomUUID())
                    .user(user)
                    .type(NotificationType.SYSTEM)
                    .channel(NotificationChannelType.IN_APP)
                    .status(NotificationStatus.SENT)
                    .title("Yêu cầu rút tiền đã được xử lý thành công")
                    .content("Lệnh rút " + formatVND(amount) + " về tài khoản " + withdrawal.getBankName() + " (" + withdrawal.getBankAccountNumber() + ") đã được chuyển khoản thành công.")
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notif);
        } catch (Exception e) {
            log.warn("Không thể gửi thông báo in-app cho user {}: {}", user.getId(), e.getMessage());
        }

        // Gửi email thông báo chuyển tiền thành công qua SMTP
        try {
            String recipientEmail = user.getEmail() != null ? user.getEmail() : (user.getAccount() != null ? user.getAccount().getEmail() : null);
            String note = request != null && request.getBankTxNo() != null ? "Mã giao dịch ngân hàng: " + request.getBankTxNo() : withdrawal.getAdminNote();
            emailService.sendWithdrawalEmail(recipientEmail, user.getFullName(), amount, withdrawal.getBankName(), withdrawal.getBankAccountNumber(), withdrawal.getTxRef(), "APPROVED", note);
        } catch (Exception e) {
            log.warn("Không thể gửi email duyệt rút tiền cho user {}: {}", user.getId(), e.getMessage());
        }

        return WithdrawalResponse.from(saved);
    }

    @Override
    @Transactional
    public WithdrawalResponse adminRejectWithdrawal(UUID adminAccountId, UUID withdrawalId, AdminReviewWithdrawalRequest request) {
        WithdrawalRequest withdrawal = withdrawalRequestRepository.findById(withdrawalId)
                .orElseThrow(() -> new CustomException("Không tìm thấy yêu cầu rút tiền"));

        if (withdrawal.getStatus() != WithdrawalStatus.PENDING) {
            throw new CustomException("Yêu cầu rút tiền không ở trạng thái chờ duyệt (PENDING)");
        }

        String reason = (request != null && request.getNote() != null && !request.getNote().isBlank())
                ? request.getNote().trim() : "Thông tin tài khoản ngân hàng không hợp lệ hoặc không đối soát được";

        User user = withdrawal.getUser();
        Wallet wallet = walletRepo.findByUserIdForUpdate(user.getId())
                .orElseThrow(() -> new CustomException("Không tìm thấy ví người dùng"));

        BigDecimal amount = withdrawal.getAmount();
        wallet.subLocked(amount);
        wallet.addAvailable(amount);
        walletRepo.save(wallet);

        withdrawal.setStatus(WithdrawalStatus.REJECTED);
        withdrawal.setReviewedBy(adminAccountId);
        withdrawal.setReviewedAt(LocalDateTime.now());
        withdrawal.setAdminNote(reason);
        WithdrawalRequest saved = withdrawalRequestRepository.save(withdrawal);

        // Cập nhật transaction status FAILED
        txRepo.findByReferenceTypeAndReferenceId(ReferenceType.WITHDRAWAL, withdrawal.getId())
                .stream()
                .filter(tx -> tx.getType() == TransactionType.WITHDRAWAL && tx.getStatus() == TransactionStatus.PENDING)
                .forEach(tx -> {
                    tx.setStatus(TransactionStatus.FAILED);
                    tx.setNote(tx.getNote() + " (Từ chối: " + reason + ")");
                    txRepo.save(tx);
                });

        // Gửi notification in-app
        try {
            Notification notif = Notification.builder()
                    .eventId("WITHDRAWAL_REJECTED_" + UUID.randomUUID())
                    .user(user)
                    .type(NotificationType.SYSTEM)
                    .channel(NotificationChannelType.IN_APP)
                    .status(NotificationStatus.SENT)
                    .title("Yêu cầu rút tiền bị từ chối")
                    .content("Lệnh rút " + formatVND(amount) + " đã bị từ chối. Lý do: " + reason + ". Số tiền đã được hoàn lại vào số dư khả dụng.")
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notif);
        } catch (Exception e) {
            log.warn("Không thể gửi thông báo in-app từ chối rút tiền cho user {}: {}", user.getId(), e.getMessage());
        }

        // Gửi email thông báo từ chối rút tiền qua SMTP
        try {
            String recipientEmail = user.getEmail() != null ? user.getEmail() : (user.getAccount() != null ? user.getAccount().getEmail() : null);
            emailService.sendWithdrawalEmail(recipientEmail, user.getFullName(), amount, withdrawal.getBankName(), withdrawal.getBankAccountNumber(), withdrawal.getTxRef(), "REJECTED", reason);
        } catch (Exception e) {
            log.warn("Không thể gửi email từ chối rút tiền cho user {}: {}", user.getId(), e.getMessage());
        }

        return WithdrawalResponse.from(saved);
    }

    private String formatVND(BigDecimal amount) {
        if (amount == null) return "0 ₫";
        NumberFormat nf = NumberFormat.getInstance(Locale.of("vi", "VN"));
        return nf.format(amount) + " ₫";
    }
}
