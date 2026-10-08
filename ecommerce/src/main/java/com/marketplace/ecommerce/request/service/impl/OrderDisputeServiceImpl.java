package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.request.dto.response.OrderDisputeResponse;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.service.OrderDisputeService;
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

        return computeDisputeInfo(orderId, reports, escrowOpt.orElse(null));
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

        Map<UUID, OrderDisputeResponse> resultMap = new HashMap<>();
        for (UUID orderId : orderIds) {
            List<Report> reports = reportsByOrderId.getOrDefault(orderId, Collections.emptyList());
            Optional<Escrow> escrowOpt = escrowRepository.findByOrderId(orderId);
            resultMap.put(orderId, computeDisputeInfo(orderId, reports, escrowOpt.orElse(null)));
        }

        return resultMap;
    }

    private OrderDisputeResponse computeDisputeInfo(UUID orderId, List<Report> reports, Escrow escrow) {
        if (reports == null || reports.isEmpty()) {
            boolean isDisputed = escrow != null && escrow.getStatus() == EscrowStatus.DISPUTED;
            return OrderDisputeResponse.builder()
                    .hasActiveDispute(isDisputed)
                    .disputeStatus(isDisputed ? "REPORT_PENDING" : "NONE")
                    .build();
        }

        // Lọc các báo cáo gốc (Type == REPORT)
        List<Report> initialReports = reports.stream()
                .filter(r -> r.getRequest() != null && r.getRequest().getType() == RequestType.REPORT)
                .toList();

        if (initialReports.isEmpty()) {
            boolean isDisputed = escrow != null && escrow.getStatus() == EscrowStatus.DISPUTED;
            return OrderDisputeResponse.builder()
                    .hasActiveDispute(isDisputed)
                    .disputeStatus(isDisputed ? "REPORT_PENDING" : "NONE")
                    .build();
        }

        Report latestReport = initialReports.get(0);
        RequestStatus reportStatus = latestReport.getRequest().getStatus();

        if (reportStatus == RequestStatus.PENDING) {
            return OrderDisputeResponse.builder()
                    .hasActiveDispute(true)
                    .disputeStatus("REPORT_PENDING")
                    .disputeReason(latestReport.getRequest().getDescription())
                    .build();
        }

        if (reportStatus == RequestStatus.REJECTED) {
            // Admin đã bác bỏ khiếu nại của Buyer
            return OrderDisputeResponse.builder()
                    .hasActiveDispute(false)
                    .disputeStatus("NONE")
                    .build();
        }

        if (reportStatus == RequestStatus.APPROVED) {
            // Khiếu nại đã được Admin chấp thuận, tìm xem có Appeal nào không
            List<Report> appeals = reports.stream()
                    .filter(r -> r.getRequest() != null && r.getRequest().getType() == RequestType.APPEAL)
                    .toList();

            // 1. Nếu có Appeal APPROVED -> Shop đã kháng cáo thành công (Shop thắng)
            boolean hasApprovedAppeal = appeals.stream()
                    .anyMatch(a -> a.getRequest().getStatus() == RequestStatus.APPROVED);
            if (hasApprovedAppeal) {
                return OrderDisputeResponse.builder()
                        .hasActiveDispute(false)
                        .disputeStatus("APPEAL_APPROVED")
                        .disputeReason(latestReport.getRequest().getDescription())
                        .build();
            }

            // 2. Nếu có Appeal PENDING -> Shop đang kháng cáo, chờ Admin phân xử
            boolean hasPendingAppeal = appeals.stream()
                    .anyMatch(a -> a.getRequest().getStatus() == RequestStatus.PENDING);
            if (hasPendingAppeal) {
                return OrderDisputeResponse.builder()
                        .hasActiveDispute(true)
                        .disputeStatus("APPEAL_PENDING")
                        .disputeReason(latestReport.getRequest().getDescription())
                        .build();
            }

            // 3. Nếu có Appeal REJECTED -> Kháng cáo bị bác bỏ -> Tiền hoàn cho Buyer
            boolean hasRejectedAppeal = appeals.stream()
                    .anyMatch(a -> a.getRequest().getStatus() == RequestStatus.REJECTED);
            if (hasRejectedAppeal || (escrow != null && escrow.getStatus() == EscrowStatus.REFUNDED)) {
                return OrderDisputeResponse.builder()
                        .hasActiveDispute(false)
                        .disputeStatus("REFUNDED")
                        .disputeReason(latestReport.getRequest().getDescription())
                        .build();
            }

            // 4. Chưa có Appeal -> Đang chờ Shop nộp đơn kháng cáo trong thời hạn 72h
            boolean isDisputed = escrow != null && escrow.getStatus() == EscrowStatus.DISPUTED;
            return OrderDisputeResponse.builder()
                    .hasActiveDispute(isDisputed)
                    .disputeStatus(isDisputed ? "REPORT_APPROVED" : "NONE")
                    .disputeReason(latestReport.getRequest().getDescription())
                    .build();
        }

        return OrderDisputeResponse.builder()
                .hasActiveDispute(false)
                .disputeStatus("NONE")
                .build();
    }
}
