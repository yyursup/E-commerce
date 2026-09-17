package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.request.dto.request.CreateSendRequest;
import com.marketplace.ecommerce.request.dto.request.RegisterSellerRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.repository.SellerRepository;
import com.marketplace.ecommerce.request.service.RegisterSellerService;
import com.marketplace.ecommerce.request.service.RequestService;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.SellerType;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RegisterSellerServiceImpl implements RegisterSellerService {
    private final SellerRepository sellerRepository;
    private final RequestService requestService;
    private final RequestRepository requestRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;

    @Override
    @Transactional
    public CreateRequestResponse createSellerRegistration(UUID accountId, RegisterSellerRequest request) {

        Account acc = accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomException("Account not found"));

        if (Boolean.FALSE.equals(acc.getAccountVerified())) {
            throw new CustomException("Tài khoản của bạn chưa hoàn tất xác minh danh tính (KYC).");
        }

        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin người dùng cho tài khoản: " + accountId));

        // 1. Kiểm tra tài khoản đã có Shop hay chưa
        if (shopRepository.existsByUserId(user.getId())) {
            throw new CustomException("Tài khoản của bạn đã sở hữu một gian hàng trên hệ thống.");
        }

        // 2. Kiểm tra tài khoản đã có đơn đăng ký PENDING hay chưa
        if (requestRepository.existsByAccountIdAndTypeAndStatus(accountId, RequestType.SELLER_REGISTRATION, RequestStatus.PENDING)) {
            throw new CustomException("Tài khoản của bạn đang có một đơn đăng ký người bán chờ xét duyệt. Vui lòng kiên nhẫn chờ Ban quản trị xử lý.");
        }

        SellerType sellerType = request.getSellerType() != null ? request.getSellerType() : SellerType.INDIVIDUAL;

        // 3. Validate & Check Unique Tên Shop (shopName)
        String shopName = request.getShopName() != null ? request.getShopName().trim() : null;
        if (shopName == null || shopName.isBlank()) {
            throw new CustomException("Tên shop không được để trống");
        }
        if (shopRepository.existsByNameIgnoreCase(shopName)) {
            throw new CustomException("Tên gian hàng \"" + shopName + "\" đã tồn tại trên hệ thống. Vui lòng chọn tên khác.");
        }
        if (sellerRepository.existsPendingByShopNameIgnoreCase(shopName)) {
            throw new CustomException("Tên gian hàng \"" + shopName + "\" đang có một đơn đăng ký khác chờ xét duyệt. Vui lòng chọn tên khác.");
        }

        // 4. Validate & Check Unique Mã số thuế (taxCode)
        String taxCode = request.getTaxCode() != null ? request.getTaxCode().trim() : null;
        if (sellerType == SellerType.BUSINESS) {
            if (request.getBusinessType() == null) {
                throw new CustomException("Vui lòng chọn loại hình kinh doanh (Hộ kinh doanh hoặc Doanh nghiệp)");
            }
            if (request.getBusinessName() == null || request.getBusinessName().isBlank()) {
                throw new CustomException("Tên công ty / Hộ kinh doanh không được để trống");
            }
            if (request.getBusinessAddress() == null || request.getBusinessAddress().isBlank()) {
                throw new CustomException("Địa chỉ trụ sở không được để trống");
            }
            if (taxCode == null || taxCode.isBlank()) {
                throw new CustomException("Mã số thuế doanh nghiệp không được để trống");
            }
            if (request.getBusinessLicenseUrl() == null || request.getBusinessLicenseUrl().isBlank()) {
                throw new CustomException("Vui lòng tải lên ảnh Giấy phép kinh doanh");
            }
        } else {
            // INDIVIDUAL
            if (taxCode == null || taxCode.isBlank()) {
                throw new CustomException("Mã số thuế cá nhân không được để trống");
            }
        }

        if (taxCode != null && !taxCode.isBlank()) {
            if (shopRepository.existsByTaxCode(taxCode)) {
                throw new CustomException("Mã số thuế \"" + taxCode + "\" đã được đăng ký bởi một gian hàng khác.");
            }
            if (sellerRepository.existsPendingByTaxCode(taxCode)) {
                throw new CustomException("Mã số thuế \"" + taxCode + "\" đang có một đơn đăng ký khác chờ xét duyệt.");
            }
        }

        // 5. Validate & Check Unique Số điện thoại Shop (shopPhone)
        String shopPhone = request.getShopPhone() != null ? request.getShopPhone().trim() : null;
        if (shopPhone != null && !shopPhone.isBlank()) {
            if (shopRepository.existsByPhoneNumber(shopPhone)) {
                throw new CustomException("Số điện thoại \"" + shopPhone + "\" đã được sử dụng bởi một gian hàng khác.");
            }
            if (sellerRepository.existsPendingByShopPhone(shopPhone)) {
                throw new CustomException("Số điện thoại \"" + shopPhone + "\" đang có một đơn đăng ký khác chờ xét duyệt.");
            }
        }

        // 6. Validate thông tin ngân hàng
        if (request.getBankAccountName() == null || request.getBankAccountName().isBlank()) {
            throw new CustomException("Tên chủ tài khoản không được để trống");
        }
        if (request.getBankAccountNumber() == null || request.getBankAccountNumber().isBlank()) {
            throw new CustomException("Số tài khoản ngân hàng không được để trống");
        }
        if (request.getBankName() == null || request.getBankName().isBlank()) {
            throw new CustomException("Tên ngân hàng không được để trống");
        }

        // 7. Validate địa chỉ lấy/trả hàng
        if (request.getPickupAddress() == null || request.getPickupAddress().isBlank()) {
            throw new CustomException("Địa chỉ lấy hàng không được để trống");
        }
        if (request.getReturnAddress() == null || request.getReturnAddress().isBlank()) {
            throw new CustomException("Địa chỉ trả hàng không được để trống");
        }

        Request r = requestService.createRequest(acc, CreateSendRequest.builder()
                .requestType(RequestType.SELLER_REGISTRATION)
                .coverImage(request.getCoverImageUrl())
                .description(request.getDescription())
                .build());

        String defaultAddress = request.getAddress() != null && !request.getAddress().isBlank()
                ? request.getAddress()
                : request.getPickupAddress();

        Seller s = Seller.builder()
                .request(r)
                .sellerType(sellerType)
                .shopName(shopName)
                .shopPhone(shopPhone)
                .shopEmail(request.getShopEmail() != null ? request.getShopEmail().trim() : null)
                .pickupAddress(request.getPickupAddress().trim())
                .returnAddress(request.getReturnAddress().trim())
                .address(defaultAddress)
                .taxCode(taxCode)
                .invoiceEmail(request.getInvoiceEmail() != null ? request.getInvoiceEmail().trim() : null)
                .businessType(sellerType == SellerType.BUSINESS ? request.getBusinessType() : null)
                .businessName(sellerType == SellerType.BUSINESS ? (request.getBusinessName() != null ? request.getBusinessName().trim() : null) : null)
                .businessAddress(sellerType == SellerType.BUSINESS ? (request.getBusinessAddress() != null ? request.getBusinessAddress().trim() : null) : null)
                .businessLicenseUrl(sellerType == SellerType.BUSINESS ? (request.getBusinessLicenseUrl() != null ? request.getBusinessLicenseUrl().trim() : null) : null)
                .bankAccountName(request.getBankAccountName().trim())
                .bankAccountNumber(request.getBankAccountNumber().trim())
                .bankName(request.getBankName().trim())
                .build();

        sellerRepository.save(s);

        return CreateRequestResponse.from(r);
    }
}
