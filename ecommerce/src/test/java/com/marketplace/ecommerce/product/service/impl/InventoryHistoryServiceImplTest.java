package com.marketplace.ecommerce.product.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.dto.response.InventoryHistoryResponse;
import com.marketplace.ecommerce.product.entity.InventoryHistory;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductVariant;
import com.marketplace.ecommerce.product.repository.InventoryHistoryRepository;
import com.marketplace.ecommerce.product.valueObjects.InventoryActionType;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryHistoryServiceImplTest {

    @Mock
    private InventoryHistoryRepository inventoryHistoryRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ShopRepository shopRepository;

    @InjectMocks
    private InventoryHistoryServiceImpl inventoryHistoryService;

    private Shop shop;
    private Product product;
    private ProductVariant variant;
    private User user;
    private UUID accountId;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();

        user = new User();
        user.setId(UUID.randomUUID());

        shop = new Shop();
        shop.setId(UUID.randomUUID());
        shop.setName("Tech Shop");
        shop.setUser(user);

        product = Product.builder()
                .id(UUID.randomUUID())
                .name("Tai nghe Sony")
                .shop(shop)
                .build();

        variant = ProductVariant.builder()
                .id(UUID.randomUUID())
                .color("Đen")
                .size("L")
                .build();
    }

    @Test
    @DisplayName("logInventoryChange không lưu khi oldStock bằng newStock")
    void testLogInventoryChange_NoChange() {
        inventoryHistoryService.logInventoryChange(shop, product, variant, 10, 10,
                InventoryActionType.MANUAL_ADJUSTMENT, "REF-1", "Không đổi");
        verify(inventoryHistoryRepository, never()).save(any());

        // null oldStock và null newStock -> cùng coi là 0 -> không đổi
        inventoryHistoryService.logInventoryChange(shop, product, variant, null, null,
                InventoryActionType.MANUAL_ADJUSTMENT, "REF-2", "Cùng null");
        verify(inventoryHistoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("logInventoryChange lưu lịch sử khi oldStock khác newStock")
    void testLogInventoryChange_Success() {
        inventoryHistoryService.logInventoryChange(shop, product, variant, 5, 12,
                InventoryActionType.STOCK_UPDATED, "PO-001", "Nhập hàng đợt 1");

        ArgumentCaptor<InventoryHistory> captor = ArgumentCaptor.forClass(InventoryHistory.class);
        verify(inventoryHistoryRepository).save(captor.capture());

        InventoryHistory saved = captor.getValue();
        assertNotNull(saved);
        assertEquals(5, saved.getOldStock());
        assertEquals(12, saved.getNewStock());
        assertEquals(7, saved.getChangeAmount());
        assertEquals(InventoryActionType.STOCK_UPDATED, saved.getActionType());
        assertEquals("PO-001", saved.getReferenceId());
        assertEquals("Nhập hàng đợt 1", saved.getNote());
        assertEquals(shop, saved.getShop());
        assertEquals(product, saved.getProduct());
        assertEquals(variant, saved.getProductVariant());
    }

    @Test
    @DisplayName("getHistoryByShopId phân trang lịch sử tồn kho của shop")
    void testGetHistoryByShopId_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.of(shop));

        InventoryHistory h = InventoryHistory.builder()
                .id(UUID.randomUUID())
                .shop(shop)
                .product(product)
                .productVariant(variant)
                .oldStock(10)
                .newStock(8)
                .changeAmount(-2)
                .actionType(InventoryActionType.ORDER_PLACED)
                .createdAt(LocalDateTime.now())
                .build();

        Page<InventoryHistory> page = new PageImpl<>(List.of(h));
        when(inventoryHistoryRepository.findByShopIdOrderByCreatedAtDesc(eq(shop.getId()), any(Pageable.class)))
                .thenReturn(page);

        Page<InventoryHistoryResponse> result = inventoryHistoryService.getHistoryByShopId(accountId, 0, 10);
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(-2, result.getContent().get(0).getChangeAmount());
    }

    @Test
    @DisplayName("getHistoryByShopId ném ngoại lệ khi user hoặc shop không tồn tại")
    void testGetHistoryByShopId_NotFound() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> inventoryHistoryService.getHistoryByShopId(accountId, 0, 10));

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(shopRepository.findByUserId(user.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> inventoryHistoryService.getHistoryByShopId(accountId, 0, 10));
    }
}
