package com.marketplace.ecommerce.chat.service;

import com.marketplace.ecommerce.chat.dto.ChatMessageResponse;
import com.marketplace.ecommerce.chat.dto.ChatThreadResponse;
import com.marketplace.ecommerce.chat.dto.SendMessageRequest;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface ChatService {

    List<ChatThreadResponse> getThreads(CurrentUserInfo principal);

    ChatThreadResponse getOrCreateSupportThread(CurrentUserInfo principal);

    ChatThreadResponse getOrCreateShopThread(CurrentUserInfo principal, UUID shopId);

    ChatThreadResponse getThreadById(CurrentUserInfo principal, UUID threadId);

    Page<ChatMessageResponse> getMessages(CurrentUserInfo principal, UUID threadId, int page, int size);

    ChatMessageResponse sendMessage(CurrentUserInfo principal, SendMessageRequest request);

    ChatMessageResponse sendImageMessage(CurrentUserInfo principal, UUID threadId, MultipartFile file);

    void markRead(CurrentUserInfo principal, UUID threadId);

    void closeThread(CurrentUserInfo principal, UUID threadId);
}
