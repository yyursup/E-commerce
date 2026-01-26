package com.marketplace.ecommerce.shipping.usecase.impl;

import com.marketplace.ecommerce.config.GHNConfig;
import com.marketplace.ecommerce.shipping.dto.request.*;
import com.marketplace.ecommerce.shipping.dto.response.*;
import com.marketplace.ecommerce.shipping.usecase.GHNClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GHNClientImpl implements GHNClient {

    private final RestClient ghnRestClient;
    private final GHNConfig cfg;

    @Override
    public GHNCalculateFeeResponse calculateFee(GHNCalculateFeeRequest request) {
        requireTokenAndShop();

        GHNCommonResponse<GHNCalculateFeeResponse> res = ghnRestClient.post()
                .uri("/shiip/public-api/v2/shipping-order/fee")
                .header("ShopId", String.valueOf(cfg.getShopId()))
                .body(request)
                .retrieve()
                .body(new ParameterizedTypeReference<GHNCommonResponse<GHNCalculateFeeResponse>>() {
                });

        return unwrap(res, "calculateFee");
    }

    @Override
    public GHNCreateOrderResponse createOrder(GHNCreateOrderRequest request) {
        requireTokenAndShop();

        GHNCommonResponse<GHNCreateOrderResponse> res = ghnRestClient.post()
                .uri("/shiip/public-api/v2/shipping-order/create")
                .header("ShopId", String.valueOf(cfg.getShopId()))
                .body(request)
                .retrieve()
                .body(new ParameterizedTypeReference<GHNCommonResponse<GHNCreateOrderResponse>>() {
                });

        return unwrap(res, "createOrder");
    }

    @Override
    public GHNOrderDetailResponse getOrderDetailByClientCode(String clientOrderCode) {
        requireTokenAndShop();

        GHNGetOrderDetailRequest req = GHNGetOrderDetailRequest.builder()
                .client_order_code(clientOrderCode)
                .build();

        GHNCommonResponse<GHNOrderDetailResponse> res = ghnRestClient.post()
                .uri("/shiip/public-api/v2/shipping-order/detail-by-client-code")
                .header("ShopId", String.valueOf(cfg.getShopId()))
                .body(req)
                .retrieve()
                .body(new ParameterizedTypeReference<GHNCommonResponse<GHNOrderDetailResponse>>() {
                });

        return unwrap(res, "getOrderDetailByClientCode");
    }

    @Override
    public GHNCancelOrderResponse cancelOrder(String orderCode) {
        requireTokenAndShop();

        GHNCancelOrderRequest req = GHNCancelOrderRequest.builder()
                .order_codes(List.of(orderCode))
                .build();

        GHNCommonResponse<GHNCancelOrderResponse> res = ghnRestClient.post()
                .uri("/shiip/public-api/v2/shipping-order/cancel")
                .header("ShopId", String.valueOf(cfg.getShopId()))
                .body(req)
                .retrieve()
                .body(new ParameterizedTypeReference<GHNCommonResponse<GHNCancelOrderResponse>>() {
                });

        return unwrap(res, "cancelOrder");
    }

    @Override
    public List<GHNProvinceResponse> getProvinces() {
        requireTokenOnly();

        GHNCommonResponse<List<GHNProvinceResponse>> res = ghnRestClient.get()
                .uri("/shiip/public-api/master-data/province")
                .retrieve()
                .body(new ParameterizedTypeReference<GHNCommonResponse<List<GHNProvinceResponse>>>() {
                });

        return unwrap(res, "getProvinces");
    }

    @Override
    public List<GHNDistrictResponse> getDistricts(Integer provinceId) {
        requireTokenOnly();

        GHNGetDistrictsRequest req = GHNGetDistrictsRequest.builder()
                .province_id(provinceId)
                .build();

        GHNCommonResponse<List<GHNDistrictResponse>> res = ghnRestClient.post()
                .uri("/shiip/public-api/master-data/district")
                .body(req)
                .retrieve()
                .body(new ParameterizedTypeReference<GHNCommonResponse<List<GHNDistrictResponse>>>() {
                });

        return unwrap(res, "getDistricts");
    }

    @Override
    public List<GHNWardResponse> getWards(Integer districtId) {
        requireTokenOnly();

        GHNGetWardsRequest req = GHNGetWardsRequest.builder()
                .district_id(districtId)
                .build();

        GHNCommonResponse<List<GHNWardResponse>> res = ghnRestClient.post()
                .uri("/shiip/public-api/master-data/ward")
                .body(req)
                .retrieve()
                .body(new ParameterizedTypeReference<GHNCommonResponse<List<GHNWardResponse>>>() {
                });

        return unwrap(res, "getWards");
    }

    // ===== helpers =====

    private void requireTokenOnly() {
        if (cfg.getToken() == null || cfg.getToken().isBlank()) {
            throw new RuntimeException("GHN Token chưa được cấu hình (GHN_TOKEN).");
        }
    }

    private void requireTokenAndShop() {
        requireTokenOnly();
        if (cfg.getShopId() == null) {
            throw new RuntimeException("GHN Shop ID chưa được cấu hình (GHN_SHOP_ID).");
        }
    }

    private <T> T unwrap(GHNCommonResponse<T> res, String op) {
        if (res == null) throw new RuntimeException("GHN " + op + " returned null");
        if (res.getCode() == 200) return res.getData();

        String msg = res.getMessage() != null ? res.getMessage() : "Unknown error";
        log.error("GHN {} failed: code={} message={}", op, res.getCode(), msg);
        throw new RuntimeException("GHN lỗi: " + msg);
    }
}
