package com.marketplace.ecommerce.auth.service.impl;

import com.marketplace.ecommerce.auth.dto.request.UpsertAddressRequest;
import com.marketplace.ecommerce.auth.dto.response.UserAddressResponse;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.entity.UserAddress;
import com.marketplace.ecommerce.auth.repository.UserAddressRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserAddressServiceImplTest {

    @Mock
    private UserAddressRepository userAddressRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserAddressServiceImpl userAddressService;

    private UUID accountId;
    private User user;
    private UserAddress address;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        user = new User();
        user.setId(UUID.randomUUID());
        
        address = new UserAddress();
        address.setId(UUID.randomUUID());
        address.setUser(user);
        address.setIsDefault(false);
    }

    @Test
    void createMyAddress_Success() {
        UpsertAddressRequest req = new UpsertAddressRequest();
        req.setReceiverName("John");
        req.setIsDefault(true);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(userAddressRepository.existsByUserIdAndDeletedFalse(user.getId())).thenReturn(false);
        when(userAddressRepository.save(any(UserAddress.class))).thenAnswer(i -> i.getArguments()[0]);

        UserAddressResponse response = userAddressService.createMyAddress(accountId, req);

        assertNotNull(response);
        verify(userAddressRepository).unsetDefaultExcept(eq(user.getId()), any());
    }

    @Test
    void updateMyAddress_Success() {
        UUID addressId = address.getId();
        UpsertAddressRequest req = new UpsertAddressRequest();
        req.setIsDefault(true);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, user.getId())).thenReturn(Optional.of(address));
        when(userAddressRepository.save(any(UserAddress.class))).thenReturn(address);

        UserAddressResponse response = userAddressService.updateMyAddress(accountId, addressId, req);

        assertNotNull(response);
        assertTrue(address.getIsDefault());
    }

    @Test
    void deleteMyAddress_Success() {
        UUID addressId = address.getId();
        address.setIsDefault(true);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, user.getId())).thenReturn(Optional.of(address));
        when(userAddressRepository.findAllByUserIdAndDeletedFalseOrderByIsDefaultDescIdDesc(user.getId()))
                .thenReturn(Collections.emptyList());

        userAddressService.deleteMyAddress(accountId, addressId);

        assertTrue(address.getDeleted());
        assertFalse(address.getIsDefault());
        verify(userAddressRepository).save(address);
    }

    @Test
    void setDefault_Success() {
        UUID addressId = address.getId();

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(user));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, user.getId())).thenReturn(Optional.of(address));
        when(userAddressRepository.save(any(UserAddress.class))).thenReturn(address);

        UserAddressResponse response = userAddressService.setDefault(accountId, addressId);

        assertTrue(address.getIsDefault());
        verify(userAddressRepository).unsetDefaultExcept(user.getId(), addressId);
    }
}
