package com.marketplace.ecommerce.product.repository;

import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    boolean existsBySkuAndDeletedFalse(String sku);

    Optional<Product> findByIdAndDeletedFalse(UUID id);

    @Modifying
    @Query("""
                update Product p
                set p.deleted = true
                where p.id = :productId
                  and p.deleted = false
                  and p.shop.id in (
                      select s.id
                      from Shop s
                      where s.user.account.id = :accountId
                  )
            """)
    int softDeleteByAccountId(UUID productId, UUID accountId);

    @Query("""
                select p
                from Product p
                join fetch p.shop s
                join fetch p.productCategory c
                left join fetch p.images i
                where p.id = :id
                  and p.status = 'PUBLISHED'
                  and s.status = 'ACTIVE'
                  and s.user.account.isActive = true
                  and p.deleted = false
            """)
    Optional<Product> findPublishedByIdWithDetails(@Param("id") UUID id);

    @Query("""
                select p
                from Product p
                where p.status = 'PUBLISHED'
                  and p.shop.status = 'ACTIVE'
                  and p.shop.user.account.isActive = true
                  and p.deleted = false
                  and (:categoryId is null or p.productCategory.id = :categoryId)
                  and (:shopId is null or p.shop.id = :shopId)
                  and (:minPrice is null or p.basePrice >= :minPrice)
                  and (:maxPrice is null or p.basePrice <= :maxPrice)
                  and (
                       :search is null
                    or p.name ilike concat('%', cast(:search as string), '%')
                    or p.description ilike concat('%', cast(:search as string), '%')
                    or p.sku ilike concat('%', cast(:search as string), '%')
                  )
            """)
    Page<Product> findPublishedProductsWithFilters(
            @Param("categoryId") UUID categoryId,
            @Param("shopId") UUID shopId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("""
                select p
                from Product p
                join fetch p.shop s
                join fetch p.productCategory c
                left join fetch p.images i
                where p.id = :id
                  and p.deleted = false
            """)
    Optional<Product> findByIdWithDetails(@Param("id") UUID id);

    @Query("""
                select distinct p
                from Product p
                join fetch p.shop s
                join fetch p.productCategory c
                left join fetch p.images i
                where s.id = :shopId
                  and p.deleted = false
            """)
    List<Product> findAllByShopIdWithDetails(@Param("shopId") UUID shopId);

    @Query("""
                select distinct p
                from Product p
                join fetch p.shop s
                join fetch p.productCategory c
                left join fetch p.images i
                where s.id = :shopId
                  and p.status = :status
                  and p.deleted = false
            """)
    List<Product> findAllByShopIdAndStatusWithDetails(
            @Param("shopId") UUID shopId,
            @Param("status") ProductStatus status
    );
}
