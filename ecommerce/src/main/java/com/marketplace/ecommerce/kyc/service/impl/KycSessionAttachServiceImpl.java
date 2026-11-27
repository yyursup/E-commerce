package com.marketplace.ecommerce.kyc.service.impl;

import com.marketplace.ecommerce.common.exception.KycNotFoundException;
import com.marketplace.ecommerce.kyc.entity.EKycDocument;
import com.marketplace.ecommerce.kyc.entity.EKycSession;
import com.marketplace.ecommerce.kyc.repository.KycDocumentRepository;
import com.marketplace.ecommerce.kyc.repository.KycSessionRepository;
import com.marketplace.ecommerce.kyc.service.KycSessionAttachService;
import com.marketplace.ecommerce.kyc.valueObjects.AttachDecision;
import com.marketplace.ecommerce.kyc.valueObjects.KycDocumentType;
import com.marketplace.ecommerce.kyc.valueObjects.KycStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KycSessionAttachServiceImpl implements KycSessionAttachService {
    private final KycSessionRepository sessions;
    private final KycDocumentRepository docs;

    @Override
    public AttachDecision attachFile(UUID sessionId, UUID accountId, String fileHash, String classifyName) {
        EKycSession s = sessions.findByIdAndAccountId(sessionId, accountId)
                .orElseThrow(() -> new KycNotFoundException(sessionId.toString(), accountId.toString()));

        if (classifyName == null || classifyName.isBlank()) {
            return new AttachDecision(false, "Classify returned empty name", null);
        }
        final String savedTo;
        final KycDocumentType docType;

        switch (classifyName.toLowerCase()) {
            case "new_front":
            case "old_front":
            case "old_ver_front":
            case "new_ver_front":
                s.setFrontHash(fileHash);
                sessions.save(s);
                savedTo = "frontHash";
                docType = KycDocumentType.FRONT;
                break;

            case "new_back":
            case "old_back":
            case "old_ver_back":
            case "new_ver_back":
                s.setBackHash(fileHash);
                sessions.save(s);
                savedTo = "backHash";
                docType = KycDocumentType.BACK;
                break;

            case "other":
            case "other_papers":
            case "other papers":
                s.setSelfieHash(fileHash);
                sessions.save(s);
                savedTo = "selfieHash";
                docType = KycDocumentType.SELFIE;
                break;

            default:
                return new AttachDecision(false, "Ảnh tải lên không phải mặt trước, mặt sau CCCD hoặc ảnh khuôn mặt", null);
        }

        s.setStatus(KycStatus.IN_PROGRESS);
        sessions.save(s);

        EKycDocument doc = new EKycDocument();
        doc.setSessionId(s.getId());
        doc.setType(docType);
        doc.setFileHash(fileHash);
        docs.save(doc);
        return new AttachDecision(true, null, savedTo);
    }
}
