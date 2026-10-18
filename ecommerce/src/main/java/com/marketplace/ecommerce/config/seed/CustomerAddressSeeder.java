package com.marketplace.ecommerce.config.seed;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.entity.UserAddress;
import com.marketplace.ecommerce.auth.repository.UserAddressRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class CustomerAddressSeeder {

    private final UserAddressRepository userAddressRepository;
    private final UserRepository userRepository;

    public void seed() {
        log.info("Seeding realistic shipping addresses for customers...");

        Map<String, User> userMap = userRepository.findAll().stream()
                .filter(u -> u.getAccount() != null)
                .collect(Collectors.toMap(u -> u.getAccount().getUsername(), Function.identity()));

        User customer1 = userMap.get("customer1");
        User customer2 = userMap.get("customer2");
        User customer3 = userMap.get("customer3");
        User customer4 = userMap.get("customer4");
        User customer5 = userMap.get("customer5");

        if (customer1 != null) {
            initializeUserAddress(customer1, "Lê Văn Mua Hàng", "0901234567",
                    "123 Đường Nguyễn Huệ, Phường Bến Nghé", "Hồ Chí Minh", "Quận 1", "Phường Bến Nghé",
                    1442, "21012", true);
        }

        if (customer2 != null) {
            initializeUserAddress(customer2, "Phạm Thị Mua Sắm", "0909876543",
                    "456 Đường Lê Lợi, Phường Bến Thành", "Hồ Chí Minh", "Quận 1", "Phường Bến Thành",
                    1442, "21012", true);
        }

        if (customer3 != null) {
            initializeUserAddress(customer3, "Nguyễn Văn An", "0905555555",
                    "789 Đường Điện Biên Phủ, Phường 15", "Hồ Chí Minh", "Bình Thạnh", "Phường 15",
                    1450, "21013", true);
        }

        if (customer4 != null) {
            initializeUserAddress(customer4, "Đỗ Thùy Trang", "0906666666",
                    "22 Phố Bà Triệu, Phường Tràng Tiền", "Hà Nội", "Hoàn Kiếm", "Phường Tràng Tiền",
                    1489, "1A0218", true);
        }

        if (customer5 != null) {
            initializeUserAddress(customer5, "Bùi Minh Quân", "0907777777",
                    "101 Đường Nguyễn Văn Linh, Phường Nam Dương", "Đà Nẵng", "Hải Châu", "Phường Nam Dương",
                    1530, "40102", true);
        }

        log.info("Customer shipping addresses seeded successfully.");
    }

    private UserAddress initializeUserAddress(User user, String receiverName, String receiverPhone,
            String addressLine, String city, String district, String ward,
            Integer districtId, String wardCode, Boolean isDefault) {

        var existingAddresses = userAddressRepository
                .findAllByUserIdAndDeletedFalseOrderByIsDefaultDescIdDesc(user.getId());
        var existing = existingAddresses.stream()
                .filter(addr -> addr.getAddressLine().equals(addressLine)
                        && !Boolean.TRUE.equals(addr.getDeleted()))
                .findFirst();

        if (existing.isPresent()) {
            return existing.get();
        }

        if (isDefault && !existingAddresses.isEmpty()) {
            existingAddresses.stream()
                    .filter(addr -> addr.getIsDefault() != null && addr.getIsDefault())
                    .forEach(addr -> {
                        addr.setIsDefault(false);
                        userAddressRepository.save(addr);
                    });
        }

        UserAddress address = new UserAddress();
        address.setUser(user);
        address.setReceiverName(receiverName);
        address.setReceiverPhone(receiverPhone);
        address.setAddressLine(addressLine);
        address.setCity(city);
        address.setDistrict(district);
        address.setWard(ward);
        address.setDistrictId(districtId);
        address.setWardCode(wardCode);
        address.setIsDefault(isDefault);
        address.setDeleted(false);

        UserAddress saved = userAddressRepository.save(address);
        log.info("Created user address for user: {}", user.getFullName());
        return saved;
    }
}
