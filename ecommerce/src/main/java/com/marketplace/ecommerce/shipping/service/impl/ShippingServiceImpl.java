package com.marketplace.ecommerce.shipping.service.impl;

import com.marketplace.ecommerce.cart.entity.CartItem;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.shipping.dto.request.GHNCalculateFeeRequest;
import com.marketplace.ecommerce.shipping.dto.request.GHNCreateOrderRequest;
import com.marketplace.ecommerce.shipping.dto.response.GHNCalculateFeeResponse;
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
                    ? orderItem.getProduct().getWeight() : 500;
            int itemWeight = productWeight * orderItem.getQuantity();
            String productName = orderItem.getProductName() != null && !orderItem.getProductName().isBlank()
                    ? orderItem.getProductName() : "Sản phẩm";
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

        return GHNCreateOrderRequest.builder()
                .payment_type_id(1)
                .note(order.getNotes() != null ? order.getNotes() : "")
                .required_note("CHOTHUHANG")
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
                .insurance_value(order.getSubtotal().intValue())
                .client_order_code(order.getOrderNumber())
                .items(ghnItems)
                .build();
    }

    public BigDecimal quoteFee(Shop shop, List<CartItem> cartItems, Integer toDistrictId, String toWardCode) {
        if (toDistrictId == null || toWardCode == null || toWardCode.isBlank()) {
            throw new CustomException("Missing information about the district and wardCode");
        }

        Integer fromDistrictId = shop.getDistrictId();
        String fromWardCode = shop.getWardCode();
        if (fromDistrictId == null || fromWardCode == null || fromWardCode.isBlank()) {
            fromDistrictId = 1442;    // fallback
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
