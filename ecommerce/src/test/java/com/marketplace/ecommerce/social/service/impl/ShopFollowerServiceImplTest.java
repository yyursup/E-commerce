package com.marketplace.ecommerce.social.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.social.dto.FollowStatusResponse;
import com.marketplace.ecommerce.social.entity.ShopFollower;
import com.marketplace.ecommerce.social.repository.ShopFollowerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShopFollowerServiceImplTest {

    @Mock
    private ShopFollowerRepository shopFollowerRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ShopRepository shopRepository;

    @InjectMocks
    private ShopFollowerServiceImpl shopFollowerService;

    private UUID accountId;
    private User sampleUser;
    private Shop sampleShop;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();

        sampleUser = new User();
        sampleUser.setId(UUID.randomUUID());

        sampleShop = new Shop();
        sampleShop.setId(UUID.randomUUID());
        sampleShop.setName("Anker Official");
        User shopOwner = new User();
        shopOwner.setId(UUID.randomUUID());
        sampleShop.setUser(shopOwner);
    }

    @Test
    @DisplayName("toggleFollowShop theo dõi và hủy theo dõi shop thành công")
    void testToggleFollowShop_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));

        // 1. Follow shop
        when(shopFollowerRepository.findByUserIdAndShopId(sampleUser.getId(), sampleShop.getId()))
                .thenReturn(Optional.empty());
        when(shopFollowerRepository.countByShopId(sampleShop.getId())).thenReturn(1L);

        FollowStatusResponse res1 = shopFollowerService.toggleFollowShop(accountId, sampleShop.getId());
        assertTrue(res1.isFollowing());
        assertEquals(1L, res1.getFollowerCount());
        verify(shopFollowerRepository).save(any(ShopFollower.class));

        // 2. Unfollow shop
        ShopFollower existing = new ShopFollower();
        when(shopFollowerRepository.findByUserIdAndShopId(sampleUser.getId(), sampleShop.getId()))
                .thenReturn(Optional.of(existing));
        when(shopFollowerRepository.countByShopId(sampleShop.getId())).thenReturn(0L);

        FollowStatusResponse res2 = shopFollowerService.toggleFollowShop(accountId, sampleShop.getId());
        assertFalse(res2.isFollowing());
        verify(shopFollowerRepository).delete(existing);
    }

    @Test
    @DisplayName("toggleFollowShop chặn tự theo dõi shop của chính mình")
    void testToggleFollowShop_SelfFollowBlocked() {
        sampleShop.setUser(sampleUser); // Shop thuộc về user
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));

        CustomException ex = assertThrows(CustomException.class,
                () -> shopFollowerService.toggleFollowShop(accountId, sampleShop.getId()));
        assertTrue(ex.getMessage().contains("không thể tự theo dõi"));
    }

    @Test
    @DisplayName("getFollowStatus và getFollowerCount trả về trạng thái đúng")
    void testGetFollowStatus() {
        when(shopFollowerRepository.countByShopId(sampleShop.getId())).thenReturn(20L);
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopFollowerRepository.existsByUserIdAndShopId(sampleUser.getId(), sampleShop.getId())).thenReturn(true);

        FollowStatusResponse res = shopFollowerService.getFollowStatus(accountId, sampleShop.getId());
        assertTrue(res.isFollowing());
        assertEquals(20L, res.getFollowerCount());

        assertEquals(20L, shopFollowerService.getFollowerCount(sampleShop.getId()));

        // Exceptions when user or shop not found, and shop.getUser() == null
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> shopFollowerService.toggleFollowShop(accountId, sampleShop.getId()));

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> shopFollowerService.toggleFollowShop(accountId, sampleShop.getId()));

        sampleShop.setUser(null);
        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(shopFollowerRepository.findByUserIdAndShopId(sampleUser.getId(), sampleShop.getId())).thenReturn(Optional.empty());
        assertNotNull(shopFollowerService.toggleFollowShop(accountId, sampleShop.getId()));
    }
}
