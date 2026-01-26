package com.marketplace.ecommerce.shipping.usecase;

import com.marketplace.ecommerce.shipping.dto.request.GHNCalculateFeeRequest;
import com.marketplace.ecommerce.shipping.dto.request.GHNCreateOrderRequest;
import com.marketplace.ecommerce.shipping.dto.response.*;

import java.util.List;

public interface GHNClient {
    GHNCalculateFeeResponse calculateFee(GHNCalculateFeeRequest request);

    GHNCreateOrderResponse createOrder(GHNCreateOrderRequest request);

    GHNOrderDetailResponse getOrderDetailByClientCode(String clientOrderCode);

    GHNCancelOrderResponse cancelOrder(String orderCode);

    List<GHNProvinceResponse> getProvinces();

    List<GHNDistrictResponse> getDistricts(Integer provinceId);

    List<GHNWardResponse> getWards(Integer districtId);
}
