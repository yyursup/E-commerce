package com.marketplace.ecommerce.wishlist.service.impl;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.wishlist.dto.WishlistStatusResponse;
import com.marketplace.ecommerce.wishlist.entity.Wishlist;
import com.marketplace.ecommerce.wishlist.repository.WishlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WishlistServiceImplTest {

    @Mock
    private WishlistRepository wishlistRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private WishlistServiceImpl wishlistService;

    private UUID accountId;
    private User sampleUser;
    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        sampleUser = new User();
        sampleUser.setId(UUID.randomUUID());

        sampleProduct = new Product();
        sampleProduct.setId(UUID.randomUUID());
        sampleProduct.setName("iPad Pro M4");
        com.marketplace.ecommerce.shop.entity.Shop shop = new com.marketplace.ecommerce.shop.entity.Shop();
        shop.setId(UUID.randomUUID());
        shop.setName("Tech Shop");
        sampleProduct.setShop(shop);

        com.marketplace.ecommerce.product.entity.ProductCategory category = new com.marketplace.ecommerce.product.entity.ProductCategory();
        category.setId(UUID.randomUUID());
        category.setName("Tablet");
        sampleProduct.setProductCategory(category);
    }

    @Test
    @DisplayName("toggleWishlist thêm và gỡ yêu thích thành công")
    void testToggleWishlist() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(productRepository.findById(sampleProduct.getId())).thenReturn(Optional.of(sampleProduct));

        // 1. Thêm yêu thích
        when(wishlistRepository.findByUserIdAndProductId(sampleUser.getId(), sampleProduct.getId()))
                .thenReturn(Optional.empty());
        when(wishlistRepository.countByProductId(sampleProduct.getId())).thenReturn(1L);

        WishlistStatusResponse res1 = wishlistService.toggleWishlist(accountId, sampleProduct.getId());
        assertTrue(res1.isWishlisted());
        assertEquals(1L, res1.getWishlistCount());
        verify(wishlistRepository).save(any(Wishlist.class));

        // 2. Gỡ yêu thích
        Wishlist existing = new Wishlist();
        when(wishlistRepository.findByUserIdAndProductId(sampleUser.getId(), sampleProduct.getId()))
                .thenReturn(Optional.of(existing));
        when(wishlistRepository.countByProductId(sampleProduct.getId())).thenReturn(0L);

        WishlistStatusResponse res2 = wishlistService.toggleWishlist(accountId, sampleProduct.getId());
        assertFalse(res2.isWishlisted());
        verify(wishlistRepository).delete(existing);
    }

    @Test
    @DisplayName("toggleWishlist ném ngoại lệ khi user hoặc product không tồn tại")
    void testToggleWishlist_NotFound() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> wishlistService.toggleWishlist(accountId, sampleProduct.getId()));

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(productRepository.findById(sampleProduct.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> wishlistService.toggleWishlist(accountId, sampleProduct.getId()));
    }

    @Test
    @DisplayName("getWishlistStatus trả về trạng thái yêu thích")
    void testGetWishlistStatus() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(wishlistRepository.existsByUserIdAndProductId(sampleUser.getId(), sampleProduct.getId())).thenReturn(true);
        when(wishlistRepository.countByProductId(sampleProduct.getId())).thenReturn(15L);

        WishlistStatusResponse res = wishlistService.getWishlistStatus(accountId, sampleProduct.getId());
        assertTrue(res.isWishlisted());
        assertEquals(15L, res.getWishlistCount());

        // Khi accountId null
        WishlistStatusResponse resNull = wishlistService.getWishlistStatus(null, sampleProduct.getId());
        assertFalse(resNull.isWishlisted());

        // Khi accountId không tìm thấy user
        UUID stranger = UUID.randomUUID();
        when(userRepository.findByAccountId(stranger)).thenReturn(Optional.empty());
        WishlistStatusResponse resNoUser = wishlistService.getWishlistStatus(stranger, sampleProduct.getId());
        assertFalse(resNoUser.isWishlisted());
    }

    @Test
    @DisplayName("getMyWishlist lấy danh sách yêu thích thành công và ném lỗi khi user not found")
    void testGetMyWishlist() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));

        Wishlist w = Wishlist.builder().user(sampleUser).product(sampleProduct).build();
        Page<Wishlist> page = new PageImpl<>(List.of(w));
        Pageable pageable = PageRequest.of(0, 10);
        when(wishlistRepository.findByUserId(sampleUser.getId(), pageable)).thenReturn(page);

        Page<ProductResponse> res = wishlistService.getMyWishlist(accountId, pageable);
        assertNotNull(res);
        assertEquals(1, res.getTotalElements());

        // User not found
        UUID stranger = UUID.randomUUID();
        when(userRepository.findByAccountId(stranger)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> wishlistService.getMyWishlist(stranger, pageable));
    }
}
