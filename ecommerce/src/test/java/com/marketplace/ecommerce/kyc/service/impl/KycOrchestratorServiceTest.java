package com.marketplace.ecommerce.kyc.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.common.exception.KycNotFoundException;
import com.marketplace.ecommerce.kyc.dto.response.*;
import com.marketplace.ecommerce.kyc.entity.EKycDocument;
import com.marketplace.ecommerce.kyc.entity.EKycSession;
import com.marketplace.ecommerce.kyc.repository.KycDocumentRepository;
import com.marketplace.ecommerce.kyc.repository.KycSessionRepository;
import com.marketplace.ecommerce.kyc.usecase.VNPTClient;
import com.marketplace.ecommerce.kyc.valueObjects.KycDocumentType;
import com.marketplace.ecommerce.kyc.valueObjects.KycStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KycOrchestratorServiceTest {

    @Mock
    private KycSessionRepository sessions;
    @Mock
    private KycDocumentRepository docs;
    @Mock
    private VNPTClient vnpt;
    @Mock
    private ObjectMapper om;
    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private KycOrchestratorService kycService;

    private UUID accountId;
    private UUID sessionId;
    private EKycSession session;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        sessionId = UUID.randomUUID();
        session = new EKycSession();
        session.setId(sessionId);
        session.setAccountId(accountId);
        session.setStatus(KycStatus.DRAFT);
    }

    @Test
    @DisplayName("start tạo phiên eKYC mới và lưu vào repository")
    void testStart() {
        when(sessions.save(any(EKycSession.class))).thenAnswer(inv -> {
            EKycSession s = inv.getArgument(0);
            s.setId(sessionId);
            return s;
        });

        UUID createdId = kycService.start(accountId);
        assertNotNull(createdId);
        assertEquals(sessionId, createdId);
        verify(sessions).save(any(EKycSession.class));
    }

    @Test
    @DisplayName("uploadToVnptAndAttach tải tài liệu lên VNPT và gán hash vào session")
    void testUploadToVnptAndAttach() {
        MockMultipartFile file = new MockMultipartFile("front", "front.jpg", "image/jpeg", "content".getBytes());
        UploadResponse up = new UploadResponse();
        UploadResponse.Obj obj = new UploadResponse.Obj();
        obj.setHash("HASH_FRONT_123");
        up.setObject(obj);
        when(vnpt.addFile(any(), any(), any())).thenReturn(up);

        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        String hash = kycService.uploadToVnptAndAttach(sessionId, accountId, KycDocumentType.FRONT, file, "CMND Mặt trước", "Mô tả");
        assertEquals("HASH_FRONT_123", hash);
        assertEquals("HASH_FRONT_123", session.getFrontHash());
        verify(sessions).save(session);
        verify(docs).save(any(EKycDocument.class));
    }

    @Test
    @DisplayName("classify phân loại giấy tờ thành công")
    void testClassify_Success() {
        session.setFrontHash("HASH_FRONT_123");
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        ClassifyResponse cls = new ClassifyResponse();
        ClassifyResponse.Obj cObj = new ClassifyResponse.Obj();
        cObj.setType(1);
        cObj.setName("new_front");
        cObj.setConfidence(98.5);
        cls.setObj(cObj);
        when(vnpt.classify("HASH_FRONT_123", sessionId.toString())).thenReturn(cls);

        Map<String, Object> res = kycService.classify(sessionId, accountId, null);
        assertNotNull(res);
        assertEquals("new_front", res.get("name"));
        assertEquals(98.5, res.get("confidence"));
    }

    @Test
    @DisplayName("classify ném ngoại lệ khi không tìm thấy hash giấy tờ")
    void testClassify_NoHash() {
        session.setFrontHash(null);
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        assertThrows(IllegalStateException.class, () -> kycService.classify(sessionId, accountId, null));
    }

    @Test
    @DisplayName("ocrFront đọc thông tin mặt trước CMND/CCCD")
    void testOcrFront() {
        session.setFrontHash("HASH_FRONT_123");
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        OcrFrontResponse ocr = new OcrFrontResponse();
        OcrFrontResponse.Obj obj = new OcrFrontResponse.Obj();
        obj.setId("012345678901");
        obj.setName("NGUYEN VAN A");
        obj.setBirthDay("01/01/1990");
        ocr.setObj(obj);
        when(vnpt.ocrFront("HASH_FRONT_123", 1, sessionId.toString())).thenReturn(ocr);

        Map<String, Object> res = kycService.ocrFront(sessionId, accountId, null, 1);
        assertNotNull(res);
        assertEquals("012345678901", res.get("idNumber"));
        assertEquals("NGUYEN VAN A", res.get("fullName"));
    }

    @Test
    @DisplayName("ocrBack đọc thông tin mặt sau CMND/CCCD")
    void testOcrBack() {
        session.setBackHash("HASH_BACK_123");
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        OcrBackResponse ocr = new OcrBackResponse();
        OcrBackResponse.Obj obj = new OcrBackResponse.Obj();
        obj.setIssueDate("01/01/2020");
        obj.setIssuePlace("CUC CANH SAT");
        ocr.setObj(obj);
        when(vnpt.ocrBack("HASH_BACK_123", 1, sessionId.toString())).thenReturn(ocr);

        Map<String, Object> res = kycService.ocrBack(sessionId, accountId, null, 1);
        assertNotNull(res);
        assertEquals("01/01/2020", res.get("issueDate"));
    }

    @Test
    @DisplayName("liveness kiểm tra tính sống của khuôn mặt selfie")
    void testLiveness() {
        session.setSelfieHash("HASH_SELFIE");
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        LivenessResponse live = new LivenessResponse();
        LivenessResponse.Obj obj = new LivenessResponse.Obj();
        obj.setLiveness("success");
        obj.setLivenessMsg("OK");
        live.setObj(obj);
        when(vnpt.liveness("HASH_SELFIE", sessionId.toString())).thenReturn(live);

        Map<String, Object> res = kycService.liveness(sessionId, accountId, null);
        assertNotNull(res);
        assertEquals(true, res.get("isLive"));
    }

    @Test
    @DisplayName("compare khớp khuôn mặt thành công và cập nhật verified cho account")
    void testCompare_Success() throws Exception {
        session.setFrontHash("HASH_FRONT");
        session.setSelfieHash("HASH_SELFIE");
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        CompareResponse cmp = new CompareResponse();
        CompareResponse.Obj cObj = new CompareResponse.Obj();
        cObj.setMsg("MATCH");
        cObj.setProb(96.5);
        cmp.setObj(cObj);
        when(vnpt.compare("HASH_FRONT", "HASH_SELFIE", sessionId.toString())).thenReturn(cmp);

        Account account = new Account();
        account.setId(accountId);
        account.setAccountVerified(false);
        when(accountRepository.findById(accountId)).thenReturn(Optional.of(account));

        Map<String, Object> res = kycService.compare(sessionId, accountId);
        assertNotNull(res);
        assertEquals(true, res.get("isMatch"));
        assertEquals(96.5, res.get("matchScore"));
        assertEquals(KycStatus.VERIFIED.name(), res.get("status"));
        assertTrue(account.getAccountVerified());
        verify(accountRepository).save(account);
        verify(sessions).save(session);
    }

    @Test
    @DisplayName("compare từ chối khi không trùng khớp hoặc điểm dưới 95")
    void testCompare_Rejected() throws Exception {
        session.setFrontHash("HASH_FRONT");
        session.setSelfieHash("HASH_SELFIE");
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        CompareResponse cmp = new CompareResponse();
        CompareResponse.Obj cObj = new CompareResponse.Obj();
        cObj.setMsg("MATCH");
        cObj.setProb(80.0);
        cmp.setObj(cObj);
        when(vnpt.compare("HASH_FRONT", "HASH_SELFIE", sessionId.toString())).thenReturn(cmp);

        Map<String, Object> res = kycService.compare(sessionId, accountId);
        assertNotNull(res);
        assertEquals(true, res.get("isMatch"));
        assertEquals(80.0, res.get("matchScore"));
        assertEquals(KycStatus.REJECTED.name(), res.get("status"));
        verify(accountRepository, never()).save(any());
    }

    @Test
    @DisplayName("get ném ngoại lệ khi session không tồn tại")
    void testGet_NotFound() {
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.empty());

        assertThrows(KycNotFoundException.class, () -> kycService.get(sessionId, accountId));
    }

    @Test
    @DisplayName("compare nem IllegalStateException khi thieu Front hoac Selfie hoac khong tim thay account")
    void testCompare_IllegalStateExceptions() {
        // 1. Front not uploaded
        session.setFrontHash(null);
        session.setSelfieHash("HASH_SELFIE");
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));
        assertThrows(IllegalStateException.class, () -> kycService.compare(sessionId, accountId));

        // 2. Selfie not uploaded
        session.setFrontHash("HASH_FRONT");
        session.setSelfieHash(null);
        assertThrows(IllegalStateException.class, () -> kycService.compare(sessionId, accountId));

        // 3. Passed but account not found
        session.setSelfieHash("HASH_SELFIE");
        CompareResponse cmp = new CompareResponse();
        CompareResponse.Obj cObj = new CompareResponse.Obj();
        cObj.setMsg("MATCH");
        cObj.setProb(99.0);
        cmp.setObj(cObj);
        when(vnpt.compare("HASH_FRONT", "HASH_SELFIE", sessionId.toString())).thenReturn(cmp);
        when(accountRepository.findById(accountId)).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class, () -> kycService.compare(sessionId, accountId));
    }

    @Test
    @DisplayName("ocrBack, liveness, classify nem IllegalStateException khi activeHash rong")
    void testActiveHash_MissingExceptions() {
        session.setFrontHash(null);
        session.setBackHash(null);
        session.setSelfieHash(null);
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        assertThrows(IllegalStateException.class, () -> kycService.ocrBack(sessionId, accountId, null, 1));
        assertThrows(IllegalStateException.class, () -> kycService.liveness(sessionId, accountId, null));
        assertThrows(IllegalStateException.class, () -> kycService.classify(sessionId, accountId, null));
    }

    @Test
    @DisplayName("attachFile cap nhat session va document cho BACK va SELFIE")
    void testAttachFile_BackAndSelfie() {
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        kycService.attachFile(sessionId, accountId, KycDocumentType.BACK, "HASH_BACK");
        assertEquals("HASH_BACK", session.getBackHash());

        kycService.attachFile(sessionId, accountId, KycDocumentType.SELFIE, "HASH_SELFIE");
        assertEquals("HASH_SELFIE", session.getSelfieHash());
        assertEquals(KycStatus.IN_PROGRESS, session.getStatus());
        verify(docs, times(2)).save(any());
    }

    @Test
    @DisplayName("toJsonSafe bat ngoai le khi serialize that bai")
    void testToJsonSafe_SerializationFailure() throws Exception {
        session.setFrontHash("HASH_FRONT");
        session.setSelfieHash("HASH_SELFIE");
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        CompareResponse cmp = new CompareResponse();
        CompareResponse.Obj cObj = new CompareResponse.Obj();
        cObj.setMsg("MISMATCH");
        cObj.setProb(30.0);
        cmp.setObj(cObj);
        when(vnpt.compare("HASH_FRONT", "HASH_SELFIE", sessionId.toString())).thenReturn(cmp);
        when(om.writeValueAsString(any())).thenThrow(new com.fasterxml.jackson.core.JsonParseException(null, "Err"));

        Map<String, Object> res = kycService.compare(sessionId, accountId);
        assertNotNull(res);
        assertNull(session.getProviderTrace());
    }

    @Test
    @DisplayName("Bao phủ các nhánh explicit fileHash và res.getObj() == null trong classify, ocrFront, ocrBack, liveness, compare")
    void testNullObjAndExplicitFileHashBranches() throws Exception {
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        // 1. ocrFront missing activeHash -> throws IllegalStateException
        session.setFrontHash("   ");
        assertThrows(IllegalStateException.class, () -> kycService.ocrFront(sessionId, accountId, "  ", 1));

        // 2. classify with explicit hash and null Obj
        ClassifyResponse clsNull = new ClassifyResponse();
        clsNull.setObj(null);
        when(vnpt.classify("EXP_HASH", sessionId.toString())).thenReturn(clsNull);
        Map<String, Object> clsRes = kycService.classify(sessionId, accountId, "EXP_HASH");
        assertNull(clsRes.get("name"));

        // 3. ocrFront with explicit hash and null Obj
        OcrFrontResponse ocrFNull = new OcrFrontResponse();
        ocrFNull.setObj(null);
        when(vnpt.ocrFront("EXP_HASH", 1, sessionId.toString())).thenReturn(ocrFNull);
        Map<String, Object> ocrFRes = kycService.ocrFront(sessionId, accountId, "EXP_HASH", 1);
        assertNull(ocrFRes.get("idNumber"));

        // 4. ocrBack with explicit hash and null Obj
        OcrBackResponse ocrBNull = new OcrBackResponse();
        ocrBNull.setObj(null);
        when(vnpt.ocrBack("EXP_HASH", 1, sessionId.toString())).thenReturn(ocrBNull);
        Map<String, Object> ocrBRes = kycService.ocrBack(sessionId, accountId, "EXP_HASH", 1);
        assertNull(ocrBRes.get("issueDate"));

        // 5. liveness with explicit hash and null Obj
        LivenessResponse liveNull = new LivenessResponse();
        liveNull.setObj(null);
        when(vnpt.liveness("EXP_HASH", sessionId.toString())).thenReturn(liveNull);
        Map<String, Object> liveRes = kycService.liveness(sessionId, accountId, "EXP_HASH");
        assertEquals(false, liveRes.get("isLive"));

        // 6. compare with null Obj
        session.setFrontHash("F_HASH");
        session.setSelfieHash("S_HASH");
        CompareResponse cmpNull = new CompareResponse();
        cmpNull.setObj(null);
        when(vnpt.compare("F_HASH", "S_HASH", sessionId.toString())).thenReturn(cmpNull);
        Map<String, Object> cmpRes = kycService.compare(sessionId, accountId);
        assertEquals(false, cmpRes.get("isMatch"));
        assertEquals(0.0, cmpRes.get("matchScore"));

        // 7. getActiveHash with null type via reflection
        java.lang.reflect.Method getActiveHash = KycOrchestratorService.class.getDeclaredMethod("getActiveHash", UUID.class, UUID.class, KycDocumentType.class);
        getActiveHash.setAccessible(true);
        assertNull(getActiveHash.invoke(kycService, sessionId, accountId, null));
    }
}
