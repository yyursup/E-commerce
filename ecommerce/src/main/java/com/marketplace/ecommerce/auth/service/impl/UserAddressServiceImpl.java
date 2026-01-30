package com.marketplace.ecommerce.auth.service.impl;

import com.marketplace.ecommerce.auth.dto.request.UpsertAddressRequest;
import com.marketplace.ecommerce.auth.dto.response.UserAddressResponse;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.entity.UserAddress;
import com.marketplace.ecommerce.auth.repository.UserAddressRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.service.UserAddressService;
import com.marketplace.ecommerce.common.exception.CustomException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserAddressServiceImpl implements UserAddressService {
    private final UserAddressRepository userAddressRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserAddressResponse createMyAddress(UUID accountId, UpsertAddressRequest req) {

        User u = requireUser(accountId);
        boolean hasAny = userAddressRepository.existsByUserIdAndDeletedFalse(u.getId());
        boolean setDefault = Boolean.TRUE.equals(req.getIsDefault()) || !hasAny;

        UserAddress a = new UserAddress();
        a.setUser(u);
        a.setCreatedAt(Instant.now());
        apply(req, a);

        a = userAddressRepository.save(a);
        if (setDefault) {
            userAddressRepository.unsetDefaultExcept(u.getId(), a.getId());
        }
        return UserAddressResponse.from(a);
    }

    @Override
    @Transactional
    public UserAddressResponse updateMyAddress(UUID accountId, UUID addressId, UpsertAddressRequest req) {
        User u = requireUser(accountId);
        UserAddress a = userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, u.getId())
                .orElseThrow(() -> new CustomException("Address not found"));
        apply(req, a);
        if (Boolean.TRUE.equals(req.getIsDefault())) {
            userAddressRepository.unsetDefaultExcept(u.getId(), a.getId());
            a.setIsDefault(true);
        }

        a = userAddressRepository.save(a);
        return UserAddressResponse.from(a);
    }

    @Override
    @Transactional
    public void deleteMyAddress(UUID accountId, UUID addressId) {
        User u = requireUser(accountId);

        UserAddress a = userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, u.getId())
                .orElseThrow(() -> new CustomException("Address not found"));

        boolean wasDefault = Boolean.TRUE.equals(a.getIsDefault());

        a.setDeleted(true);
        a.setIsDefault(false);
        userAddressRepository.save(a);

        if (wasDefault) {
            var remaining = userAddressRepository.findAllByUserIdAndDeletedFalseOrderByIsDefaultDescIdDesc(u.getId());
            if (!remaining.isEmpty()) {
                UserAddress promote = remaining.get(0);
                userAddressRepository.unsetDefaultExcept(u.getId(), promote.getId());
                promote.setIsDefault(true);
                userAddressRepository.save(promote);
            }
        }
    }

    @Override
    @Transactional
    public UserAddressResponse setDefault(UUID accountId, UUID addressId) {
        User u = requireUser(accountId);

        UserAddress a = userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, u.getId())
                .orElseThrow(() -> new CustomException("Address not found"));

        userAddressRepository.unsetDefaultExcept(u.getId(), a.getId());
        a.setIsDefault(true);

        a = userAddressRepository.save(a);
        return UserAddressResponse.from(a);
    }

    private User requireUser(UUID accountId) {
        return userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found for accountId=" + accountId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserAddressResponse> listMyAddresses(UUID accountId) {
        User u = requireUser(accountId);
        return userAddressRepository.findAllByUserIdAndDeletedFalseOrderByIsDefaultDescIdDesc(u.getId())
                .stream().map(UserAddressResponse::from).toList();
    }

    private void apply(UpsertAddressRequest req, UserAddress a) {
        a.setReceiverName(req.getReceiverName());
        a.setReceiverPhone(req.getReceiverPhone());
        a.setAddressLine(req.getAddressLine());
        a.setCity(req.getCity());
        a.setDistrict(req.getDistrict());
        a.setWard(req.getWard());
        a.setDistrictId(req.getDistrictId());
        a.setWardCode(req.getWardCode());
    }
}
