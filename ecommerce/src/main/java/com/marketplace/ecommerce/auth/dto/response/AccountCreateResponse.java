package com.marketplace.ecommerce.auth.dto.response;

import com.marketplace.ecommerce.auth.entity.Account;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountCreateResponse {
  private UUID id;
  private String username;
  private String email;
  private String phoneNumber;

  public static AccountCreateResponse from(Account account) {
    return AccountCreateResponse.builder()
            .id(account.getId())
            .username(account.getUsername())
            .email(account.getEmail())
            .phoneNumber(account.getPhoneNumber())
            .build();
  }
}
