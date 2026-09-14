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

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.shop.dto.response.ShopProfileResponse;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShopServiceImpl implements ShopService {
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;

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
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return shopRepository.save(shop);
    }

    @Override
    public ShopProfileResponse getShopProfileById(UUID shopId) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin cửa hàng"));
        long count = productRepository.countByShopIdAndStatusAndDeletedFalse(shopId, ProductStatus.PUBLISHED);
        return ShopProfileResponse.from(shop, count);
    }

    @Override
    public List<ShopProfileResponse> getAllActiveShops() {
        return shopRepository.findAll().stream()
                .filter(s -> s.getStatus() == ShopStatus.ACTIVE)
                .map(s -> {
                    long count = productRepository.countByShopIdAndStatusAndDeletedFalse(s.getId(), ProductStatus.PUBLISHED);
                    return ShopProfileResponse.from(s, count);
                })
                .collect(Collectors.toList());
    }
}
