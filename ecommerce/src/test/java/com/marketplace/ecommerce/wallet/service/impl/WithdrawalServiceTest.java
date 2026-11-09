package com.marketplace.ecommerce.wallet.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.service.EmailService;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.notification.entity.Notification;
import com.marketplace.ecommerce.notification.repository.NotificationRepository;
import com.marketplace.ecommerce.payment.entity.Transaction;
import com.marketplace.ecommerce.payment.repository.TransactionRepository;
import com.marketplace.ecommerce.payment.valueObjects.ReferenceType;
import com.marketplace.ecommerce.payment.valueObjects.TransactionStatus;
import com.marketplace.ecommerce.payment.valueObjects.TransactionType;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.wallet.dto.request.AdminReviewWithdrawalRequest;
import com.marketplace.ecommerce.wallet.dto.request.BankInfoRequest;
import com.marketplace.ecommerce.wallet.dto.request.CreateWithdrawalRequest;
import com.marketplace.ecommerce.wallet.dto.response.WithdrawalResponse;
import com.marketplace.ecommerce.wallet.entity.Wallet;
import com.marketplace.ecommerce.wallet.entity.WithdrawalRequest;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import com.marketplace.ecommerce.wallet.repository.WithdrawalRequestRepository;
import com.marketplace.ecommerce.wallet.valueObjects.WalletType;
import com.marketplace.ecommerce.wallet.valueObjects.WithdrawalStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Wallet Withdrawal Service Unit Tests")
class WithdrawalServiceTest {

    @Mock
    private WalletRepository walletRepo;
    @Mock
    private TransactionRepository txRepo;
    @Mock
    private UserRepository userRepository;
    @Mock
    private WithdrawalRequestRepository withdrawalRequestRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private ShopRepository shopRepository;

    @InjectMocks
    private WalletServiceImpl walletService;

    private UUID accountId;
    private UUID userId;
    private User user;
    private Wallet wallet;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        userId = UUID.randomUUID();

        Account account = Account.builder()
                .id(accountId)
                .email("testuser@gmail.com")
                .username("testuser")
                .build();

        user = User.builder()
                .id(userId)
                .account(account)
                .fullName("Nguyen Van A")
                .email("testuser@gmail.com")
                .bankName("Vietcombank (VCB)")
                .bankAccountNumber("1234567890")
                .bankAccountName("NGUYEN VAN A")
                .build();

