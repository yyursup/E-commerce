package com.marketplace.ecommerce.cart.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.cart.dto.request.AddToCartRequest;
import com.marketplace.ecommerce.cart.dto.response.CartResponse;
import com.marketplace.ecommerce.cart.entity.Cart;
import com.marketplace.ecommerce.cart.entity.CartItem;
import com.marketplace.ecommerce.cart.repository.CartItemRepository;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.cart.validate.CartValidation;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductVariant;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceImplTest {

    @Mock
    private CartRepository cartRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private CartValidation cartValidation;

    @InjectMocks
    private CartServiceImpl cartService;

    private UUID accountId;
    private User sampleUser;
    private Cart sampleCart;
    private Product sampleProduct;
    private Shop sampleShop;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();

        sampleUser = new User();
        sampleUser.setId(UUID.randomUUID());

        sampleShop = new Shop();
        sampleShop.setId(UUID.randomUUID());
        sampleShop.setName("Tech Shop");

        sampleCart = new Cart();
        sampleCart.setId(UUID.randomUUID());
        sampleCart.setUser(sampleUser);
        sampleCart.setItems(new HashSet<>());

        sampleProduct = Product.builder()
                .id(UUID.randomUUID())
                .shop(sampleShop)
                .name("Chuột Gaming")
                .basePrice(BigDecimal.valueOf(500000))
                .quantity(20)
                .status(ProductStatus.PUBLISHED)
                .variants(new HashSet<>())
                .build();
    }

    @Test
    @DisplayName("addToCart thêm sản phẩm không có variant thành công")
    void testAddToCart_SimpleProduct() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(cartValidation.normalizeAndValidateQuantity(1)).thenReturn(1);
        when(productRepository.findPublishedByIdWithDetails(sampleProduct.getId()))
                .thenReturn(Optional.of(sampleProduct));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(sampleCart));

        AddToCartRequest req = new AddToCartRequest();
        req.setProductId(sampleProduct.getId());
        req.setQuantity(1);

        CartResponse res = cartService.addToCart(accountId, req);
        assertNotNull(res);
        verify(cartRepository).save(any(Cart.class));
    }

    @Test
    @DisplayName("addToCart thêm sản phẩm có phân loại (Variant) thành công")
    void testAddToCart_WithVariant() {
        UUID variantId = UUID.randomUUID();
        ProductVariant variant = ProductVariant.builder()
                .id(variantId)
                .color("Đen")
                .size("RGB")
                .price(BigDecimal.valueOf(600000))
                .stock(10)
                .deleted(false)
                .build();
        sampleProduct.getVariants().add(variant);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(cartValidation.normalizeAndValidateQuantity(2)).thenReturn(2);
        when(productRepository.findPublishedByIdWithDetails(sampleProduct.getId()))
                .thenReturn(Optional.of(sampleProduct));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(sampleCart));

        AddToCartRequest req = new AddToCartRequest();
        req.setProductId(sampleProduct.getId());
        req.setVariantId(variantId);
        req.setQuantity(2);

        CartResponse res = cartService.addToCart(accountId, req);
        assertNotNull(res);
        verify(cartRepository).save(any(Cart.class));
    }

    @Test
    @DisplayName("addToCart ném lỗi khi sản phẩm có phân loại nhưng không chọn variantId")
    void testAddToCart_MissingVariantId() {
        ProductVariant variant = ProductVariant.builder()
                .id(UUID.randomUUID())
                .color("Trắng")
                .deleted(false)
                .build();
        sampleProduct.getVariants().add(variant);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(cartValidation.normalizeAndValidateQuantity(1)).thenReturn(1);
        when(productRepository.findPublishedByIdWithDetails(sampleProduct.getId()))
                .thenReturn(Optional.of(sampleProduct));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(sampleCart));

        AddToCartRequest req = new AddToCartRequest();
        req.setProductId(sampleProduct.getId());
        req.setQuantity(1);

        CustomException ex = assertThrows(CustomException.class, () -> cartService.addToCart(accountId, req));
        assertTrue(ex.getMessage().contains("Vui lòng chọn phân loại hàng"));
    }

    @Test
    @DisplayName("deleteItem xóa mềm món hàng khỏi giỏ")
    void testDeleteItem() {
        UUID cartItemId = UUID.randomUUID();
        CartItem item = new CartItem();
        item.setId(cartItemId);
        item.setCart(sampleCart);
        item.setQuantity(3);
        item.setDeleted(false);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(cartItemRepository.findActiveByIdAndUserId(sampleUser.getId(), cartItemId))
                .thenReturn(Optional.of(item));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(sampleCart));

        CartResponse res = cartService.deleteItem(accountId, cartItemId);
        assertNotNull(res);
        assertTrue(item.getDeleted());
        assertEquals(0, item.getQuantity());
        verify(cartItemRepository).save(item);
    }

    @Test
    @DisplayName("minus giảm số lượng và tự xóa khi số lượng về 0")
    void testMinus_ToZero() {
        UUID cartItemId = UUID.randomUUID();
        CartItem item = new CartItem();
        item.setId(cartItemId);
        item.setCart(sampleCart);
        item.setQuantity(1);
        item.setDeleted(false);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(cartItemRepository.findActiveByIdAndUserId(sampleUser.getId(), cartItemId))
                .thenReturn(Optional.of(item));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(sampleCart));

        cartService.minus(accountId, cartItemId);

        assertTrue(item.getDeleted());
        assertEquals(0, item.getQuantity());
        verify(cartItemRepository).save(item);
    }

    @Test
    @DisplayName("getCartByAccountId thành công")
    void testGetCartByAccountId_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(sampleCart));

        CartResponse res = cartService.getCartByAccountId(accountId);
        assertNotNull(res);
        verify(cartRepository).findByUserIdWithItems(sampleUser.getId());
    }

    @Test
    @DisplayName("minus giảm số lượng khi số lượng > 1")
    void testMinus_GreaterThanOne() {
        UUID cartItemId = UUID.randomUUID();
        CartItem item = new CartItem();
        item.setId(cartItemId);
        item.setCart(sampleCart);
        item.setQuantity(5);
        item.setDeleted(false);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(cartItemRepository.findActiveByIdAndUserId(sampleUser.getId(), cartItemId))
                .thenReturn(Optional.of(item));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(sampleCart));

        CartResponse res = cartService.minus(accountId, cartItemId);
        assertNotNull(res);
        assertEquals(4, item.getQuantity());
        assertFalse(item.getDeleted());
        verify(cartItemRepository).save(item);
    }

    @Test
    @DisplayName("add tăng số lượng không variant thành công")
    void testAdd_WithoutVariant_Success() {
        UUID cartItemId = UUID.randomUUID();
        CartItem item = new CartItem();
        item.setId(cartItemId);
        item.setProduct(sampleProduct);
        item.setQuantity(2);
        item.setVariantId(null);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(cartItemRepository.findActiveByIdAndUserId(sampleUser.getId(), cartItemId))
                .thenReturn(Optional.of(item));
        when(productRepository.findPublishedByIdWithDetails(sampleProduct.getId()))
                .thenReturn(Optional.of(sampleProduct));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(sampleCart));

        CartResponse res = cartService.add(accountId, cartItemId);
        assertNotNull(res);
        assertEquals(3, item.getQuantity());
        verify(cartValidation).ensureStock(sampleProduct, 3, "Out of stock");
        verify(cartItemRepository).save(item);
    }

    @Test
    @DisplayName("add tăng số lượng có variant thành công")
    void testAdd_WithVariant_Success() {
        UUID cartItemId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();
        ProductVariant variant = ProductVariant.builder()
                .id(variantId)
                .stock(10)
                .deleted(false)
                .build();
        sampleProduct.getVariants().add(variant);

        CartItem item = new CartItem();
        item.setId(cartItemId);
        item.setProduct(sampleProduct);
        item.setQuantity(2);
        item.setVariantId(variantId);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(cartItemRepository.findActiveByIdAndUserId(sampleUser.getId(), cartItemId))
                .thenReturn(Optional.of(item));
        when(productRepository.findPublishedByIdWithDetails(sampleProduct.getId()))
                .thenReturn(Optional.of(sampleProduct));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(sampleCart));

        CartResponse res = cartService.add(accountId, cartItemId);
        assertNotNull(res);
        assertEquals(3, item.getQuantity());
        verify(cartItemRepository).save(item);
    }

    @Test
    @DisplayName("add có variant nhưng vượt tồn kho ném ngoại lệ")
    void testAdd_WithVariant_ExceedStock() {
        UUID cartItemId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();
        ProductVariant variant = ProductVariant.builder()
                .id(variantId)
                .stock(2)
                .deleted(false)
                .build();
        sampleProduct.getVariants().add(variant);

        CartItem item = new CartItem();
        item.setId(cartItemId);
        item.setProduct(sampleProduct);
        item.setQuantity(2);
        item.setVariantId(variantId);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(cartItemRepository.findActiveByIdAndUserId(sampleUser.getId(), cartItemId))
                .thenReturn(Optional.of(item));
        when(productRepository.findPublishedByIdWithDetails(sampleProduct.getId()))
                .thenReturn(Optional.of(sampleProduct));

        CustomException ex = assertThrows(CustomException.class, () -> cartService.add(accountId, cartItemId));
        assertTrue(ex.getMessage().contains("Số lượng tồn kho của phân loại này đã đạt giới hạn"));
    }

    @Test
    @DisplayName("addToCart variant không tồn tại hoặc đã bị xóa ném ngoại lệ")
    void testAddToCart_VariantNotFoundOrDeleted() {
        UUID variantId = UUID.randomUUID();
        ProductVariant deletedVariant = ProductVariant.builder()
                .id(variantId)
                .deleted(true)
                .build();
        ProductVariant activeVariant = ProductVariant.builder()
                .id(UUID.randomUUID())
                .deleted(false)
                .build();
        sampleProduct.getVariants().add(deletedVariant);
        sampleProduct.getVariants().add(activeVariant);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(cartValidation.normalizeAndValidateQuantity(1)).thenReturn(1);
        when(productRepository.findPublishedByIdWithDetails(sampleProduct.getId()))
                .thenReturn(Optional.of(sampleProduct));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(sampleCart));

        AddToCartRequest req = new AddToCartRequest();
        req.setProductId(sampleProduct.getId());
        req.setVariantId(variantId);
        req.setQuantity(1);

        CustomException ex = assertThrows(CustomException.class, () -> cartService.addToCart(accountId, req));
        assertTrue(ex.getMessage().contains("Phân loại hàng không tồn tại hoặc đã ngừng kinh doanh"));
    }

    @Test
    @DisplayName("addToCart số lượng tồn kho variant không đủ ném ngoại lệ")
    void testAddToCart_VariantStockNotEnough() {
        UUID variantId = UUID.randomUUID();
        ProductVariant variant = ProductVariant.builder()
                .id(variantId)
                .stock(3)
                .deleted(false)
                .build();
        sampleProduct.getVariants().add(variant);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(cartValidation.normalizeAndValidateQuantity(5)).thenReturn(5);
        when(productRepository.findPublishedByIdWithDetails(sampleProduct.getId()))
                .thenReturn(Optional.of(sampleProduct));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(sampleCart));

        AddToCartRequest req = new AddToCartRequest();
        req.setProductId(sampleProduct.getId());
        req.setVariantId(variantId);
        req.setQuantity(5);

        CustomException ex = assertThrows(CustomException.class, () -> cartService.addToCart(accountId, req));
        assertTrue(ex.getMessage().contains("Số lượng tồn kho của phân loại này không đủ"));
    }

    @Test
    @DisplayName("addToCart item đã tồn tại trong giỏ có variant thành công")
    void testAddToCart_ExistingItemWithVariant_Success() {
        UUID variantId = UUID.randomUUID();
        ProductVariant variant = ProductVariant.builder()
                .id(variantId)
                .price(BigDecimal.valueOf(250000))
                .stock(10)
                .deleted(false)
                .build();
        sampleProduct.getVariants().add(variant);

        CartItem existing = new CartItem();
        existing.setId(UUID.randomUUID());
        existing.setProduct(sampleProduct);
        existing.setVariantId(variantId);
        existing.setQuantity(2);
        existing.setDeleted(false);
        sampleCart.getItems().add(existing);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(cartValidation.normalizeAndValidateQuantity(3)).thenReturn(3);
        when(productRepository.findPublishedByIdWithDetails(sampleProduct.getId()))
                .thenReturn(Optional.of(sampleProduct));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(sampleCart));

        AddToCartRequest req = new AddToCartRequest();
        req.setProductId(sampleProduct.getId());
        req.setVariantId(variantId);
        req.setQuantity(3);

        CartResponse res = cartService.addToCart(accountId, req);
        assertNotNull(res);
        assertEquals(5, existing.getQuantity());
        assertEquals(BigDecimal.valueOf(250000), existing.getUnitPrice());
    }

    @Test
    @DisplayName("addToCart item đã tồn tại trong giỏ có variant vượt quá tồn kho ném ngoại lệ")
    void testAddToCart_ExistingItemWithVariant_ExceedStock() {
        UUID variantId = UUID.randomUUID();
        ProductVariant variant = ProductVariant.builder()
                .id(variantId)
                .price(BigDecimal.valueOf(250000))
                .stock(5)
                .deleted(false)
                .build();
        sampleProduct.getVariants().add(variant);

        CartItem existing = new CartItem();
        existing.setId(UUID.randomUUID());
        existing.setProduct(sampleProduct);
        existing.setVariantId(variantId);
        existing.setQuantity(4);
        existing.setDeleted(false);
        sampleCart.getItems().add(existing);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(cartValidation.normalizeAndValidateQuantity(3)).thenReturn(3);
        when(productRepository.findPublishedByIdWithDetails(sampleProduct.getId()))
                .thenReturn(Optional.of(sampleProduct));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(sampleCart));

        AddToCartRequest req = new AddToCartRequest();
        req.setProductId(sampleProduct.getId());
        req.setVariantId(variantId);
        req.setQuantity(3);

        CustomException ex = assertThrows(CustomException.class, () -> cartService.addToCart(accountId, req));
        assertTrue(ex.getMessage().contains("vượt quá tồn kho còn lại"));
    }

    @Test
    @DisplayName("addToCart item đã tồn tại trong giỏ không variant thành công")
    void testAddToCart_ExistingItemWithoutVariant_Success() {
        CartItem existing = new CartItem();
        existing.setId(UUID.randomUUID());
        existing.setProduct(sampleProduct);
        existing.setVariantId(null);
        existing.setQuantity(2);
        existing.setDeleted(false);
        sampleCart.getItems().add(existing);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(cartValidation.normalizeAndValidateQuantity(3)).thenReturn(3);
        when(productRepository.findPublishedByIdWithDetails(sampleProduct.getId()))
                .thenReturn(Optional.of(sampleProduct));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.of(sampleCart));

        AddToCartRequest req = new AddToCartRequest();
        req.setProductId(sampleProduct.getId());
        req.setVariantId(null);
        req.setQuantity(3);

        CartResponse res = cartService.addToCart(accountId, req);
        assertNotNull(res);
        assertEquals(5, existing.getQuantity());
        verify(cartValidation).ensureStock(sampleProduct, 5, "Not enough quantity");
    }

    @Test
    @DisplayName("Các trường hợp ném ngoại lệ khi tìm không thấy User, Product, Cart, CartItem")
    void testExceptionCases() throws Exception {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> cartService.getCartByAccountId(accountId));

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(cartRepository.findByUserIdWithItems(sampleUser.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> cartService.getCartByAccountId(accountId));

        UUID cartItemId = UUID.randomUUID();
        when(cartItemRepository.findActiveByIdAndUserId(sampleUser.getId(), cartItemId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> cartService.deleteItem(accountId, cartItemId));

        AddToCartRequest req = new AddToCartRequest();
        req.setProductId(sampleProduct.getId());
        req.setQuantity(1);
        when(productRepository.findPublishedByIdWithDetails(sampleProduct.getId())).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> cartService.addToCart(accountId, req));

        // Test private method getCartByUserId via reflection
        java.lang.reflect.Method m = CartServiceImpl.class.getDeclaredMethod("getCartByUserId", UUID.class);
        m.setAccessible(true);
        when(cartRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleCart));
        Object c = m.invoke(cartService, sampleUser.getId());
        assertEquals(sampleCart, c);

        when(cartRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());
        java.lang.reflect.InvocationTargetException ite = assertThrows(java.lang.reflect.InvocationTargetException.class,
                () -> m.invoke(cartService, sampleUser.getId()));
        assertTrue(ite.getCause() instanceof RuntimeException);
    }

}
