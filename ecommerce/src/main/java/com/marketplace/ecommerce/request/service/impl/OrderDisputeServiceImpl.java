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

    private OrderDisputeResponse computeDisputeInfo(List<Report> reports, Escrow escrow) {
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
        ReportStage stage = latestReport.getStage();
        RequestStatus reportStatus = latestReport.getRequest() != null ? latestReport.getRequest().getStatus() : null;
        String disputeReason = latestReport.getRequest() != null ? latestReport.getRequest().getDescription() : null;
        boolean isDisputed = escrow != null && escrow.getStatus() == EscrowStatus.DISPUTED;

        // 1. Tiền đã hoàn tất hoàn lại cho Buyer
        if (escrow != null && escrow.getStatus() == EscrowStatus.REFUNDED) {
            return OrderDisputeResponse.builder()
                    .hasActiveDispute(false)
                    .disputeStatus("REFUNDED")
                    .disputeReason(disputeReason)
                    .build();
        }

        // 2. Đang trong tiến trình đổi trả hàng -> BẮT BUỘC có active dispute để chặn Buyer bấm nhận hàng hoặc auto-release
        if (stage == ReportStage.RETURN_IN_PROGRESS) {
            return OrderDisputeResponse.builder()
                    .hasActiveDispute(true)
                    .disputeStatus("RETURN_IN_PROGRESS")
                    .disputeReason(disputeReason)
                    .build();
        }

        // 3. Đang trong giai đoạn thương lượng 1:1 Buyer - Seller
        if (stage == ReportStage.DIRECT_NEGOTIATION) {
            return OrderDisputeResponse.builder()
                    .hasActiveDispute(true)
                    .disputeStatus("DIRECT_NEGOTIATION")
                    .disputeReason(disputeReason)
                    .build();
        }

        // 4. Nếu khiếu nại đã bị hủy (CANCELLED)
        if (stage == ReportStage.CANCELLED) {
            return OrderDisputeResponse.builder()
                    .hasActiveDispute(isDisputed)
                    .disputeStatus("CANCELLED")
                    .disputeReason(disputeReason)
                    .build();
        }

        // 5. Nếu vụ việc đã kết thúc (RESOLVED, CLOSED)
        if (stage == ReportStage.RESOLVED || stage == ReportStage.CLOSED) {
            if (reportStatus == RequestStatus.REJECTED) {
                return OrderDisputeResponse.builder()
                        .hasActiveDispute(false)
                        .disputeStatus("NONE")
                        .disputeReason(disputeReason)
                        .build();
            }
            return OrderDisputeResponse.builder()
                    .hasActiveDispute(isDisputed)
                    .disputeStatus(isDisputed ? "REPORT_APPROVED" : "RESOLVED")
                    .disputeReason(disputeReason)
                    .build();
        }

        // 6. Đang chờ Quản trị viên xử lý (ESCALATED_TO_ADMIN hoặc PENDING)
        if (stage == ReportStage.ESCALATED_TO_ADMIN || reportStatus == RequestStatus.PENDING) {
            return OrderDisputeResponse.builder()
                    .hasActiveDispute(true)
                    .disputeStatus("REPORT_PENDING")
                    .disputeReason(disputeReason)
                    .build();
        }

        if (reportStatus == RequestStatus.REJECTED) {
            // Admin đã bác bỏ khiếu nại của Buyer
            return OrderDisputeResponse.builder()
                    .hasActiveDispute(false)
                    .disputeStatus("NONE")
                    .disputeReason(disputeReason)
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

            // 3. Nếu có Appeal REJECTED -> Kháng cáo bị bác bỏ
            boolean hasRejectedAppeal = appeals.stream()
                    .anyMatch(a -> a.getRequest().getStatus() == RequestStatus.REJECTED);
            if (hasRejectedAppeal) {
                if (escrow != null && escrow.getStatus() == EscrowStatus.REFUNDED) {
                    return OrderDisputeResponse.builder()
                            .hasActiveDispute(false)
                            .disputeStatus("REFUNDED")
                            .disputeReason(latestReport.getRequest().getDescription())
                            .build();
                }
                return OrderDisputeResponse.builder()
                        .hasActiveDispute(isDisputed)
                        .disputeStatus(isDisputed ? "REPORT_APPROVED" : "REFUNDED")
                        .disputeReason(latestReport.getRequest().getDescription())
                        .build();
            }

            // 4. Nếu không có Appeal
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
