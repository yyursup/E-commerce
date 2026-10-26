package com.marketplace.ecommerce.config.seed;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.Role;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.RoleRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.GenderType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserSeeder {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public void seed() {
        log.info("Seeding users...");
        
        Map<String, Role> roleMap = roleRepository.findAll().stream()
                .collect(Collectors.toMap(Role::getRoleName, Function.identity()));

        Role customerRole = roleMap.get("CUSTOMER");
        Role businessRole = roleMap.get("BUSINESS");
        Role adminRole = roleMap.get("ADMIN");

        // Admin
        Account adminAccount = initializeAccount("admin", "admin@ecommerce.vn", "0123456789", "admin123@", adminRole);
        initializeUser(adminAccount, "Quản Trị Viên Sàn E-commerce", "admin@ecommerce.vn", "0123456789", 
                LocalDate.of(1990, 1, 1), GenderType.MALE, "123456789012");

        // Sellers
        initializeUser(initializeAccount("seller1", "apple.reseller@gmail.com", "0987654321", "seller123@", businessRole),
                "Nguyễn Thành Đạt (Apple Official)", "apple.reseller@gmail.com", "0987654321",
                LocalDate.of(1988, 5, 15), GenderType.MALE, "987654321012");

        initializeUser(initializeAccount("seller2", "samsung.official@gmail.com", "0987654322", "seller123@", businessRole),
                "Trần Quang Huy (Samsung Experience)", "samsung.official@gmail.com", "0987654322",
                LocalDate.of(1990, 8, 20), GenderType.MALE, "987654321013");

        initializeUser(initializeAccount("seller3", "gearvn.hub@gmail.com", "0987654323", "seller123@", businessRole),
                "Lê Minh Tuấn (GearVN Gaming)", "gearvn.hub@gmail.com", "0987654323",
                LocalDate.of(1989, 11, 12), GenderType.MALE, "987654321014");

        initializeUser(initializeAccount("seller4", "sony.flagship@gmail.com", "0987654324", "seller123@", businessRole),
                "Phạm Gia Long (Sony Official)", "sony.flagship@gmail.com", "0987654324",
                LocalDate.of(1987, 4, 18), GenderType.MALE, "987654321015");

        initializeUser(initializeAccount("seller5", "anker.baseus.vn@gmail.com", "0987654325", "seller123@", businessRole),
                "Ngô Hoàng Bách (Anker & Baseus)", "anker.baseus.vn@gmail.com", "0987654325",
                LocalDate.of(1994, 9, 25), GenderType.MALE, "987654321016");

        initializeUser(initializeAccount("seller6", "xiaomi.ecosystem@gmail.com", "0987654326", "seller123@", businessRole),
                "Vũ Đình Nam (Xiaomi Official)", "xiaomi.ecosystem@gmail.com", "0987654326",
                LocalDate.of(1991, 2, 10), GenderType.MALE, "987654321017");

        // Customers
        initializeUser(initializeAccount("customer1", "customer1@gmail.com", "0901234567", "customer123@", customerRole),
                "Lê Văn Mua Hàng", "customer1@gmail.com", "0901234567",
                LocalDate.of(1995, 3, 10), GenderType.MALE, "223344556677");

        initializeUser(initializeAccount("customer2", "customer2@gmail.com", "0909876543", "customer123@", customerRole),
                "Phạm Thị Mua Sắm", "customer2@gmail.com", "0909876543",
                LocalDate.of(1992, 7, 25), GenderType.FEMALE, "334455667788");

        initializeUser(initializeAccount("customer3", "customer3@gmail.com", "0905555555", "customer123@", customerRole),
                "Nguyễn Văn An", "customer3@gmail.com", "0905555555",
                LocalDate.of(1994, 4, 14), GenderType.MALE, "555666777888");

        initializeUser(initializeAccount("customer4", "customer4@gmail.com", "0906666666", "customer123@", customerRole),
                "Đỗ Thùy Trang", "customer4@gmail.com", "0906666666",
                LocalDate.of(1996, 12, 1), GenderType.FEMALE, "888777666555");

        initializeUser(initializeAccount("customer5", "customer5@gmail.com", "0907777777", "customer123@", customerRole),
                "Bùi Minh Quân", "customer5@gmail.com", "0907777777",
                LocalDate.of(1993, 10, 30), GenderType.MALE, "111222333444");

        log.info("Users seeded successfully.");
    }

    private Account initializeAccount(String username, String email, String phone, String password, Role role) {
        return accountRepository.findByUsername(username)
                .orElseGet(() -> {
                    Account account = Account.builder()
                            .username(username)
                            .email(email)
                            .phoneNumber(phone)
                            .passwordHash(passwordEncoder.encode(password))
                            .status(AccountStatus.ACTIVE)
                            .role(role)
                            .isActive(true)
                            .accountVerified(true)
                            .violationCount(0)
                            .disciplineLevel(com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel.NONE)
                            .build();
                    return accountRepository.save(account);
                });
    }

    private User initializeUser(Account account, String fullName, String email, String phone, 
            LocalDate dob, GenderType gender, String citizenId) {
        return userRepository.findByAccountId(account.getId())
                .orElseGet(() -> {
                    User user = User.builder()
                            .account(account)
                            .fullName(fullName)
                            .email(email)
                            .phoneNumber(phone)
                            .dateOfBirth(dob)
                            .gender(gender)
                            .identityCardNumber(citizenId)
                            .build();
                    return userRepository.save(user);
                });
    }

    public List<User> getSellers() {
        Role businessRole = roleRepository.findByRoleName("BUSINESS").orElseThrow();
        return userRepository.findAll().stream()
                .filter(u -> u.getAccount().getRole().equals(businessRole))
                .toList();
    }

    public List<User> getCustomers() {
        Role customerRole = roleRepository.findByRoleName("CUSTOMER").orElseThrow();
        return userRepository.findAll().stream()
                .filter(u -> u.getAccount().getRole().equals(customerRole))
                .toList();
    }
}
