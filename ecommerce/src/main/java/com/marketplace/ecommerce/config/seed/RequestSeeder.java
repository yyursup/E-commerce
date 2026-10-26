package com.marketplace.ecommerce.config.seed;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.repository.SellerRepository;
import com.marketplace.ecommerce.request.valueObjects.BusinessType;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.SellerType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class RequestSeeder {

    private static final int TARGET_REQUEST_COUNT = 3;

    private final RequestRepository requestRepository;
    private final SellerRepository sellerRepository;
    private final AccountRepository accountRepository;

    public void seed() {
        log.info("Seeding seller onboarding requests...");

        long existingRequestCount = requestRepository.count();
        if (existingRequestCount >= TARGET_REQUEST_COUNT) {
            log.debug("Skip seed requests: already {} requests", existingRequestCount);
            return;
        }

        Account adminAccount = accountRepository.findByUsername("admin").orElse(null);
        Account customerAccount1 = accountRepository.findByUsername("customer1").orElse(null);
        Account customerAccount2 = accountRepository.findByUsername("customer2").orElse(null);
        Account customerAccount3 = accountRepository.findByUsername("customer3").orElse(null);

        if (customerAccount1 != null) {
            Request req1 = initializeRequest(
                    customerAccount1,
                    RequestType.SELLER_REGISTRATION,
                    RequestStatus.REJECTED,
                    "Đăng ký mở gian hàng linh kiện PC & Gaming Gear nhập khẩu",
                    adminAccount,
                    LocalDateTime.now().minusDays(5),
                    "Từ chối: Giấy phép kinh doanh thiết bị CNTT chưa chứng thực và thông tin MST doanh nghiệp không khớp trên cổng Thuế.");
            initializeSellerDetail(req1, customerAccount1, SellerType.BUSINESS, BusinessType.ENTERPRISE,
                    "Công Ty TNHH Công Nghệ GearTech Việt Nam",
                    "123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
                    "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c",
                    "GearTech PC Official", "0901234567", "customer1@gmail.com",
                    "123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
                    "123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
                    "0319881122", "geartech.corp@gmail.com",
                    "Vietcombank", "0071008899001", "CONG TY TNHH CONG NGHE GEARTECH");
        }

        if (customerAccount2 != null) {
            Request req2 = initializeRequest(
                    customerAccount2,
                    RequestType.SELLER_REGISTRATION,
                    RequestStatus.PENDING,
                    "Đăng ký mở gian hàng thiết bị âm thanh Hi-Res & Studio Audio chính hãng",
                    null,
                    null,
                    null);
            initializeSellerDetail(req2, customerAccount2, SellerType.BUSINESS, BusinessType.HOUSEHOLD,
                    "Hộ Kinh Doanh Âm Thanh Số AudioTech",
                    "456 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM",
                    "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c",
                    "AudioTech Sound Studio", "0909876543", "customer2@gmail.com",
                    "456 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM",
                    "456 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM",
                    "0319887766", "audiotech@gmail.com",
                    "Techcombank", "190333222111", "PHAM THI MUA SAM");
        }

        if (customerAccount3 != null) {
            Request req3 = initializeRequest(
                    customerAccount3,
                    RequestType.SELLER_REGISTRATION,
                    RequestStatus.REJECTED,
                    "Đăng ký kinh doanh thiết bị bay không người lái (Flycam/Drone) và thiết bị thu phát vô tuyến",
                    adminAccount,
                    LocalDateTime.now().minusDays(10),
                    "Từ chối: Mặt hàng thiết bị bay flycam và phát sóng vô tuyến yêu cầu chứng nhận hợp quy ICT/CR của Cục Viễn Thông (Bộ TT&TT) và giấy phép kiểm soát bay theo quy định an ninh hàng không.");
            initializeSellerDetail(req3, customerAccount3, SellerType.INDIVIDUAL, null, null, null, null,
                    "Flycam Drone Pro Store", "0905555555", "customer3@gmail.com",
                    "789 Đường Điện Biên Phủ, Phường 15, Bình Thạnh, TP.HCM",
                    "789 Đường Điện Biên Phủ, Phường 15, Bình Thạnh, TP.HCM",
                    "8999888777", "customer3@gmail.com",
                    "VPBank", "999888777666", "NGUYEN VAN AN");
        }

        log.info("Requests seeded successfully.");
    }

    private Request initializeRequest(Account account, RequestType type, RequestStatus status,
                                      String description, Account reviewedBy, LocalDateTime reviewedAt, String response) {
        boolean alreadyExists = requestRepository.count() > 0 && requestRepository.findAll().stream()
                .anyMatch(r -> r.getAccount() != null
                        && r.getAccount().getId().equals(account.getId())
                        && r.getType() == type
                        && r.getStatus() == status);

        if (alreadyExists) {
            return requestRepository.findAll().stream()
                    .filter(r -> r.getAccount() != null
                            && r.getAccount().getId().equals(account.getId())
                            && r.getType() == type
                            && r.getStatus() == status)
                    .findFirst()
                    .orElseThrow();
        }

        LocalDateTime createdAt = reviewedAt != null ? reviewedAt.minusDays(2)
                : LocalDateTime.now().minusDays(1);
        LocalDateTime updatedAt = reviewedAt != null ? reviewedAt : createdAt;

        Request request = Request.builder()
                .account(account)
                .type(type)
                .status(status)
                .description(description)
                .response(response)
                .reviewedBy(reviewedBy)
                .reviewedAt(reviewedAt)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();

        Request saved = requestRepository.save(request);
        log.info("Created request: {} with status: {}", type, status);
        return saved;
    }

    private Seller initializeSellerDetail(Request request, Account account,
                                          SellerType sellerType, BusinessType businessType,
                                          String businessName, String businessAddress, String businessLicenseUrl,
                                          String shopName, String shopPhone, String shopEmail,
                                          String pickupAddress, String returnAddress,
                                          String taxCode, String invoiceEmail,
                                          String bankName, String bankAccountNumber, String bankAccountName) {
        if (request == null)
            return null;
        Seller existing = sellerRepository.findByRequestId(request.getId());
        if (existing != null) {
            return existing;
        }

        Seller seller = Seller.builder()
                .request(request)
                .sellerType(sellerType)
                .businessType(businessType)
                .businessName(businessName)
                .businessAddress(businessAddress)
                .businessLicenseUrl(businessLicenseUrl)
                .shopName(shopName)
                .shopPhone(shopPhone)
                .shopEmail(shopEmail)
                .address(pickupAddress)
                .pickupAddress(pickupAddress)
                .returnAddress(returnAddress)
                .taxCode(taxCode)
                .invoiceEmail(invoiceEmail)
                .bankName(bankName)
                .bankAccountNumber(bankAccountNumber)
                .bankAccountName(bankAccountName)
                .build();
        Seller saved = sellerRepository.save(seller);
        log.info("Created seller detail for request ID: {}", request.getId());
        return saved;
    }
}
