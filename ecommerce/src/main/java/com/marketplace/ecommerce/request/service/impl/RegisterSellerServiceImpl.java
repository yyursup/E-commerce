package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.request.dto.request.CreateSendRequest;
import com.marketplace.ecommerce.request.dto.request.RegisterSellerRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.request.repository.SellerRepository;
import com.marketplace.ecommerce.request.service.RegisterSellerService;
import com.marketplace.ecommerce.request.service.RequestService;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.SellerType;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RegisterSellerServiceImpl implements RegisterSellerService {
    private final SellerRepository sellerRepository;
    private final RequestService requestService;
    private final AccountRepository accountRepository;

    @Override
    @Transactional
    public CreateRequestResponse createSellerRegistration(UUID accountId, RegisterSellerRequest request) {

        Account acc = accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomException("Account not found"));

        if (Boolean.FALSE.equals(acc.getAccountVerified())) {
            throw new CustomException("Your account hasn't been verified");
        }

        SellerType sellerType = request.getSellerType() != null ? request.getSellerType() : SellerType.INDIVIDUAL;

        // Validation nghiệp vụ theo loại hình người bán
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
            if (request.getTaxCode() == null || request.getTaxCode().isBlank()) {
                throw new CustomException("Mã số thuế không được để trống");
            }
            if (request.getBusinessLicenseUrl() == null || request.getBusinessLicenseUrl().isBlank()) {
                throw new CustomException("Vui lòng tải lên ảnh Giấy phép kinh doanh");
            }
        } else {
            // INDIVIDUAL
            if (request.getTaxCode() == null || request.getTaxCode().isBlank()) {
                throw new CustomException("Mã số thuế cá nhân không được để trống");
            }
        }

        // Validate thông tin ngân hàng
        if (request.getBankAccountName() == null || request.getBankAccountName().isBlank()) {
            throw new CustomException("Tên chủ tài khoản không được để trống");
        }
        if (request.getBankAccountNumber() == null || request.getBankAccountNumber().isBlank()) {
            throw new CustomException("Số tài khoản ngân hàng không được để trống");
        }
        if (request.getBankName() == null || request.getBankName().isBlank()) {
            throw new CustomException("Tên ngân hàng không được để trống");
        }

        // Validate địa chỉ lấy/trả hàng
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
                .shopName(request.getShopName())
                .shopPhone(request.getShopPhone())
                .shopEmail(request.getShopEmail())
                .pickupAddress(request.getPickupAddress())
                .returnAddress(request.getReturnAddress())
                .address(defaultAddress)
                .taxCode(request.getTaxCode())
                .invoiceEmail(request.getInvoiceEmail())
                .businessType(request.getBusinessType())
                .businessName(request.getBusinessName())
                .businessAddress(request.getBusinessAddress())
                .businessLicenseUrl(request.getBusinessLicenseUrl())
                .bankAccountName(request.getBankAccountName())
                .bankAccountNumber(request.getBankAccountNumber())
                .bankName(request.getBankName())
                .build();

        sellerRepository.save(s);

        return CreateRequestResponse.from(r);
    }
}
