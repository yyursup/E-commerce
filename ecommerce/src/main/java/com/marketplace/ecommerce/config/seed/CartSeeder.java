package com.marketplace.ecommerce.config.seed;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.cart.entity.Cart;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CartSeeder {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;

    public void seed() {
        log.info("Seeding shopping carts for users...");

        List<User> allUsers = userRepository.findAll();

        for (User user : allUsers) {
            if (user.getAccount() == null) continue;

            String roleName = user.getAccount().getRole() != null ? user.getAccount().getRole().getRoleName() : "";

            // Create carts for CUSTOMERs and seller1 (for test buying)
            if ("CUSTOMER".equalsIgnoreCase(roleName) || "seller1".equalsIgnoreCase(user.getAccount().getUsername())) {
                initializeCart(user);
            }
        }

        log.info("Shopping carts seeded successfully.");
    }

    private Cart initializeCart(User user) {
        return cartRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Cart cart = Cart.builder()
                            .user(user)
                            .items(new HashSet<>())
                            .build();
                    Cart saved = cartRepository.save(cart);
                    log.info("Created cart for user: {}", user.getFullName());
                    return saved;
                });
    }
}
