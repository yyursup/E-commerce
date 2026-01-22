package com.marketplace.ecommerce.kyc.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.common.exception.KycNotFoundException;
import com.marketplace.ecommerce.kyc.dto.response.CompareResponse;
import com.marketplace.ecommerce.kyc.entity.EKycSession;
import com.marketplace.ecommerce.kyc.repository.KycSessionRepository;
import com.marketplace.ecommerce.kyc.service.CompareKycService;
import com.marketplace.ecommerce.kyc.usecase.VNPTClient;
import com.marketplace.ecommerce.kyc.valueObjects.KycStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompareKycServiceImpl implements CompareKycService {

    private final KycSessionRepository sessions;
    private final VNPTClient vnpt;
    private final AccountRepository accountRepository;
    private final ObjectMapper om;

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

    private String toJsonSafe(Object obj) {
        try {
            return om.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.warn("Cannot serialize VNPT response to JSON. {}", e.getMessage());
            return null;
        }
    }
}
