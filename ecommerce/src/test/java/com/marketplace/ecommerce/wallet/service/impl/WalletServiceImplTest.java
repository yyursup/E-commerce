package com.marketplace.ecommerce.wallet.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.entity.Payment;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.repository.TransactionRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.wallet.dto.response.WalletResponse;
import com.marketplace.ecommerce.wallet.entity.Wallet;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import com.marketplace.ecommerce.wallet.valueObjects.WalletType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WalletServiceImplTest {

    @Mock
    private WalletRepository walletRepo;
    @Mock
    private EscrowRepository escrowRepo;
    @Mock
    private TransactionRepository txRepo;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private WalletServiceImpl walletService;

    private UUID accountId;
    private User user;
    private Wallet wallet;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        user = new User();
        user.setId(UUID.randomUUID());
        
        wallet = new Wallet();
        wallet.setId(UUID.randomUUID());
        wallet.setUser(user);
        wallet.setAvailableBalance(BigDecimal.valueOf(1000));
        wallet.setLockedBalance(BigDecimal.ZERO);
    }

    @Test
    void getWallet_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(walletRepo.findByUserId(user.getId())).thenReturn(Optional.of(wallet));

        WalletResponse response = walletService.getWallet(accountId);

        assertNotNull(response);
        assertEquals(BigDecimal.valueOf(1000), response.getAvailableBalance());
    }

    @Test
    void getWallet_UserNotFound() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> walletService.getWallet(accountId));
    }

    @Test
    void recordPaymentAndHoldEscrow_Success() {
        Payment payment = new Payment();
        payment.setId(UUID.randomUUID());
        payment.setAmount(BigDecimal.valueOf(500));
        
        Order order = new Order();
        order.setId(UUID.randomUUID());
        order.setUser(user);
        
        User sellerUser = new User();
        sellerUser.setId(UUID.randomUUID());
        Shop shop = new Shop();
        shop.setUser(sellerUser);
        order.setShop(shop);
        payment.setOrder(order);

        Wallet sellerWallet = new Wallet();
        Wallet escrowWallet = new Wallet();
        escrowWallet.setLockedBalance(BigDecimal.ZERO);

        when(walletRepo.findByUserIdForUpdate(user.getId())).thenReturn(Optional.of(wallet));
        when(walletRepo.findByUserIdForUpdate(sellerUser.getId())).thenReturn(Optional.of(sellerWallet));
        when(walletRepo.findSystemWalletForUpdate(WalletType.ESCROW)).thenReturn(Optional.of(escrowWallet));
        when(escrowRepo.findByOrderId(order.getId())).thenReturn(Optional.empty());
        when(txRepo.existsByDedupeKey(anyString())).thenReturn(false);

        walletService.recordPaymentAndHoldEscrow(payment);

        verify(txRepo, times(2)).save(any());
        verify(walletRepo, times(2)).save(any());
        assertEquals(BigDecimal.valueOf(1000), wallet.getAvailableBalance()); // After add 500 and sub 500
        assertEquals(BigDecimal.valueOf(500), escrowWallet.getLockedBalance());
    }
}
