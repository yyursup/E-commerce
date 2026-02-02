package com.marketplace.ecommerce.request.service;

import com.marketplace.ecommerce.request.dto.request.CreateReportRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;

import java.util.List;
import java.util.UUID;

public interface ReportService {
     CreateRequestResponse createReport(UUID accountId, CreateReportRequest request);

}
