package com.marketplace.ecommerce.live.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LiveTokenResponse {
    private String token;

    @com.fasterxml.jackson.annotation.JsonProperty("liveKitUrl")
    private String liveKitUrl;

    @com.fasterxml.jackson.annotation.JsonProperty("livekitUrl")
    private String livekitUrl;

    private String roomName;
    private String participantIdentity;
    private String participantName;
    private Boolean isHost;
    private LiveStreamResponse liveStream;
}
