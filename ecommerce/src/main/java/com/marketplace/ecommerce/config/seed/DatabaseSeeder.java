package com.marketplace.ecommerce.config.seed;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final RoleSeeder roleSeeder;
    private final UserSeeder userSeeder;
    private final CategorySeeder categorySeeder;
    private final ShopSeeder shopSeeder;
    private final PlatformSettingSeeder platformSettingSeeder;
    private final WalletSeeder walletSeeder;
    private final CartSeeder cartSeeder;
    private final CustomerAddressSeeder customerAddressSeeder;
    private final ProductSeeder productSeeder;
    private final VoucherSeeder voucherSeeder;
    private final RequestSeeder requestSeeder;
    private final OrderSeeder orderSeeder;
    private final ReviewSeeder reviewSeeder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("=== Starting Database Seeding Process ===");
        try {
            // 1. Foundation: Roles & Users
            roleSeeder.seed();
            userSeeder.seed();

            // 2. Categories & Shops
            categorySeeder.seed();
            shopSeeder.seed();

            // 3. Platform Configuration & Financials
            platformSettingSeeder.seed();
            walletSeeder.seed();

            // 4. User Setup (Carts & Delivery Addresses)
            cartSeeder.seed();
            customerAddressSeeder.seed();

            // 5. Products & Vouchers
            productSeeder.seed();
            voucherSeeder.seed();

            // 6. Requests (Seller Onboarding)
            requestSeeder.seed();

            // 7. Orders & Commissions
            orderSeeder.seed();

            // 8. Reviews, Ratings & Replies
            reviewSeeder.seed();

            log.info("=== Database Seeding Completed Successfully! ===");
        } catch (Exception e) {
            log.error("Database seeding encountered an error: {}", e.getMessage(), e);
        }
    }
}
