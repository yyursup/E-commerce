package com.marketplace.ecommerce.config.seed;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.wallet.entity.Wallet;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import com.marketplace.ecommerce.wallet.valueObjects.WalletType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WalletSeeder {

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;

    public void seed() {
        log.info("Seeding user wallets and platform escrow holding wallet...");

        List<User> allUsers = userRepository.findAll();

        for (User user : allUsers) {
            if (user.getAccount() == null) continue;

            String roleName = user.getAccount().getRole() != null ? user.getAccount().getRole().getRoleName() : "";

            if ("ADMIN".equalsIgnoreCase(roleName)) {
                initializeAdminEscrowWallet(user);
            } else {
                initializeUserWallet(user);
            }
        }

        log.info("Wallets seeded successfully.");
    }

    private Wallet initializeUserWallet(User user) {
        return walletRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    LocalDateTime now = LocalDateTime.now();
                    Wallet w = Wallet.builder()
                            .user(user)
                            .currency("VND")
                            .availableBalance(BigDecimal.valueOf(1000000))
                            .lockedBalance(BigDecimal.ZERO)
                            .walletType(WalletType.USER)
                            .createdAt(now)
                            .build();

                    w.setCreatedAt(now);
                    w.setUpdatedAt(now);

                    Wallet saved = walletRepository.save(w);
                    log.info("Created USER wallet for user: {}", user.getFullName());
                    return saved;
                });
    }

    private Wallet initializeAdminEscrowWallet(User user) {
        return walletRepository.findByUserId(user.getId())
                .map(existing -> {
                    if (existing.getWalletType() != WalletType.ESCROW) {
                        existing.setWalletType(WalletType.ESCROW);
                        return walletRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    LocalDateTime now = LocalDateTime.now();
                    Wallet w = Wallet.builder()
                            .user(user)
                            .currency("VND")
                            .availableBalance(BigDecimal.ZERO)
                            .lockedBalance(BigDecimal.ZERO)
                            .walletType(WalletType.ESCROW)
                            .createdAt(now)
                            .build();

                    w.setCreatedAt(now);
                    w.setUpdatedAt(now);

                    Wallet saved = walletRepository.save(w);
                    log.info("Created ESCROW wallet for admin: {}", user.getFullName());
                    return saved;
                });
    }
}
