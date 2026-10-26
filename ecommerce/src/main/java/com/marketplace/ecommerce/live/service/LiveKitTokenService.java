package com.marketplace.ecommerce.live.service;

import io.livekit.server.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LiveKitTokenService {

    @Value("${livekit.url:}")
    private String livekitUrl;

    @Value("${livekit.api-key:}")
    private String apiKey;

    @Value("${livekit.api-secret:}")
    private String apiSecret;

    // Token TTL: 1 hour for security (reduce from 6 hours)
    private static final long TOKEN_TTL_SECONDS = 3600;

    // Cache tokens to avoid generating same token repeatedly within TTL window
    private final Map<String, String> tokenCache = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        if (livekitUrl == null || livekitUrl.isBlank()) {
            throw new IllegalStateException("LiveKit URL must be configured via livekit.url property");
        }
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("LiveKit API key must be configured via livekit.api-key property");
        }
        if (apiSecret == null || apiSecret.isBlank()) {
            throw new IllegalStateException("LiveKit API secret must be configured via livekit.api-secret property");
        }
    }

    public String getLivekitUrl() {
        return livekitUrl;
    }

    public String createHostToken(String roomName, String participantIdentity, String participantName) {
        validateCredentials();

        String cacheKey = "host_" + roomName + "_" + participantIdentity;
        String cachedToken = tokenCache.get(cacheKey);
        if (cachedToken != null) {
            return cachedToken;
        }

        AccessToken token = new AccessToken(apiKey, apiSecret);
        token.setName(participantName);
        token.setIdentity(participantIdentity);
        token.setTtl(TOKEN_TTL_SECONDS);

        token.addGrants(
                new RoomJoin(true),
                new RoomName(roomName),
                new CanPublish(true),
                new CanSubscribe(true),
                new CanPublishData(true)
        );

        String jwt = token.toJwt();
        tokenCache.put(cacheKey, jwt);
        return jwt;
    }

    public String createViewerToken(String roomName, String participantIdentity, String participantName) {
        validateCredentials();

        String cacheKey = "viewer_" + roomName + "_" + participantIdentity;
        String cachedToken = tokenCache.get(cacheKey);
        if (cachedToken != null) {
            return cachedToken;
        }

        AccessToken token = new AccessToken(apiKey, apiSecret);
        token.setName(participantName);
        token.setIdentity(participantIdentity);
        token.setTtl(TOKEN_TTL_SECONDS);

        token.addGrants(
                new RoomJoin(true),
                new RoomName(roomName),
                new CanPublish(false),
                new CanSubscribe(true),
                new CanPublishData(true)
        );

        String jwt = token.toJwt();
        tokenCache.put(cacheKey, jwt);
        return jwt;
    }

    private void validateCredentials() {
        if (apiKey == null || apiKey.isBlank() || apiSecret == null || apiSecret.isBlank()) {
            throw new IllegalStateException("LiveKit credentials not configured. Please set livekit.api-key and livekit.api-secret properties.");
        }
    }

    /**
     * Clear token cache (useful for testing or when credentials change)
     */
    public void clearCache() {
        tokenCache.clear();
    }
}
