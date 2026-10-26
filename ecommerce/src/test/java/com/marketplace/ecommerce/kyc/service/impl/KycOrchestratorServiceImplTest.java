package com.marketplace.ecommerce.kyc.service.impl;

import com.marketplace.ecommerce.kyc.service.*;
import com.marketplace.ecommerce.kyc.valueObjects.AttachDecision;
import com.marketplace.ecommerce.kyc.valueObjects.CardLivenessResult;
import com.marketplace.ecommerce.kyc.valueObjects.ClassifyResult;
import com.marketplace.ecommerce.kyc.valueObjects.FaceLivenessResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KycOrchestratorServiceImplTest {

    @Mock
    private UploadFileService uploadService;
    @Mock
    private CardLivenessService cardLivenessService;
    @Mock
    private CardClassifyService classifyService;
    @Mock
    private KycSessionAttachService attachService;
    @Mock
    private FaceLivenessService faceLivenessService;

    @InjectMocks
    private KycOrchestratorServiceImpl orchestratorService;

    private UUID sessionId;
    private UUID accountId;
    private MockMultipartFile file;

    @BeforeEach
    void setUp() {
        sessionId = UUID.randomUUID();
        accountId = UUID.randomUUID();
        file = new MockMultipartFile("file", "card.jpg", "image/jpeg", "card-data".getBytes());
    }

    @Test
    @DisplayName("uploadFileAndAttach trả về lỗi nếu upload trả về rỗng")
    void testUploadFileAndAttach_EmptyHash() {
        when(uploadService.upload(any(), any(), any())).thenReturn("");

        Map<String, Object> res = orchestratorService.uploadFileAndAttach(sessionId, accountId, file, "Title", "Desc");
        assertEquals(false, res.get("ok"));
        assertEquals("UPLOAD", res.get("step"));
    }

    @Test
    @DisplayName("uploadFileAndAttach trả về lỗi nếu classify thất bại")
    void testUploadFileAndAttach_ClassifyFailed() {
        when(uploadService.upload(any(), any(), any())).thenReturn("HASH123");
        when(classifyService.classify("HASH123", sessionId.toString())).thenReturn(null);

        Map<String, Object> res = orchestratorService.uploadFileAndAttach(sessionId, accountId, file, "Title", "Desc");
        assertEquals(false, res.get("ok"));
        assertEquals("CLASSIFY", res.get("step"));
    }

    @Test
    @DisplayName("uploadFileAndAttach kiểm tra tính sống thẻ không thành công")
    void testUploadFileAndAttach_CardLivenessFailed() {
        when(uploadService.upload(any(), any(), any())).thenReturn("HASH123");
        ClassifyResult cls = new ClassifyResult("new_front", 1, 95.0);
        when(classifyService.classify("HASH123", sessionId.toString())).thenReturn(cls);

        CardLivenessResult cardLive = new CardLivenessResult(false, "fake", "Photocopied card detected");
        when(cardLivenessService.verify("HASH123", sessionId.toString())).thenReturn(cardLive);

        Map<String, Object> res = orchestratorService.uploadFileAndAttach(sessionId, accountId, file, "Title", "Desc");
        assertEquals(false, res.get("ok"));
        assertEquals("CARD_LIVENESS", res.get("step"));
    }

    @Test
    @DisplayName("uploadFileAndAttach kiểm tra tính sống khuôn mặt (type = 4)")
    void testUploadFileAndAttach_FaceLiveness() {
        when(uploadService.upload(any(), any(), any())).thenReturn("HASH_FACE");
        ClassifyResult cls = new ClassifyResult("selfie", 4, 98.0);
        when(classifyService.classify("HASH_FACE", sessionId.toString())).thenReturn(cls);

        FaceLivenessResult faceLive = new FaceLivenessResult(true, "success", "Live face");
        when(faceLivenessService.verify("HASH_FACE", sessionId.toString())).thenReturn(faceLive);

        AttachDecision decision = new AttachDecision(true, null, "selfieHash");
        when(attachService.attachFile(sessionId, accountId, "HASH_FACE", "selfie")).thenReturn(decision);

        Map<String, Object> res = orchestratorService.uploadFileAndAttach(sessionId, accountId, file, "Selfie", "Desc");
        assertEquals(true, res.get("ok"));
        assertEquals("selfieHash", res.get("savedTo"));
    }

    @Test
    @DisplayName("uploadFileAndAttach thành công với thẻ hợp lệ")
    void testUploadFileAndAttach_Success() {
        when(uploadService.upload(any(), any(), any())).thenReturn("HASH123");
        ClassifyResult cls = new ClassifyResult("new_front", 0, 99.0);
        when(classifyService.classify("HASH123", sessionId.toString())).thenReturn(cls);

        CardLivenessResult cardLive = new CardLivenessResult(true, "success", "Real card");
        when(cardLivenessService.verify("HASH123", sessionId.toString())).thenReturn(cardLive);

        AttachDecision decision = new AttachDecision(true, null, "frontHash");
        when(attachService.attachFile(sessionId, accountId, "HASH123", "new_front")).thenReturn(decision);

        Map<String, Object> res = orchestratorService.uploadFileAndAttach(sessionId, accountId, file, "Front", "Desc");
        assertEquals(true, res.get("ok"));
        assertEquals("frontHash", res.get("savedTo"));
    }

    @Test
    @DisplayName("uploadFileAndAttach loi ROUTE_UNSUPPORTED khi type khong ho tro")
    void testUploadFileAndAttach_RouteUnsupported() {
        when(uploadService.upload(any(), any(), any())).thenReturn("HASH_UNSUPPORTED");
        ClassifyResult cls = new ClassifyResult("other", 99, 50.0);
        when(classifyService.classify("HASH_UNSUPPORTED", sessionId.toString())).thenReturn(cls);

        Map<String, Object> res = orchestratorService.uploadFileAndAttach(sessionId, accountId, file, "Title", "Desc");
        assertEquals(false, res.get("ok"));
        assertEquals("ROUTE_UNSUPPORTED", res.get("step"));
    }

    @Test
    @DisplayName("uploadFileAndAttach fail FACE_LIVENESS khi khong dat tinh song khuon mat")
    void testUploadFileAndAttach_FaceLivenessFailed() {
        when(uploadService.upload(any(), any(), any())).thenReturn("HASH_FACE_FAIL");
        ClassifyResult cls = new ClassifyResult("selfie", 4, 98.0);
        when(classifyService.classify("HASH_FACE_FAIL", sessionId.toString())).thenReturn(cls);

        FaceLivenessResult faceLive = new FaceLivenessResult(false, "fake", "Spoof detected");
        when(faceLivenessService.verify("HASH_FACE_FAIL", sessionId.toString())).thenReturn(faceLive);

        Map<String, Object> res = orchestratorService.uploadFileAndAttach(sessionId, accountId, file, "Selfie", "Desc");
        assertEquals(false, res.get("ok"));
        assertEquals("FACE_LIVENESS", res.get("step"));
    }

    @Test
    @DisplayName("uploadFileAndAttach fail ATTACH khi attach decision khong thanh cong")
    void testUploadFileAndAttach_AttachFailed() {
        when(uploadService.upload(any(), any(), any())).thenReturn("HASH_ATTACH_FAIL");
        ClassifyResult cls = new ClassifyResult("new_front", 0, 99.0);
        when(classifyService.classify("HASH_ATTACH_FAIL", sessionId.toString())).thenReturn(cls);

        CardLivenessResult cardLive = new CardLivenessResult(true, "success", "Real card");
        when(cardLivenessService.verify("HASH_ATTACH_FAIL", sessionId.toString())).thenReturn(cardLive);

        AttachDecision decision = new AttachDecision(false, "Session closed", null);
        when(attachService.attachFile(sessionId, accountId, "HASH_ATTACH_FAIL", "new_front")).thenReturn(decision);

        Map<String, Object> res = orchestratorService.uploadFileAndAttach(sessionId, accountId, file, "Front", "Desc");
        assertEquals(false, res.get("ok"));
        assertEquals("ATTACH", res.get("step"));
        assertEquals("Session closed", res.get("reason"));
    }
}
