package com.marketplace.ecommerce.auth.dto.response;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.valueObjects.GenderType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class UserProfileResponse {
    private UUID id;
    private String fullName;
    private String avatarUrl;
    private String phoneNumber;
    private GenderType gender;
    private LocalDate dateOfBirth;
    private boolean accountVerified;
    private String role;
    private String email;


    public static UserProfileResponse from(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .phoneNumber(user.getPhoneNumber())
                .gender(user.getGender())
                .dateOfBirth(user.getDateOfBirth())
                .accountVerified(user.getAccount().getAccountVerified())
                .role(user.getAccount().getRole().getRoleName())
                .email(user.getEmail())
                .build();
    }
}
