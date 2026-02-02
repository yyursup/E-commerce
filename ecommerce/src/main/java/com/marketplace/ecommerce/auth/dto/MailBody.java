package com.marketplace.ecommerce.auth.dto;
import com.marketplace.ecommerce.auth.entity.Account;
import jakarta.persistence.Column;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Email
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MailBody {
    Account to;

    String subject;

    @Column(nullable = false)
    Date expirationTime;

    String otp;
}

