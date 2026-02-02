package com.marketplace.ecommerce.cart.repository;

import com.marketplace.ecommerce.cart.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, UUID> {

    @Query("""
                select ci from CartItem ci
                join ci.cart c
                join c.user u
                where u.id = :userId and ci.id = :itemId  and ci.deleted = false
            """)
    Optional<CartItem> findActiveByIdAndUserId(@Param("userId") UUID userId, @Param("itemId") UUID itemId);

}
