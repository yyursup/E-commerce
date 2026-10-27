package com.marketplace.ecommerce.auth.service.impl;

import com.marketplace.ecommerce.auth.dto.request.UpsertAddressRequest;
import com.marketplace.ecommerce.auth.dto.response.UserAddressResponse;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.entity.UserAddress;
import com.marketplace.ecommerce.auth.repository.UserAddressRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
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
    private UUID addressId;
    private User sampleUser;
    private UpsertAddressRequest request;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        addressId = UUID.randomUUID();

        sampleUser = new User();
        sampleUser.setId(UUID.randomUUID());

        request = new UpsertAddressRequest();
        request.setReceiverName("Nguyen Van A");
        request.setReceiverPhone("0987654321");
        request.setAddressLine("123 Duong ABC");
        request.setCity("Ha Noi");
        request.setDistrict("Cau Giay");
        request.setWard("Dich Vong");
        request.setDistrictId(1442);
        request.setWardCode("20101");
        request.setIsDefault(true);
    }

    @Test
    @DisplayName("createMyAddress thành công với địa chỉ đầu tiên (tự set default)")
    void testCreateMyAddress_FirstAddress() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(userAddressRepository.existsByUserIdAndDeletedFalse(sampleUser.getId())).thenReturn(false);
        when(userAddressRepository.save(any(UserAddress.class))).thenAnswer(inv -> {
            UserAddress a = inv.getArgument(0);
            a.setId(addressId);
            return a;
        });

        UserAddressResponse res = userAddressService.createMyAddress(accountId, request);
        assertNotNull(res);
        assertEquals("Nguyen Van A", res.getReceiverName());
        verify(userAddressRepository).unsetDefaultExcept(sampleUser.getId(), addressId);
    }

    @Test
    @DisplayName("updateMyAddress thành công và cập nhật default")
    void testUpdateMyAddress_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        UserAddress existing = new UserAddress();
        existing.setId(addressId);
        existing.setUser(sampleUser);
        existing.setIsDefault(false);

        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, sampleUser.getId()))
                .thenReturn(Optional.of(existing));
        when(userAddressRepository.save(any(UserAddress.class))).thenAnswer(inv -> inv.getArgument(0));

        UserAddressResponse res = userAddressService.updateMyAddress(accountId, addressId, request);
        assertNotNull(res);
        assertTrue(res.getIsDefault());
        verify(userAddressRepository).unsetDefaultExcept(sampleUser.getId(), addressId);
    }

    @Test
    @DisplayName("deleteMyAddress xóa mềm và tự đôn địa chỉ còn lại lên làm default nếu địa chỉ bị xóa là default")
    void testDeleteMyAddress_PromoteNextDefault() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        UserAddress existing = new UserAddress();
        existing.setId(addressId);
        existing.setUser(sampleUser);
        existing.setIsDefault(true);

        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, sampleUser.getId()))
                .thenReturn(Optional.of(existing));

        UserAddress remaining = new UserAddress();
        remaining.setId(UUID.randomUUID());
        remaining.setIsDefault(false);
        when(userAddressRepository.findAllByUserIdAndDeletedFalseOrderByIsDefaultDescIdDesc(sampleUser.getId()))
                .thenReturn(List.of(remaining));

        userAddressService.deleteMyAddress(accountId, addressId);

        assertTrue(existing.getDeleted());
        assertFalse(existing.getIsDefault());
        assertTrue(remaining.getIsDefault());
        verify(userAddressRepository).save(existing);
        verify(userAddressRepository).save(remaining);
    }

    @Test
    @DisplayName("setDefault gán địa chỉ mặc định thành công")
    void testSetDefault_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        UserAddress existing = new UserAddress();
        existing.setId(addressId);
        existing.setIsDefault(false);

        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, sampleUser.getId()))
                .thenReturn(Optional.of(existing));
        when(userAddressRepository.save(any(UserAddress.class))).thenAnswer(inv -> inv.getArgument(0));

        UserAddressResponse res = userAddressService.setDefault(accountId, addressId);
        assertTrue(res.getIsDefault());
        verify(userAddressRepository).unsetDefaultExcept(sampleUser.getId(), addressId);
    }

    @Test
    @DisplayName("listMyAddresses trả về danh sách địa chỉ")
    void testListMyAddresses() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        UserAddress a1 = new UserAddress();
        a1.setId(UUID.randomUUID());
        a1.setReceiverName("User 1");
        when(userAddressRepository.findAllByUserIdAndDeletedFalseOrderByIsDefaultDescIdDesc(sampleUser.getId()))
                .thenReturn(List.of(a1));

        List<UserAddressResponse> list = userAddressService.listMyAddresses(accountId);
        assertEquals(1, list.size());
        assertEquals("User 1", list.get(0).getReceiverName());
    }

    @Test
    @DisplayName("Ném ngoại lệ khi không tìm thấy user")
    void testRequireUser_NotFound() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> userAddressService.listMyAddresses(accountId));
    }

    @Test
    @DisplayName("createMyAddress: Đã có địa chỉ và req.isDefault = false thì không set default")
    void testCreateMyAddress_NotDefault() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(userAddressRepository.existsByUserIdAndDeletedFalse(sampleUser.getId())).thenReturn(true);
        when(userAddressRepository.save(any(UserAddress.class))).thenAnswer(inv -> {
            UserAddress a = inv.getArgument(0);
            a.setId(addressId);
            return a;
        });

        request.setIsDefault(false);
        UserAddressResponse res = userAddressService.createMyAddress(accountId, request);

        assertNotNull(res);
        verify(userAddressRepository, never()).unsetDefaultExcept(any(), any());
    }

    @Test
    @DisplayName("updateMyAddress ném lỗi khi không tìm thấy địa chỉ")
    void testUpdateMyAddress_NotFound() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, sampleUser.getId()))
                .thenReturn(Optional.empty());

        assertThrows(CustomException.class, () -> userAddressService.updateMyAddress(accountId, addressId, request));
    }

    @Test
    @DisplayName("updateMyAddress: req.isDefault = false thì không set default")
    void testUpdateMyAddress_NotDefault() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        UserAddress existing = new UserAddress();
        existing.setId(addressId);
        existing.setUser(sampleUser);
        existing.setIsDefault(false);

        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, sampleUser.getId()))
                .thenReturn(Optional.of(existing));
        when(userAddressRepository.save(any(UserAddress.class))).thenAnswer(inv -> inv.getArgument(0));

        request.setIsDefault(false);
        UserAddressResponse res = userAddressService.updateMyAddress(accountId, addressId, request);

        assertNotNull(res);
        assertFalse(existing.getIsDefault());
        verify(userAddressRepository, never()).unsetDefaultExcept(any(), any());
    }

    @Test
    @DisplayName("deleteMyAddress ném lỗi khi không tìm thấy địa chỉ")
    void testDeleteMyAddress_NotFound() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, sampleUser.getId()))
                .thenReturn(Optional.empty());

        assertThrows(CustomException.class, () -> userAddressService.deleteMyAddress(accountId, addressId));
    }

    @Test
    @DisplayName("deleteMyAddress: Địa chỉ bị xóa không phải default thì không thực hiện promote")
    void testDeleteMyAddress_NotDefault_NoPromote() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        UserAddress existing = new UserAddress();
        existing.setId(addressId);
        existing.setUser(sampleUser);
        existing.setIsDefault(false);

        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, sampleUser.getId()))
                .thenReturn(Optional.of(existing));

        userAddressService.deleteMyAddress(accountId, addressId);

        assertTrue(existing.getDeleted());
        assertFalse(existing.getIsDefault());
        verify(userAddressRepository).save(existing);
        verify(userAddressRepository, never()).findAllByUserIdAndDeletedFalseOrderByIsDefaultDescIdDesc(any());
    }

    @Test
    @DisplayName("deleteMyAddress: Địa chỉ xóa là default nhưng không còn địa chỉ nào khác (remaining rỗng)")
    void testDeleteMyAddress_Default_NoRemaining() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        UserAddress existing = new UserAddress();
        existing.setId(addressId);
        existing.setUser(sampleUser);
        existing.setIsDefault(true);

        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, sampleUser.getId()))
                .thenReturn(Optional.of(existing));
        when(userAddressRepository.findAllByUserIdAndDeletedFalseOrderByIsDefaultDescIdDesc(sampleUser.getId()))
                .thenReturn(List.of());

        userAddressService.deleteMyAddress(accountId, addressId);

        assertTrue(existing.getDeleted());
        assertFalse(existing.getIsDefault());
        verify(userAddressRepository).save(existing);
        verify(userAddressRepository, never()).unsetDefaultExcept(any(), any());
    }

    @Test
    @DisplayName("setDefault ném lỗi khi không tìm thấy địa chỉ")
    void testSetDefault_NotFound() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, sampleUser.getId()))
                .thenReturn(Optional.empty());

        assertThrows(CustomException.class, () -> userAddressService.setDefault(accountId, addressId));
    }
}
