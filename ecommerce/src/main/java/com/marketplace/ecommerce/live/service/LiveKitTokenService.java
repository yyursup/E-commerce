package com.marketplace.ecommerce.live.service;

import io.livekit.server.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class LiveKitTokenService {

    @Value("${livekit.url:wss://project-e-commerce-eqw785us.livekit.cloud}")
    private String livekitUrl;

    @Value("${livekit.api-key:APIsWoFD3phQhq7}")
    private String apiKey;

    @Value("${livekit.api-secret:QJJyDQuZpwca6Q8lomf83YyNdPA2w8FnAYlV7R0rBTd}")
    private String apiSecret;

    public String getLivekitUrl() {
        return livekitUrl;
    }

    public String createHostToken(String roomName, String participantIdentity, String participantName) {
        AccessToken token = new AccessToken(apiKey, apiSecret);
        token.setName(participantName);
        token.setIdentity(participantIdentity);
        token.setTtl(6 * 3600); // 6 hours

        token.addGrants(
                new RoomJoin(true),
                new RoomName(roomName),
                new CanPublish(true),
                new CanSubscribe(true),
                new CanPublishData(true)
        );
        return token.toJwt();
    }

    public String createViewerToken(String roomName, String participantIdentity, String participantName) {
        AccessToken token = new AccessToken(apiKey, apiSecret);
        token.setName(participantName);
        token.setIdentity(participantIdentity);
        token.setTtl(6 * 3600); // 6 hours

        token.addGrants(
                new RoomJoin(true),
                new RoomName(roomName),
                new CanPublish(false),
                new CanSubscribe(true),
                new CanPublishData(true)
        );
        return token.toJwt();
    }
}