        wallet = Wallet.builder()
                .id(UUID.randomUUID())
                .user(user)
                .walletType(WalletType.USER)
                .availableBalance(new BigDecimal("500000"))
                .lockedBalance(BigDecimal.ZERO)
                .build();
    }

    @Test
    @DisplayName("Cập nhật thông tin ngân hàng thành công")
    void testUpdateBankInfo_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));

        BankInfoRequest req = BankInfoRequest.builder()
                .bankName("MB Bank (MB)")
                .bankAccountNumber("9876543210")
                .bankAccountName("NGUYEN VAN A")
                .build();

        walletService.updateBankInfo(accountId, req);

        assertEquals("MB Bank (MB)", user.getBankName());
        assertEquals("9876543210", user.getBankAccountNumber());
        assertEquals("NGUYEN VAN A", user.getBankAccountName());
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("Rút tiền: Validate số tiền rút tối thiểu 100.000 VNĐ")
    void testRequestWithdrawal_MinimumAmountValidation() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));

        CreateWithdrawalRequest req = CreateWithdrawalRequest.builder()
                .amount(new BigDecimal("50000")) // Nhỏ hơn 100k
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> walletService.requestWithdrawal(accountId, req));
        assertTrue(ex.getMessage().contains("100.000 VNĐ"));
    }

    @Test
    @DisplayName("Rút tiền: Lỗi khi số dư khả dụng không đủ")
    void testRequestWithdrawal_InsufficientBalance() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(walletRepo.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet));

        CreateWithdrawalRequest req = CreateWithdrawalRequest.builder()
                .amount(new BigDecimal("1000000")) // Hiện chỉ có 500k
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> walletService.requestWithdrawal(accountId, req));
        assertTrue(ex.getMessage().contains("Số dư khả dụng trong ví không đủ"));
    }

    @Test
    @DisplayName("Rút tiền: Thành công - Khóa số dư, lưu WithdrawalRequest, ghi Transaction, gửi email SMTP")
    void testRequestWithdrawal_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(walletRepo.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet));
        when(txRepo.existsByDedupeKey(anyString())).thenReturn(false);
        when(withdrawalRequestRepository.save(any(WithdrawalRequest.class))).thenAnswer(i -> {
            WithdrawalRequest w = i.getArgument(0);
            w.setId(UUID.randomUUID());
            return w;
        });

        CreateWithdrawalRequest req = CreateWithdrawalRequest.builder()
                .amount(new BigDecimal("200000"))
                .note("Rút tiền về tài khoản tiêu dùng")
                .build();

        WithdrawalResponse res = walletService.requestWithdrawal(accountId, req);

        assertNotNull(res);
        assertEquals(new BigDecimal("200000"), res.getAmount());
        assertEquals(WithdrawalStatus.PENDING, res.getStatus());
        assertEquals("Vietcombank (VCB)", res.getBankName());

        // Kiểm tra biến động số dư: Trừ 200k available, tăng 200k locked
        assertEquals(new BigDecimal("300000"), wallet.getAvailableBalance());
        assertEquals(new BigDecimal("200000"), wallet.getLockedBalance());
        verify(walletRepo).save(wallet);

        // Kiểm tra lưu Transaction WITHDRAWAL PENDING
        verify(txRepo).save(any(Transaction.class));

        // Kiểm tra gửi email thông báo qua SMTP
        verify(emailService).sendWithdrawalEmail(eq("testuser@gmail.com"), eq("Nguyen Van A"),
                eq(new BigDecimal("200000")), eq("Vietcombank (VCB)"), eq("1234567890"),
                anyString(), eq("PENDING"), eq("Rút tiền về tài khoản tiêu dùng"));
    }

    @Test
    @DisplayName("Hủy lệnh rút tiền: Thành công - Hoàn lại số dư khả dụng, gửi email SMTP")
    void testCancelWithdrawal_Success() {
        UUID withdrawalId = UUID.randomUUID();
        wallet.setAvailableBalance(new BigDecimal("300000"));
        wallet.setLockedBalance(new BigDecimal("200000"));

        WithdrawalRequest withdrawal = WithdrawalRequest.builder()
                .id(withdrawalId)
                .user(user)
                .wallet(wallet)
                .amount(new BigDecimal("200000"))
                .status(WithdrawalStatus.PENDING)
                .txRef("WD-20261109-12345678")
                .bankName("Vietcombank (VCB)")
                .bankAccountNumber("1234567890")
                .build();

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(withdrawalRequestRepository.findById(withdrawalId)).thenReturn(Optional.of(withdrawal));
        when(walletRepo.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet));
        when(withdrawalRequestRepository.save(any(WithdrawalRequest.class))).thenAnswer(i -> i.getArgument(0));

        WithdrawalResponse res = walletService.cancelWithdrawal(accountId, withdrawalId);

        assertEquals(WithdrawalStatus.CANCELLED, res.getStatus());
        // Số dư được hoàn lại: available = 500k, locked = 0
        assertEquals(new BigDecimal("500000"), wallet.getAvailableBalance());
        assertEquals(BigDecimal.ZERO, wallet.getLockedBalance());
        verify(walletRepo).save(wallet);

        // Kiểm tra gửi email thông báo hủy
        verify(emailService).sendWithdrawalEmail(eq("testuser@gmail.com"), eq("Nguyen Van A"),
                eq(new BigDecimal("200000")), any(), any(), eq("WD-20261109-12345678"), eq("CANCELLED"), anyString());
    }

    @Test
    @DisplayName("Admin phê duyệt rút tiền: Thành công - Trừ lockedBalance, gửi in-app notification & email SMTP")
    void testAdminApproveWithdrawal_Success() {
        UUID adminAccountId = UUID.randomUUID();
        UUID withdrawalId = UUID.randomUUID();
        wallet.setAvailableBalance(new BigDecimal("300000"));
        wallet.setLockedBalance(new BigDecimal("200000"));

        WithdrawalRequest withdrawal = WithdrawalRequest.builder()
                .id(withdrawalId)
                .user(user)
                .wallet(wallet)
                .amount(new BigDecimal("200000"))
                .status(WithdrawalStatus.PENDING)
                .txRef("WD-20261109-12345678")
                .bankName("Vietcombank (VCB)")
                .bankAccountNumber("1234567890")
                .build();

        Transaction tx = Transaction.builder()
                .id(UUID.randomUUID())
                .type(TransactionType.WITHDRAWAL)
                .status(TransactionStatus.PENDING)
                .referenceType(ReferenceType.WITHDRAWAL)
                .referenceId(withdrawalId)
                .build();

        when(withdrawalRequestRepository.findById(withdrawalId)).thenReturn(Optional.of(withdrawal));
        when(walletRepo.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet));
        when(withdrawalRequestRepository.save(any(WithdrawalRequest.class))).thenAnswer(i -> i.getArgument(0));
        when(txRepo.findByReferenceTypeAndReferenceId(ReferenceType.WITHDRAWAL, withdrawalId))
                .thenReturn(List.of(tx));

        AdminReviewWithdrawalRequest reviewReq = AdminReviewWithdrawalRequest.builder()
                .bankTxNo("FT261109887766")
                .note("Đã chuyển khoản qua Napas247")
                .build();

        WithdrawalResponse res = walletService.adminApproveWithdrawal(adminAccountId, withdrawalId, reviewReq);

        assertEquals(WithdrawalStatus.APPROVED, res.getStatus());
        assertEquals("Đã chuyển khoản qua Napas247", res.getAdminNote());
        assertEquals(adminAccountId, res.getReviewedBy());

        // Số dư locked bị trừ
        assertEquals(BigDecimal.ZERO, wallet.getLockedBalance());
        verify(walletRepo).save(wallet);

        // Transaction cập nhật SUCCESS
        assertEquals(TransactionStatus.SUCCESS, tx.getStatus());
        assertEquals("FT261109887766", tx.getProviderTxnNo());
        verify(txRepo).save(tx);

        // Gửi In-app notification & Email
        verify(notificationRepository).save(any(Notification.class));
        verify(emailService).sendWithdrawalEmail(eq("testuser@gmail.com"), eq("Nguyen Van A"),
                eq(new BigDecimal("200000")), any(), any(), eq("WD-20261109-12345678"), eq("APPROVED"), anyString());
    }

    @Test
    @DisplayName("Admin từ chối rút tiền: Hoàn lại availableBalance, gửi in-app notification & email SMTP")
    void testAdminRejectWithdrawal_Success() {
        UUID adminAccountId = UUID.randomUUID();
        UUID withdrawalId = UUID.randomUUID();
        wallet.setAvailableBalance(new BigDecimal("300000"));
        wallet.setLockedBalance(new BigDecimal("200000"));

        WithdrawalRequest withdrawal = WithdrawalRequest.builder()
                .id(withdrawalId)
                .user(user)
                .wallet(wallet)
                .amount(new BigDecimal("200000"))
                .status(WithdrawalStatus.PENDING)
                .txRef("WD-20261109-12345678")
                .bankName("Vietcombank (VCB)")
                .bankAccountNumber("1234567890")
                .build();

        Transaction tx = Transaction.builder()
                .id(UUID.randomUUID())
                .type(TransactionType.WITHDRAWAL)
                .status(TransactionStatus.PENDING)
                .referenceType(ReferenceType.WITHDRAWAL)
                .referenceId(withdrawalId)
                .build();

        when(withdrawalRequestRepository.findById(withdrawalId)).thenReturn(Optional.of(withdrawal));
        when(walletRepo.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet));
        when(withdrawalRequestRepository.save(any(WithdrawalRequest.class))).thenAnswer(i -> i.getArgument(0));
        when(txRepo.findByReferenceTypeAndReferenceId(ReferenceType.WITHDRAWAL, withdrawalId))
                .thenReturn(List.of(tx));

        AdminReviewWithdrawalRequest reviewReq = AdminReviewWithdrawalRequest.builder()
                .note("Số tài khoản không chính xác, ngân hàng báo tài khoản đóng")
                .build();

        WithdrawalResponse res = walletService.adminRejectWithdrawal(adminAccountId, withdrawalId, reviewReq);

        assertEquals(WithdrawalStatus.REJECTED, res.getStatus());
        assertEquals("Số tài khoản không chính xác, ngân hàng báo tài khoản đóng", res.getAdminNote());

        // Số dư locked được hoàn về available
        assertEquals(new BigDecimal("500000"), wallet.getAvailableBalance());
        assertEquals(BigDecimal.ZERO, wallet.getLockedBalance());
        verify(walletRepo).save(wallet);

        // Transaction cập nhật FAILED
        assertEquals(TransactionStatus.FAILED, tx.getStatus());
        verify(txRepo).save(tx);

        // Gửi In-app notification & Email
        verify(notificationRepository).save(any(Notification.class));
        verify(emailService).sendWithdrawalEmail(eq("testuser@gmail.com"), eq("Nguyen Van A"),
                eq(new BigDecimal("200000")), any(), any(), eq("WD-20261109-12345678"), eq("REJECTED"),
                eq("Số tài khoản không chính xác, ngân hàng báo tài khoản đóng"));
    }

    @Test
    @DisplayName("Lấy danh sách rút tiền cá nhân và danh sách quản trị")
    void testGetWithdrawals() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        WithdrawalRequest w = WithdrawalRequest.builder().id(UUID.randomUUID()).user(user).amount(new BigDecimal("100000")).build();
        Page<WithdrawalRequest> page = new PageImpl<>(List.of(w));

        when(withdrawalRequestRepository.findByUserIdOrderByCreatedAtDesc(eq(userId), any())).thenReturn(page);
        Page<WithdrawalResponse> myWithdrawals = walletService.getMyWithdrawals(accountId, PageRequest.of(0, 10));
        assertEquals(1, myWithdrawals.getTotalElements());

        when(withdrawalRequestRepository.findAllByOrderByCreatedAtDesc(any())).thenReturn(page);
        Page<WithdrawalResponse> adminAll = walletService.adminGetWithdrawals(null, PageRequest.of(0, 10));
        assertEquals(1, adminAll.getTotalElements());

        when(withdrawalRequestRepository.findByStatusOrderByCreatedAtDesc(eq(WithdrawalStatus.PENDING), any())).thenReturn(page);
        Page<WithdrawalResponse> adminPending = walletService.adminGetWithdrawals(WithdrawalStatus.PENDING, PageRequest.of(0, 10));
        assertEquals(1, adminPending.getTotalElements());
    }
}

