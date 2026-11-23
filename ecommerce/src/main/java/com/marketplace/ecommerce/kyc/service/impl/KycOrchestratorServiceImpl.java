package com.marketplace.ecommerce.kyc.service.impl;

import com.marketplace.ecommerce.kyc.service.*;
import com.marketplace.ecommerce.kyc.service.KycOrchestratorService;
import com.marketplace.ecommerce.kyc.valueObjects.AttachDecision;
import com.marketplace.ecommerce.kyc.valueObjects.CardLivenessResult;
import com.marketplace.ecommerce.kyc.valueObjects.ClassifyResult;
import com.marketplace.ecommerce.kyc.valueObjects.FaceLivenessResult;
import com.marketplace.ecommerce.kyc.valueObjects.KycDocumentType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KycOrchestratorServiceImpl implements KycOrchestratorService {

    private final UploadFileService uploadService;
    private final CardLivenessService cardLivenessService;
    private final CardClassifyService classifyService;
    private final KycSessionAttachService attachService;
    private final FaceLivenessService faceLivenessService;

    private static String nz(String s) {
        return s == null ? "" : s;
    }

    private static Object nzObj(Object v, Object def) {
        return v == null ? def : v;
    }

    private static final Set<String> FRONT_NAMES = Set.of("new_front", "old_front", "old_ver_front", "new_ver_front");
    private static final Set<String> BACK_NAMES = Set.of("new_back", "old_back", "old_ver_back", "new_ver_back");
    private static final int FACE_TYPE = 4;

    // Ảnh VNPT nhận diện có đúng loại của bước người dùng đang làm không; không truyền bước thì không kiểm tra
    static boolean matchesExpectedType(KycDocumentType expected, String classifiedName, Integer classifiedType) {
        if (expected == null) return true;
        String name = classifiedName == null ? "" : classifiedName.toLowerCase();
        return switch (expected) {
            case FRONT -> FRONT_NAMES.contains(name);
            case BACK -> BACK_NAMES.contains(name);
            case SELFIE -> classifiedType != null && classifiedType == FACE_TYPE;
            default -> true;
        };
    }

    public Map<String, Object> uploadFileAndAttach(
            UUID sessionId,
            UUID accountId,
            MultipartFile file,
            String title,
            String description,
            KycDocumentType expectedType
    ) {
        // 1) upload -> hash VNPT
        String hash = uploadService.upload(file, title, description);
        if (hash == null || hash.isBlank()) {
            return Map.of(
                    "ok", false,
                    "step", "UPLOAD",
                    "fileHash", "",
                    "reason", "Empty hash from upload"
            );
        }

        // 2) classify FIRST (để route)
        ClassifyResult cls = classifyService.classify(hash, sessionId.toString());
        if (cls == null || cls.name() == null || cls.name().isBlank()) {
            return Map.of(
                    "ok", false,
                    "step", "CLASSIFY",
                    "fileHash", hash,
                    "reason", "Classify returned empty name"
            );
        }
        Integer type = cls.type();
        String name = cls.name();

        // 2b) sai loại ảnh so với bước đang làm: dừng ở đây, không kiểm tra liveness và không lưu vào phiên
        if (!matchesExpectedType(expectedType, name, type)) {
            return Map.of(
                    "ok", false,
                    "step", "TYPE_MISMATCH",
                    "fileHash", hash,
                    "classifiedName", nz(name),
                    "classifiedType", nzObj(type, -1),
                    "expectedType", expectedType.name()
            );
        }

        if (type != null && (type == 0 || type == 1 || type == 2 || type == 3)) {
            // 3a) card/document liveness
            CardLivenessResult live = cardLivenessService.verify(hash, sessionId.toString());
            if (live == null || !live.isReal()) {
                return Map.of(
                        "ok", false,
                        "step", "CARD_LIVENESS",
                        "fileHash", hash,
                        "classifiedName", nz(name),
                        "classifiedType", nzObj(type, -1),
                        "liveness", live != null ? nz(live.liveness()) : "",
                        "livenessMsg", live != null ? nz(live.livenessMsg()) : ""
                );
            }
        } else if (type != null && type == 4) {
            // Ảnh khuôn mặt: không kiểm tra liveness, chỉ cần VNPT nhận diện đúng là ảnh khuôn mặt
        } else {
            return Map.of(
                    "ok", false,
                    "step", "ROUTE_UNSUPPORTED",
                    "fileHash", hash,
                    "classifiedName", nz(name),
                    "classifiedType", nzObj(type, -1),
                    "reason", "Unsupported classify type for this endpoint"
            );
        }

        AttachDecision decision = attachService.attachFile(sessionId, accountId, hash, name);
        if (decision == null || !decision.attached()) {
            return Map.of(
                    "ok", false,
                    "step", "ATTACH",
                    "fileHash", hash,
                    "classifiedName", nz(name),
                    "classifiedType", nzObj(type, -1),
                    "reason", decision != null ? nz(decision.reason()) : "ATTACH_DECISION_NULL"
            );
        }

        return Map.of(
                "ok", true,
                "fileHash", hash,
                "classifiedName", nz(name),
                "classifiedType", nzObj(type, -1),
                "classifiedConfidence", nzObj(cls.confidence(), 0.0),
                "savedTo", nz(decision.savedTo())
        );
    }
}
