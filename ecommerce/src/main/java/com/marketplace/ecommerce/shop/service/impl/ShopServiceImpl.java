package com.marketplace.ecommerce.shop.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopService;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ShopServiceImpl implements ShopService {
    private final ShopRepository shopRepository;

    @Override
    public Shop createShop(User ownerUser, String shopName, Request req, Seller sellerDetail) {

        Shop shop = Shop.builder()
                .user(ownerUser)
                .name(shopName)
                .description(req.getDescription())
                .coverImageUrl(req.getCoverImageUrl())
                .logoUrl(req.getCoverImageUrl())
                .phoneNumber(sellerDetail.getShopPhone())
                .address(sellerDetail.getAddress() != null ? sellerDetail.getAddress() : sellerDetail.getPickupAddress())
                .pickupAddress(sellerDetail.getPickupAddress())
                .returnAddress(sellerDetail.getReturnAddress())
                .taxCode(sellerDetail.getTaxCode())
                .invoiceEmail(sellerDetail.getInvoiceEmail())
                .bankName(sellerDetail.getBankName())
                .bankAccountNumber(sellerDetail.getBankAccountNumber())
                .bankAccountName(sellerDetail.getBankAccountName())
                .sellerType(sellerDetail.getSellerType())
                .businessType(sellerDetail.getBusinessType())
                .businessName(sellerDetail.getBusinessName())
                .businessAddress(sellerDetail.getBusinessAddress())
                .businessLicenseUrl(sellerDetail.getBusinessLicenseUrl())
                .status(ShopStatus.ACTIVE)
                .shopType(sellerDetail.getSellerType() != null ? sellerDetail.getSellerType() : com.marketplace.ecommerce.shop.valueObjects.SellerType.INDIVIDUAL)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return shopRepository.save(shop);
    }
}
