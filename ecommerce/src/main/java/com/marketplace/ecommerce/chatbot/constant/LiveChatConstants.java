package com.marketplace.ecommerce.chatbot.constant;

/**
 * Shared constants for live chat (STOMP topics). Used by controller, service, and clients.
 */
public final class LiveChatConstants {

    private LiveChatConstants() {}

    /** Topic where customer messages are broadcast for admin UI. */
    public static final String TOPIC_ADMIN_LIVE_CHAT = "/topic/admin/live-chat";

    /** Prefix for admin→customer reply topic. Full destination: TOPIC_LIVE_CHAT_REPLY_PREFIX + sessionId */
    public static final String TOPIC_LIVE_CHAT_REPLY_PREFIX = "/topic/live-chat-reply/";
}
