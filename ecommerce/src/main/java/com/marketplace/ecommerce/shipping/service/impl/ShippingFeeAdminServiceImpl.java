package com.marketplace.ecommerce.shipping.service.impl;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderReturn;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.repository.OrderReturnRepository;
import com.marketplace.ecommerce.payment.repository.TransactionRepository;
import com.marketplace.ecommerce.shipping.dto.response.ShippingFeeRecordResponse;
import com.marketplace.ecommerce.shipping.dto.response.ShippingFeeSummaryResponse;
import com.marketplace.ecommerce.shipping.service.ShippingFeeAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShippingFeeAdminServiceImpl implements ShippingFeeAdminService {

    public static final String OUTBOUND = "OUTBOUND";
    public static final String RETURN = "RETURN";
    /** Khi gộp hai chiều, mỗi chiều lấy tối đa số bản ghi mới nhất này (đủ cho quy mô đồ án). */
    private static final int MERGE_LIMIT = 500;

    private final OrderRepository orderRepository;
    private final OrderReturnRepository orderReturnRepository;
    private final TransactionRepository transactionRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<ShippingFeeRecordResponse> list(String direction, Pageable pageable) {
        String dir = direction == null || direction.isBlank() ? null : direction.trim().toUpperCase();
        if (dir != null && !OUTBOUND.equals(dir) && !RETURN.equals(dir)) {
            throw new CustomException("direction phải là OUTBOUND hoặc RETURN");
        }
        Sort newestFirst = Sort.by(Sort.Direction.DESC, "createdAt");

        if (OUTBOUND.equals(dir)) {
            return orderRepository.findByGhnOrderCodeIsNotNull(PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), newestFirst))
                    .map(this::toOutbound);
        }
        if (RETURN.equals(dir)) {
            return orderReturnRepository.findByBuyerShippedAtIsNotNull(PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), newestFirst))
                    .map(this::toReturn);
        }

        PageRequest head = PageRequest.of(0, MERGE_LIMIT, newestFirst);
        List<ShippingFeeRecordResponse> all = new ArrayList<>();
        orderRepository.findByGhnOrderCodeIsNotNull(head).forEach(o -> all.add(toOutbound(o)));
        orderReturnRepository.findByBuyerShippedAtIsNotNull(head).forEach(r -> all.add(toReturn(r)));
        all.sort(Comparator.comparing(ShippingFeeRecordResponse::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));

        int from = (int) Math.min(pageable.getOffset(), all.size());
        int to = Math.min(from + pageable.getPageSize(), all.size());
        return new PageImpl<>(all.subList(from, to), pageable, all.size());
    }

    @Override
    @Transactional(readOnly = true)
    public ShippingFeeSummaryResponse summary() {
        BigDecimal outboundTotal = nz(orderRepository.sumShippingFeeOfGhnOrders());
        BigDecimal returnTotal = nz(orderReturnRepository.sumShippingFeeOfReturnShipments());
        return ShippingFeeSummaryResponse.builder()
                .outboundCount(orderRepository.countByGhnOrderCodeIsNotNull())
                .outboundTotal(outboundTotal)
                .returnCount(orderReturnRepository.countByBuyerShippedAtIsNotNull())
                .returnTotal(returnTotal)
                .grandTotal(outboundTotal.add(returnTotal))
                .build();
    }

    /**
     * Cước chiều đi do Shop chịu khi đơn kết thúc bằng hoàn tiền cho người mua (trích quỹ ký quỹ):
     * hoàn tiền không cần trả hàng (khóa COMPENSATION:OUTBOUND_SHIPPING) hoặc hoàn tất kiện trả hàng
     * (cước hai chiều đã trích). Ngược lại chiều đi là tiền người mua đã trả.
     */
    private boolean isOutboundBorneByShop(Order o) {
        if (o.getId() == null) {
            return false;
        }
        if (transactionRepository.existsByDedupeKey("COMPENSATION:OUTBOUND_SHIPPING:" + o.getId())) {
            return true;
        }
        return orderReturnRepository.findByOrderId(o.getId())
                .map(r -> Boolean.TRUE.equals(r.getIsReturnShippingDeducted()))
                .orElse(false);
    }

    private ShippingFeeRecordResponse toOutbound(Order o) {
        boolean shopBorne = isOutboundBorneByShop(o);
        return ShippingFeeRecordResponse.builder()
                .direction(OUTBOUND)
                .orderId(o.getId())
                .orderNumber(o.getOrderNumber())
                .shopName(o.getShop() != null ? o.getShop().getName() : null)
                .buyerName(o.getUser() != null ? o.getUser().getFullName() : null)
                .createdBy("SHOP")
                .carrier("GHN")
                .trackingCode(o.getGhnOrderCode())
                .fee(nz(o.getShippingFee()))
                .status(o.getStatus() != null ? o.getStatus().name() : null)
                .payer(shopBorne ? "SHOP_FUND" : "BUYER")
                .deductedFromShopFund(shopBorne)
                .createdAt(o.getCreatedAt())
                .build();
    }

    private ShippingFeeRecordResponse toReturn(OrderReturn r) {
        Order o = r.getOrder();
        LocalDateTime at = r.getBuyerShippedAt() != null ? r.getBuyerShippedAt() : r.getCreatedAt();
        return ShippingFeeRecordResponse.builder()
                .direction(RETURN)
                .orderId(o != null ? o.getId() : null)
                .orderNumber(o != null ? o.getOrderNumber() : null)
                .shopName(o != null && o.getShop() != null ? o.getShop().getName() : null)
                .buyerName(o != null && o.getUser() != null ? o.getUser().getFullName() : null)
                .createdBy("BUYER")
                .carrier(r.getCarrierName() != null ? r.getCarrierName() : "GHN")
                .trackingCode(r.getReturnTrackingCode())
                .fee(effectiveReturnFee(r, o))
                .status(r.getStatus() != null ? r.getStatus().name() : null)
                .payer("SHOP_FUND")
                .deductedFromShopFund(Boolean.TRUE.equals(r.getIsReturnShippingDeducted()))
                .createdAt(at)
                .build();
    }

    /** Cùng quy tắc trích quỹ: cước người mua khai báo nếu > 0, ngược lại bằng cước chiều đi của đơn. */
    private static BigDecimal effectiveReturnFee(OrderReturn r, Order o) {
        if (r.getShippingFee() != null && r.getShippingFee().signum() > 0) {
            return r.getShippingFee();
        }
        return nz(o != null ? o.getShippingFee() : null);
    }

    private static BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
