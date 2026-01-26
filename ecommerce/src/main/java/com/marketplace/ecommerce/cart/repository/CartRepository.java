package com.marketplace.ecommerce.cart.repository;

import com.marketplace.ecommerce.cart.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartRepository extends JpaRepository<Cart, UUID> {

    Optional<Cart> findByUserId(UUID userId);

    @Query("""
                select distinct c
                from Cart c
                left join fetch c.items i
                left join fetch i.product p
                left join fetch p.images img
                where c.user.id = :userId
            """)
    Optional<Cart> findByUserIdWithItems(@Param("userId") UUID userId);
}
