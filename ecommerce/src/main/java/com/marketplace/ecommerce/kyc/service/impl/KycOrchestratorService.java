package com.marketplace.ecommerce.kyc.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.common.exception.KycNotFoundException;
import com.marketplace.ecommerce.kyc.dto.response.*;
import com.marketplace.ecommerce.kyc.entity.EKycDocument;
import com.marketplace.ecommerce.kyc.entity.EKycSession;
import com.marketplace.ecommerce.kyc.repository.KycDocumentRepository;
import com.marketplace.ecommerce.kyc.repository.KycSessionRepository;
import com.marketplace.ecommerce.kyc.service.KycOrchestrator;
import com.marketplace.ecommerce.kyc.usecase.VNPTClient;
import com.marketplace.ecommerce.kyc.valueObjects.KycDocumentType;
import com.marketplace.ecommerce.kyc.valueObjects.KycStatus;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.multipart.MultipartFile;


import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor

public class KycOrchestratorService implements KycOrchestrator {
    private static final Logger log = LoggerFactory.getLogger(KycOrchestratorService.class);

    private final KycSessionRepository sessions;
    private final KycDocumentRepository docs;
    private final VNPTClient vnpt;
    private final ObjectMapper om;
    private final AccountRepository accountRepository;


    public String uploadToVnptAndAttach(
            UUID sessionId,
            UUID accountId,
            KycDocumentType type,
            MultipartFile file,
            String title,
            String description
    ) {

        UploadResponse up = vnpt.addFile(file, title, description);
        String hash = up.getObject().getHash();

        attachFile(sessionId, accountId, type, hash);

        return hash;
    }

    public UUID start(UUID accountId) {
        EKycSession s = new EKycSession();
        s.setAccountId(accountId);
        s.setStatus(KycStatus.DRAFT);
        sessions.save(s);
        return s.getId();
    }

    public void attachFile(UUID sessionId,
                           UUID accountId,
                           KycDocumentType type,
                           String fileHash) {

        EKycSession s = get(sessionId, accountId);

        if (type == KycDocumentType.FRONT) {
//            s.setFrontFileId(fileId);
            s.setFrontHash(fileHash);
        } else if (type == KycDocumentType.BACK) {
//            s.setBackFileId(fileId);
            s.setBackHash(fileHash);
        } else if (type == KycDocumentType.SELFIE) {
//            s.setSelfieFileId(fileId);
            s.setSelfieHash(fileHash);
        }

        // tối giản: cứ attach xong là IN_PROGRESS
        s.setStatus(KycStatus.IN_PROGRESS);
        sessions.save(s);

        EKycDocument doc = new EKycDocument();
        doc.setSessionId(s.getId());
        doc.setType(type);
//      doc.setFileId(fileId);
        doc.setFileHash(fileHash);
        docs.save(doc);
    }

    public Map<String, Object> classify(UUID sessionId, UUID accountId, String fileHash) {
        String activeHash = (fileHash != null && !fileHash.isBlank())
                ? fileHash
                : getActiveHash(sessionId, accountId, KycDocumentType.FRONT);

        if (activeHash == null || activeHash.isBlank()) {
            throw new IllegalStateException("No active front file hash found");
        }

        ClassifyResponse res = vnpt.classify(activeHash, sessionId.toString());

        Map<String, Object> out = new HashMap<>();
        out.put("name", res.getObj() != null ? res.getObj().getName() : null);
        out.put("confidence", res.getObj() != null ? res.getObj().getConfidence() : null);
        out.put("source", "LIVE");
        out.put("type", res.getObj() != null ? res.getObj().getType() : null);
        return out;
    }

    public Map<String, Object> ocrFront(UUID sessionId, UUID accountId, String fileHash, int type) {
        String activeHash = (fileHash != null && !fileHash.isBlank())
                ? fileHash
                : getActiveHash(sessionId, accountId, KycDocumentType.FRONT);

        if (activeHash == null || activeHash.isBlank()) {
            throw new IllegalStateException("No active front file hash found");
        }

        OcrFrontResponse res = vnpt.ocrFront(activeHash, type, sessionId.toString());

        log.info("VNPT OCR Front ok. sessionId={}, hasObj={}", sessionId, res.getObj() != null);

        OcrFrontResponse.Obj o = res.getObj();
        Map<String, Object> out = new HashMap<>();
        out.put("idNumber", o != null ? o.getId() : null);
        out.put("fullName", o != null ? o.getName() : null);
        out.put("birthDay", o != null ? o.getBirthDay() : null);
        out.put("cardType", o != null ? o.getCardType() : null);
        out.put("nationality", o != null ? o.getNationality() : null);
        out.put("gender", o != null ? o.getGender() : null);
        out.put("recentLocation", o != null ? o.getRecentLocation() : null);
        out.put("originLocation", o != null ? o.getOriginLocation() : null);
        out.put("issueDate", o != null ? o.getIssueDate() : null);
        out.put("issuePlace", o != null ? o.getIssuePlace() : null);
        out.put("validDate", o != null ? o.getValidDate() : null);
        out.put("typeId", o != null ? o.getTypeId() : null);
        out.put("source", "LIVE");
        return out;
    }

