package com.marketplace.ecommerce.live.dto;

import com.marketplace.ecommerce.live.entity.LiveStream;
import com.marketplace.ecommerce.live.entity.LiveStreamStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
public class LiveStreamResponse {
    private UUID id;
    private UUID shopId;
    private String shopName;
    private String shopLogoUrl;
    private String title;
    private String coverImageUrl;
    private String roomName;
    private LiveStreamStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Long totalLikes;
    private Long totalViews;
    private Integer currentViewers;
    private List<LiveProductResponse> products;
    private LiveProductResponse pinnedProduct;

    public static LiveStreamResponse fromEntity(LiveStream ls, Integer currentViewers, Long currentLikes) {
        List<LiveProductResponse> prodList = ls.getProducts() == null ? List.of() :
                ls.getProducts().stream().map(LiveProductResponse::fromEntity).collect(Collectors.toList());

        LiveProductResponse pinned = prodList.stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsPinned()))
                .findFirst()
                .orElse(null);

        return LiveStreamResponse.builder()
                .id(ls.getId())
                .shopId(ls.getShop().getId())
                .shopName(ls.getShop().getName())
                .shopLogoUrl(ls.getShop().getLogoUrl())
                .title(ls.getTitle())
                .coverImageUrl(ls.getCoverImageUrl())
                .roomName(ls.getRoomName())
                .status(ls.getStatus())
                .startedAt(ls.getStartedAt())
                .endedAt(ls.getEndedAt())
                .totalLikes(currentLikes != null ? currentLikes : (ls.getTotalLikes() != null ? ls.getTotalLikes() : 0L))
                .totalViews(ls.getTotalViews() != null ? ls.getTotalViews() : 0L)
                .currentViewers(currentViewers != null ? currentViewers : 0)
                .products(prodList)
                .pinnedProduct(pinned)
                .build();
    }
}
