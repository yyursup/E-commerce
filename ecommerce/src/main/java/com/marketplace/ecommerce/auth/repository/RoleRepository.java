package com.marketplace.ecommerce.auth.repository;

import com.marketplace.ecommerce.auth.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {
    Optional<Role> findByRoleName(String roleName);

    Boolean existsByRoleName(String roleName);
}
