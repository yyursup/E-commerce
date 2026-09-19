package com.marketplace.ecommerce.product.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.dto.response.InventoryHistoryResponse;
import com.marketplace.ecommerce.product.entity.InventoryHistory;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductVariant;
import com.marketplace.ecommerce.product.repository.InventoryHistoryRepository;
import com.marketplace.ecommerce.product.service.InventoryHistoryService;
import com.marketplace.ecommerce.product.valueObjects.InventoryActionType;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryHistoryServiceImpl implements InventoryHistoryService {

    private final InventoryHistoryRepository inventoryHistoryRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;

    @Override
    @Transactional
    public void logInventoryChange(Shop shop, Product product, ProductVariant variant, Integer oldStock, Integer newStock,
                                   InventoryActionType actionType, String referenceId, String note) {
        
        if (oldStock == null) oldStock = 0;
        if (newStock == null) newStock = 0;
        
        if (oldStock.equals(newStock)) {
            return; // no change, no log
        }

        InventoryHistory history = InventoryHistory.builder()
                .shop(shop)
                .product(product)
                .productVariant(variant)
                .oldStock(oldStock)
                .newStock(newStock)
                .changeAmount(newStock - oldStock)
                .actionType(actionType)
                .referenceId(referenceId)
                .note(note)
                .createdAt(LocalDateTime.now())
                .build();

        inventoryHistoryRepository.save(history);
    }

    @Override
    public Page<InventoryHistoryResponse> getHistoryByShopId(UUID accountId, int page, int size) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        Shop shop = shopRepository.findByUserId(user.getId())
                .orElseThrow(() -> new CustomException("Shop not found"));

        Pageable pageable = PageRequest.of(page, size);
        Page<InventoryHistory> histories = inventoryHistoryRepository.findByShopIdOrderByCreatedAtDesc(shop.getId(), pageable);
        
        return histories.map(InventoryHistoryResponse::from);
    }
}
