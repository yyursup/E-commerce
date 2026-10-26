package com.marketplace.ecommerce.kyc.service.impl;

import com.marketplace.ecommerce.kyc.dto.response.*;
import com.marketplace.ecommerce.kyc.usecase.VNPTClient;
import com.marketplace.ecommerce.kyc.valueObjects.CardLivenessResult;
import com.marketplace.ecommerce.kyc.valueObjects.ClassifyResult;
import com.marketplace.ecommerce.kyc.valueObjects.FaceLivenessResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KycHelperServicesTest {

    @Mock
    private VNPTClient vnpt;

    @Test
    @DisplayName("CardClassifyServiceImpl classify thẻ trả về tên, type, confidence")
    void testCardClassifyService() {
        CardClassifyServiceImpl service = new CardClassifyServiceImpl(vnpt);
        ClassifyResponse resp = new ClassifyResponse();
        ClassifyResponse.Obj obj = new ClassifyResponse.Obj();
        obj.setName("new_front");
        obj.setType(1);
        obj.setConfidence(99.2);
        resp.setObj(obj);

        when(vnpt.classify("HASH_1", "SESSION_1")).thenReturn(resp);

        ClassifyResult result = service.classify("HASH_1", "SESSION_1");
        assertNotNull(result);
        assertEquals("new_front", result.name());
        assertEquals(1, result.type());
        assertEquals(99.2, result.confidence());
    }

    @Test
    @DisplayName("CardLivenessServiceImpl verify kiểm tra liveness của thẻ")
    void testCardLivenessService() {
        CardLivenessServiceImpl service = new CardLivenessServiceImpl(vnpt);
        CardLivenessResponse resp = new CardLivenessResponse();
        CardLivenessResponse.Obj obj = new CardLivenessResponse.Obj();
        obj.setLiveness("success");
        obj.setLivenessMsg("OK");
        resp.setObject(obj);

        when(vnpt.cardLiveness("HASH_2", "SESSION_2")).thenReturn(resp);

        CardLivenessResult res = service.verify("HASH_2", "SESSION_2");
        assertNotNull(res);
        assertTrue(res.isReal());
        assertEquals("success", res.liveness());
    }

    @Test
    @DisplayName("FaceLivenessServiceImpl verify kiểm tra tính sống của khuôn mặt")
    void testFaceLivenessService() {
        FaceLivenessServiceImpl service = new FaceLivenessServiceImpl(vnpt);
        LivenessResponse resp = new LivenessResponse();
        LivenessResponse.Obj obj = new LivenessResponse.Obj();
        obj.setLiveness("success");
        obj.setLivenessMsg("REAL FACE");
        resp.setObj(obj);

        when(vnpt.liveness("HASH_3", "SESSION_3")).thenReturn(resp);

        FaceLivenessResult res = service.verify("HASH_3", "SESSION_3");
        assertNotNull(res);
        assertTrue(res.isLive());
        assertEquals("success", res.liveness());
    }

    @Test
    @DisplayName("UploadFileServiceImpl upload tải file lên và trả về hash")
    void testUploadFileService() {
        UploadFileServiceImpl service = new UploadFileServiceImpl(vnpt);
        MockMultipartFile file = new MockMultipartFile("f", "doc.pdf", "application/pdf", "data".getBytes());

        UploadResponse resp = new UploadResponse();
        UploadResponse.Obj obj = new UploadResponse.Obj();
        obj.setHash("HASH_RETURNED");
        resp.setObject(obj);

        when(vnpt.addFile(file, "Doc", "Desc")).thenReturn(resp);

        String hash = service.upload(file, "Doc", "Desc");
        assertEquals("HASH_RETURNED", hash);
    }

    @Test
    @DisplayName("UploadFileServiceImpl upload ném lỗi nếu hash rỗng")
    void testUploadFileService_EmptyHash() {
        UploadFileServiceImpl service = new UploadFileServiceImpl(vnpt);
        MockMultipartFile file = new MockMultipartFile("f", "doc.pdf", "application/pdf", "data".getBytes());

        UploadResponse resp = new UploadResponse();
        when(vnpt.addFile(file, "Doc", "Desc")).thenReturn(resp);

        assertThrows(IllegalStateException.class, () -> service.upload(file, "Doc", "Desc"));
    }
}
