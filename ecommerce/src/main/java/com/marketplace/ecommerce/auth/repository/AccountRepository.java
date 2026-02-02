package com.marketplace.ecommerce.auth.repository;

import com.marketplace.ecommerce.auth.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

    Optional<Account> findByUsername(String username);

    Optional<Account> findByEmail(String email);

    @Query("SELECT CASE " +
            "WHEN COUNT(CASE WHEN a.username = :username THEN 1 END) > 0 THEN 'USERNAME_EXISTS' " +
            "WHEN COUNT(CASE WHEN a.email = :email THEN 1 END) > 0 THEN 'EMAIL_EXISTS' " +
            "WHEN COUNT(CASE WHEN a.phoneNumber = :phoneNumber THEN 1 END) > 0 THEN 'PHONE_EXISTS' " +
            "ELSE 'VALID' END " +
            "FROM Account a WHERE a.username = :username OR a.email = :email OR a.phoneNumber = :phoneNumber")
    String validateAccountUniqueness(@Param("username") String username,
                                     @Param("email") String email,
                                     @Param("phoneNumber") String phoneNumber);
}
