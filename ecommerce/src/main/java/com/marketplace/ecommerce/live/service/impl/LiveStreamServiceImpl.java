package com.marketplace.ecommerce.live.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.live.dto.*;
import com.marketplace.ecommerce.live.entity.LiveProduct;
import com.marketplace.ecommerce.live.entity.LiveStream;
import com.marketplace.ecommerce.live.entity.LiveStreamStatus;
import com.marketplace.ecommerce.live.repository.LiveProductRepository;
import com.marketplace.ecommerce.live.repository.LiveStreamRepository;
import com.marketplace.ecommerce.live.service.LiveKitTokenService;
import com.marketplace.ecommerce.live.service.LiveRedisService;
import com.marketplace.ecommerce.live.service.LiveStreamService;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LiveStreamServiceImpl implements LiveStreamService {

    private final LiveStreamRepository liveStreamRepository;
    private final LiveProductRepository liveProductRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final LiveKitTokenService liveKitTokenService;
    private final LiveRedisService liveRedisService;

    @Override
    @Transactional
    public LiveStreamResponse createLiveStream(UUID accountId, CreateLiveStreamRequest request) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Tài khoản không tồn tại"));

        Shop shop = shopRepository.findByUserId(user.getId())
                .orElseThrow(() -> new CustomException("Chỉ người bán có gian hàng mới có thể tạo livestream"));

        // Generate a unique clean room name
        String roomName = "room_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        LiveStream liveStream = LiveStream.builder()
                .shop(shop)
                .title(request.getTitle())
                .coverImageUrl(request.getCoverImageUrl())
                .roomName(roomName)
                .status(LiveStreamStatus.CREATED)
                .totalLikes(0L)
                .totalViews(0L)
                .peakViewers(0)
                .createdAt(LocalDateTime.now())
                .build();

        if (request.getProducts() != null && !request.getProducts().isEmpty()) {
            List<LiveProduct> liveProducts = new ArrayList<>();
            int order = 0;
            for (CreateLiveStreamRequest.LiveProductItemRequest item : request.getProducts()) {
                Product product = productRepository.findById(item.getProductId())
                        .orElse(null);
                if (product != null && product.getShop().getId().equals(shop.getId())) {
                    liveProducts.add(LiveProduct.builder()
                            .liveStream(liveStream)
                            .product(product)
                            .livePrice(item.getLivePrice() != null ? item.getLivePrice() : product.getBasePrice())
                            .isPinned(order == 0) // Pin the first product by default
                            .pinnedAt(order == 0 ? LocalDateTime.now() : null)
                            .displayOrder(order++)
                            .createdAt(LocalDateTime.now())
                            .build());
                }
            }
            liveStream.setProducts(liveProducts);
        }

        liveStreamRepository.save(liveStream);

        return LiveStreamResponse.fromEntity(liveStream, 0, 0L);
    }

    @Override
    @Transactional
    public LiveTokenResponse startLiveStream(UUID accountId, UUID liveStreamId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Tài khoản không tồn tại"));

        LiveStream liveStream = liveStreamRepository.findById(liveStreamId)
                .orElseThrow(() -> new CustomException("Phòng livestream không tồn tại"));

        if (!liveStream.getShop().getUser().getId().equals(user.getId())) {
            throw new CustomException("Bạn không có quyền phát sóng phiên live này");
        }

        liveStream.setStatus(LiveStreamStatus.LIVE);
        if (liveStream.getStartedAt() == null) {
            liveStream.setStartedAt(LocalDateTime.now());
        }
        liveStreamRepository.save(liveStream);

        // Host LiveKit token
        String hostIdentity = "host_" + user.getId().toString();
        String hostToken = liveKitTokenService.createHostToken(
                liveStream.getRoomName(),
                hostIdentity,
                liveStream.getShop().getName() + " (Host)"
        );

        return LiveTokenResponse.builder()
                .token(hostToken)
                .livekitUrl(liveKitTokenService.getLivekitUrl())
                .liveKitUrl(liveKitTokenService.getLivekitUrl())
                .roomName(liveStream.getRoomName())
                .participantIdentity(hostIdentity)
                .participantName(liveStream.getShop().getName())
                .isHost(true)
                .liveStream(LiveStreamResponse.fromEntity(liveStream, liveRedisService.getViewerCount(liveStream.getId()), liveRedisService.getLikes(liveStream.getId())))
                .build();
    }

    @Override
    @Transactional
    public LiveStreamResponse endLiveStream(UUID accountId, UUID liveStreamId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Tài khoản không tồn tại"));

        LiveStream liveStream = liveStreamRepository.findById(liveStreamId)
                .orElseThrow(() -> new CustomException("Phòng livestream không tồn tại"));

        if (!liveStream.getShop().getUser().getId().equals(user.getId())) {
            throw new CustomException("Bạn không có quyền kết thúc phiên live này");
        }

        liveStream.setStatus(LiveStreamStatus.ENDED);
        liveStream.setEndedAt(LocalDateTime.now());

        // Sync final likes and clean redis
        Long finalLikes = liveRedisService.getLikes(liveStream.getId());
        liveStream.setTotalLikes(Math.max(liveStream.getTotalLikes() != null ? liveStream.getTotalLikes() : 0L, finalLikes));
        liveStreamRepository.save(liveStream);

        liveRedisService.cleanupLive(liveStream.getId());

        return LiveStreamResponse.fromEntity(liveStream, 0, finalLikes);
    }

    @Override
    @Transactional
    public LiveTokenResponse joinLiveStream(UUID accountId, UUID liveStreamId, String guestName) {
        LiveStream liveStream = liveStreamRepository.findById(liveStreamId)
                .orElseThrow(() -> new CustomException("Phòng livestream không tồn tại"));

        if (liveStream.getStatus() == LiveStreamStatus.ENDED) {
            throw new CustomException("Phiên livestream này đã kết thúc");
        }

        String participantId;
        String participantName;

        if (accountId != null) {
            User user = userRepository.findByAccountId(accountId).orElse(null);
            String userIdStr = user != null ? user.getId().toString() : UUID.randomUUID().toString();
            participantId = "viewer_" + userIdStr.substring(0, Math.min(8, userIdStr.length())) + "_" + UUID.randomUUID().toString().substring(0, 6);
            participantName = (user != null && user.getFullName() != null && !user.getFullName().isBlank())
                    ? user.getFullName()
                    : "Khách hàng " + participantId.substring(7, 11);
        } else {
            participantId = "guest_" + UUID.randomUUID().toString().substring(0, 8);
            participantName = (guestName != null && !guestName.isBlank()) ? guestName : "Khách xem " + participantId.substring(6);
        }

        // Increase total views counter
        liveStream.setTotalViews((liveStream.getTotalViews() != null ? liveStream.getTotalViews() : 0L) + 1);
        liveStreamRepository.save(liveStream);

        // Track active viewer in Redis
        liveRedisService.addViewer(liveStream.getId(), participantId);
        int currentViewers = liveRedisService.getViewerCount(liveStream.getId());
        if (currentViewers > (liveStream.getPeakViewers() != null ? liveStream.getPeakViewers() : 0)) {
            liveStream.setPeakViewers(currentViewers);
            liveStreamRepository.save(liveStream);
        }

        String viewerToken = liveKitTokenService.createViewerToken(
                liveStream.getRoomName(),
                participantId,
                participantName
        );

        Long currentLikes = liveRedisService.getLikes(liveStream.getId());

        return LiveTokenResponse.builder()
                .token(viewerToken)
                .livekitUrl(liveKitTokenService.getLivekitUrl())
                .liveKitUrl(liveKitTokenService.getLivekitUrl())
                .roomName(liveStream.getRoomName())
                .participantIdentity(participantId)
                .participantName(participantName)
                .isHost(false)
                .liveStream(LiveStreamResponse.fromEntity(liveStream, currentViewers, currentLikes))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LiveStreamResponse> getActiveLiveStreams() {
        List<LiveStream> activeStreams = liveStreamRepository.findByStatusOrderByStartedAtDesc(LiveStreamStatus.LIVE);
        return activeStreams.stream().map(ls -> {
            Integer viewers = liveRedisService.getViewerCount(ls.getId());
            Long likes = liveRedisService.getLikes(ls.getId());
            return LiveStreamResponse.fromEntity(ls, viewers, likes);
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public LiveStreamResponse getLiveStreamDetail(UUID liveStreamId) {
        LiveStream liveStream = liveStreamRepository.findById(liveStreamId)
                .orElseThrow(() -> new CustomException("Phòng livestream không tồn tại"));

        Integer viewers = liveRedisService.getViewerCount(liveStream.getId());
        Long likes = liveRedisService.getLikes(liveStream.getId());
        return LiveStreamResponse.fromEntity(liveStream, viewers, likes);
    }

    @Override
    @Transactional
    public LiveProductResponse pinProduct(UUID accountId, UUID liveStreamId, UUID productId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Tài khoản không tồn tại"));

        LiveStream liveStream = liveStreamRepository.findById(liveStreamId)
                .orElseThrow(() -> new CustomException("Phòng livestream không tồn tại"));

        if (!liveStream.getShop().getUser().getId().equals(user.getId())) {
            throw new CustomException("Chỉ người bán phiên live mới có quyền ghim sản phẩm");
        }

        // Unpin all other products in this livestream
        List<LiveProduct> products = liveProductRepository.findByLiveStreamIdOrderByDisplayOrderAsc(liveStreamId);
        LiveProduct target = null;
        for (LiveProduct p : products) {
            if (p.getProduct().getId().equals(productId)) {
                p.setIsPinned(true);
                p.setPinnedAt(LocalDateTime.now());
                target = p;
            } else {
                p.setIsPinned(false);
            }
        }
        liveProductRepository.saveAll(products);

        if (target != null) {
            liveRedisService.setPinnedProductId(liveStreamId, productId);
            return LiveProductResponse.fromEntity(target);
        } else {
            throw new CustomException("Sản phẩm không có trong danh sách live này");
        }
    }

    @Override
    @Transactional
    public void unpinProduct(UUID accountId, UUID liveStreamId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Tài khoản không tồn tại"));

        LiveStream liveStream = liveStreamRepository.findById(liveStreamId)
                .orElseThrow(() -> new CustomException("Phòng livestream không tồn tại"));

        if (!liveStream.getShop().getUser().getId().equals(user.getId())) {
            throw new CustomException("Chỉ người bán phiên live mới có quyền gỡ ghim sản phẩm");
        }

        List<LiveProduct> products = liveProductRepository.findByLiveStreamIdOrderByDisplayOrderAsc(liveStreamId);
        for (LiveProduct p : products) {
            p.setIsPinned(false);
        }
        liveProductRepository.saveAll(products);
        liveRedisService.setPinnedProductId(liveStreamId, null);
    }

    @Override
    public Long likeLiveStream(UUID liveStreamId, Long count) {
        long addCount = (count != null && count > 0 && count <= 50) ? count : 1L;
        return liveRedisService.incrementLikes(liveStreamId, addCount);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LiveStreamResponse> getShopLiveStreams(UUID accountId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Tài khoản không tồn tại"));

        Shop shop = shopRepository.findByUserId(user.getId())
                .orElseThrow(() -> new CustomException("Bạn chưa mở gian hàng"));

        List<LiveStream> streams = liveStreamRepository.findByShopIdOrderByCreatedAtDesc(shop.getId());
        return streams.stream().map(ls -> {
            Integer viewers = liveRedisService.getViewerCount(ls.getId());
            Long likes = liveRedisService.getLikes(ls.getId());
            return LiveStreamResponse.fromEntity(ls, viewers, likes);
        }).collect(Collectors.toList());
    }
}
