package com.marketplace.ecommerce.common;


import lombok.Data;

import java.util.UUID;

@Data
public class CurrentUserInfo {
    private UUID accountId;
    private String username;
    private String role;

}
