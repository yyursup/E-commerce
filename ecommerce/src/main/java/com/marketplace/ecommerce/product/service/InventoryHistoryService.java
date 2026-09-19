package com.marketplace.ecommerce.product.service;

import com.marketplace.ecommerce.product.dto.response.InventoryHistoryResponse;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductVariant;
import com.marketplace.ecommerce.product.valueObjects.InventoryActionType;
import com.marketplace.ecommerce.shop.entity.Shop;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface InventoryHistoryService {
    void logInventoryChange(Shop shop, Product product, ProductVariant variant, Integer oldStock, Integer newStock,
                            InventoryActionType actionType, String referenceId, String note);

    Page<InventoryHistoryResponse> getHistoryByShopId(UUID accountId, int page, int size);
}
