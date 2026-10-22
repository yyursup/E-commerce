package com.marketplace.ecommerce.auth.dto.response;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.auth.valueObjects.GenderType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private UUID shopId;

    // Chỉ số Điểm Uy Tín & Kỷ luật người mua hàng (Trust & Safety)
    private Integer violationCount;
    private Integer reputationScore;
    private DisciplineLevel disciplineLevel;
    private LocalDateTime lastViolationAt;
    private LocalDateTime bannedUntil;

    public static UserProfileResponse from(User user) {
        Account account = user.getAccount();
        int vCount = account != null ? account.getViolationCount() : 0;
        int repScore = Math.max(0, 100 - vCount * 15);
        DisciplineLevel discLevel = (account != null && account.getDisciplineLevel() != null)
                ? account.getDisciplineLevel()
                : DisciplineLevel.NONE;

        return UserProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .phoneNumber(user.getPhoneNumber())
                .gender(user.getGender())
                .dateOfBirth(user.getDateOfBirth())
                .accountVerified(account != null && Boolean.TRUE.equals(account.getAccountVerified()))
                .role(account != null && account.getRole() != null ? account.getRole().getRoleName() : null)
                .email(user.getEmail())
                .violationCount(vCount)
                .reputationScore(repScore)
                .disciplineLevel(discLevel)
                .lastViolationAt(account != null ? account.getLastViolationAt() : null)
                .bannedUntil(account != null ? account.getBannedUntil() : null)
                .build();
    }
}

