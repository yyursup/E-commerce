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

        Request r = requestService.createRequest(acc, CreateSendRequest.builder()
                .requestType(RequestType.SELLER_REGISTRATION)
                .coverImage(request.getCoverImageUrl())
                .description(request.getDescription())
                .build());

        boolean verified = r.getAccount().getAccountVerified();
        if (!verified) {
            throw new CustomException("Your account hasn't been verified");
        }

        Seller s = Seller.builder()
                .address(request.getAddress())
                .shopName(request.getShopName())
                .taxCode(request.getTaxCode())
                .shopPhone(request.getShopPhone())
                .shopEmail(request.getShopEmail())
                .request(r)
                .build();

        sellerRepository.save(s);

        return CreateRequestResponse.from(r);
    }
}
