package com.marketplace.ecommerce.auth.service.impl;

import com.marketplace.ecommerce.auth.dto.request.UpdateUserProfileRequest;
import com.marketplace.ecommerce.auth.dto.response.UserProfileResponse;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.service.UserService;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.file.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final FileService fileService;

    @Override
    @Transactional
    public UserProfileResponse updateProfile(
            UUID accountId,
            UpdateUserProfileRequest request

    ) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()) {
            user.setPhoneNumber(request.getPhoneNumber().trim());
        }

        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }

        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }

        if (request.getAvatarFile() != null && !request.getAvatarFile().isEmpty()) {
            String fileName = fileService.uploadFile(request.getAvatarFile(), "avatars");
            String avatarUrl = fileService.getFileUrl(fileName);
            user.setAvatarUrl(avatarUrl);
        }

        user = userRepository.save(user);
        return UserProfileResponse.from(user);
    }
}
