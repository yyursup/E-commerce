package com.marketplace.ecommerce.auth.service;

import com.marketplace.ecommerce.auth.dto.request.UpsertAddressRequest;
import com.marketplace.ecommerce.auth.dto.response.UserAddressResponse;

import java.util.List;
import java.util.UUID;

public interface UserAddressService {
    List<UserAddressResponse> listMyAddresses(UUID accountId);

    UserAddressResponse createMyAddress(UUID accountId, UpsertAddressRequest req);

    UserAddressResponse updateMyAddress(UUID accountId, UUID addressId, UpsertAddressRequest req);

    void deleteMyAddress(UUID accountId, UUID addressId);

    UserAddressResponse setDefault(UUID accountId, UUID addressId);
}
