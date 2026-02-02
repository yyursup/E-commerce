package com.marketplace.ecommerce.auth.repository;

import com.marketplace.ecommerce.auth.entity.UserAddress;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserAddressRepository extends JpaRepository<UserAddress, UUID> {


    @Query("""
                select a from UserAddress a
                where a.user.id = :userId and a.deleted = false and a.isDefault = true
                order by a.updatedAt desc
            """)
    Optional<UserAddress> findDefault(@Param("userId") UUID userId);

    @Query("""
                select a from UserAddress a
                where a.user.id = :userId and a.deleted = false
                order by a.lastUsedAt desc nulls last, a.updatedAt desc
            """)
    List<UserAddress> findRecent(@Param("userId") UUID userId, PageRequest page);

    default Optional<UserAddress> findLastUsed(UUID userId) {
        var list = findRecent(userId, PageRequest.of(0, 1));
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Query("""
                select a
                from UserAddress a
                where a.id = :id
                  and a.user.id = :userId
                  and a.deleted = false
            """)
    Optional<UserAddress> findByIdAndUserIdAndDeletedFalse(
            @Param("id") UUID id,
            @Param("userId") UUID userId
    );

    List<UserAddress> findAllByUserIdAndDeletedFalseOrderByIsDefaultDescIdDesc(UUID userId);

    boolean existsByUserIdAndDeletedFalse(UUID userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
    update UserAddress a
    set a.isDefault = false
    where a.user.id = :userId
      and a.deleted = false
      and a.id <> :addressId
      and a.isDefault = true
""")
    int unsetDefaultExcept(UUID userId, UUID addressId);


}
