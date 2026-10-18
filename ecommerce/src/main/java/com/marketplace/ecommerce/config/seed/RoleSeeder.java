package com.marketplace.ecommerce.config.seed;

import com.marketplace.ecommerce.auth.entity.Role;
import com.marketplace.ecommerce.auth.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RoleSeeder {

    private final RoleRepository roleRepository;

    public Role seed() {
        log.info("Seeding roles...");
        
        Role customerRole = initializeRole("CUSTOMER", "Khách hàng");
        Role businessRole = initializeRole("BUSINESS", "Doanh nghiệp / Người bán");
        Role adminRole = initializeRole("ADMIN", "Quản trị viên sàn");

        log.info("Roles seeded successfully.");
        return adminRole;
    }

    private Role initializeRole(String roleName, String description) {
        return roleRepository.findByRoleName(roleName)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setRoleName(roleName);
                    role.setDescription(description);
                    return roleRepository.save(role);
                });
    }
}
