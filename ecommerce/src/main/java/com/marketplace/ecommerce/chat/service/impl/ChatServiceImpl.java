package com.marketplace.ecommerce.chat.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.chat.dto.ChatMessageResponse;
import com.marketplace.ecommerce.chat.dto.ChatThreadResponse;
import com.marketplace.ecommerce.chat.dto.SendMessageRequest;
import com.marketplace.ecommerce.chat.entity.ChatMessage;
import com.marketplace.ecommerce.chat.entity.ChatThread;
import com.marketplace.ecommerce.chat.enums.ChatMessageType;
import com.marketplace.ecommerce.chat.enums.ThreadStatus;
import com.marketplace.ecommerce.chat.enums.ThreadType;
import com.marketplace.ecommerce.chat.repository.ChatMessageRepository;
import com.marketplace.ecommerce.chat.repository.ChatThreadRepository;
import com.marketplace.ecommerce.chat.service.ChatService;
import com.marketplace.ecommerce.chat.websocket.WebSocketSessionService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.file.service.FileService;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final ChatThreadRepository chatThreadRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ReportRepository reportRepository;
    private final FileService fileService;
    private final WebSocketSessionService webSocketSessionService;

    @Override
    @Transactional(readOnly = true)
    public List<ChatThreadResponse> getThreads(CurrentUserInfo principal) {
        return getThreads(principal, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatThreadResponse> getThreads(CurrentUserInfo principal, String type) {
        if (principal == null || principal.getAccountId() == null) {
            throw new CustomException("Vui lòng đăng nhập để xem danh sách chat");
        }

        boolean isAdmin = checkIsAdmin(principal.getRole());
        List<ChatThread> threads;

        if (isAdmin) {
            if ("ALL".equalsIgnoreCase(type)) {
                threads = chatThreadRepository.findAllOrderByLastMessageAtDesc();
            } else if ("DISPUTE".equalsIgnoreCase(type)) {
                threads = chatThreadRepository.findByType(ThreadType.DISPUTE);
            } else if ("SHOP".equalsIgnoreCase(type) || "SELLER".equalsIgnoreCase(type)) {
                threads = chatThreadRepository.findByType(ThreadType.SHOP);
            } else {
                threads = chatThreadRepository.findByType(ThreadType.SUPPORT);
            }
        } else if ("DISPUTE".equalsIgnoreCase(type)) {
            Optional<User> userOpt = userRepository.findByAccountId(principal.getAccountId());
            Shop shop = userOpt.flatMap(u -> shopRepository.findByUserId(u.getId())).orElse(null);
            if (shop != null) {
                threads = chatThreadRepository.findByShopId(shop.getId()).stream()
                        .filter(t -> t.getType() == ThreadType.DISPUTE)
                        .collect(Collectors.toList());
            } else {
                threads = chatThreadRepository.findByCustomerId(principal.getAccountId()).stream()
                        .filter(t -> t.getType() == ThreadType.DISPUTE)
                        .collect(Collectors.toList());
            }
        } else if ("SHOP".equalsIgnoreCase(type) || "SELLER".equalsIgnoreCase(type)) {
            Optional<User> userOpt = userRepository.findByAccountId(principal.getAccountId());
            Shop shop = userOpt.flatMap(u -> shopRepository.findByUserId(u.getId())).orElse(null);
            if (shop != null) {
                threads = chatThreadRepository.findByShopId(shop.getId());
            } else {
                threads = List.of();
            }
        } else {
            // Default or "CUSTOMER": Always return customer threads for current user
            threads = chatThreadRepository.findByCustomerId(principal.getAccountId());
        }

        // Filter out any self-chat threads where customer is also the shop owner
        threads = threads.stream()
                .filter(t -> !(t.getType() == ThreadType.SHOP
                        && t.getShop() != null
                        && t.getShop().getUser() != null
                        && t.getShop().getUser().getAccount() != null
                        && t.getCustomer() != null
                        && t.getCustomer().getId().equals(t.getShop().getUser().getAccount().getId())))
                .collect(Collectors.toList());

        return threads.stream()
                .map(t -> ChatThreadResponse.from(t, principal.getAccountId(), isAdmin))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ChatThreadResponse getOrCreateSupportThread(CurrentUserInfo principal) {
        if (principal == null || principal.getAccountId() == null) {
            throw new CustomException("Vui lòng đăng nhập để bắt đầu hỗ trợ trực tuyến");
        }

        UUID accountId = principal.getAccountId();
        Optional<ChatThread> existingOpt = chatThreadRepository.findFirstByCustomer_IdAndTypeAndStatus(
                accountId, ThreadType.SUPPORT, ThreadStatus.OPEN);

        if (existingOpt.isPresent()) {
            return ChatThreadResponse.from(existingOpt.get(), accountId, false);
        }

        Account customer = accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy tài khoản người dùng"));

        Optional<User> userOpt = userRepository.findByAccountId(accountId);
        String customerName = userOpt.map(User::getFullName).filter(s -> !s.isBlank()).orElse(customer.getUsername());
        String customerAvatar = userOpt.map(User::getAvatarUrl).orElse(null);

        ChatThread newThread = ChatThread.builder()
                .type(ThreadType.SUPPORT)
                .customer(customer)
                .customerName(customerName)
                .customerAvatar(customerAvatar)
                .title("Hỗ trợ: " + customerName)
                .status(ThreadStatus.OPEN)
                .unreadCustomer(0)
                .unreadAdmin(0)
                .createdAt(LocalDateTime.now())
                .build();

        ChatThread saved = chatThreadRepository.save(newThread);
        ChatThreadResponse response = ChatThreadResponse.from(saved, accountId, false);

        // Notify admins of new support thread
        webSocketSessionService.broadcastToAdmins("CHAT_THREAD_NEW", response);

        return response;
    }

    @Override
    @Transactional
    public ChatThreadResponse getOrCreateShopThread(CurrentUserInfo principal, String shopIdStr) {
        if (shopIdStr == null || shopIdStr.isBlank()) {
            throw new CustomException("Mã Shop không hợp lệ");
        }

        UUID resolvedShopId = null;
        try {
            resolvedShopId = UUID.fromString(shopIdStr);
        } catch (IllegalArgumentException e) {
            // Not a UUID string, search by shop name or fallback to first available shop in
            // DB
            Optional<Shop> matchingShop = shopRepository.findAll().stream()
                    .filter(s -> s.getName() != null && (s.getName().equalsIgnoreCase(shopIdStr) ||
                            s.getName().toLowerCase().contains(shopIdStr.toLowerCase()) ||
                            shopIdStr.toLowerCase().contains(s.getName().toLowerCase())))
                    .findFirst();

            if (matchingShop.isPresent()) {
                resolvedShopId = matchingShop.get().getId();
            } else {
                resolvedShopId = shopRepository.findAll().stream()
                        .findFirst()
                        .map(Shop::getId)
                        .orElse(null);
            }
        }

        if (resolvedShopId == null) {
            throw new CustomException("Không tìm thấy Shop phù hợp trên hệ thống");
        }

        return getOrCreateShopThread(principal, resolvedShopId);
    }

    @Override
    @Transactional
    public ChatThreadResponse getOrCreateShopThread(CurrentUserInfo principal, UUID shopId) {
        if (principal == null || principal.getAccountId() == null) {
            throw new CustomException("Vui lòng đăng nhập để chat với Shop");
        }

        Shop shop = shopRepository.findById(shopId).orElseGet(() -> shopRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new CustomException("Không tìm thấy Shop")));

        UUID accountId = principal.getAccountId();

        // Prevent self-chat: shop owner cannot create a chat thread with their own shop
        if (shop.getUser() != null && shop.getUser().getAccount() != null
                && shop.getUser().getAccount().getId().equals(accountId)) {
            throw new CustomException("Bạn không thể tự nhắn tin cho chính gian hàng của mình");
        }

        Optional<ChatThread> existingOpt = chatThreadRepository.findFirstByCustomer_IdAndShop_IdAndStatus(
                accountId, shop.getId(), ThreadStatus.OPEN);

        if (existingOpt.isPresent()) {
            return ChatThreadResponse.from(existingOpt.get(), accountId, false);
        }

        Account customer = accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy tài khoản người dùng"));

        Optional<User> userOpt = userRepository.findByAccountId(accountId);
        String customerName = userOpt.map(User::getFullName).filter(s -> !s.isBlank()).orElse(customer.getUsername());
        String customerAvatar = userOpt.map(User::getAvatarUrl).orElse(null);

        ChatThread newThread = ChatThread.builder()
                .type(ThreadType.SHOP)
                .customer(customer)
                .customerName(customerName)
                .customerAvatar(customerAvatar)
                .shop(shop)
                .title("Chat với " + shop.getName())
                .status(ThreadStatus.OPEN)
                .unreadCustomer(0)
                .unreadAdmin(0)
                .createdAt(LocalDateTime.now())
                .build();

        ChatThread saved = chatThreadRepository.save(newThread);
        return ChatThreadResponse.from(saved, accountId, false);
    }

    @Override
    @Transactional(readOnly = true)
    public ChatThreadResponse getThreadById(CurrentUserInfo principal, UUID threadId) {
        ChatThread thread = requireParticipantThread(principal, threadId);

        boolean isAdmin = checkIsAdmin(principal.getRole());
        return ChatThreadResponse.from(thread, principal.getAccountId(), isAdmin);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getMessages(CurrentUserInfo principal, UUID threadId, int page, int size) {
        requireParticipantThread(principal, threadId);

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return chatMessageRepository.findByThread_IdOrderByCreatedAtDesc(threadId, pageRequest)
                .map(ChatMessageResponse::from);
    }

    @Override
    @Transactional
    public ChatMessageResponse sendMessage(CurrentUserInfo principal, SendMessageRequest request) {
        if (principal == null || principal.getAccountId() == null) {
            throw new CustomException("Chưa xác thực");
        }

        ChatThread thread = requireParticipantThread(principal, request.getThreadId());

        if (thread.isLocked()) {
            throw new CustomException("Phòng thương lượng tranh chấp đã đóng, không thể gửi thêm tin nhắn");
        }

        validateNotSelfChat(thread);

        UUID senderId = principal.getAccountId();
        String senderRole = principal.getRole() != null ? principal.getRole() : "CUSTOMER";
        boolean isAdmin = checkIsAdmin(senderRole);

        if (thread.getType() == ThreadType.DISPUTE && isAdmin) {
            throw new CustomException(
                    "Quản trị viên chỉ có quyền giám sát, không được phép nhắn tin vào phòng tranh chấp");
        }

        // Determine sender display name (Shop name for shop owner in SHOP threads)
        String senderName = resolveSenderDisplayName(thread, senderId, principal.getUsername(), isAdmin);

        UUID recipientId = request.getRecipientId();
        if (recipientId == null) {
            if (thread.getType() == ThreadType.SHOP || thread.getType() == ThreadType.DISPUTE) {
                if (senderId.equals(thread.getCustomer().getId())) {
                    if (thread.getShop() != null && thread.getShop().getUser() != null
                            && thread.getShop().getUser().getAccount() != null) {
                        recipientId = thread.getShop().getUser().getAccount().getId();
                    }
                } else {
                    recipientId = thread.getCustomer().getId();
                }
            } else if (isAdmin) {
                recipientId = thread.getCustomer().getId();
            } else if (thread.getAdmin() != null) {
                recipientId = thread.getAdmin().getId();
            }
        }

        ChatMessage message = ChatMessage.builder()
                .thread(thread)
                .senderId(senderId)
                .senderName(senderName)
                .senderRole(senderRole)
                .recipientId(recipientId)
                .content(request.getContent().trim())
                .messageType(ChatMessageType.TEXT)
                .createdAt(LocalDateTime.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(message);

        // Update thread preview and unread counters
        LocalDateTime now = LocalDateTime.now();
        thread.setLastMessage(request.getContent().trim());
        thread.setLastMessageAt(now);

        updateThreadUnreadCounters(thread, senderId, isAdmin);
        chatThreadRepository.save(thread);

        ChatMessageResponse response = ChatMessageResponse.from(saved);

        // Dispatch via WebSocket with perspective-aware thread updates
        dispatchRealtimeMessage(thread, response, isAdmin);

        return response;
    }

    @Override
    @Transactional
    public ChatMessageResponse sendImageMessage(CurrentUserInfo principal, UUID threadId, MultipartFile file) {
        if (principal == null || principal.getAccountId() == null) {
            throw new CustomException("Chưa xác thực");
        }

        ChatThread thread = requireParticipantThread(principal, threadId);

        if (thread.isLocked()) {
            throw new CustomException("Phòng thương lượng tranh chấp đã đóng, không thể gửi thêm tin nhắn");
        }

        validateNotSelfChat(thread);

        UUID senderId = principal.getAccountId();
        String senderRole = principal.getRole() != null ? principal.getRole() : "CUSTOMER";
        boolean isAdmin = checkIsAdmin(senderRole);

        if (thread.getType() == ThreadType.DISPUTE && isAdmin) {
            throw new CustomException(
                    "Quản trị viên chỉ có quyền giám sát, không được phép nhắn tin vào phòng tranh chấp");
        }

        String uploadFolder = (thread.getType() == ThreadType.DISPUTE) ? "evidence/dispute" : "chat";
        String fileName = fileService.uploadFile(file, uploadFolder);
        String fileUrl = fileService.getFileUrl(fileName);

        String senderName = resolveSenderDisplayName(thread, senderId, principal.getUsername(), isAdmin);

        ChatMessage message = ChatMessage.builder()
                .thread(thread)
                .senderId(senderId)
                .senderName(senderName)
                .senderRole(senderRole)
                .content("[Hình ảnh]")
                .messageType(ChatMessageType.IMAGE)
                .imageUrl(fileUrl)
                .createdAt(LocalDateTime.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(message);

        LocalDateTime now = LocalDateTime.now();
        thread.setLastMessage("[Hình ảnh]");
        thread.setLastMessageAt(now);
        updateThreadUnreadCounters(thread, senderId, isAdmin);
        chatThreadRepository.save(thread);

        ChatMessageResponse response = ChatMessageResponse.from(saved);

        dispatchRealtimeMessage(thread, response, isAdmin);

        return response;
    }

    @Override
    @Transactional
    public void markRead(CurrentUserInfo principal, UUID threadId) {
        if (principal == null || principal.getAccountId() == null)
            return;

        ChatThread thread = chatThreadRepository.findById(threadId).orElse(null);
        if (thread == null || !isParticipant(principal, thread))
            return;

        boolean isAdmin = checkIsAdmin(principal.getRole());
        boolean isShopOwner = false;
        if (thread.getShop() != null && thread.getShop().getUser() != null
                && thread.getShop().getUser().getAccount() != null) {
            isShopOwner = principal.getAccountId().equals(thread.getShop().getUser().getAccount().getId());
        }

        chatMessageRepository.markAllAsRead(threadId, principal.getAccountId(), LocalDateTime.now());

        if (isAdmin || isShopOwner) {
            thread.setUnreadAdmin(0);
        } else {
            thread.setUnreadCustomer(0);
        }
        chatThreadRepository.save(thread);

        // Notify client side of read receipt
        Map<String, Object> readEvent = Map.of(
                "threadId", threadId,
                "readBy", principal.getUsername());

        if (isAdmin || isShopOwner) {
            if (thread.getCustomer() != null) {
                webSocketSessionService.sendToUser(thread.getCustomer().getId(), "CHAT_READ", readEvent);
            }
        } else {
            if (thread.getType() == ThreadType.SHOP) {
                if (thread.getShop() != null && thread.getShop().getUser() != null
                        && thread.getShop().getUser().getAccount() != null) {
                    webSocketSessionService.sendToUser(thread.getShop().getUser().getAccount().getId(), "CHAT_READ",
                            readEvent);
                }
            } else {
                webSocketSessionService.broadcastToAdmins("CHAT_READ", readEvent);
            }
        }

        // Notify the reader so their unread badge resets to 0 immediately
        ChatThreadResponse readerThreadRes = ChatThreadResponse.from(thread, principal.getAccountId(), isAdmin);
        webSocketSessionService.sendToUser(principal.getAccountId(), "CHAT_THREAD_UPDATED", readerThreadRes);
    }

    @Override
    @Transactional
    public void closeThread(CurrentUserInfo principal, UUID threadId) {
        ChatThread thread = requireParticipantThread(principal, threadId);

        if (thread.getType() == ThreadType.DISPUTE) {
            throw new CustomException(
                    "Phòng thương lượng tranh chấp chỉ được đóng tự động khi phán quyết hoàn tất xử lý");
        }

        thread.setStatus(ThreadStatus.RESOLVED);
        chatThreadRepository.save(thread);

        Map<String, Object> event = Map.of("threadId", threadId, "status", ThreadStatus.RESOLVED);
        if (thread.getType() == ThreadType.SHOP) {
            UUID customerAccountId = thread.getCustomer() != null ? thread.getCustomer().getId() : null;
            UUID shopOwnerAccountId = null;
            if (thread.getShop() != null && thread.getShop().getUser() != null
                    && thread.getShop().getUser().getAccount() != null) {
                shopOwnerAccountId = thread.getShop().getUser().getAccount().getId();
            }
            if (customerAccountId != null) {
                webSocketSessionService.sendToUser(customerAccountId, "CHAT_THREAD_CLOSED", event);
            }
            if (shopOwnerAccountId != null && !shopOwnerAccountId.equals(customerAccountId)) {
                webSocketSessionService.sendToUser(shopOwnerAccountId, "CHAT_THREAD_CLOSED", event);
            }
        } else {
            if (thread.getCustomer() != null) {
                webSocketSessionService.sendToUser(thread.getCustomer().getId(), "CHAT_THREAD_CLOSED", event);
            }
            webSocketSessionService.broadcastToAdmins("CHAT_THREAD_CLOSED", event);
        }
    }

    @Override
    @Transactional
    public ChatMessageResponse sendVideoMessage(CurrentUserInfo principal, UUID threadId, MultipartFile file) {
        if (principal == null || principal.getAccountId() == null) {
            throw new CustomException("Chưa xác thực");
        }

        ChatThread thread = requireParticipantThread(principal, threadId);

        if (thread.isLocked()) {
            throw new CustomException("Phòng thương lượng tranh chấp đã đóng, không thể gửi thêm tin nhắn");
        }

        validateNotSelfChat(thread);

        UUID senderId = principal.getAccountId();
        String senderRole = principal.getRole() != null ? principal.getRole() : "CUSTOMER";
        boolean isAdmin = checkIsAdmin(senderRole);

        if (thread.getType() == ThreadType.DISPUTE && isAdmin) {
            throw new CustomException(
                    "Quản trị viên chỉ có quyền giám sát, không được phép nhắn tin vào phòng tranh chấp");
        }

        String uploadFolder = (thread.getType() == ThreadType.DISPUTE) ? "evidence/dispute" : "chat";
        String fileName = fileService.uploadFile(file, uploadFolder);
        String fileUrl = fileService.getFileUrl(fileName);

        String senderName = resolveSenderDisplayName(thread, senderId, principal.getUsername(), isAdmin);

        ChatMessage message = ChatMessage.builder()
                .thread(thread)
                .senderId(senderId)
                .senderName(senderName)
                .senderRole(senderRole)
                .content("[Video]")
                .messageType(ChatMessageType.VIDEO)
                .videoUrl(fileUrl)
                .createdAt(LocalDateTime.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(message);

        LocalDateTime now = LocalDateTime.now();
        thread.setLastMessage("[Video]");
        thread.setLastMessageAt(now);
        updateThreadUnreadCounters(thread, senderId, isAdmin);
        chatThreadRepository.save(thread);

        ChatMessageResponse response = ChatMessageResponse.from(saved);

        dispatchRealtimeMessage(thread, response, isAdmin);

        return response;
    }

    @Override
    @Transactional
    public ChatMessageResponse editMessage(CurrentUserInfo principal, UUID messageId, String newContent) {
        if (principal == null || principal.getAccountId() == null) {
            throw new CustomException("Chưa xác thực");
        }
        if (newContent == null || newContent.isBlank()) {
            throw new CustomException("Nội dung tin nhắn không được để trống");
        }

        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new CustomException("Không tìm thấy tin nhắn"));

        if (message.getThread() != null && message.getThread().getType() == ThreadType.DISPUTE) {
            throw new CustomException(
                    "Không thể chỉnh sửa tin nhắn trong phòng tranh chấp để bảo đảm tính toàn vẹn của hồ sơ đối soát");
        }

        if (message.getMessageType() == ChatMessageType.SYSTEM) {
            throw new CustomException("Không thể chỉnh sửa tin nhắn hệ thống");
        }

        if (message.getSenderId() == null || !message.getSenderId().equals(principal.getAccountId())) {
            throw new CustomException("Bạn không có quyền sửa tin nhắn này");
        }
        if (Boolean.TRUE.equals(message.getIsDeleted())) {
            throw new CustomException("Không thể sửa tin nhắn đã bị xóa");
        }
        if (message.getMessageType() != ChatMessageType.TEXT) {
            throw new CustomException("Chỉ có thể sửa tin nhắn văn bản");
        }

        message.setContent(newContent.trim());
        message.setEditedAt(LocalDateTime.now());
        ChatMessage saved = chatMessageRepository.save(message);

        ChatMessageResponse response = ChatMessageResponse.from(saved);

        // Broadcast edit event to participants
        ChatThread thread = message.getThread();
        if (thread.getType() == ThreadType.SHOP) {
            UUID customerAccountId = thread.getCustomer() != null ? thread.getCustomer().getId() : null;
            UUID shopOwnerAccountId = null;
            if (thread.getShop() != null && thread.getShop().getUser() != null
                    && thread.getShop().getUser().getAccount() != null) {
                shopOwnerAccountId = thread.getShop().getUser().getAccount().getId();
            }
            if (customerAccountId != null) {
                webSocketSessionService.sendToUser(customerAccountId, "CHAT_MESSAGE_EDITED", response);
            }
            if (shopOwnerAccountId != null && !shopOwnerAccountId.equals(customerAccountId)) {
                webSocketSessionService.sendToUser(shopOwnerAccountId, "CHAT_MESSAGE_EDITED", response);
            }
        } else {
            boolean isAdmin = checkIsAdmin(principal.getRole());
            if (isAdmin) {
                if (thread.getCustomer() != null) {
                    webSocketSessionService.sendToUser(thread.getCustomer().getId(), "CHAT_MESSAGE_EDITED", response);
                }
                webSocketSessionService.broadcastToAdmins("CHAT_MESSAGE_EDITED", response);
            } else {
                webSocketSessionService.sendToUser(message.getSenderId(), "CHAT_MESSAGE_EDITED", response);
                webSocketSessionService.broadcastToAdmins("CHAT_MESSAGE_EDITED", response);
            }
        }

        return response;
    }

    @Override
    @Transactional
    public void deleteMessage(CurrentUserInfo principal, UUID messageId) {
        if (principal == null || principal.getAccountId() == null) {
            throw new CustomException("Chưa xác thực");
        }

        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new CustomException("Không tìm thấy tin nhắn"));

        if (message.getThread() != null && message.getThread().getType() == ThreadType.DISPUTE) {
            throw new CustomException(
                    "Không thể xóa tin nhắn trong phòng tranh chấp để bảo đảm tính toàn vẹn của hồ sơ đối soát");
        }

        if (message.getMessageType() == ChatMessageType.SYSTEM) {
            throw new CustomException("Không thể xóa tin nhắn hệ thống");
        }

        boolean isAdmin = checkIsAdmin(principal.getRole());
        // Allow: sender OR admin
        if ((message.getSenderId() == null || !message.getSenderId().equals(principal.getAccountId())) && !isAdmin) {
            throw new CustomException("Bạn không có quyền xóa tin nhắn này");
        }
        if (Boolean.TRUE.equals(message.getIsDeleted())) {
            return; // already deleted, idempotent
        }

        message.setIsDeleted(true);
        message.setDeletedAt(LocalDateTime.now());
        message.setContent("[Tin nhắn đã bị xóa]");
        chatMessageRepository.save(message);

        ChatThread thread = message.getThread();
        Map<String, Object> payload = Map.of(
                "messageId", messageId,
                "threadId", thread.getId());

        if (thread.getType() == ThreadType.SHOP) {
            UUID customerAccountId = thread.getCustomer() != null ? thread.getCustomer().getId() : null;
            UUID shopOwnerAccountId = null;
            if (thread.getShop() != null && thread.getShop().getUser() != null
                    && thread.getShop().getUser().getAccount() != null) {
                shopOwnerAccountId = thread.getShop().getUser().getAccount().getId();
            }
            if (customerAccountId != null) {
                webSocketSessionService.sendToUser(customerAccountId, "CHAT_MESSAGE_DELETED", payload);
            }
            if (shopOwnerAccountId != null && !shopOwnerAccountId.equals(customerAccountId)) {
                webSocketSessionService.sendToUser(shopOwnerAccountId, "CHAT_MESSAGE_DELETED", payload);
            }
        } else {
            if (thread.getCustomer() != null) {
                webSocketSessionService.sendToUser(thread.getCustomer().getId(), "CHAT_MESSAGE_DELETED", payload);
            }
            webSocketSessionService.broadcastToAdmins("CHAT_MESSAGE_DELETED", payload);
        }
    }

    private void dispatchRealtimeMessage(ChatThread thread, ChatMessageResponse response, boolean senderIsAdmin) {
        if (thread.getType() == ThreadType.SHOP || thread.getType() == ThreadType.DISPUTE) {
            UUID customerAccountId = thread.getCustomer() != null ? thread.getCustomer().getId() : null;
            UUID shopOwnerAccountId = null;
            if (thread.getShop() != null && thread.getShop().getUser() != null
                    && thread.getShop().getUser().getAccount() != null) {
                shopOwnerAccountId = thread.getShop().getUser().getAccount().getId();
            }

            if (customerAccountId != null) {
                ChatThreadResponse customerThreadRes = ChatThreadResponse.from(thread, customerAccountId, false);
                webSocketSessionService.sendToUser(customerAccountId, "CHAT_MESSAGE", response);
                webSocketSessionService.sendToUser(customerAccountId, "CHAT_THREAD_UPDATED", customerThreadRes);
            }
            if (shopOwnerAccountId != null && !shopOwnerAccountId.equals(customerAccountId)) {
                ChatThreadResponse shopThreadRes = ChatThreadResponse.from(thread, shopOwnerAccountId, false);
                webSocketSessionService.sendToUser(shopOwnerAccountId, "CHAT_MESSAGE", response);
                webSocketSessionService.sendToUser(shopOwnerAccountId, "CHAT_THREAD_UPDATED", shopThreadRes);
            }

            if (thread.getType() == ThreadType.DISPUTE) {
                ChatThreadResponse adminThreadRes = ChatThreadResponse.from(thread, null, true);
                webSocketSessionService.broadcastToAdmins("CHAT_MESSAGE", response);
                webSocketSessionService.broadcastToAdmins("CHAT_THREAD_UPDATED", adminThreadRes);
            }
            return;
        }

        ChatThreadResponse customerThreadRes = thread.getCustomer() != null
                ? ChatThreadResponse.from(thread, thread.getCustomer().getId(), false)
                : null;
        ChatThreadResponse adminThreadRes = ChatThreadResponse.from(thread, null, true);

        if (senderIsAdmin) {
            // Send to customer
            if (customerThreadRes != null) {
                webSocketSessionService.sendToUser(thread.getCustomer().getId(), "CHAT_MESSAGE", response);
                webSocketSessionService.sendToUser(thread.getCustomer().getId(), "CHAT_THREAD_UPDATED",
                        customerThreadRes);
            }

            // Broadcast to all admins (including the sender admin)
            webSocketSessionService.broadcastToAdmins("CHAT_MESSAGE", response);
            webSocketSessionService.broadcastToAdmins("CHAT_THREAD_UPDATED", adminThreadRes);
        } else {
            // Customer sent: echo back to customer and broadcast to all admins
            if (customerThreadRes != null) {
                webSocketSessionService.sendToUser(response.getSenderId(), "CHAT_MESSAGE", response);
                webSocketSessionService.sendToUser(response.getSenderId(), "CHAT_THREAD_UPDATED", customerThreadRes);
            }
            webSocketSessionService.broadcastToAdmins("CHAT_MESSAGE", response);
            webSocketSessionService.broadcastToAdmins("CHAT_THREAD_UPDATED", adminThreadRes);
        }
    }

    private void validateNotSelfChat(ChatThread thread) {
        if (thread != null && thread.getType() == ThreadType.SHOP && thread.getShop() != null
                && thread.getShop().getUser() != null && thread.getShop().getUser().getAccount() != null) {
            UUID shopOwnerAccountId = thread.getShop().getUser().getAccount().getId();
            if (thread.getCustomer() != null && thread.getCustomer().getId().equals(shopOwnerAccountId)) {
                throw new CustomException("Bạn không thể tự nhắn tin cho chính gian hàng của mình");
            }
        }
    }

    private boolean isCustomerSender(ChatThread thread, UUID senderId) {
        if (thread == null || thread.getCustomer() == null || thread.getCustomer().getId() == null) {
            return false;
        }
        return senderId != null && senderId.equals(thread.getCustomer().getId());
    }

    private void updateThreadUnreadCounters(ChatThread thread, UUID senderId, boolean isAdmin) {
        if (isCustomerSender(thread, senderId)) {
            // Customer sent message -> recipient is Shop/Admin
            thread.setUnreadAdmin(thread.getUnreadAdmin() + 1);
            thread.setUnreadCustomer(0);
        } else {
            // Shop owner or Admin sent message -> recipient is Customer
            thread.setUnreadCustomer(thread.getUnreadCustomer() + 1);
            thread.setUnreadAdmin(0);
            if (isAdmin && thread.getAdmin() == null) {
                accountRepository.findById(senderId).ifPresent(thread::setAdmin);
            }
        }
    }

    private String resolveSenderDisplayName(ChatThread thread, UUID senderId, String username, boolean isAdmin) {
        if (isAdmin) {
            return "Hỗ trợ viên (" + username + ")";
        }
        if (thread != null && thread.getType() == ThreadType.SHOP && !isCustomerSender(thread, senderId)) {
            if (thread.getShop() != null && thread.getShop().getName() != null
                    && !thread.getShop().getName().isBlank()) {
                return thread.getShop().getName();
            }
        }
        Optional<User> userOpt = userRepository.findByAccountId(senderId);
        return userOpt.map(User::getFullName).filter(s -> !s.isBlank()).orElse(username);
    }

    private boolean isParticipant(CurrentUserInfo principal, ChatThread thread) {
        if (principal == null || principal.getAccountId() == null)
            return false;
        if (checkIsAdmin(principal.getRole()))
            return true;
        UUID me = principal.getAccountId();
        if (thread.getCustomer() != null && me.equals(thread.getCustomer().getId()))
            return true;
        return thread.getShop() != null && thread.getShop().getUser() != null
                && thread.getShop().getUser().getAccount() != null
                && me.equals(thread.getShop().getUser().getAccount().getId());
    }

    private ChatThread requireParticipantThread(CurrentUserInfo principal, UUID threadId) {
        if (principal == null || principal.getAccountId() == null) {
            throw new CustomException("Chưa xác thực");
        }
        ChatThread thread = chatThreadRepository.findById(threadId)
                .orElseThrow(() -> new CustomException("Không tìm thấy cuộc hội thoại"));
        if (!isParticipant(principal, thread)) {
            // same message as not-found so thread ids can't be probed
            throw new CustomException("Không tìm thấy cuộc hội thoại");
        }
        return thread;
    }

    private boolean checkIsAdmin(String role) {
        if (role == null)
            return false;
        return "ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role);
    }

    @Override
    public void handleTyping(CurrentUserInfo principal, UUID threadId, boolean isTyping) {
        if (principal == null || threadId == null)
            return;
        ChatThread thread = chatThreadRepository.findById(threadId).orElse(null);
        if (thread == null || !isParticipant(principal, thread))
            return;

        Map<String, Object> payload = Map.of(
                "threadId", thread.getId().toString(),
                "senderName", principal.getUsername(),
                "typing", isTyping);

        if (thread.getType() == ThreadType.SHOP) {
            UUID customerId = thread.getCustomer() != null ? thread.getCustomer().getId() : null;
            UUID shopOwnerId = null;
            if (thread.getShop() != null && thread.getShop().getUser() != null
                    && thread.getShop().getUser().getAccount() != null) {
                shopOwnerId = thread.getShop().getUser().getAccount().getId();
            }

            if (principal.getAccountId().equals(customerId)) {
                if (shopOwnerId != null) {
                    webSocketSessionService.sendToUser(shopOwnerId, "CHAT_TYPING", payload);
                }
            } else {
                if (customerId != null) {
                    webSocketSessionService.sendToUser(customerId, "CHAT_TYPING", payload);
                }
            }
        } else {
            boolean isAdmin = checkIsAdmin(principal.getRole());
            if (isAdmin) {
                if (thread.getCustomer() != null) {
                    webSocketSessionService.sendToUser(thread.getCustomer().getId(), "CHAT_TYPING", payload);
                }
            } else {
                webSocketSessionService.broadcastToAdmins("CHAT_TYPING", payload);
            }
        }
    }

    @Override
    @Transactional
    public ChatThreadResponse getOrCreateDisputeThread(UUID orderId, UUID requestId, UUID buyerAccountId, UUID shopId,
            String orderNumber) {
        if (orderId == null || requestId == null || buyerAccountId == null || shopId == null) {
            throw new CustomException("Thông tin tạo phòng tranh chấp không hợp lệ");
        }

        Account customer = accountRepository.findById(buyerAccountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy tài khoản người mua"));
        Optional<User> userOpt = userRepository.findByAccountId(buyerAccountId);
        String customerName = userOpt.map(User::getFullName).filter(s -> !s.isBlank()).orElse(customer.getUsername());
        String customerAvatar = userOpt.map(User::getAvatarUrl).orElse(null);
        String displayOrderCode = (orderNumber != null && !orderNumber.isBlank()) ? orderNumber
                : orderId.toString().substring(0, 8);
        String title = "Khiếu nại đơn hàng #" + displayOrderCode;

        UUID threadId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();

        int affectedRows = chatThreadRepository.insertDisputeThreadSafe(
                threadId,
                buyerAccountId,
                shopId,
                orderId,
                requestId,
                customerName,
                customerAvatar,
                title,
                now);

        ChatThread thread = chatThreadRepository.findFirstByRequestIdAndType(requestId, ThreadType.DISPUTE)
                .orElseThrow(() -> new CustomException("Không tìm thấy phòng chat khiếu nại vừa tạo"));

        if (affectedRows > 0) {
            // Luồng đầu tiên tạo phòng thành công -> Tạo tin nhắn chào mừng duy nhất
            ChatMessage welcomeMsg = ChatMessage.builder()
                    .thread(thread)
                    .senderId(null)
                    .senderName("Hệ Thống Tranh Chấp")
                    .senderRole("SYSTEM")
                    .content(
                            "Phòng thương lượng tranh chấp tự động kích hoạt. Người mua và Người bán vui lòng trao đổi, cung cấp bằng chứng và phương án xử lý trong vòng 48 giờ trước khi hệ thống chuyển hồ sơ lên Quản trị viên.")
                    .messageType(ChatMessageType.SYSTEM)
                    .createdAt(now)
                    .build();
            chatMessageRepository.save(welcomeMsg);

            thread.setLastMessage(welcomeMsg.getContent());
            thread.setLastMessageAt(now);
            chatThreadRepository.save(thread);

            ChatThreadResponse response = ChatThreadResponse.from(thread, buyerAccountId, false);

            if (TransactionSynchronizationManager.isActualTransactionActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        dispatchNewDisputeThreadEvents(thread, response);
                    }
                });
            } else {
                dispatchNewDisputeThreadEvents(thread, response);
            }
        }

        return ChatThreadResponse.from(thread, buyerAccountId, false);
    }

    private void dispatchNewDisputeThreadEvents(ChatThread thread, ChatThreadResponse response) {
        UUID customerAccountId = thread.getCustomer() != null ? thread.getCustomer().getId() : null;
        UUID shopOwnerAccountId = null;
        if (thread.getShop() != null && thread.getShop().getUser() != null
                && thread.getShop().getUser().getAccount() != null) {
            shopOwnerAccountId = thread.getShop().getUser().getAccount().getId();
        }

        if (customerAccountId != null) {
            ChatThreadResponse custRes = ChatThreadResponse.from(thread, customerAccountId, false);
            webSocketSessionService.sendToUser(customerAccountId, "CHAT_THREAD_NEW", custRes);
        }
        if (shopOwnerAccountId != null && !shopOwnerAccountId.equals(customerAccountId)) {
            ChatThreadResponse shopRes = ChatThreadResponse.from(thread, shopOwnerAccountId, false);
            webSocketSessionService.sendToUser(shopOwnerAccountId, "CHAT_THREAD_NEW", shopRes);
        }
        ChatThreadResponse adminRes = ChatThreadResponse.from(thread, null, true);
        webSocketSessionService.broadcastToAdmins("CHAT_THREAD_NEW", adminRes);
    }

    @Override
    @Transactional(readOnly = true)
    public ChatThreadResponse getDisputeThreadByRequestId(CurrentUserInfo principal, UUID requestId) {
        if (principal == null || principal.getAccountId() == null) {
            throw new CustomException("Chưa xác thực");
        }
        if (requestId == null) {
            throw new CustomException("Mã yêu cầu khiếu nại không hợp lệ");
        }

        ChatThread thread = chatThreadRepository.findFirstByRequestIdAndType(requestId, ThreadType.DISPUTE)
                .orElseThrow(() -> new CustomException("Không tìm thấy cuộc hội thoại khiếu nại"));

        if (!isParticipant(principal, thread)) {
            throw new CustomException("Không tìm thấy cuộc hội thoại khiếu nại");
        }

        boolean isAdmin = checkIsAdmin(principal.getRole());
        return ChatThreadResponse.from(thread, principal.getAccountId(), isAdmin);
    }

    @Override
    @Transactional(readOnly = true)
    public ChatThreadResponse getDisputeThreadByOrderId(CurrentUserInfo principal, UUID orderId) {
        if (principal == null || principal.getAccountId() == null) {
            throw new CustomException("Chưa xác thực");
        }
        if (orderId == null) {
            throw new CustomException("Mã đơn hàng không hợp lệ");
        }

        List<Report> reports = reportRepository.findByOrderIdOrderByCreatedAtDesc(orderId);
        if (reports.isEmpty()) {
            return null;
        }

        Report targetReport = reports.stream()
                .filter(r -> r.getStage() != null && !r.getStage().name().equals("CLOSED")
                        && !r.getStage().name().equals("CANCELLED"))
                .findFirst()
                .orElse(reports.get(0));

        if (targetReport.getRequest() == null) {
            return null;
        }

        ChatThread thread = chatThreadRepository
                .findFirstByRequestIdAndType(targetReport.getRequest().getId(), ThreadType.DISPUTE)
                .orElse(null);

        if (thread == null) {
            return null;
        }

        if (!isParticipant(principal, thread)) {
            return null;
        }

        boolean isAdmin = checkIsAdmin(principal.getRole());
        return ChatThreadResponse.from(thread, principal.getAccountId(), isAdmin);
    }

    @Override
    @Transactional
    public void closeDisputeThread(UUID requestId, String reason) {
        if (requestId == null)
            return;

        Optional<ChatThread> threadOpt = chatThreadRepository.findByRequestIdForUpdate(requestId);
        if (threadOpt.isEmpty()) {
            log.info("Không tìm thấy phòng chat tranh chấp cho requestId: {}", requestId);
            return;
        }

        ChatThread thread = threadOpt.get();
        if (thread.getStatus() == ThreadStatus.CLOSED) {
            log.info("Phòng chat tranh chấp cho requestId {} đã đóng trước đó (idempotent)", requestId);
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        thread.setStatus(ThreadStatus.CLOSED);
        thread.setClosedAt(now);
        String finalReason = (reason != null && !reason.isBlank()) ? reason : "Khiếu nại đã được giải quyết";
        thread.setCloseReason(finalReason);

        ChatMessage closeMsg = ChatMessage.builder()
                .thread(thread)
                .senderId(null)
                .senderName("Hệ Thống Tranh Chấp")
                .senderRole("SYSTEM")
                .content("Phòng trao đổi thương lượng đã đóng: " + finalReason
                        + ". Toàn bộ lịch sử trao đổi được lưu trữ bất biến phục vụ đối soát.")
                .messageType(ChatMessageType.SYSTEM)
                .createdAt(now)
                .build();
        chatMessageRepository.save(closeMsg);

        thread.setLastMessage(closeMsg.getContent());
        thread.setLastMessageAt(now);
        chatThreadRepository.saveAndFlush(thread);

        UUID customerAccountId = thread.getCustomer() != null ? thread.getCustomer().getId() : null;
        UUID shopOwnerAccountId = null;
        if (thread.getShop() != null) {
            try {
                if (thread.getShop().getUser() != null && thread.getShop().getUser().getAccount() != null) {
                    shopOwnerAccountId = thread.getShop().getUser().getAccount().getId();
                }
            } catch (Exception e) {
                log.debug("Proxy lazy loading shop owner account, resolving via shopId: {}", e.getMessage());
            }
            if (shopOwnerAccountId == null && thread.getShop().getId() != null) {
                shopOwnerAccountId = shopRepository.findById(thread.getShop().getId())
                        .map(Shop::getUser)
                        .map(User::getAccount)
                        .map(Account::getId)
                        .orElse(null);
            }
        }

        ChatMessageResponse closeMsgResponse = ChatMessageResponse.from(closeMsg);
        ChatThreadResponse customerThreadRes = customerAccountId != null
                ? ChatThreadResponse.from(thread, customerAccountId, false)
                : null;
        ChatThreadResponse shopThreadRes = shopOwnerAccountId != null
                ? ChatThreadResponse.from(thread, shopOwnerAccountId, false)
                : null;
        ChatThreadResponse adminThreadRes = ChatThreadResponse.from(thread, null, true);

        Map<String, Object> event = Map.of(
                "threadId", thread.getId(),
                "requestId", thread.getRequestId() != null ? thread.getRequestId().toString() : "",
                "status", ThreadStatus.CLOSED.name(),
                "isLocked", true,
                "closedAt", now.toString(),
                "closeReason", finalReason);

        final UUID finalCustId = customerAccountId;
        final UUID finalShopOwnerId = shopOwnerAccountId;

        Runnable dispatchAction = () -> {
            try {
                if (finalCustId != null) {
                    webSocketSessionService.sendToUser(finalCustId, "CHAT_THREAD_CLOSED", event);
                    if (customerThreadRes != null) {
                        webSocketSessionService.sendToUser(finalCustId, "CHAT_THREAD_UPDATED", customerThreadRes);
                    }
                    webSocketSessionService.sendToUser(finalCustId, "CHAT_MESSAGE", closeMsgResponse);
                }
                if (finalShopOwnerId != null && !finalShopOwnerId.equals(finalCustId)) {
                    webSocketSessionService.sendToUser(finalShopOwnerId, "CHAT_THREAD_CLOSED", event);
                    if (shopThreadRes != null) {
                        webSocketSessionService.sendToUser(finalShopOwnerId, "CHAT_THREAD_UPDATED", shopThreadRes);
                    }
                    webSocketSessionService.sendToUser(finalShopOwnerId, "CHAT_MESSAGE", closeMsgResponse);
                }
                webSocketSessionService.broadcastToAdmins("CHAT_THREAD_CLOSED", event);
                webSocketSessionService.broadcastToAdmins("CHAT_THREAD_UPDATED", adminThreadRes);
                webSocketSessionService.broadcastToAdmins("CHAT_MESSAGE", closeMsgResponse);
            } catch (Exception e) {
                log.error("Lỗi khi phát sự kiện đóng phòng chat realtime cho thread {}: {}", thread.getId(), e.getMessage(), e);
            }
        };

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    dispatchAction.run();
                }
            });
        } else {
            dispatchAction.run();
        }
    }
}
