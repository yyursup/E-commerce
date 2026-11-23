package com.marketplace.ecommerce.kyc.service.impl;

import com.marketplace.ecommerce.kyc.service.*;
import com.marketplace.ecommerce.kyc.valueObjects.AttachDecision;
import com.marketplace.ecommerce.kyc.valueObjects.CardLivenessResult;
import com.marketplace.ecommerce.kyc.valueObjects.ClassifyResult;
import com.marketplace.ecommerce.kyc.valueObjects.FaceLivenessResult;
import com.marketplace.ecommerce.kyc.valueObjects.KycDocumentType;
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
    @DisplayName("uploadFileAndAttach nhận ảnh khuôn mặt (type = 4) mà không kiểm tra liveness")
    void testUploadFileAndAttach_FaceSkipsLiveness() {
        when(uploadService.upload(any(), any(), any())).thenReturn("HASH_FACE");
        ClassifyResult cls = new ClassifyResult("selfie", 4, 98.0);
        when(classifyService.classify("HASH_FACE", sessionId.toString())).thenReturn(cls);

        AttachDecision decision = new AttachDecision(true, null, "selfieHash");
        when(attachService.attachFile(sessionId, accountId, "HASH_FACE", "selfie")).thenReturn(decision);

        Map<String, Object> res = orchestratorService.uploadFileAndAttach(sessionId, accountId, file, "Selfie", "Desc");

        assertEquals(true, res.get("ok"));
        assertEquals("selfieHash", res.get("savedTo"));
        verifyNoInteractions(faceLivenessService);
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
    @DisplayName("uploadFileAndAttach từ chối ảnh không phải giấy tờ hay khuôn mặt (ROUTE_UNSUPPORTED)")
    void testUploadFileAndAttach_UnsupportedType() {
        when(uploadService.upload(any(), any(), any())).thenReturn("HASH_OTHER");
        when(classifyService.classify("HASH_OTHER", sessionId.toString())).thenReturn(new ClassifyResult("unknown", 9, 50.0));

        Map<String, Object> res = orchestratorService.uploadFileAndAttach(sessionId, accountId, file, "Doc", "Desc");

        assertEquals(false, res.get("ok"));
        assertEquals("ROUTE_UNSUPPORTED", res.get("step"));
        verifyNoInteractions(attachService);
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

    @Test
    @DisplayName("Bước mặt sau nhận ảnh mặt trước: TYPE_MISMATCH, không kiểm tra liveness, không lưu vào phiên")
    void testUploadFileAndAttach_BackStepRejectsFront() {
        when(uploadService.upload(any(), any(), any())).thenReturn("HASH_F");
        when(classifyService.classify("HASH_F", sessionId.toString())).thenReturn(new ClassifyResult("new_front", 2, 99.0));

        Map<String, Object> res = orchestratorService.uploadFileAndAttach(sessionId, accountId, file, "t", "d", KycDocumentType.BACK);

        assertEquals(false, res.get("ok"));
        assertEquals("TYPE_MISMATCH", res.get("step"));
        assertEquals("BACK", res.get("expectedType"));
        verifyNoInteractions(cardLivenessService, faceLivenessService, attachService);
    }

    @Test
    @DisplayName("Bước khuôn mặt nhận ảnh CCCD: TYPE_MISMATCH, không ghi đè ảnh nào")
    void testUploadFileAndAttach_SelfieStepRejectsCard() {
        when(uploadService.upload(any(), any(), any())).thenReturn("HASH_C");
        when(classifyService.classify("HASH_C", sessionId.toString())).thenReturn(new ClassifyResult("old_back", 1, 97.0));

        Map<String, Object> res = orchestratorService.uploadFileAndAttach(sessionId, accountId, file, "t", "d", KycDocumentType.SELFIE);

        assertEquals("TYPE_MISMATCH", res.get("step"));
        verifyNoInteractions(cardLivenessService, attachService);
    }

    @Test
    @DisplayName("Bước mặt sau nhận đúng ảnh mặt sau: kiểm tra thẻ thật rồi lưu")
    void testUploadFileAndAttach_BackStepAcceptsBack() {
        when(uploadService.upload(any(), any(), any())).thenReturn("HASH_B");
        when(classifyService.classify("HASH_B", sessionId.toString())).thenReturn(new ClassifyResult("new_back", 3, 99.0));
        when(cardLivenessService.verify("HASH_B", sessionId.toString())).thenReturn(new CardLivenessResult(true, "success", "ok"));
        when(attachService.attachFile(sessionId, accountId, "HASH_B", "new_back")).thenReturn(new AttachDecision(true, null, "backHash"));

        Map<String, Object> res = orchestratorService.uploadFileAndAttach(sessionId, accountId, file, "t", "d", KycDocumentType.BACK);

        assertEquals(true, res.get("ok"));
        assertEquals("backHash", res.get("savedTo"));
    }

    @Test
    @DisplayName("matchesExpectedType: so tên/loại VNPT với bước, không phân biệt hoa thường, null = không kiểm tra")
    void testMatchesExpectedType() {
        assertTrue(KycOrchestratorServiceImpl.matchesExpectedType(null, "anything", 9));
        assertTrue(KycOrchestratorServiceImpl.matchesExpectedType(KycDocumentType.FRONT, "OLD_VER_FRONT", 0));
        assertFalse(KycOrchestratorServiceImpl.matchesExpectedType(KycDocumentType.FRONT, "new_back", 3));
        assertTrue(KycOrchestratorServiceImpl.matchesExpectedType(KycDocumentType.BACK, "old_back", 1));
        assertFalse(KycOrchestratorServiceImpl.matchesExpectedType(KycDocumentType.BACK, null, 1));
        assertTrue(KycOrchestratorServiceImpl.matchesExpectedType(KycDocumentType.SELFIE, "other", 4));
        assertFalse(KycOrchestratorServiceImpl.matchesExpectedType(KycDocumentType.SELFIE, "other", 2));
    }
}
