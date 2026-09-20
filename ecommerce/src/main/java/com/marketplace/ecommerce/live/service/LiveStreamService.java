package com.marketplace.ecommerce.live.service;

import com.marketplace.ecommerce.live.dto.*;

import java.util.List;
import java.util.UUID;

public interface LiveStreamService {

    LiveStreamResponse createLiveStream(UUID accountId, CreateLiveStreamRequest request);

    LiveTokenResponse startLiveStream(UUID accountId, UUID liveStreamId);

    LiveStreamResponse endLiveStream(UUID accountId, UUID liveStreamId);

    LiveTokenResponse joinLiveStream(UUID accountId, UUID liveStreamId, String guestName);

    List<LiveStreamResponse> getActiveLiveStreams();

    LiveStreamResponse getLiveStreamDetail(UUID liveStreamId);

    LiveProductResponse pinProduct(UUID accountId, UUID liveStreamId, UUID productId);

    void unpinProduct(UUID accountId, UUID liveStreamId);

    Long likeLiveStream(UUID liveStreamId, Long count);

    List<LiveStreamResponse> getShopLiveStreams(UUID accountId);
}