    public Map<String, Object> ocrBack(UUID sessionId, UUID accountId, String fileHash, int type) {
        String activeHash = (fileHash != null && !fileHash.isBlank())
                ? fileHash
                : getActiveHash(sessionId, accountId, KycDocumentType.BACK);

        if (activeHash == null || activeHash.isBlank()) {
            throw new IllegalStateException("No active back file hash found");
        }

        OcrBackResponse res = vnpt.ocrBack(activeHash, type, sessionId.toString());

        OcrBackResponse.Obj o = res.getObj();
        Map<String, Object> out = new HashMap<>();
        out.put("issueDate", o != null ? o.getIssueDate() : null);
        out.put("issuePlace", o != null ? o.getIssuePlace() : null);
        out.put("backTypeId", o != null ? o.getBackTypeId() : null);
        out.put("msgBack", o != null ? o.getMsgBack() : null);
        out.put("source", "LIVE");
        return out;
    }

    public Map<String, Object> liveness(UUID sessionId, UUID accountId, String fileHash) {
        String activeHash = (fileHash != null && !fileHash.isBlank())
                ? fileHash
                : getActiveHash(sessionId, accountId, KycDocumentType.SELFIE);

        if (activeHash == null || activeHash.isBlank()) {
            throw new IllegalStateException("No active selfie file hash found");
        }

        LivenessResponse res = vnpt.liveness(activeHash, sessionId.toString());
        LivenessResponse.Obj o = res.getObj();

        boolean isLive = o != null && "success".equalsIgnoreCase(o.getLiveness());

        Map<String, Object> out = new HashMap<>();
        out.put("isLive", isLive);
        out.put("liveness", o != null ? o.getLiveness() : null);
        out.put("livenessMsg", o != null ? o.getLivenessMsg() : null);
        out.put("isEyeOpen", o != null ? o.getIsEyeOpen() : null);
        out.put("source", "LIVE");
        return out;
    }

    /**
     * Compare face: nếu match + score >= 95 -> VERIFIED, else -> REJECTED
     */
    public Map<String, Object> compare(UUID sessionId, UUID accountId) {
        EKycSession s = get(sessionId, accountId);

        if (s.getFrontHash() == null || s.getFrontHash().isBlank()) {
            throw new IllegalStateException("Front not uploaded");
        }
        if (s.getSelfieHash() == null || s.getSelfieHash().isBlank()) {
            throw new IllegalStateException("Selfie not uploaded");
        }

        CompareResponse res = vnpt.compare(s.getFrontHash(), s.getSelfieHash(), sessionId.toString());
        CompareResponse.Obj o = res.getObj();

        String msg = (o != null ? o.getMsg() : null);
        Double prob = (o != null && o.getProb() != null) ? o.getProb() : 0.0;

        boolean matched = msg != null && msg.equalsIgnoreCase("MATCH");
        boolean passed = matched && prob >= 95.0;

        s.setStatus(passed ? KycStatus.VERIFIED : KycStatus.REJECTED);
        // lưu trace tối giản để debug
        s.setProviderTrace(toJsonSafe(res));
        sessions.save(s);

        if (passed) {
            Account account = accountRepository.findById(accountId)
                    .orElseThrow(() -> new IllegalStateException("No account found"));
            account.setAccountVerified(true);
            accountRepository.save(account);
        }

        Map<String, Object> out = new HashMap<>();
        out.put("isMatch", matched);
        out.put("matchScore", prob);
        out.put("status", s.getStatus().name());
        out.put("verifiedAt", passed ? s.getUpdatedAt() : null);
        return out;
    }

    public EKycSession get(UUID sessionId, UUID accountId) {
        return sessions.findByIdAndAccountId(sessionId, accountId)
                .orElseThrow(() -> new KycNotFoundException(sessionId.toString(), accountId.toString()));
    }

    private String getActiveHash(UUID sessionId, UUID accountId, KycDocumentType type) {
        EKycSession s = get(sessionId, accountId);
        if (type == KycDocumentType.FRONT) return s.getFrontHash();
        if (type == KycDocumentType.BACK) return s.getBackHash();
        if (type == KycDocumentType.SELFIE) return s.getSelfieHash();
        return null;
    }

    private String toJsonSafe(Object obj) {
        try {
            return om.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.warn("Cannot serialize VNPT response to JSON. {}", e.getMessage());
            return null;
        }
    }
}
