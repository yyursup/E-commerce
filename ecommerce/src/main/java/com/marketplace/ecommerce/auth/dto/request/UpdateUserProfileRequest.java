package com.marketplace.ecommerce.auth.dto.request;

import com.marketplace.ecommerce.auth.valueObjects.GenderType;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Data
public class UpdateUserProfileRequest {
    @Size(max = 100, message = "fullName max 100 chars")
    private String fullName;

    @Pattern(regexp = "^(\\+84|0)(3|5|7|8|9)\\d{8}$", message = "phoneNumber invalid")
    private String phoneNumber;

    private GenderType gender;

    @Past(message = "dateOfBirth must be in the past")
    private LocalDate dateOfBirth;

    private MultipartFile avatarFile;
}
