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
import com.marketplace.ecommerce.chat.websocket.WebSocketSessionService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.file.service.FileService;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ChatServiceImplTest {

    @Mock
    private ChatThreadRepository chatThreadRepository;
    @Mock
    private ChatMessageRepository chatMessageRepository;
    @Mock
    private AccountRepository accountRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ShopRepository shopRepository;
    @Mock
    private ReportRepository reportRepository;
    @Mock
    private FileService fileService;
    @Mock
    private WebSocketSessionService webSocketSessionService;

    @InjectMocks
    private ChatServiceImpl chatService;

    private CurrentUserInfo buyerPrincipal;
    private CurrentUserInfo sellerPrincipal;
    private CurrentUserInfo adminPrincipal;
    private UUID customerId;
    private UUID sellerId;
    private UUID adminId;

    private Account customerAccount;
    private Account sellerAccount;
    private Shop sampleShop;
    private ChatThread sampleThread;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        sellerId = UUID.randomUUID();
        adminId = UUID.randomUUID();

        buyerPrincipal = new CurrentUserInfo();
        buyerPrincipal.setAccountId(customerId);
        buyerPrincipal.setUsername("buyer@test.com");
        buyerPrincipal.setRole("ROLE_USER");

        sellerPrincipal = new CurrentUserInfo();
        sellerPrincipal.setAccountId(sellerId);
        sellerPrincipal.setUsername("seller@test.com");
        sellerPrincipal.setRole("ROLE_SELLER");

        adminPrincipal = new CurrentUserInfo();
        adminPrincipal.setAccountId(adminId);
        adminPrincipal.setUsername("admin@test.com");
        adminPrincipal.setRole("ROLE_ADMIN");

        customerAccount = new Account();
        customerAccount.setId(customerId);
        customerAccount.setUsername("buyerA");

        sellerAccount = new Account();
        sellerAccount.setId(sellerId);
        sellerAccount.setUsername("sellerB");

        User sellerUser = new User();
        sellerUser.setId(UUID.randomUUID());
        sellerUser.setAccount(sellerAccount);

        sampleShop = new Shop();
        sampleShop.setId(UUID.randomUUID());
        sampleShop.setName("Tech World");
        sampleShop.setUser(sellerUser);

        sampleThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.SHOP)
                .customer(customerAccount)
                .shop(sampleShop)
                .status(ThreadStatus.OPEN)
                .unreadCustomer(0)
                .unreadAdmin(0)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("getThreads lấy danh sách hội thoại của người dùng thành công")
    void testGetThreads_Success() {
        when(chatThreadRepository.findByCustomerId(customerId))
                .thenReturn(List.of(sampleThread));

        List<ChatThreadResponse> res = chatService.getThreads(buyerPrincipal, null);
        assertNotNull(res);
        assertEquals(1, res.size());
    }

    @Test
    @DisplayName("getOrCreateShopThread tạo mới hội thoại giữa Buyer và Shop")
    void testGetOrCreateShopThread_CreateNew() {
        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(chatThreadRepository.findFirstByCustomer_IdAndShop_IdAndStatus(customerId, sampleShop.getId(), ThreadStatus.OPEN))
                .thenReturn(Optional.empty());
        when(accountRepository.findById(customerId)).thenReturn(Optional.of(customerAccount));
        when(chatThreadRepository.save(any(ChatThread.class))).thenAnswer(inv -> inv.getArgument(0));

        ChatThreadResponse res = chatService.getOrCreateShopThread(buyerPrincipal, sampleShop.getId());
        assertNotNull(res);
        assertEquals(ThreadType.SHOP, res.getType());
        verify(chatThreadRepository).save(any(ChatThread.class));
    }

    @Test
    @DisplayName("getOrCreateShopThread ném lỗi khi Shop tự chat với chính mình")
    void testGetOrCreateShopThread_SelfChatPrevented() {
        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        CustomException ex = assertThrows(CustomException.class, () -> chatService.getOrCreateShopThread(sellerPrincipal, sampleShop.getId()));
        assertTrue(ex.getMessage().contains("tự nhắn tin"));
    }

    @Test
    @DisplayName("getOrCreateSupportThread tạo hội thoại hỗ trợ giữa Khách và Admin")
    void testGetOrCreateSupportThread_Success() {
        when(chatThreadRepository.findFirstByCustomer_IdAndTypeAndStatus(customerId, ThreadType.SUPPORT, ThreadStatus.OPEN))
                .thenReturn(Optional.empty());
        when(accountRepository.findById(customerId)).thenReturn(Optional.of(customerAccount));
        when(chatThreadRepository.save(any(ChatThread.class))).thenAnswer(inv -> inv.getArgument(0));

        ChatThreadResponse res = chatService.getOrCreateSupportThread(buyerPrincipal);
        assertNotNull(res);
        assertEquals(ThreadType.SUPPORT, res.getType());
    }

    @Test
    @DisplayName("getMessages phân trang tin nhắn trong hội thoại")
    void testGetMessages() {
        when(chatThreadRepository.findById(sampleThread.getId())).thenReturn(Optional.of(sampleThread));
        ChatMessage msg = ChatMessage.builder()
                .id(UUID.randomUUID())
                .thread(sampleThread)
                .senderId(customerId)
                .content("Alo shop oi")
                .messageType(ChatMessageType.TEXT)
                .createdAt(LocalDateTime.now())
                .build();
        when(chatMessageRepository.findByThread_IdOrderByCreatedAtDesc(eq(sampleThread.getId()), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(msg)));

        Page<ChatMessageResponse> res = chatService.getMessages(buyerPrincipal, sampleThread.getId(), 0, 10);
        assertEquals(1, res.getContent().size());
        assertEquals("Alo shop oi", res.getContent().get(0).getContent());
    }

    @Test
    @DisplayName("sendMessage gửi tin nhắn văn bản và cập nhật preview thread")
    void testSendMessage() {
        when(chatThreadRepository.findById(sampleThread.getId())).thenReturn(Optional.of(sampleThread));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> inv.getArgument(0));
        when(chatThreadRepository.save(any(ChatThread.class))).thenAnswer(inv -> inv.getArgument(0));

        SendMessageRequest req = new SendMessageRequest();
        req.setThreadId(sampleThread.getId());
        req.setContent("Chào shop, sản phẩm còn không?");

        ChatMessageResponse res = chatService.sendMessage(buyerPrincipal, req);
        assertNotNull(res);
        assertEquals("Chào shop, sản phẩm còn không?", res.getContent());
        assertEquals("Chào shop, sản phẩm còn không?", sampleThread.getLastMessage());
        verify(webSocketSessionService, atLeastOnce()).sendToUser(any(), any(), any());
    }

    @Test
    @DisplayName("sendImageMessage tải ảnh qua FileService và gửi tin nhắn hình ảnh")
    void testSendImageMessage() {
        when(chatThreadRepository.findById(sampleThread.getId())).thenReturn(Optional.of(sampleThread));
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", "image-content".getBytes());
        when(fileService.uploadFile(eq(file), anyString())).thenReturn("test.jpg");
        when(fileService.getFileUrl("test.jpg")).thenReturn("http://file.com/test.jpg");
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> inv.getArgument(0));

        ChatMessageResponse res = chatService.sendImageMessage(buyerPrincipal, sampleThread.getId(), file);
        assertNotNull(res);
        assertEquals(ChatMessageType.IMAGE, res.getMessageType());
        assertEquals("http://file.com/test.jpg", res.getImageUrl());
    }

    @Test
    @DisplayName("sendVideoMessage tải video qua FileService và gửi tin nhắn video")
    void testSendVideoMessage() {
        when(chatThreadRepository.findById(sampleThread.getId())).thenReturn(Optional.of(sampleThread));
        MockMultipartFile file = new MockMultipartFile("file", "vid.mp4", "video/mp4", "vid-content".getBytes());
        when(fileService.uploadFile(eq(file), anyString())).thenReturn("vid.mp4");
        when(fileService.getFileUrl("vid.mp4")).thenReturn("http://file.com/vid.mp4");
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> inv.getArgument(0));

        ChatMessageResponse res = chatService.sendVideoMessage(buyerPrincipal, sampleThread.getId(), file);
        assertNotNull(res);
        assertEquals(ChatMessageType.VIDEO, res.getMessageType());
        assertEquals("http://file.com/vid.mp4", res.getVideoUrl());
    }

    @Test
    @DisplayName("editMessage cho phép người gửi sửa nội dung tin nhắn")
    void testEditMessage() {
        UUID msgId = UUID.randomUUID();
        ChatMessage msg = ChatMessage.builder()
                .id(msgId)
                .thread(sampleThread)
                .senderId(customerId)
                .content("Nội dung cũ")
                .messageType(ChatMessageType.TEXT)
                .build();
        when(chatMessageRepository.findById(msgId)).thenReturn(Optional.of(msg));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> inv.getArgument(0));

        ChatMessageResponse res = chatService.editMessage(buyerPrincipal, msgId, "Nội dung mới đã sửa");
        assertNotNull(res);
        assertEquals("Nội dung mới đã sửa", res.getContent());
    }

    @Test
    @DisplayName("deleteMessage xóa tin nhắn thành công")
    void testDeleteMessage() {
        UUID msgId = UUID.randomUUID();
        ChatMessage msg = ChatMessage.builder()
                .id(msgId)
                .thread(sampleThread)
                .senderId(customerId)
                .content("Tin nhắn nhầm")
                .messageType(ChatMessageType.TEXT)
                .build();
        when(chatMessageRepository.findById(msgId)).thenReturn(Optional.of(msg));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> inv.getArgument(0));

        chatService.deleteMessage(buyerPrincipal, msgId);
        assertTrue(msg.getIsDeleted());
        assertEquals("[Tin nhắn đã bị xóa]", msg.getContent());
    }

    @Test
    @DisplayName("markRead đặt lại số tin chưa đọc về 0")
    void testMarkRead() {
        sampleThread.setUnreadCustomer(5);
        when(chatThreadRepository.findById(sampleThread.getId())).thenReturn(Optional.of(sampleThread));

        chatService.markRead(buyerPrincipal, sampleThread.getId());
        assertEquals(0, sampleThread.getUnreadCustomer());
        verify(chatThreadRepository).save(sampleThread);
    }

    @Test
    @DisplayName("closeThread đóng cuộc hội thoại thành công")
    void testCloseThread() {
        when(chatThreadRepository.findById(sampleThread.getId())).thenReturn(Optional.of(sampleThread));
        when(chatThreadRepository.save(any(ChatThread.class))).thenAnswer(inv -> inv.getArgument(0));

        chatService.closeThread(buyerPrincipal, sampleThread.getId());
        assertEquals(ThreadStatus.RESOLVED, sampleThread.getStatus());
        verify(chatThreadRepository).save(sampleThread);
    }

    @Test
    @DisplayName("getThreads với các điều kiện role Admin (ALL, DISPUTE, SHOP, SUPPORT)")
    void testGetThreads_AdminVariants() {
        when(chatThreadRepository.findAllOrderByLastMessageAtDesc()).thenReturn(List.of(sampleThread));
        when(chatThreadRepository.findByType(ThreadType.DISPUTE)).thenReturn(List.of(sampleThread));
        when(chatThreadRepository.findByType(ThreadType.SHOP)).thenReturn(List.of(sampleThread));
        when(chatThreadRepository.findByType(ThreadType.SUPPORT)).thenReturn(List.of(sampleThread));

        List<ChatThreadResponse> all = chatService.getThreads(adminPrincipal, "ALL");
        assertEquals(1, all.size());

        List<ChatThreadResponse> dispute = chatService.getThreads(adminPrincipal, "DISPUTE");
        assertEquals(1, dispute.size());

        List<ChatThreadResponse> shop = chatService.getThreads(adminPrincipal, "SHOP");
        assertEquals(1, shop.size());

        List<ChatThreadResponse> support = chatService.getThreads(adminPrincipal, "SUPPORT");
        assertEquals(1, support.size());
    }

    @Test
    @DisplayName("getThreads với non-admin (DISPUTE, SHOP, CUSTOMER)")
    void testGetThreads_NonAdminVariants() {
        User sellerUser = sampleShop.getUser();
        when(userRepository.findByAccountId(sellerId)).thenReturn(Optional.of(sellerUser));
        when(shopRepository.findByUserId(sellerUser.getId())).thenReturn(Optional.of(sampleShop));

        ChatThread disputeThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.DISPUTE)
                .customer(customerAccount)
                .shop(sampleShop)
                .status(ThreadStatus.OPEN)
                .build();
        when(chatThreadRepository.findByShopId(sampleShop.getId())).thenReturn(List.of(disputeThread, sampleThread));

        List<ChatThreadResponse> disputeList = chatService.getThreads(sellerPrincipal, "DISPUTE");
        assertEquals(1, disputeList.size());

        List<ChatThreadResponse> shopList = chatService.getThreads(sellerPrincipal, "SHOP");
        assertEquals(2, shopList.size());

        // Trường hợp user không có shop
        when(userRepository.findByAccountId(customerId)).thenReturn(Optional.of(new User()));
        when(shopRepository.findByUserId(any())).thenReturn(Optional.empty());
        when(chatThreadRepository.findByCustomerId(customerId)).thenReturn(List.of(sampleThread));

        List<ChatThreadResponse> userDispute = chatService.getThreads(buyerPrincipal, "DISPUTE");
        assertNotNull(userDispute);

        List<ChatThreadResponse> userShop = chatService.getThreads(buyerPrincipal, "SHOP");
        assertTrue(userShop.isEmpty());

        List<ChatThreadResponse> userCustomer = chatService.getThreads(buyerPrincipal, null);
        assertEquals(1, userCustomer.size());
    }

    @Test
    @DisplayName("getOrCreateShopThread tìm bằng tên Shop hoặc fallback")
    void testGetOrCreateShopThread_ByNameAndFallback() {
        when(shopRepository.findAll()).thenReturn(List.of(sampleShop));
        when(chatThreadRepository.findFirstByCustomer_IdAndShop_IdAndStatus(customerId, sampleShop.getId(), ThreadStatus.OPEN))
                .thenReturn(Optional.of(sampleThread));

        // Bằng tên
        ChatThreadResponse res1 = chatService.getOrCreateShopThread(buyerPrincipal, "Tech World");
        assertNotNull(res1);

        // Fallback
        ChatThreadResponse res2 = chatService.getOrCreateShopThread(buyerPrincipal, "NonExistentName");
        assertNotNull(res2);

        // Blank string error
        assertThrows(CustomException.class, () -> chatService.getOrCreateShopThread(buyerPrincipal, "   "));
    }

    @Test
    @DisplayName("getOrCreateDisputeThread tạo phòng tranh chấp và gửi sự kiện realtime")
    void testGetOrCreateDisputeThread() {
        UUID orderId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();

        when(accountRepository.findById(customerId)).thenReturn(Optional.of(customerAccount));
        when(userRepository.findByAccountId(customerId)).thenReturn(Optional.of(new User()));

        ChatThread disputeThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.DISPUTE)
                .customer(customerAccount)
                .shop(sampleShop)
                .requestId(requestId)
                .status(ThreadStatus.OPEN)
                .build();

        when(chatThreadRepository.insertDisputeThreadSafe(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(1);
        when(chatThreadRepository.findFirstByRequestIdAndType(requestId, ThreadType.DISPUTE))
                .thenReturn(Optional.of(disputeThread));
        when(chatThreadRepository.save(any(ChatThread.class))).thenAnswer(inv -> inv.getArgument(0));

        ChatThreadResponse res = chatService.getOrCreateDisputeThread(orderId, requestId, customerId, sampleShop.getId(), "ORD-123");
        assertNotNull(res);
        verify(chatMessageRepository).save(any(ChatMessage.class));
    }

    @Test
    @DisplayName("getDisputeThreadByRequestId và getDisputeThreadByOrderId")
    void testGetDisputeThreads() {
        UUID orderId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();

        ChatThread disputeThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.DISPUTE)
                .customer(customerAccount)
                .shop(sampleShop)
                .requestId(requestId)
                .status(ThreadStatus.OPEN)
                .build();

        when(chatThreadRepository.findFirstByRequestIdAndType(requestId, ThreadType.DISPUTE))
                .thenReturn(Optional.of(disputeThread));

        ChatThreadResponse res1 = chatService.getDisputeThreadByRequestId(buyerPrincipal, requestId);
        assertNotNull(res1);

        Report report = Report.builder()
                .id(requestId)
                .stage(com.marketplace.ecommerce.request.valueObjects.ReportStage.DIRECT_NEGOTIATION)
                .request(com.marketplace.ecommerce.request.entity.Request.builder().id(requestId).build())
                .build();
        when(reportRepository.findByOrderIdOrderByCreatedAtDesc(orderId)).thenReturn(List.of(report));

        ChatThreadResponse res2 = chatService.getDisputeThreadByOrderId(buyerPrincipal, orderId);
        assertNotNull(res2);
    }

    @Test
    @DisplayName("closeDisputeThread đóng phòng tranh chấp an toàn")
    void testCloseDisputeThread() {
        UUID requestId = UUID.randomUUID();
        ChatThread disputeThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.DISPUTE)
                .customer(customerAccount)
                .shop(sampleShop)
                .requestId(requestId)
                .status(ThreadStatus.OPEN)
                .build();

        when(chatThreadRepository.findByRequestIdForUpdate(requestId)).thenReturn(Optional.of(disputeThread));
        when(chatThreadRepository.saveAndFlush(any(ChatThread.class))).thenAnswer(inv -> inv.getArgument(0));

        chatService.closeDisputeThread(requestId, "Đã thỏa thuận xong");
        assertEquals(ThreadStatus.CLOSED, disputeThread.getStatus());
        verify(chatMessageRepository).save(any(ChatMessage.class));

        // Idempotent khi gọi lại
        chatService.closeDisputeThread(requestId, "Gọi lại");
        verify(chatThreadRepository, times(1)).saveAndFlush(any(ChatThread.class));
    }

    @Test
    @DisplayName("handleTyping gửi sự kiện đang gõ chữ cho cả User và Admin")
    void testHandleTyping() {
        when(chatThreadRepository.findById(sampleThread.getId())).thenReturn(Optional.of(sampleThread));

        // Buyer đang gõ trong SHOP thread
        chatService.handleTyping(buyerPrincipal, sampleThread.getId(), true);
        verify(webSocketSessionService, atLeastOnce()).sendToUser(any(), eq("CHAT_TYPING"), any());

        // Admin đang gõ trong SUPPORT thread
        ChatThread supportThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.SUPPORT)
                .customer(customerAccount)
                .build();
        when(chatThreadRepository.findById(supportThread.getId())).thenReturn(Optional.of(supportThread));

        chatService.handleTyping(adminPrincipal, supportThread.getId(), false);
        verify(webSocketSessionService, atLeastOnce()).sendToUser(any(), eq("CHAT_TYPING"), any());
    }

    @Test
    @DisplayName("Các trường hợp lỗi của sendMessage, editMessage, deleteMessage, closeThread")
    void testExceptionsAndValidations() {
        // Principal null
        assertThrows(CustomException.class, () -> chatService.sendMessage(null, new SendMessageRequest()));
        assertThrows(CustomException.class, () -> chatService.sendImageMessage(null, sampleThread.getId(), null));
        assertThrows(CustomException.class, () -> chatService.sendVideoMessage(null, sampleThread.getId(), null));
        assertThrows(CustomException.class, () -> chatService.editMessage(null, UUID.randomUUID(), "new"));
        assertThrows(CustomException.class, () -> chatService.deleteMessage(null, UUID.randomUUID()));

        // Thread locked
        sampleThread.setStatus(ThreadStatus.CLOSED);
        when(chatThreadRepository.findById(sampleThread.getId())).thenReturn(Optional.of(sampleThread));
        SendMessageRequest req = new SendMessageRequest();
        req.setThreadId(sampleThread.getId());
        req.setContent("Test");
        assertThrows(CustomException.class, () -> chatService.sendMessage(buyerPrincipal, req));

        // Admin không được nhắn tin vào DISPUTE thread
        ChatThread disputeThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.DISPUTE)
                .customer(customerAccount)
                .shop(sampleShop)
                .build();
        when(chatThreadRepository.findById(disputeThread.getId())).thenReturn(Optional.of(disputeThread));
        req.setThreadId(disputeThread.getId());
        assertThrows(CustomException.class, () -> chatService.sendMessage(adminPrincipal, req));

        // closeThread cho DISPUTE thread ném lỗi
        assertThrows(CustomException.class, () -> chatService.closeThread(buyerPrincipal, disputeThread.getId()));

        // Sửa tin nhắn trong DISPUTE thread
        ChatMessage disputeMsg = ChatMessage.builder()
                .id(UUID.randomUUID())
                .thread(disputeThread)
                .senderId(customerId)
                .messageType(ChatMessageType.TEXT)
                .build();
        when(chatMessageRepository.findById(disputeMsg.getId())).thenReturn(Optional.of(disputeMsg));
        assertThrows(CustomException.class, () -> chatService.editMessage(buyerPrincipal, disputeMsg.getId(), "Edit"));

        // Sửa tin nhắn hệ thống
        ChatMessage sysMsg = ChatMessage.builder()
                .id(UUID.randomUUID())
                .thread(sampleThread)
                .senderId(customerId)
                .messageType(ChatMessageType.SYSTEM)
                .build();
        when(chatMessageRepository.findById(sysMsg.getId())).thenReturn(Optional.of(sysMsg));
        assertThrows(CustomException.class, () -> chatService.editMessage(buyerPrincipal, sysMsg.getId(), "Edit"));

        // Người không sở hữu sửa tin nhắn
        ChatMessage otherMsg = ChatMessage.builder()
                .id(UUID.randomUUID())
                .thread(sampleThread)
                .senderId(UUID.randomUUID())
                .messageType(ChatMessageType.TEXT)
                .build();
        when(chatMessageRepository.findById(otherMsg.getId())).thenReturn(Optional.of(otherMsg));
        assertThrows(CustomException.class, () -> chatService.editMessage(buyerPrincipal, otherMsg.getId(), "Edit"));
    }

    @Test
    @DisplayName("editMessage và deleteMessage các nhánh validation và broadcast")
    void testEditAndDeleteMessage_DetailedBranches() {
        ChatThread supportThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.SUPPORT)
                .customer(customerAccount)
                .status(ThreadStatus.OPEN)
                .unreadAdmin(0)
                .unreadCustomer(0)
                .build();

        // editMessage blank content
        assertThrows(CustomException.class, () -> chatService.editMessage(buyerPrincipal, UUID.randomUUID(), "   "));

        // editMessage deleted message
        ChatMessage delMsg = ChatMessage.builder()
                .id(UUID.randomUUID())
                .thread(sampleThread)
                .senderId(customerId)
                .isDeleted(true)
                .messageType(ChatMessageType.TEXT)
                .build();
        when(chatMessageRepository.findById(delMsg.getId())).thenReturn(Optional.of(delMsg));
        assertThrows(CustomException.class, () -> chatService.editMessage(buyerPrincipal, delMsg.getId(), "valid"));

        // editMessage non-text message
        ChatMessage imgMsg = ChatMessage.builder()
                .id(UUID.randomUUID())
                .thread(sampleThread)
                .senderId(customerId)
                .isDeleted(false)
                .messageType(ChatMessageType.IMAGE)
                .build();
        when(chatMessageRepository.findById(imgMsg.getId())).thenReturn(Optional.of(imgMsg));
        assertThrows(CustomException.class, () -> chatService.editMessage(buyerPrincipal, imgMsg.getId(), "valid"));

        // editMessage in SUPPORT thread by customer
        ChatMessage supMsg = ChatMessage.builder()
                .id(UUID.randomUUID())
                .thread(supportThread)
                .senderId(customerId)
                .isDeleted(false)
                .messageType(ChatMessageType.TEXT)
                .content("Cần hỗ trợ đơn hàng")
                .build();
        when(chatMessageRepository.findById(supMsg.getId())).thenReturn(Optional.of(supMsg));
        when(chatMessageRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        ChatMessageResponse editedRes = chatService.editMessage(buyerPrincipal, supMsg.getId(), "Cần hỗ trợ gấp đơn hàng");
        assertNotNull(editedRes);
        verify(webSocketSessionService, atLeastOnce()).broadcastToAdmins(eq("CHAT_MESSAGE_EDITED"), any());

        // deleteMessage in DISPUTE thread throws
        ChatThread dispThread = ChatThread.builder().id(UUID.randomUUID()).type(ThreadType.DISPUTE).build();
        ChatMessage dispMsg = ChatMessage.builder().id(UUID.randomUUID()).thread(dispThread).senderId(customerId).build();
        when(chatMessageRepository.findById(dispMsg.getId())).thenReturn(Optional.of(dispMsg));
        assertThrows(CustomException.class, () -> chatService.deleteMessage(buyerPrincipal, dispMsg.getId()));

        // deleteMessage SYSTEM msg throws
        ChatMessage sysMsg = ChatMessage.builder().id(UUID.randomUUID()).thread(sampleThread).senderId(customerId).messageType(ChatMessageType.SYSTEM).build();
        when(chatMessageRepository.findById(sysMsg.getId())).thenReturn(Optional.of(sysMsg));
        assertThrows(CustomException.class, () -> chatService.deleteMessage(buyerPrincipal, sysMsg.getId()));

        // deleteMessage stranger throws
        ChatMessage strangerMsg = ChatMessage.builder().id(UUID.randomUUID()).thread(sampleThread).senderId(UUID.randomUUID()).messageType(ChatMessageType.TEXT).build();
        when(chatMessageRepository.findById(strangerMsg.getId())).thenReturn(Optional.of(strangerMsg));
        assertThrows(CustomException.class, () -> chatService.deleteMessage(buyerPrincipal, strangerMsg.getId()));

        // deleteMessage already deleted -> idempotent return
        strangerMsg.setIsDeleted(true);
        chatService.deleteMessage(adminPrincipal, strangerMsg.getId());

        // deleteMessage admin deletes message in SUPPORT thread
        ChatMessage textMsg = ChatMessage.builder().id(UUID.randomUUID()).thread(supportThread).senderId(customerId).messageType(ChatMessageType.TEXT).isDeleted(false).build();
        when(chatMessageRepository.findById(textMsg.getId())).thenReturn(Optional.of(textMsg));
        chatService.deleteMessage(adminPrincipal, textMsg.getId());
        assertTrue(textMsg.getIsDeleted());
        verify(webSocketSessionService, atLeastOnce()).broadcastToAdmins(eq("CHAT_MESSAGE_DELETED"), any());
    }

    @Test
    @DisplayName("closeDisputeThread: các nhánh null, empty, already closed, fallback shopOwner")
    void testCloseDisputeThread_Branches() {
        // requestId null -> early return
        chatService.closeDisputeThread(null, "reason");

        // thread empty -> early return
        UUID reqId = UUID.randomUUID();
        when(chatThreadRepository.findByRequestIdForUpdate(reqId)).thenReturn(Optional.empty());
        chatService.closeDisputeThread(reqId, "reason");

        // already closed -> early return
        ChatThread closedThread = ChatThread.builder().id(UUID.randomUUID()).status(ThreadStatus.CLOSED).build();
        when(chatThreadRepository.findByRequestIdForUpdate(reqId)).thenReturn(Optional.of(closedThread));
        chatService.closeDisputeThread(reqId, "reason");

        // Active thread with fallback shopOwner via shopRepository
        Shop shopNoAcc = Shop.builder().id(UUID.randomUUID()).user(null).build();
        ChatThread activeThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .status(ThreadStatus.OPEN)
                .type(ThreadType.DISPUTE)
                .customer(customerAccount)
                .shop(shopNoAcc)
                .requestId(reqId)
                .build();
        when(chatThreadRepository.findByRequestIdForUpdate(reqId)).thenReturn(Optional.of(activeThread));
        when(shopRepository.findById(shopNoAcc.getId())).thenReturn(Optional.of(sampleShop));

        chatService.closeDisputeThread(reqId, null);
        assertEquals(ThreadStatus.CLOSED, activeThread.getStatus());
        verify(webSocketSessionService, atLeastOnce()).broadcastToAdmins(eq("CHAT_THREAD_CLOSED"), any());
    }

    @Test
    @DisplayName("getDisputeThreadByOrderId: các nhánh validation, null report, stranger, success")
    void testGetDisputeThreadByOrderId_Branches() {
        assertThrows(CustomException.class, () -> chatService.getDisputeThreadByOrderId(null, UUID.randomUUID()));
        assertThrows(CustomException.class, () -> chatService.getDisputeThreadByOrderId(buyerPrincipal, null));

        UUID orderId = UUID.randomUUID();
        when(reportRepository.findByOrderIdOrderByCreatedAtDesc(orderId)).thenReturn(List.of());
        assertNull(chatService.getDisputeThreadByOrderId(buyerPrincipal, orderId));

        // Report request null -> returns null
        com.marketplace.ecommerce.request.entity.Report r = new com.marketplace.ecommerce.request.entity.Report();
        r.setRequest(null);
        when(reportRepository.findByOrderIdOrderByCreatedAtDesc(orderId)).thenReturn(List.of(r));
        assertNull(chatService.getDisputeThreadByOrderId(buyerPrincipal, orderId));

        // Thread not found -> returns null
        com.marketplace.ecommerce.request.entity.Request req = new com.marketplace.ecommerce.request.entity.Request();
        req.setId(UUID.randomUUID());
        r.setRequest(req);
        when(chatThreadRepository.findFirstByRequestIdAndType(req.getId(), ThreadType.DISPUTE)).thenReturn(Optional.empty());
        assertNull(chatService.getDisputeThreadByOrderId(buyerPrincipal, orderId));

        // Stranger not participant -> returns null
        ChatThread dispThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.DISPUTE)
                .customer(Account.builder().id(UUID.randomUUID()).build())
                .shop(Shop.builder().id(UUID.randomUUID()).build())
                .build();
        when(chatThreadRepository.findFirstByRequestIdAndType(req.getId(), ThreadType.DISPUTE)).thenReturn(Optional.of(dispThread));
        assertNull(chatService.getDisputeThreadByOrderId(buyerPrincipal, orderId));

        // Participant success
        dispThread.setCustomer(customerAccount);
        ChatThreadResponse res = chatService.getDisputeThreadByOrderId(buyerPrincipal, orderId);
        assertNotNull(res);

        // Admin success
        ChatThreadResponse adminRes = chatService.getDisputeThreadByOrderId(adminPrincipal, orderId);
        assertNotNull(adminRes);
    }

    @Test
    @DisplayName("dispatchRealtimeMessage và resolveSenderDisplayName cho DISPUTE và SHOP và SUPPORT")
    void testDispatchAndSenderDisplayNameBranches() {
        Account adminAccount = new Account();
        adminAccount.setId(adminId);
        adminAccount.setUsername("adminA");

        ChatThread supportThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.SUPPORT)
                .customer(customerAccount)
                .status(ThreadStatus.OPEN)
                .unreadAdmin(0)
                .unreadCustomer(0)
                .build();

        // DISPUTE message by customer
        ChatThread dispThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.DISPUTE)
                .status(ThreadStatus.OPEN)
                .customer(customerAccount)
                .shop(sampleShop)
                .unreadAdmin(0)
                .unreadCustomer(0)
                .build();

        when(chatThreadRepository.findById(dispThread.getId())).thenReturn(Optional.of(dispThread));
        when(chatMessageRepository.save(any())).thenAnswer(i -> {
            ChatMessage m = i.getArgument(0);
            m.setId(UUID.randomUUID());
            m.setCreatedAt(java.time.LocalDateTime.now());
            return m;
        });

        SendMessageRequest msgReq = new SendMessageRequest();
        msgReq.setThreadId(dispThread.getId());
        msgReq.setContent("Tin nhắn khiếu nại");

        ChatMessageResponse dispMsgRes = chatService.sendMessage(buyerPrincipal, msgReq);
        assertNotNull(dispMsgRes);
        verify(webSocketSessionService, atLeastOnce()).broadcastToAdmins(eq("CHAT_MESSAGE"), any());

        // SUPPORT message by admin (admin null on thread -> sets admin)
        supportThread.setAdmin(null);
        supportThread.setStatus(ThreadStatus.OPEN);
        when(chatThreadRepository.findById(supportThread.getId())).thenReturn(Optional.of(supportThread));
        when(accountRepository.findById(adminId)).thenReturn(Optional.of(adminAccount));

        msgReq.setThreadId(supportThread.getId());
        msgReq.setContent("Hỗ trợ viên trả lời");
        ChatMessageResponse supMsgRes = chatService.sendMessage(adminPrincipal, msgReq);
        assertNotNull(supMsgRes);
        assertEquals(adminAccount, supportThread.getAdmin());
        verify(webSocketSessionService, atLeastOnce()).sendToUser(eq(customerAccount.getId()), eq("CHAT_MESSAGE"), any());
    }

    @Test
    @DisplayName("validateNotSelfChat ném ngoại lệ khi shopOwner tự chat")
    void testValidateNotSelfChat_Throws() {
        CurrentUserInfo shopOwnerAsCustomer = new CurrentUserInfo();
        shopOwnerAsCustomer.setAccountId(sellerId);
        shopOwnerAsCustomer.setUsername("sellerB");
        shopOwnerAsCustomer.setRole("ROLE_SELLER");

        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(accountRepository.findById(sellerId)).thenReturn(Optional.of(sellerAccount));
        when(chatThreadRepository.findFirstByCustomer_IdAndShop_IdAndStatus(sellerId, sampleShop.getId(), ThreadStatus.OPEN)).thenReturn(Optional.empty());

        assertThrows(CustomException.class, () -> chatService.getOrCreateShopThread(shopOwnerAsCustomer, sampleShop.getId()));
    }

    @Test
    @DisplayName("markRead, closeThread, handleTyping các nhánh bổ sung")
    void testMarkReadAndCloseThread_MoreBranches() {
        // markRead by shopOwner
        when(chatThreadRepository.findById(sampleThread.getId())).thenReturn(Optional.of(sampleThread));
        chatService.markRead(sellerPrincipal, sampleThread.getId());
        assertEquals(0, sampleThread.getUnreadAdmin());
        verify(webSocketSessionService, atLeastOnce()).sendToUser(eq(customerAccount.getId()), eq("CHAT_READ"), any());

        // markRead by customer in SUPPORT thread
        ChatThread supThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.SUPPORT)
                .customer(customerAccount)
                .status(ThreadStatus.OPEN)
                .build();
        when(chatThreadRepository.findById(supThread.getId())).thenReturn(Optional.of(supThread));
        chatService.markRead(buyerPrincipal, supThread.getId());
        verify(webSocketSessionService, atLeastOnce()).broadcastToAdmins(eq("CHAT_READ"), any());

        // closeThread in SHOP thread
        when(chatThreadRepository.findById(sampleThread.getId())).thenReturn(Optional.of(sampleThread));
        chatService.closeThread(buyerPrincipal, sampleThread.getId());
        assertEquals(ThreadStatus.RESOLVED, sampleThread.getStatus());
        verify(webSocketSessionService, atLeastOnce()).sendToUser(eq(customerAccount.getId()), eq("CHAT_THREAD_CLOSED"), any());

        // handleTyping by shopOwner in SHOP thread
        chatService.handleTyping(sellerPrincipal, sampleThread.getId(), true);
        verify(webSocketSessionService, atLeastOnce()).sendToUser(eq(customerAccount.getId()), eq("CHAT_TYPING"), any());

        // handleTyping by customer in SUPPORT thread
        chatService.handleTyping(buyerPrincipal, supThread.getId(), true);
        verify(webSocketSessionService, atLeastOnce()).broadcastToAdmins(eq("CHAT_TYPING"), any());
    }


    @Test
    @DisplayName("getThreadById lay chi tiet cuoc hoi thoai thanh cong")
    void testGetThreadById_Success() {
        when(chatThreadRepository.findById(sampleThread.getId())).thenReturn(Optional.of(sampleThread));
        ChatThreadResponse res = chatService.getThreadById(buyerPrincipal, sampleThread.getId());
        assertNotNull(res);
        assertEquals(sampleThread.getId(), res.getId());
    }

    @Test
    @DisplayName("requireParticipantThread nem ngoai le khi chua dang nhap hoac khong phai thanh vien")
    void testRequireParticipantThread_Validations() {
        // 1. null principal
        assertThrows(CustomException.class, () -> chatService.getThreadById(null, sampleThread.getId()));

        // 2. not found
        when(chatThreadRepository.findById(any())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> chatService.getThreadById(buyerPrincipal, UUID.randomUUID()));

        // 3. not a participant
        CurrentUserInfo stranger = new CurrentUserInfo();
        stranger.setAccountId(UUID.randomUUID());
        stranger.setUsername("stranger");
        stranger.setRole("ROLE_USER");

        when(chatThreadRepository.findById(sampleThread.getId())).thenReturn(Optional.of(sampleThread));
        assertThrows(CustomException.class, () -> chatService.getThreadById(stranger, sampleThread.getId()));
    }

    @Test
    @DisplayName("sendImageMessage va sendVideoMessage gui tin nhan da phuong tien")
    void testSendMediaMessages() {
        MockMultipartFile imgFile = new MockMultipartFile("file", "test.jpg", "image/jpeg", "image".getBytes());
        when(chatThreadRepository.findById(sampleThread.getId())).thenReturn(Optional.of(sampleThread));
        when(accountRepository.findById(customerId)).thenReturn(Optional.of(customerAccount));
        when(fileService.uploadFile(any(), eq("chat"))).thenReturn("test_img.jpg");
        when(fileService.getFileUrl("test_img.jpg")).thenReturn("http://cdn/test_img.jpg");

        ChatMessage imgMsg = ChatMessage.builder()
                .id(UUID.randomUUID())
                .thread(sampleThread)
                .content("[Hinh anh]")
                .messageType(ChatMessageType.IMAGE)
                .imageUrl("http://cdn/test_img.jpg")
                .createdAt(LocalDateTime.now())
                .build();
        when(chatMessageRepository.save(any(ChatMessage.class))).thenReturn(imgMsg);

        ChatMessageResponse resImg = chatService.sendImageMessage(buyerPrincipal, sampleThread.getId(), imgFile);
        assertNotNull(resImg);

        // sendVideoMessage
        MockMultipartFile vidFile = new MockMultipartFile("file", "test.mp4", "video/mp4", "video".getBytes());
        when(fileService.uploadFile(any(), eq("chat"))).thenReturn("test_vid.mp4");
        when(fileService.getFileUrl("test_vid.mp4")).thenReturn("http://cdn/test_vid.mp4");

        ChatMessage vidMsg = ChatMessage.builder()
                .id(UUID.randomUUID())
                .thread(sampleThread)
                .content("[Video]")
                .messageType(ChatMessageType.VIDEO)
                .videoUrl("http://cdn/test_vid.mp4")
                .createdAt(LocalDateTime.now())
                .build();
        when(chatMessageRepository.save(any(ChatMessage.class))).thenReturn(vidMsg);

        ChatMessageResponse resVid = chatService.sendVideoMessage(buyerPrincipal, sampleThread.getId(), vidFile);
        assertNotNull(resVid);

        // DISPUTE locked validation
        ChatThread lockedThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.DISPUTE)
                .customer(customerAccount)
                .status(ThreadStatus.CLOSED)
                .build();
        when(chatThreadRepository.findById(lockedThread.getId())).thenReturn(Optional.of(lockedThread));
        assertThrows(CustomException.class, () -> chatService.sendImageMessage(buyerPrincipal, lockedThread.getId(), imgFile));

        // DISPUTE admin cannot send validation
        ChatThread openDisputeThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.DISPUTE)
                .customer(customerAccount)
                .status(ThreadStatus.OPEN)
                .build();
        when(chatThreadRepository.findById(openDisputeThread.getId())).thenReturn(Optional.of(openDisputeThread));
        assertThrows(CustomException.class, () -> chatService.sendImageMessage(adminPrincipal, openDisputeThread.getId(), imgFile));
    }

    @Test
    @DisplayName("closeThread nem ngoai le khi co dong phong DISPUTE thu cong")
    void testCloseThread_DisputeThrows() {
        ChatThread disputeThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.DISPUTE)
                .customer(customerAccount)
                .build();
        when(chatThreadRepository.findById(disputeThread.getId())).thenReturn(Optional.of(disputeThread));
        assertThrows(CustomException.class, () -> chatService.closeThread(buyerPrincipal, disputeThread.getId()));
    }

    @Test
    @DisplayName("getOrCreateShopThread voi chuoi ten shop hoac slug")
    void testGetOrCreateShopThread_ByNameOrSlug() {
        // 1. By slug matching shop name
        when(shopRepository.findAll()).thenReturn(List.of(sampleShop));
        when(chatThreadRepository.findFirstByCustomer_IdAndShop_IdAndStatus(customerId, sampleShop.getId(), ThreadStatus.OPEN))
                .thenReturn(Optional.of(sampleThread));

        ChatThreadResponse res = chatService.getOrCreateShopThread(buyerPrincipal, "Tech World");
        assertNotNull(res);

        // 2. Empty shop repo throws
        when(shopRepository.findAll()).thenReturn(List.of());
        assertThrows(CustomException.class, () -> chatService.getOrCreateShopThread(buyerPrincipal, "NonExistent"));
    }

    @Test
    @DisplayName("getDisputeThreadByRequestId va getDisputeThreadByOrderId")
    void testGetDisputeThread() {
        UUID reqId = UUID.randomUUID();
        UUID ordId = UUID.randomUUID();

        // 1. Validations on requestId
        assertThrows(CustomException.class, () -> chatService.getDisputeThreadByRequestId(null, reqId));
        assertThrows(CustomException.class, () -> chatService.getDisputeThreadByRequestId(buyerPrincipal, null));

        // 2. Not found
        when(chatThreadRepository.findFirstByRequestIdAndType(reqId, ThreadType.DISPUTE)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> chatService.getDisputeThreadByRequestId(buyerPrincipal, reqId));

        // 3. Found and participant
        ChatThread dispThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.DISPUTE)
                .requestId(reqId)
                .customer(customerAccount)
                .build();
        when(chatThreadRepository.findFirstByRequestIdAndType(reqId, ThreadType.DISPUTE)).thenReturn(Optional.of(dispThread));
        ChatThreadResponse resReq = chatService.getDisputeThreadByRequestId(buyerPrincipal, reqId);
        assertNotNull(resReq);

        // 4. By orderId
        assertThrows(CustomException.class, () -> chatService.getDisputeThreadByOrderId(null, ordId));
        assertThrows(CustomException.class, () -> chatService.getDisputeThreadByOrderId(buyerPrincipal, null));

        when(reportRepository.findByOrderIdOrderByCreatedAtDesc(ordId)).thenReturn(List.of());
        assertNull(chatService.getDisputeThreadByOrderId(buyerPrincipal, ordId));

        Report rep = new Report();
        rep.setId(UUID.randomUUID());
        com.marketplace.ecommerce.request.entity.Request baseReq = new com.marketplace.ecommerce.request.entity.Request();
        baseReq.setId(reqId);
        rep.setRequest(baseReq);

        when(reportRepository.findByOrderIdOrderByCreatedAtDesc(ordId)).thenReturn(List.of(rep));
        ChatThreadResponse resOrd = chatService.getDisputeThreadByOrderId(buyerPrincipal, ordId);
        assertNotNull(resOrd);
    }

    @Test
    @DisplayName("closeDisputeThread dong phong tranh chap va gui thong bao realtime")
    void testCloseDisputeThread_Success() {
        UUID reqId = UUID.randomUUID();
        // 1. null requestId -> does nothing
        chatService.closeDisputeThread(null, "Ly do");

        // 2. not found -> does nothing
        when(chatThreadRepository.findByRequestIdForUpdate(reqId)).thenReturn(Optional.empty());
        chatService.closeDisputeThread(reqId, "Ly do");

        // 3. already CLOSED -> does nothing
        ChatThread closedThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .status(ThreadStatus.CLOSED)
                .build();
        when(chatThreadRepository.findByRequestIdForUpdate(reqId)).thenReturn(Optional.of(closedThread));
        chatService.closeDisputeThread(reqId, "Ly do");

        // 4. open thread -> closes thread
        ChatThread openThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .status(ThreadStatus.OPEN)
                .requestId(reqId)
                .customer(customerAccount)
                .shop(sampleShop)
                .build();
        when(chatThreadRepository.findByRequestIdForUpdate(reqId)).thenReturn(Optional.of(openThread));

        ChatMessage sysMsg = ChatMessage.builder()
                .id(UUID.randomUUID())
                .thread(openThread)
                .content("He Thong Dong")
                .createdAt(LocalDateTime.now())
                .build();
        when(chatMessageRepository.save(any())).thenReturn(sysMsg);

        chatService.closeDisputeThread(reqId, "Giai quyet thoa dang");
        assertEquals(ThreadStatus.CLOSED, openThread.getStatus());
        verify(webSocketSessionService, atLeastOnce()).broadcastToAdmins(eq("CHAT_THREAD_CLOSED"), any());
    }

    @Test
    @DisplayName("resolveSenderDisplayName kiem tra cac nhanh hien thi ten nguoi gui")
    void testResolveSenderDisplayName_Branches() {
        // User with fullName
        User userWithFullName = new User();
        userWithFullName.setId(UUID.randomUUID());
        userWithFullName.setFullName("Nguyen Van A");
        when(userRepository.findByAccountId(customerId)).thenReturn(Optional.of(userWithFullName));

        SendMessageRequest req = new SendMessageRequest();
        req.setThreadId(sampleThread.getId());
        req.setContent("Hello Shop");

        when(chatThreadRepository.findById(sampleThread.getId())).thenReturn(Optional.of(sampleThread));
        when(accountRepository.findById(customerId)).thenReturn(Optional.of(customerAccount));

        ChatMessage saved = ChatMessage.builder()
                .id(UUID.randomUUID())
                .thread(sampleThread)
                .senderId(customerId)
                .senderName("Nguyen Van A")
                .content("Hello Shop")
                .createdAt(LocalDateTime.now())
                .build();
        when(chatMessageRepository.save(any())).thenReturn(saved);

        ChatMessageResponse msgRes = chatService.sendMessage(buyerPrincipal, req);
        assertNotNull(msgRes);
    }

    @Test
    @DisplayName("TransactionSynchronization when active transaction: dispute thread creation and close")
    void testTransactionSynchronization_Active() {
        org.springframework.transaction.support.TransactionSynchronizationManager.initSynchronization();
        org.springframework.transaction.support.TransactionSynchronizationManager.setActualTransactionActive(true);

        try {
            UUID buyerId = UUID.randomUUID();
            UUID shopId = UUID.randomUUID();
            UUID reqId = UUID.randomUUID();
            UUID orderId = UUID.randomUUID();

            Account bAcc = Account.builder().id(buyerId).email("b@test.com").build();
            User bUser = User.builder().id(UUID.randomUUID()).account(bAcc).fullName("Buyer").build();
            when(accountRepository.findById(buyerId)).thenReturn(Optional.of(bAcc));
            when(userRepository.findByAccountId(buyerId)).thenReturn(Optional.of(bUser));

            Shop s = Shop.builder().id(shopId).name("S").build();
            when(shopRepository.findById(shopId)).thenReturn(Optional.of(s));

            ChatThread dt = ChatThread.builder()
                    .id(UUID.randomUUID())
                    .type(ThreadType.DISPUTE)
                    .status(ThreadStatus.OPEN)
                    .requestId(reqId)
                    .customer(bAcc)
                    .shop(s)
                    .build();
            when(chatThreadRepository.insertDisputeThreadSafe(any(), any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(1);
            when(chatThreadRepository.findFirstByRequestIdAndType(reqId, ThreadType.DISPUTE)).thenReturn(Optional.of(dt));
            when(chatThreadRepository.save(any())).thenReturn(dt);

            chatService.getOrCreateDisputeThread(orderId, reqId, buyerId, shopId, "ORD-123");

            // closeDisputeThread with transaction active
            when(chatThreadRepository.findByRequestIdForUpdate(reqId)).thenReturn(Optional.of(dt));
            ChatMessage sysMsg = ChatMessage.builder()
                    .id(UUID.randomUUID())
                    .thread(dt)
                    .content("System message")
                    .createdAt(LocalDateTime.now())
                    .build();
            when(chatMessageRepository.save(any())).thenReturn(sysMsg);

            chatService.closeDisputeThread(reqId, "Dong do thoa thuan xong");

            // Run afterCommit for registered synchronizations
            for (org.springframework.transaction.support.TransactionSynchronization sync :
                    org.springframework.transaction.support.TransactionSynchronizationManager.getSynchronizations()) {
                sync.afterCommit();
            }
        } finally {
            org.springframework.transaction.support.TransactionSynchronizationManager.clear();
        }
    }

    @Test
    @DisplayName("sendVideoMessage: gửi tin nhắn video thành công và các ngoại lệ")
    void testSendVideoMessage_ExtraValidation() {
        // principal null
        assertThrows(CustomException.class, () -> chatService.sendVideoMessage(null, sampleThread.getId(), null));

        // locked thread
        ChatThread lockedThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.DISPUTE)
                .customer(customerAccount)
                .status(ThreadStatus.CLOSED)
                .build();
        when(chatThreadRepository.findById(lockedThread.getId())).thenReturn(Optional.of(lockedThread));
        assertThrows(CustomException.class, () -> chatService.sendVideoMessage(buyerPrincipal, lockedThread.getId(), null));

        // admin in dispute thread
        ChatThread disputeThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.DISPUTE)
                .customer(customerAccount)
                .status(ThreadStatus.OPEN)
                .build();
        when(chatThreadRepository.findById(disputeThread.getId())).thenReturn(Optional.of(disputeThread));
        assertThrows(CustomException.class, () -> chatService.sendVideoMessage(adminPrincipal, disputeThread.getId(), null));

        // valid video file in shop thread and dispute thread
        when(chatThreadRepository.findById(sampleThread.getId())).thenReturn(Optional.of(sampleThread));
        when(accountRepository.findById(customerId)).thenReturn(Optional.of(customerAccount));
        MockMultipartFile videoFile = new MockMultipartFile("file", "demo.mp4", "video/mp4", "video-content".getBytes());
        when(fileService.uploadFile(any(), anyString())).thenReturn("chat/demo.mp4");
        when(fileService.getFileUrl("chat/demo.mp4")).thenReturn("http://cdn.com/demo.mp4");

        ChatMessage savedMsg = ChatMessage.builder()
                .id(UUID.randomUUID())
                .thread(sampleThread)
                .senderId(customerId)
                .senderName("Buyer")
                .messageType(ChatMessageType.VIDEO)
                .videoUrl("http://cdn.com/demo.mp4")
                .createdAt(LocalDateTime.now())
                .build();
        when(chatMessageRepository.save(any())).thenReturn(savedMsg);

        ChatMessageResponse res = chatService.sendVideoMessage(buyerPrincipal, sampleThread.getId(), videoFile);
        assertNotNull(res);
        assertEquals("http://cdn.com/demo.mp4", res.getVideoUrl());

        ChatMessageResponse resDispute = chatService.sendVideoMessage(buyerPrincipal, disputeThread.getId(), videoFile);
        assertNotNull(resDispute);
    }

    @Test
    @DisplayName("editMessage: các nhánh validation và sửa tin nhắn thành công")
    void testEditMessage_ExtraValidation() {
        UUID msgId = UUID.randomUUID();

        // 1. blank content
        assertThrows(CustomException.class, () -> chatService.editMessage(buyerPrincipal, msgId, "  "));

        // 2. message not found
        when(chatMessageRepository.findById(msgId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> chatService.editMessage(buyerPrincipal, msgId, "New text"));

        // 3. dispute thread message
        ChatThread disputeThread = ChatThread.builder().type(ThreadType.DISPUTE).build();
        ChatMessage disputeMsg = ChatMessage.builder().id(msgId).thread(disputeThread).build();
        when(chatMessageRepository.findById(msgId)).thenReturn(Optional.of(disputeMsg));
        assertThrows(CustomException.class, () -> chatService.editMessage(buyerPrincipal, msgId, "New text"));

        // 4. system message
        ChatMessage sysMsg = ChatMessage.builder().id(msgId).messageType(ChatMessageType.SYSTEM).build();
        when(chatMessageRepository.findById(msgId)).thenReturn(Optional.of(sysMsg));
        assertThrows(CustomException.class, () -> chatService.editMessage(buyerPrincipal, msgId, "New text"));

        // 5. not sender
        ChatMessage strangerMsg = ChatMessage.builder().id(msgId).senderId(UUID.randomUUID()).messageType(ChatMessageType.TEXT).build();
        when(chatMessageRepository.findById(msgId)).thenReturn(Optional.of(strangerMsg));
        assertThrows(CustomException.class, () -> chatService.editMessage(buyerPrincipal, msgId, "New text"));

        // 6. deleted message
        ChatMessage deletedMsg = ChatMessage.builder().id(msgId).senderId(customerId).isDeleted(true).messageType(ChatMessageType.TEXT).build();
        when(chatMessageRepository.findById(msgId)).thenReturn(Optional.of(deletedMsg));
        assertThrows(CustomException.class, () -> chatService.editMessage(buyerPrincipal, msgId, "New text"));

        // 7. message type not text (e.g. IMAGE)
        ChatMessage imgMsg = ChatMessage.builder().id(msgId).senderId(customerId).messageType(ChatMessageType.IMAGE).build();
        when(chatMessageRepository.findById(msgId)).thenReturn(Optional.of(imgMsg));
        assertThrows(CustomException.class, () -> chatService.editMessage(buyerPrincipal, msgId, "New text"));

        // 8. valid edit
        ChatMessage textMsg = ChatMessage.builder()
                .id(msgId)
                .senderId(customerId)
                .messageType(ChatMessageType.TEXT)
                .content("Old content")
                .thread(sampleThread)
                .build();
        when(chatMessageRepository.findById(msgId)).thenReturn(Optional.of(textMsg));
        when(chatMessageRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ChatMessageResponse res = chatService.editMessage(buyerPrincipal, msgId, "Updated content");
        assertNotNull(res);
        assertEquals("Updated content", res.getContent());
    }

    @Test
    @DisplayName("deleteMessage: các ngoại lệ khi xóa tin nhắn")
    void testDeleteMessage_Exceptions() {
        UUID msgId = UUID.randomUUID();

        // 1. not found
        when(chatMessageRepository.findById(msgId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> chatService.deleteMessage(buyerPrincipal, msgId));

        // 2. in dispute thread
        ChatThread disputeThread = ChatThread.builder().type(ThreadType.DISPUTE).build();
        ChatMessage disputeMsg = ChatMessage.builder().id(msgId).thread(disputeThread).build();
        when(chatMessageRepository.findById(msgId)).thenReturn(Optional.of(disputeMsg));
        assertThrows(CustomException.class, () -> chatService.deleteMessage(buyerPrincipal, msgId));

        // 3. system message
        ChatMessage sysMsg = ChatMessage.builder().id(msgId).messageType(ChatMessageType.SYSTEM).build();
        when(chatMessageRepository.findById(msgId)).thenReturn(Optional.of(sysMsg));
        assertThrows(CustomException.class, () -> chatService.deleteMessage(buyerPrincipal, msgId));

        // 4. stranger
        ChatMessage strangerMsg = ChatMessage.builder().id(msgId).senderId(UUID.randomUUID()).build();
        when(chatMessageRepository.findById(msgId)).thenReturn(Optional.of(strangerMsg));
        assertThrows(CustomException.class, () -> chatService.deleteMessage(buyerPrincipal, msgId));
    }

    @Test
    @DisplayName("closeThread: không được đóng thread DISPUTE trực tiếp và đóng thread SHOP thành công")
    void testCloseThread_Branches() {
        // Dispute thread
        ChatThread disputeThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.DISPUTE)
                .customer(customerAccount)
                .build();
        when(chatThreadRepository.findById(disputeThread.getId())).thenReturn(Optional.of(disputeThread));
        assertThrows(CustomException.class, () -> chatService.closeThread(buyerPrincipal, disputeThread.getId()));

        // Shop thread
        when(chatThreadRepository.findById(sampleThread.getId())).thenReturn(Optional.of(sampleThread));
        chatService.closeThread(buyerPrincipal, sampleThread.getId());
        assertEquals(ThreadStatus.RESOLVED, sampleThread.getStatus());
    }

    @Test
    @DisplayName("validateNotSelfChat: ném lỗi khi người dùng tự nhắn tin cho gian hàng của chính mình")
    void testValidateNotSelfChat() {
        // Shop thuộc về customerAccount
        User selfUser = User.builder().id(UUID.randomUUID()).account(customerAccount).build();
        Shop selfShop = Shop.builder().id(UUID.randomUUID()).user(selfUser).build();

        ChatThread selfThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.SHOP)
                .customer(customerAccount)
                .shop(selfShop)
                .build();
        when(chatThreadRepository.findById(selfThread.getId())).thenReturn(Optional.of(selfThread));
        when(accountRepository.findById(customerId)).thenReturn(Optional.of(customerAccount));

        SendMessageRequest req = new SendMessageRequest();
        req.setThreadId(selfThread.getId());
        req.setContent("Chat với chính mình");

        assertThrows(CustomException.class, () -> chatService.sendMessage(buyerPrincipal, req));
    }

    @Test
    @DisplayName("Bao phủ các nhánh SUPPORT thread (closeThread, editMessage, sendMessage bởi Admin/Seller) và lambdas")
    void testSupportThreadAndSellerBranches() {
        ChatThread supportThread = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.SUPPORT)
                .customer(customerAccount)
                .status(ThreadStatus.OPEN)
                .unreadAdmin(0)
                .unreadCustomer(0)
                .build();
        when(chatThreadRepository.findById(supportThread.getId())).thenReturn(Optional.of(supportThread));
        when(accountRepository.findById(adminId)).thenReturn(Optional.of(new Account()));

        // 1. Admin sends message in SUPPORT thread -> hits senderIsAdmin in dispatchRealtimeMessage & resolveSenderDisplayName(isAdmin=true)
        SendMessageRequest adminSendReq = new SendMessageRequest();
        adminSendReq.setThreadId(supportThread.getId());
        adminSendReq.setContent("Xin chào, Admin hỗ trợ bạn");
        when(chatMessageRepository.save(any())).thenAnswer(inv -> {
            ChatMessage m = inv.getArgument(0);
            m.setId(UUID.randomUUID());
            return m;
        });
        assertNotNull(chatService.sendMessage(adminPrincipal, adminSendReq));

        // 2. Seller sends message in SHOP thread -> hits resolveSenderDisplayName(shop.getName())
        when(chatThreadRepository.findById(sampleThread.getId())).thenReturn(Optional.of(sampleThread));
        SendMessageRequest sellerSendReq = new SendMessageRequest();
        sellerSendReq.setThreadId(sampleThread.getId());
        sellerSendReq.setContent("Shop xin nghe");
        assertNotNull(chatService.sendMessage(sellerPrincipal, sellerSendReq));

        // 3. editMessage in SUPPORT thread by Admin and by Customer
        UUID adminMsgId = UUID.randomUUID();
        ChatMessage adminSupportMsg = ChatMessage.builder()
                .id(adminMsgId)
                .senderId(adminId)
                .messageType(ChatMessageType.TEXT)
                .content("Old")
                .thread(supportThread)
                .build();
        when(chatMessageRepository.findById(adminMsgId)).thenReturn(Optional.of(adminSupportMsg));
        assertNotNull(chatService.editMessage(adminPrincipal, adminMsgId, "New by admin"));

        UUID custMsgId = UUID.randomUUID();
        ChatMessage custSupportMsg = ChatMessage.builder()
                .id(custMsgId)
                .senderId(customerId)
                .messageType(ChatMessageType.TEXT)
                .content("Old cust")
                .thread(supportThread)
                .build();
        when(chatMessageRepository.findById(custMsgId)).thenReturn(Optional.of(custSupportMsg));
        assertNotNull(chatService.editMessage(buyerPrincipal, custMsgId, "New by cust"));

        // 4. closeThread on SUPPORT thread
        chatService.closeThread(adminPrincipal, supportThread.getId());
        assertEquals(ThreadStatus.RESOLVED, supportThread.getStatus());

        // 5. getOrCreateSupportThread: with User fullName non-blank, and account not found
        User namedUser = User.builder().id(UUID.randomUUID()).fullName("Nguyen Van Buyer").avatarUrl("avt.png").build();
        when(accountRepository.findById(customerId)).thenReturn(Optional.of(customerAccount));
        when(userRepository.findByAccountId(customerId)).thenReturn(Optional.of(namedUser));
        when(chatThreadRepository.findFirstByCustomer_IdAndTypeAndStatus(customerId, ThreadType.SUPPORT, ThreadStatus.OPEN))
                .thenReturn(Optional.empty());
        when(chatThreadRepository.save(any())).thenAnswer(inv -> {
            ChatThread t = inv.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });
        assertNotNull(chatService.getOrCreateSupportThread(buyerPrincipal));

        when(accountRepository.findById(customerId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> chatService.getOrCreateSupportThread(buyerPrincipal));

        // 6. getOrCreateShopThread: with User fullName non-blank, account not found, and shop not found
        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(chatThreadRepository.findFirstByCustomer_IdAndShop_IdAndStatus(customerId, sampleShop.getId(), ThreadStatus.OPEN))
                .thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> chatService.getOrCreateShopThread(buyerPrincipal, sampleShop.getId()));

        when(accountRepository.findById(customerId)).thenReturn(Optional.of(customerAccount));
        assertNotNull(chatService.getOrCreateShopThread(buyerPrincipal, sampleShop.getId()));

        UUID missingShopId = UUID.randomUUID();
        when(shopRepository.findById(missingShopId)).thenReturn(Optional.empty());
        when(shopRepository.findAll()).thenReturn(List.of());
        assertThrows(CustomException.class, () -> chatService.getOrCreateShopThread(buyerPrincipal, missingShopId));

        // 7. closeDisputeThread when shop has owner account and websocket throws exception
        UUID reqId = UUID.randomUUID();
        ChatThread dtWithShopOwner = ChatThread.builder()
                .id(UUID.randomUUID())
                .type(ThreadType.DISPUTE)
                .status(ThreadStatus.OPEN)
                .requestId(reqId)
                .customer(customerAccount)
                .shop(sampleShop)
                .build();
        when(chatThreadRepository.findByRequestIdForUpdate(reqId)).thenReturn(Optional.of(dtWithShopOwner));
        doThrow(new RuntimeException("WS error")).when(webSocketSessionService).broadcastToAdmins(eq("CHAT_MESSAGE"), any());
        chatService.closeDisputeThread(reqId, "Test WS error catch");
    }
}
