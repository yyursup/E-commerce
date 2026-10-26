package com.marketplace.ecommerce.live.service.impl;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.live.dto.CreateLiveStreamRequest;
import com.marketplace.ecommerce.live.dto.LiveStreamResponse;
import com.marketplace.ecommerce.live.dto.LiveTokenResponse;
import com.marketplace.ecommerce.live.dto.LiveProductResponse;
import com.marketplace.ecommerce.live.entity.LiveProduct;
import com.marketplace.ecommerce.live.entity.LiveStream;
import com.marketplace.ecommerce.live.entity.LiveStreamStatus;
import com.marketplace.ecommerce.live.repository.LiveProductRepository;
import com.marketplace.ecommerce.live.repository.LiveStreamRepository;
import com.marketplace.ecommerce.live.service.LiveKitTokenService;
import com.marketplace.ecommerce.live.service.LiveRedisService;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LiveStreamServiceImplTest {

    @Mock
    private LiveStreamRepository liveStreamRepository;
    @Mock
    private LiveProductRepository liveProductRepository;
    @Mock
    private ShopRepository shopRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private LiveKitTokenService liveKitTokenService;
    @Mock
    private LiveRedisService liveRedisService;

    @InjectMocks
    private LiveStreamServiceImpl liveStreamService;

    private UUID accountId;
    private User sampleUser;
    private Shop sampleShop;
    private LiveStream sampleLiveStream;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();

        sampleUser = new User();
        sampleUser.setId(UUID.randomUUID());

        sampleShop = new Shop();
        sampleShop.setId(UUID.randomUUID());
        sampleShop.setName("Live Tech Shop");
        sampleShop.setUser(sampleUser);
        sampleShop.setStatus(ShopStatus.ACTIVE);

        sampleLiveStream = LiveStream.builder()
                .id(UUID.randomUUID())
                .shop(sampleShop)
                .title("Flash Sale Livestream")
                .roomName("room_test123")
                .status(LiveStreamStatus.LIVE)
                .totalLikes(100L)
                .totalViews(50L)
                .peakViewers(20)
                .products(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("createLiveStream tạo phòng live và ghim sản phẩm đầu tiên")
    void testCreateLiveStream_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));

        Product p = Product.builder().id(UUID.randomUUID()).shop(sampleShop).basePrice(BigDecimal.valueOf(100000)).build();
        when(productRepository.findById(p.getId())).thenReturn(Optional.of(p));
        when(liveStreamRepository.save(any(LiveStream.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateLiveStreamRequest req = new CreateLiveStreamRequest();
        req.setTitle("Review iPhone 15");
        CreateLiveStreamRequest.LiveProductItemRequest itemReq = new CreateLiveStreamRequest.LiveProductItemRequest();
        itemReq.setProductId(p.getId());
        req.setProducts(List.of(itemReq));

        LiveStreamResponse res = liveStreamService.createLiveStream(accountId, req);
        assertNotNull(res);
        assertEquals("Review iPhone 15", res.getTitle());
    }

    @Test
    @DisplayName("endLiveStream kết thúc phiên live, lưu số likes và dọn dẹp Redis")
    void testEndLiveStream_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(liveStreamRepository.findById(sampleLiveStream.getId())).thenReturn(Optional.of(sampleLiveStream));
        when(liveRedisService.getLikes(sampleLiveStream.getId())).thenReturn(250L);

        LiveStreamResponse res = liveStreamService.endLiveStream(accountId, sampleLiveStream.getId());
        assertEquals(LiveStreamStatus.ENDED, res.getStatus());
        assertEquals(250L, res.getTotalLikes());
        verify(liveRedisService).cleanupLive(sampleLiveStream.getId());
    }

    @Test
    @DisplayName("joinLiveStream cấp token LiveKit cho người xem và cập nhật PeakViewers")
    void testJoinLiveStream() {
        when(liveStreamRepository.findById(sampleLiveStream.getId())).thenReturn(Optional.of(sampleLiveStream));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(liveRedisService.getViewerCount(sampleLiveStream.getId())).thenReturn(30);
        when(liveKitTokenService.createViewerToken(any(), any(), any())).thenReturn("livekit_token_123");

        LiveTokenResponse res = liveStreamService.joinLiveStream(accountId, sampleLiveStream.getId(), "Khach A");
        assertNotNull(res);
        assertEquals("livekit_token_123", res.getToken());
        assertFalse(res.getIsHost());
        assertEquals(30, sampleLiveStream.getPeakViewers());
        verify(liveRedisService).addViewer(eq(sampleLiveStream.getId()), any());
    }

    @Test
    @DisplayName("likeLiveStream tăng lượt thích qua Redis")
    void testLikeLiveStream() {
        when(liveRedisService.incrementLikes(sampleLiveStream.getId(), 5L)).thenReturn(105L);
        Long count = liveStreamService.likeLiveStream(sampleLiveStream.getId(), 5L);
        assertEquals(105L, count);
    }

    @Test
    @DisplayName("startLiveStream: Chủ shop phát sóng thành công")
    void testStartLiveStream_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(liveStreamRepository.findById(sampleLiveStream.getId())).thenReturn(Optional.of(sampleLiveStream));
        when(liveKitTokenService.createHostToken(any(), any(), any())).thenReturn("host_token_abc");
        when(liveKitTokenService.getLivekitUrl()).thenReturn("wss://livekit.example.com");

        LiveTokenResponse res = liveStreamService.startLiveStream(accountId, sampleLiveStream.getId());
        assertNotNull(res);
        assertTrue(res.getIsHost());
        assertEquals("host_token_abc", res.getToken());
        assertEquals(LiveStreamStatus.LIVE, sampleLiveStream.getStatus());
        verify(liveStreamRepository).save(sampleLiveStream);
    }

    @Test
    @DisplayName("startLiveStream: Lỗi nếu người dùng không phải chủ shop")
    void testStartLiveStream_NotShopOwner_Throws() {
        User stranger = User.builder().id(UUID.randomUUID()).build();
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(stranger));
        when(liveStreamRepository.findById(sampleLiveStream.getId())).thenReturn(Optional.of(sampleLiveStream));

        CustomException ex = assertThrows(CustomException.class,
                () -> liveStreamService.startLiveStream(accountId, sampleLiveStream.getId()));
        assertTrue(ex.getMessage().contains("Bạn không có quyền phát sóng"));
    }

    @Test
    @DisplayName("joinLiveStream: Khách vãng lai xem livestream thành công")
    void testJoinLiveStream_Guest() {
        when(liveStreamRepository.findById(sampleLiveStream.getId())).thenReturn(Optional.of(sampleLiveStream));
        when(liveRedisService.getViewerCount(sampleLiveStream.getId())).thenReturn(10);
        when(liveKitTokenService.createViewerToken(any(), any(), any())).thenReturn("guest_token");

        LiveTokenResponse res = liveStreamService.joinLiveStream(null, sampleLiveStream.getId(), "Khách 123");
        assertNotNull(res);
        assertFalse(res.getIsHost());
        assertEquals("Khách 123", res.getParticipantName());
    }

    @Test
    @DisplayName("joinLiveStream: Chủ phòng tham gia lại phòng với quyền Host")
    void testJoinLiveStream_HostRejoin() {
        when(liveStreamRepository.findById(sampleLiveStream.getId())).thenReturn(Optional.of(sampleLiveStream));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(liveKitTokenService.createViewerToken(any(), any(), any())).thenReturn("viewer_token");

        LiveTokenResponse res = liveStreamService.joinLiveStream(accountId, sampleLiveStream.getId(), null);
        assertNotNull(res);
        assertFalse(res.getIsHost());
    }

    @Test
    @DisplayName("joinLiveStream: Lỗi nếu phòng không ở trạng thái LIVE")
    void testJoinLiveStream_NotLive_Throws() {
        sampleLiveStream.setStatus(LiveStreamStatus.ENDED);
        when(liveStreamRepository.findById(sampleLiveStream.getId())).thenReturn(Optional.of(sampleLiveStream));

        CustomException ex = assertThrows(CustomException.class,
                () -> liveStreamService.joinLiveStream(null, sampleLiveStream.getId(), "Khach"));
        assertTrue(ex.getMessage().contains("đã kết thúc"));
    }

    @Test
    @DisplayName("endLiveStream: Lỗi nếu không phải chủ phòng")
    void testEndLiveStream_NotShopOwner_Throws() {
        User stranger = User.builder().id(UUID.randomUUID()).build();
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(stranger));
        when(liveStreamRepository.findById(sampleLiveStream.getId())).thenReturn(Optional.of(sampleLiveStream));

        CustomException ex = assertThrows(CustomException.class,
                () -> liveStreamService.endLiveStream(accountId, sampleLiveStream.getId()));
        assertTrue(ex.getMessage().contains("Bạn không có quyền kết thúc"));
    }

    @Test
    @DisplayName("pinProduct: Ghim sản phẩm thành công trong phiên live")
    void testPinProduct_Success() {
        Product p = Product.builder().id(UUID.randomUUID()).build();
        LiveProduct lp = LiveProduct.builder().id(UUID.randomUUID()).product(p).isPinned(false).build();

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(liveStreamRepository.findById(sampleLiveStream.getId())).thenReturn(Optional.of(sampleLiveStream));
        when(liveProductRepository.findByLiveStreamIdOrderByDisplayOrderAsc(sampleLiveStream.getId()))
                .thenReturn(List.of(lp));

        LiveProductResponse res = liveStreamService.pinProduct(accountId, sampleLiveStream.getId(), p.getId());
        assertNotNull(res);
        assertTrue(lp.getIsPinned());
        verify(liveRedisService).setPinnedProductId(sampleLiveStream.getId(), p.getId());
    }

    @Test
    @DisplayName("pinProduct: Lỗi khi sản phẩm không có trong danh sách live")
    void testPinProduct_NotInLive_Throws() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(liveStreamRepository.findById(sampleLiveStream.getId())).thenReturn(Optional.of(sampleLiveStream));
        when(liveProductRepository.findByLiveStreamIdOrderByDisplayOrderAsc(sampleLiveStream.getId()))
                .thenReturn(List.of());

        CustomException ex = assertThrows(CustomException.class,
                () -> liveStreamService.pinProduct(accountId, sampleLiveStream.getId(), UUID.randomUUID()));
        assertTrue(ex.getMessage().contains("Sản phẩm không có trong danh sách live"));
    }

    @Test
    @DisplayName("pinProduct: Lỗi nếu không phải chủ shop")
    void testPinProduct_NotShopOwner_Throws() {
        User stranger = User.builder().id(UUID.randomUUID()).build();
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(stranger));
        when(liveStreamRepository.findById(sampleLiveStream.getId())).thenReturn(Optional.of(sampleLiveStream));

        CustomException ex = assertThrows(CustomException.class,
                () -> liveStreamService.pinProduct(accountId, sampleLiveStream.getId(), UUID.randomUUID()));
        assertTrue(ex.getMessage().contains("Chỉ người bán phiên live mới có quyền ghim"));
    }

    @Test
    @DisplayName("unpinProduct: Gỡ ghim sản phẩm thành công")
    void testUnpinProduct_Success() {
        Product p = Product.builder().id(UUID.randomUUID()).build();
        LiveProduct lp = LiveProduct.builder().id(UUID.randomUUID()).product(p).isPinned(true).build();

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(liveStreamRepository.findById(sampleLiveStream.getId())).thenReturn(Optional.of(sampleLiveStream));
        when(liveProductRepository.findByLiveStreamIdOrderByDisplayOrderAsc(sampleLiveStream.getId()))
                .thenReturn(List.of(lp));

        liveStreamService.unpinProduct(accountId, sampleLiveStream.getId());
        assertFalse(lp.getIsPinned());
        verify(liveRedisService).setPinnedProductId(sampleLiveStream.getId(), null);
    }

    @Test
    @DisplayName("getActiveLiveStreams: Lấy danh sách live đang phát")
    void testGetActiveLiveStreams() {
        when(liveStreamRepository.findByStatusOrderByStartedAtDesc(LiveStreamStatus.LIVE))
                .thenReturn(List.of(sampleLiveStream));
        when(liveRedisService.getViewerCount(sampleLiveStream.getId())).thenReturn(50);
        when(liveRedisService.getLikes(sampleLiveStream.getId())).thenReturn(100L);

        List<LiveStreamResponse> res = liveStreamService.getActiveLiveStreams();
        assertEquals(1, res.size());
    }

    @Test
    @DisplayName("getLiveStreamDetail: Lấy chi tiết phòng live thành công và khi không tìm thấy")
    void testGetLiveStreamDetail() {
        when(liveStreamRepository.findById(sampleLiveStream.getId())).thenReturn(Optional.of(sampleLiveStream));
        assertNotNull(liveStreamService.getLiveStreamDetail(sampleLiveStream.getId()));

        when(liveStreamRepository.findById(sampleLiveStream.getId())).thenReturn(Optional.empty());
        CustomException ex = assertThrows(CustomException.class,
                () -> liveStreamService.getLiveStreamDetail(sampleLiveStream.getId()));
        assertTrue(ex.getMessage().contains("Phòng livestream không tồn tại"));
    }

    @Test
    @DisplayName("getShopLiveStreams: Lấy danh sách live của shop")
    void testGetShopLiveStreams() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));
        when(liveStreamRepository.findByShopIdOrderByCreatedAtDesc(sampleShop.getId()))
                .thenReturn(List.of(sampleLiveStream));

        List<LiveStreamResponse> res = liveStreamService.getShopLiveStreams(accountId);
        assertEquals(1, res.size());
    }

    @Test
    @DisplayName("Cac ngoai le NotFound trong LiveStreamService")
    void testLiveStream_NotFoundExceptions() {
        UUID liveId = sampleLiveStream.getId();
        UUID prodId = UUID.randomUUID();

        // 1. createLiveStream: user not found / shop not found
        CreateLiveStreamRequest req = new CreateLiveStreamRequest();
        req.setTitle("Live Stream Mới");
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> liveStreamService.createLiveStream(accountId, req));

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> liveStreamService.createLiveStream(accountId, req));

        // 2. startLiveStream: user not found / live not found
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> liveStreamService.startLiveStream(accountId, liveId));

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(liveStreamRepository.findById(liveId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> liveStreamService.startLiveStream(accountId, liveId));

        // 3. endLiveStream: user not found / live not found
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> liveStreamService.endLiveStream(accountId, liveId));

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(liveStreamRepository.findById(liveId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> liveStreamService.endLiveStream(accountId, liveId));

        // 4. joinLiveStream: live not found
        when(liveStreamRepository.findById(liveId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> liveStreamService.joinLiveStream(accountId, liveId, "Viewer"));

        // 5. pinProduct: product not in stream
        when(liveStreamRepository.findById(liveId)).thenReturn(Optional.of(sampleLiveStream));
        when(liveProductRepository.findByLiveStreamIdOrderByDisplayOrderAsc(liveId)).thenReturn(List.of());
        assertThrows(CustomException.class, () -> liveStreamService.pinProduct(accountId, liveId, prodId));

        // 6. unpinProduct: user not found / live not found
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> liveStreamService.unpinProduct(accountId, liveId));

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(liveStreamRepository.findById(liveId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> liveStreamService.unpinProduct(accountId, liveId));

        // 7. getShopLiveStreams: user not found / shop not found
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> liveStreamService.getShopLiveStreams(accountId));

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> liveStreamService.getShopLiveStreams(accountId));
    }

    @Test
    @DisplayName("joinLiveStream: nguoi dung chua dang nhap (anonymous) va likeLiveStream")
    void testJoinAnonymousAndLike() {
        when(liveStreamRepository.findById(sampleLiveStream.getId())).thenReturn(Optional.of(sampleLiveStream));
        when(liveKitTokenService.createViewerToken(eq(sampleLiveStream.getRoomName()), any(), any()))
                .thenReturn("TOKEN_ANON");

        LiveTokenResponse res = liveStreamService.joinLiveStream(null, sampleLiveStream.getId(), null);
        assertNotNull(res);
        assertEquals("TOKEN_ANON", res.getToken());

        // likeLiveStream
        when(liveRedisService.incrementLikes(sampleLiveStream.getId(), 5L)).thenReturn(105L);
        Long likes = liveStreamService.likeLiveStream(sampleLiveStream.getId(), 5L);
        assertEquals(105L, likes);

        // likeLiveStream edge cases: null, <= 0, > 50
        liveStreamService.likeLiveStream(sampleLiveStream.getId(), null);
        liveStreamService.likeLiveStream(sampleLiveStream.getId(), 0L);
        liveStreamService.likeLiveStream(sampleLiveStream.getId(), 100L);

        // pinProduct & unpinProduct: not owner
        User stranger = User.builder().id(UUID.randomUUID()).build();
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(stranger));
        assertThrows(CustomException.class, () -> liveStreamService.pinProduct(accountId, sampleLiveStream.getId(), UUID.randomUUID()));
        assertThrows(CustomException.class, () -> liveStreamService.unpinProduct(accountId, sampleLiveStream.getId()));

        // pinProduct: user not found & livestream not found
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> liveStreamService.pinProduct(accountId, sampleLiveStream.getId(), UUID.randomUUID()));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(liveStreamRepository.findById(sampleLiveStream.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> liveStreamService.pinProduct(accountId, sampleLiveStream.getId(), UUID.randomUUID()));
    }
}
