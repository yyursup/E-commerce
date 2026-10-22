package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.request.dto.response.OrderDisputeResponse;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.service.OrderDisputeService;
import com.marketplace.ecommerce.request.valueObjects.ReportStage;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderDisputeServiceImpl implements OrderDisputeService {

    private final ReportRepository reportRepository;
    private final EscrowRepository escrowRepository;

    @Override
    public boolean hasActiveDispute(UUID orderId) {
        if (orderId == null) return false;
        return getDisputeInfo(orderId).isHasActiveDispute();
    }

    @Override
    public OrderDisputeResponse getDisputeInfo(UUID orderId) {
        if (orderId == null) {
            return OrderDisputeResponse.builder().hasActiveDispute(false).disputeStatus("NONE").build();
        }

        List<Report> reports = reportRepository.findReportsByTargetTypeAndTargetId(TargetType.ORDER, orderId);
        Optional<Escrow> escrowOpt = escrowRepository.findByOrderId(orderId);

        return computeDisputeInfo(reports, escrowOpt.orElse(null));
    }

    @Override
    public Map<UUID, OrderDisputeResponse> getDisputeInfoBatch(List<UUID> orderIds) {
        if (orderIds == null || orderIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Report> allReports = reportRepository.findReportsByTargetTypeAndTargetIdIn(TargetType.ORDER, orderIds);
        Map<UUID, List<Report>> reportsByOrderId = allReports.stream()
                .filter(r -> r.getTargetId() != null)
                .collect(Collectors.groupingBy(Report::getTargetId));

        List<Escrow> allEscrows = escrowRepository.findByOrderIdIn(orderIds);
        Map<UUID, Escrow> escrowByOrderId = allEscrows.stream()
                .filter(e -> e.getOrder() != null && e.getOrder().getId() != null)
                .collect(Collectors.toMap(e -> e.getOrder().getId(), e -> e, (e1, e2) -> e1));

        Map<UUID, OrderDisputeResponse> resultMap = new HashMap<>();
        for (UUID orderId : orderIds) {
            List<Report> reports = reportsByOrderId.getOrDefault(orderId, Collections.emptyList());
            Escrow escrow = escrowByOrderId.get(orderId);
            resultMap.put(orderId, computeDisputeInfo(reports, escrow));
        }

        return resultMap;
    }

    private OrderDisputeResponse buildResponse(boolean hasActiveDispute, String disputeStatus, String disputeReason, Report report) {
        return OrderDisputeResponse.builder()
                .hasActiveDispute(hasActiveDispute)
                .disputeStatus(disputeStatus)
                .disputeReason(disputeReason)
                .policyClauseCode(report != null ? report.getPolicyClauseCode() : null)
                .policyClauseTitle(report != null ? report.getPolicyClauseTitle() : null)
                .build();
    }

    private OrderDisputeResponse computeDisputeInfo(List<Report> reports, Escrow escrow) {
        if (reports == null || reports.isEmpty()) {
            boolean isDisputed = escrow != null && escrow.getStatus() == EscrowStatus.DISPUTED;
            return buildResponse(isDisputed, isDisputed ? "REPORT_PENDING" : "NONE", null, null);
        }

        // Lọc các báo cáo gốc (Type == REPORT)
        List<Report> initialReports = reports.stream()
                .filter(r -> r.getRequest() != null && r.getRequest().getType() == RequestType.REPORT)
                .toList();

        if (initialReports.isEmpty()) {
            boolean isDisputed = escrow != null && escrow.getStatus() == EscrowStatus.DISPUTED;
            return buildResponse(isDisputed, isDisputed ? "REPORT_PENDING" : "NONE", null, null);
        }

        Report latestReport = initialReports.get(0);
        ReportStage stage = latestReport.getStage();
        RequestStatus reportStatus = latestReport.getRequest() != null ? latestReport.getRequest().getStatus() : null;
        String disputeReason = latestReport.getRequest() != null ? latestReport.getRequest().getDescription() : null;
        boolean isDisputed = escrow != null && escrow.getStatus() == EscrowStatus.DISPUTED;

        // 1. Tiền đã hoàn tất hoàn lại cho Buyer
        if (escrow != null && escrow.getStatus() == EscrowStatus.REFUNDED) {
            return buildResponse(false, "REFUNDED", disputeReason, latestReport);
        }

        // 2. Đang trong tiến trình đổi trả hàng -> BẮT BUỘC có active dispute để chặn Buyer bấm nhận hàng hoặc auto-release
        if (stage == ReportStage.RETURN_IN_PROGRESS) {
            return buildResponse(true, "RETURN_IN_PROGRESS", disputeReason, latestReport);
        }

        // 3. Đang trong giai đoạn thương lượng 1:1 Buyer - Seller
        if (stage == ReportStage.DIRECT_NEGOTIATION) {
            return buildResponse(true, "DIRECT_NEGOTIATION", disputeReason, latestReport);
        }

        // 4. Nếu khiếu nại đã bị hủy (CANCELLED)
        if (stage == ReportStage.CANCELLED) {
            return buildResponse(isDisputed, "CANCELLED", disputeReason, latestReport);
        }

        // 5. Nếu vụ việc đã kết thúc (RESOLVED, CLOSED)
        if (stage == ReportStage.RESOLVED || stage == ReportStage.CLOSED) {
            if (reportStatus == RequestStatus.REJECTED) {
                return buildResponse(false, "NONE", disputeReason, latestReport);
            }
            return buildResponse(isDisputed, isDisputed ? "REPORT_APPROVED" : "RESOLVED", disputeReason, latestReport);
        }

        // 6. Đang chờ Quản trị viên xử lý (ESCALATED_TO_ADMIN hoặc PENDING)
        if (stage == ReportStage.ESCALATED_TO_ADMIN || reportStatus == RequestStatus.PENDING) {
            return buildResponse(true, "REPORT_PENDING", disputeReason, latestReport);
        }

        if (reportStatus == RequestStatus.REJECTED) {
            // Admin đã bác bỏ khiếu nại của Buyer
            return buildResponse(false, "NONE", disputeReason, latestReport);
        }

        if (reportStatus == RequestStatus.APPROVED) {
            if (escrow != null && escrow.getStatus() == EscrowStatus.REFUNDED) {
                return buildResponse(false, "REFUNDED", disputeReason, latestReport);
            }
            return buildResponse(isDisputed, isDisputed ? "REPORT_APPROVED" : "NONE", disputeReason, latestReport);
        }

        return buildResponse(false, "NONE", null, latestReport);
    }
}
