package com.marketplace.ecommerce.shipping.service.impl;

import com.marketplace.ecommerce.cart.entity.CartItem;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.payment.valueObjects.PaymentMethod;
import com.marketplace.ecommerce.product.valueObjects.ConditionGrade;
import com.marketplace.ecommerce.shipping.dto.request.GHNCalculateFeeRequest;
import com.marketplace.ecommerce.shipping.dto.request.GHNCreateOrderRequest;
import com.marketplace.ecommerce.shipping.dto.response.GHNCalculateFeeResponse;
import com.marketplace.ecommerce.shipping.dto.response.GHNCreateOrderResponse;
import com.marketplace.ecommerce.shipping.service.ShippingService;
import com.marketplace.ecommerce.shipping.usecase.GHNClient;
import com.marketplace.ecommerce.shop.entity.Shop;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShippingServiceImpl implements ShippingService {

    private final GHNClient ghnClient;

    public GHNCreateOrderRequest build(Order order) {
        int totalWeight = order.getItems().stream()
                .mapToInt(item -> {
                    int w = item.getProduct().getWeight() != null ? item.getProduct().getWeight() : 500;
                    return w * item.getQuantity();
                })
                .sum();

        Shop shop = order.getShop();
        Integer fromDistrictId = shop.getDistrictId();
        String fromWardCode = shop.getWardCode();

        if (fromDistrictId == null || fromWardCode == null) {
            fromDistrictId = 1442;
            fromWardCode = "21012";
            log.warn("Shop {} missing address, using default", shop.getName());
        }

        if (order.getShippingDistrictId() == null || order.getShippingWardCode() == null) {
            throw new CustomException("Missing information about the district and wardCode (district_id, ward_code).");
        }

        List<GHNCreateOrderRequest.GHNItem> ghnItems = new ArrayList<>();
        for (OrderItem orderItem : order.getItems()) {
            int productWeight = orderItem.getProduct().getWeight() != null
                    ? orderItem.getProduct().getWeight()
                    : 500;
            int itemWeight = productWeight * orderItem.getQuantity();
            String productName = orderItem.getProductName() != null && !orderItem.getProductName().isBlank()
                    ? orderItem.getProductName()
                    : "Sản phẩm";
            GHNCreateOrderRequest.GHNItem apply = GHNCreateOrderRequest.GHNItem.builder()
                    .name(productName)
                    .quantity(orderItem.getQuantity())
                    .weight(itemWeight)
                    .length(20)
                    .width(20)
                    .height(10)
                    .build();
            ghnItems.add(apply);
        }

        boolean hasBrandNewItem = order.getItems().stream()
                .anyMatch(item -> item.getProduct() != null && item.getProduct().getConditionGrade() == ConditionGrade.GRADE_NEW);
        String requiredNote = hasBrandNewItem ? "CHOXEMHANGKHONGTHU" : "CHOTHUHANG";

        int insuranceValue = 0;
        if (order.getSubtotal() != null) {
            insuranceValue = Math.min(order.getSubtotal().intValue(), 5_000_000);
        }

        return GHNCreateOrderRequest.builder()
                .payment_type_id(1)
                .note(order.getNotes() != null ? order.getNotes() : "")
                .required_note(requiredNote)
                .from_district_id(fromDistrictId)
                .from_ward_code(fromWardCode)
                .to_name(order.getShippingName())
                .to_phone(order.getShippingPhone())
                .to_address(order.getShippingAddress())
                .to_ward_code(order.getShippingWardCode())
                .to_district_id(String.valueOf(order.getShippingDistrictId()))
                .weight(totalWeight)
                .length(20).width(20).height(10)
                .service_type_id(2)
                .cod_amount(order.getPaymentMethod() == PaymentMethod.COD && order.getTotal() != null ? order.getTotal().intValue() : 0)
                .insurance_value(insuranceValue)
                .client_order_code(order.getOrderNumber())
                .items(ghnItems)
                .build();
    }

    @Override
    public BigDecimal quoteReturnFee(Order order) {
        if (order == null || order.getShop() == null || order.getShippingDistrictId() == null
                || order.getShippingWardCode() == null || order.getShippingWardCode().isBlank()) {
            log.warn("Không đủ địa chỉ người mua để báo giá cước trả hàng cho đơn {}",
                    order != null ? order.getOrderNumber() : null);
            return null;
        }

        Shop shop = order.getShop();
        Integer toDistrictId = shop.getDistrictId();
        String toWardCode = shop.getWardCode();
        if (toDistrictId == null || toWardCode == null || toWardCode.isBlank()) {
            toDistrictId = 1442; // fallback giống chiều đi
            toWardCode = "21012";
            log.warn("Shop {} missing district/ward, using default for return fee quote", shop.getName());
        }

        int totalWeight = 0;
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                Integer w = item.getProduct() != null ? item.getProduct().getWeight() : null;
                int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                totalWeight += (w != null ? w : 500) * qty;
            }
        }
        if (totalWeight <= 0) {
            totalWeight = 500;
        }

        // Chiều trả hàng đi ngược lại: điểm đi là địa chỉ người mua, điểm đến là shop
        GHNCalculateFeeRequest feeReq = GHNCalculateFeeRequest.builder()
                .from_district_id(order.getShippingDistrictId())
                .from_ward_code(order.getShippingWardCode())
                .to_district_id(toDistrictId)
                .to_ward_code(toWardCode)
                .weight(totalWeight)
                .service_type_id(2)
                .build();

        try {
            GHNCalculateFeeResponse feeRes = ghnClient.calculateFee(feeReq);
            return feeRes != null && feeRes.getTotal() != null ? BigDecimal.valueOf(feeRes.getTotal()) : null;
        } catch (Exception e) {
            log.warn("GHN calculate return fee failed for order {}: {}", order.getOrderNumber(), e.getMessage());
            return null;
        }
    }

    @Override
    public String createReturnShipment(Order order) {
        if (order == null || order.getShop() == null || order.getShippingDistrictId() == null
                || order.getShippingWardCode() == null || order.getShippingWardCode().isBlank()) {
            log.warn("Không đủ địa chỉ người mua để tạo đơn GHN trả hàng cho đơn {}",
                    order != null ? order.getOrderNumber() : null);
            return null;
        }
        Shop shop = order.getShop();
        Integer toDistrictId = shop.getDistrictId();
        String toWardCode = shop.getWardCode();
        if (toDistrictId == null || toWardCode == null || toWardCode.isBlank()) {
            toDistrictId = 1442;
            toWardCode = "21012";
        }

        int totalWeight = 0;
        List<GHNCreateOrderRequest.GHNItem> ghnItems = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                Integer w = item.getProduct() != null ? item.getProduct().getWeight() : null;
                int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                int itemWeight = (w != null ? w : 500) * qty;
                totalWeight += itemWeight;
                ghnItems.add(GHNCreateOrderRequest.GHNItem.builder()
                        .name(item.getProductName() != null && !item.getProductName().isBlank()
                                ? item.getProductName() : "Sản phẩm")
                        .quantity(qty).weight(itemWeight).length(20).width(20).height(10).build());
            }
        }
        if (totalWeight <= 0) {
            totalWeight = 500;
        }

        String shopPhone = shop.getPhoneNumber() != null && !shop.getPhoneNumber().isBlank()
                ? shop.getPhoneNumber()
                : (shop.getUser() != null ? shop.getUser().getPhoneNumber() : null);

        GHNCreateOrderRequest req = GHNCreateOrderRequest.builder()
                .payment_type_id(1)
                .note("Hoàn hàng đơn " + order.getOrderNumber())
                .required_note("CHOXEMHANGKHONGTHU")
                .from_name(order.getShippingName())
                .from_phone(order.getShippingPhone())
                .from_address(order.getShippingAddress())
                .from_district_id(order.getShippingDistrictId())
                .from_ward_code(order.getShippingWardCode())
                .to_name(shop.getName())
                .to_phone(shopPhone)
                .to_address(shop.getAddress())
                .to_ward_code(toWardCode)
                .to_district_id(String.valueOf(toDistrictId))
                .weight(totalWeight)
                .length(20).width(20).height(10)
                .service_type_id(2)
                .cod_amount(0)
                .insurance_value(0)
                .client_order_code(order.getOrderNumber() + "-RET")
                .items(ghnItems)
                .build();
        try {
            GHNCreateOrderResponse res = ghnClient.createOrder(req);
            return res != null ? res.getOrderCode() : null;
        } catch (Exception e) {
            log.warn("GHN create return order failed for order {}: {}", order.getOrderNumber(), e.getMessage());
            return null;
        }
    }

    public BigDecimal quoteFee(Shop shop, List<CartItem> cartItems, Integer toDistrictId, String toWardCode) {
        if (toDistrictId == null || toWardCode == null || toWardCode.isBlank()) {
            throw new CustomException("Missing information about the district and wardCode");
        }

        Integer fromDistrictId = shop.getDistrictId();
        String fromWardCode = shop.getWardCode();
        if (fromDistrictId == null || fromWardCode == null || fromWardCode.isBlank()) {
            fromDistrictId = 1442; // fallback
            fromWardCode = "21012";
            log.warn("Shop {} missing district/ward, using default", shop.getName());
        }

        int totalWeight = cartItems.stream()
                .mapToInt(i -> {
                    Integer w = i.getProduct().getWeight();
                    int weight = (w != null ? w : 500);
                    return weight * i.getQuantity();
                })
                .sum();

        GHNCalculateFeeRequest feeReq = GHNCalculateFeeRequest.builder()
                .from_district_id(fromDistrictId)
                .from_ward_code(fromWardCode)
                .to_district_id(toDistrictId)
                .to_ward_code(toWardCode)
                .weight(totalWeight)
                .service_type_id(2)
                .build();

        try {
            GHNCalculateFeeResponse feeRes = ghnClient.calculateFee(feeReq);
            return BigDecimal.valueOf(feeRes.getTotal());
        } catch (Exception e) {
            log.error("GHN calculate fee failed", e);
            throw new CustomException("Can not calculate fee for district " + fromDistrictId);
        }
    }
}
