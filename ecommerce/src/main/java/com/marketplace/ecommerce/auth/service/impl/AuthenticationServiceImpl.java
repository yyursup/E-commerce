package com.marketplace.ecommerce.auth.service.impl;

import com.marketplace.ecommerce.auth.dto.MailBody;
import com.marketplace.ecommerce.auth.dto.request.AccountCreateRequest;
import com.marketplace.ecommerce.auth.dto.request.LoginRequest;
import com.marketplace.ecommerce.auth.dto.request.VerifyRequest;
import com.marketplace.ecommerce.auth.dto.response.AccountCreateResponse;
import com.marketplace.ecommerce.auth.dto.response.LoginResponse;
import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.Role;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.RoleRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.service.AuthenticationService;
import com.marketplace.ecommerce.auth.service.EmailService;
import com.marketplace.ecommerce.auth.service.TokenService;
import com.marketplace.ecommerce.auth.validate.Validation;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.common.exception.RoleNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationServiceImpl implements AuthenticationService {
    private final PasswordEncoder passwordEncoder;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final AuthenticationManager authenticationManager;
    private final Validation validation;
    private final EmailService emailService;
    private final RoleRepository roleRepository;

    @Override
    public AccountCreateResponse verifyAccount(VerifyRequest request) {
        boolean isOtpValid = emailService.verifyOtp(request.getEmail(), request.getOtp());
        if (!isOtpValid) {
            throw new CustomException("OTP is not valid, has expired, or does not match.");
        }

        Optional<Account> accountOptional = accountRepository.findByEmail(request.getEmail());

        if (accountOptional.isEmpty()) {
            emailService.clearOtp(request.getEmail());
            throw new CustomException("Email not found");
        }
        Account account = accountOptional.get();
        if (account.getStatus() == AccountStatus.ACTIVE) {
            emailService.clearOtp(request.getEmail());
        }
        account.setStatus(AccountStatus.ACTIVE);
        emailService.clearOtp(request.getEmail());
        Account savedAccount = accountRepository.save(account);

        User user = User.builder()
                .email(savedAccount.getEmail())
                .phoneNumber(savedAccount.getPhoneNumber())
                .account(savedAccount)
                .build();
        userRepository.save(user);

        return AccountCreateResponse.from(savedAccount);
    }


    @Override
    @Transactional
    public AccountCreateResponse register(AccountCreateRequest request) {

        long startTime = System.currentTimeMillis();
        log.info("Starting registration for user: {}", request.getUsername());

        String otp = emailService.generateOTP();
        validation.validate(request);

        long validationEndTime = System.currentTimeMillis();
        log.info("Validation completed in {}ms", validationEndTime - startTime);

        long passwordEncodeTime = System.currentTimeMillis();
        log.info("Password encoding completed in {}ms", passwordEncodeTime - validationEndTime);

        Account account = createUserAccount(request);
        Account savedAccount = accountRepository.save(account);
        createMailBody(savedAccount, otp);

        long totalTime = System.currentTimeMillis() - startTime;
        log.info("Registration completed for user: {} in {}ms (excluding async email)",
                request.getUsername(), totalTime);

        return AccountCreateResponse.from(savedAccount);
    }

    public Account createUserAccount(AccountCreateRequest request) {
        Role defaultRole = roleRepository.findByRoleName("CUSTOMER")
                .orElseThrow(() -> new RoleNotFoundException("Role not found"));

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        return Account.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(encodedPassword)
                .status(AccountStatus.INACTIVE)
                .role(defaultRole)
                .phoneNumber(request.getPhoneNumber())
                .isActive(false).build();
    }

    public void createMailBody(Account account, String otp) {
        MailBody mailBody = new MailBody();
        mailBody.setTo(account);
        mailBody.setSubject("WELCOME TO MOVIE THEATER WEBSITE");
        mailBody.setOtp(otp);
        emailService.sendOtpForVerifyAccount(mailBody, otp);
    }


    @Override
    public LoginResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            Account users = (Account) authentication.getPrincipal();

            return LoginResponse.builder()
                    .email(users.getEmail())
                    .token(tokenService.createToken(users))
                    .role(users.getRole().getRoleName())
                    .build();

        } catch (
                BadCredentialsException e) {
            throw new BadCredentialsException("Invalid username or password.");
        }
    }

    @Override
    public List<LoginResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> LoginResponse.builder()
                        .email(user.getEmail())
                        .role(user.getAccount().getRole().getRoleName())
                        .build())
                .toList();
    }


}
