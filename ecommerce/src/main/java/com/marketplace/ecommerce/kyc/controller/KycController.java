package com.marketplace.ecommerce.kyc.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.file.SimpleLocalFileStore;
import com.marketplace.ecommerce.kyc.dto.request.ClassifyRequest;
import com.marketplace.ecommerce.kyc.dto.request.KycThumbnailAttachRequest;
import com.marketplace.ecommerce.kyc.entity.EKycSession;
import com.marketplace.ecommerce.kyc.service.KycOrchestrator;
import com.marketplace.ecommerce.kyc.valueObjects.KycDocumentType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/kyc")
@RequiredArgsConstructor
public class KycController {
    private final KycOrchestrator orchestrator;
    private final SimpleLocalFileStore fileStore;


    @PostMapping("/sessions:start")
    public ResponseEntity<Map<String, Object>> start(@CurrentUser CurrentUserInfo u) {
        UUID sessionId = orchestrator.start(u.getAccountId());
        return ResponseEntity.ok(Map.of(
                "sessionId", sessionId,
                "status", "DRAFT"
        ));
    }


    @PostMapping("/session/{id}/upload")
    public Map<String, Object> upload(
            @PathVariable("id") UUID sessionId,
            @RequestParam("type") KycDocumentType type,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @CurrentUser CurrentUserInfo u
    ) {
        String vnptHash = orchestrator.uploadToVnptAndAttach(
                sessionId,
                u.getAccountId(),
                type,
                file,
                title,
                description
        );

        return Map.of(
                "fileHash", vnptHash,
                "type", type.name(),
                "sessionId", sessionId.toString()
        );
    }

    @PostMapping(
            "/session/{id}/attach"
    )
    public Map<String, Object> attach(
            @PathVariable("id") UUID sessionId,
            @RequestBody @Valid KycThumbnailAttachRequest req,
            @CurrentUser CurrentUserInfo u
    ) {
        orchestrator.attachFile(sessionId, u.getAccountId(), req.getType(), req.getFileHash());
        var session = orchestrator.get(sessionId, u.getAccountId());

        return Map.of(
                "success", true,
                "session", session
        );
    }

    @PostMapping("/sessions/{sessionId}/classify")
    public ResponseEntity<Map<String, Object>> classify(
            @PathVariable UUID sessionId,
            @CurrentUser CurrentUserInfo u,
            @RequestParam(required = false) String fileHash

    ) {
        Map<String, Object> out = orchestrator.classify(sessionId, u.getAccountId(), fileHash);
        return ResponseEntity.ok(out);
    }

    @PostMapping("/sessions/{sessionId}/ocr/front")
    public ResponseEntity<Map<String, Object>> ocrFront(
            @PathVariable UUID sessionId,
            @CurrentUser CurrentUserInfo u,
            @RequestParam(required = false) String fileHash,
            @RequestParam(name = "type", defaultValue = "-1") int type
    ) {
        Map<String, Object> out = orchestrator.ocrFront(sessionId, u.getAccountId(), fileHash, type);
        return ResponseEntity.ok(out);
    }

    @PostMapping("/sessions/{sessionId}/ocr/back")
    public ResponseEntity<Map<String, Object>> ocrBack(
            @PathVariable UUID sessionId,
            @CurrentUser CurrentUserInfo u,
            @RequestParam(required = false) String fileHash,
            @RequestParam(name = "type", defaultValue = "-1") int type
    ) {
        Map<String, Object> out = orchestrator.ocrBack(sessionId, u.getAccountId(), fileHash, type);
        return ResponseEntity.ok(out);
    }

    @PostMapping("/sessions/{sessionId}/ocr/liveness")
    public ResponseEntity<Map<String, Object>> liveness(
            @PathVariable UUID sessionId,
            @CurrentUser CurrentUserInfo u,
            @RequestParam(required = false) String fileHash
    ) {
        Map<String, Object> out = orchestrator.liveness(sessionId, u.getAccountId(), fileHash);
        return ResponseEntity.ok(out);
    }

    @PostMapping("/sessions/{sessionId}/compare")
    public ResponseEntity<Map<String, Object>> compare(
            @PathVariable UUID sessionId,
            @CurrentUser CurrentUserInfo u
    ) {
        Map<String, Object> out = orchestrator.compare(sessionId, u.getAccountId());
        return ResponseEntity.ok(out);
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<Map<String, Object>> get(
            @PathVariable UUID sessionId,
            @CurrentUser CurrentUserInfo u
    ) {
        EKycSession session = orchestrator.get(sessionId, u.getAccountId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "session", session
        ));
    }

}
