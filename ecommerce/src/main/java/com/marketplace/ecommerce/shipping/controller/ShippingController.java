package com.marketplace.ecommerce.shipping.controller;

import com.marketplace.ecommerce.shipping.dto.request.GHNCalculateFeeRequest;
import com.marketplace.ecommerce.shipping.dto.response.GHNCalculateFeeResponse;
import com.marketplace.ecommerce.shipping.dto.response.GHNProvinceResponse;
import com.marketplace.ecommerce.shipping.usecase.GHNClient;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(version = "1", path = "/shipping")
@RequiredArgsConstructor
public class ShippingController {
    private final GHNClient ghnClient;

    @GetMapping("/provinces")
    public List<GHNProvinceResponse> provinces() {
        return ghnClient.getProvinces();
    }

    @PostMapping("/fee")
    public GHNCalculateFeeResponse fee(@RequestBody GHNCalculateFeeRequest req) {
        return ghnClient.calculateFee(req);
    }
}
