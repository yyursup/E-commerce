package com.marketplace.ecommerce.auth.service;

import com.marketplace.ecommerce.auth.dto.request.UpdateUserProfileRequest;
import com.marketplace.ecommerce.auth.dto.response.UserProfileResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface UserService {

    UserProfileResponse getUserProfile(UUID accountId);

    UserProfileResponse updateProfile(
            UUID accountId,
            UpdateUserProfileRequest request);
}
