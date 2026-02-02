package com.marketplace.ecommerce.auth.validate;

import com.marketplace.ecommerce.auth.dto.request.AccountCreateRequest;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.common.exception.EmailAlreadyExistsException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuthValidation {
    private final AccountRepository accountRepository;
    public void validate(AccountCreateRequest request){
        long startTime = System.currentTimeMillis();

        String validationResult = accountRepository.validateAccountUniqueness(
                request.getUsername(),
                request.getEmail(),
                request.getPhoneNumber()
        );

        long validationTime = System.currentTimeMillis() - startTime;
        log.info("Validation completed in {}ms, result: {}", validationTime, validationResult);

        switch (validationResult) {
            case "USERNAME_EXISTS":
                throw new CustomException("Username is already taken");
            case "EMAIL_EXISTS":
                throw new EmailAlreadyExistsException("Email is already taken");
            case "PHONE_EXISTS":
                throw new CustomException("Phone number is already taken");
            case "VALID":
                break;
            default:
                log.warn("Unexpected validation result: {}", validationResult);
        }
    }
}
