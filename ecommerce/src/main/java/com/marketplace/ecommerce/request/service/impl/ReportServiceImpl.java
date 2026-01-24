package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.request.dto.request.CreateReportRequest;
import com.marketplace.ecommerce.request.dto.request.CreateSendRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.service.ReportService;
import com.marketplace.ecommerce.request.service.RequestService;
import com.marketplace.ecommerce.request.policy.RequestPolicy;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {
    private final RequestService requestService;
    private final ReportRepository reportRepository;
    private final RequestPolicy requestValidation;
    private final AccountRepository accountRepository;

    @Override
    public CreateRequestResponse createReport(UUID accountId, CreateReportRequest request) {

        Account acc = accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomException("Account not found"));


        Request r = requestService.createRequest(acc, CreateSendRequest.builder()
                .requestType(RequestType.REPORT)
                .coverImage(request.getCoverImageUrl())
                .description(request.getDescription())
                .build());

        TargetType targetType = requestValidation.resolve(request.getTargetId());

        Report re = Report.builder()
                .request(r)
                .evidenceUrl(request.getEvidenceUrl())
                .targetType(targetType)
                .targetId(request.getTargetId())
                .build();

        reportRepository.save(re);

        return CreateRequestResponse.from(r);
    }
}
