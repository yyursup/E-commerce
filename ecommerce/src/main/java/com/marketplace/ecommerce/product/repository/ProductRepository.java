package com.marketplace.ecommerce.product.repository;

import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.valueObjects.ConditionGrade;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.product.valueObjects.WarrantyType;
import com.marketplace.ecommerce.review.entity.Review;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") UUID id);

    long countByShopIdAndStatusAndDeletedFalse(UUID shopId, ProductStatus status);

    long countByShopIdAndDeletedFalse(UUID shopId);

    List<Product> findByStatusAndDeletedFalseOrderByCreatedAtDesc(ProductStatus status);


    @Modifying
    @Query("update Product p set p.status = :status where p.shop.id = :shopId")
    int updateStatusByShopId(@Param("shopId") UUID shopId, @Param("status") ProductStatus status);

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
                  and s.status in ('ACTIVE', 'WARNED')
                  and s.user.account.isActive = true
                  and p.deleted = false
            """)
    Optional<Product> findPublishedByIdWithDetails(@Param("id") UUID id);

    @Query("""
                select p
                from Product p
                join fetch p.shop s
                join fetch p.productCategory c
                where p.id <> :excludeId
                  and p.status = 'PUBLISHED'
                  and p.shop.status in ('ACTIVE', 'WARNED')
                  and p.shop.user.account.isActive = true
                  and p.deleted = false
                  and (:categoryId is null or p.productCategory.id = :categoryId)
            """)
    Page<Product> findPublishedByCategoryExcludingId(
            @Param("excludeId") UUID excludeId,
            @Param("categoryId") UUID categoryId,
            Pageable pageable);

    @Query("""
                select p
                from Product p
                where p.status = 'PUBLISHED'
                  and p.shop.status in ('ACTIVE', 'WARNED')
                  and p.shop.user.account.isActive = true
                  and p.deleted = false
                  and (:categoryId is null or p.productCategory.id = :categoryId)
                  and (:shopId is null or p.shop.id = :shopId)
                  and (:conditionGrade is null or p.conditionGrade = :conditionGrade)
                  and (:warrantyType is null or p.warrantyType = :warrantyType)
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
            @Param("conditionGrade") ConditionGrade conditionGrade,
            @Param("warrantyType") WarrantyType warrantyType,
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

    @Query("""
                select p
                from Product p
                join fetch p.shop s
                join fetch p.productCategory c
                left join fetch p.images i
                where s.id = :shopId
                  and p.featured = true
                  and p.status = 'PUBLISHED'
                  and p.deleted = false
            """)
    List<Product> findFeaturedByShopIdWithDetails(@Param("shopId") UUID shopId);

    @Query("""
                select distinct p
                from Product p
                join fetch p.shop s
                join fetch p.productCategory c
                left join fetch p.images i
                where s.id = :shopId
                  and (p.status = 'DELETED' or p.flagged = true or p.deleted = true)
            """)
    List<Product> findAllViolatedProductsByShopId(@Param("shopId") UUID shopId);

    long countByShopIdAndFeaturedTrueAndDeletedFalse(UUID shopId);

    @Query("""
        select p
        from Product p
        join fetch p.shop s
        join fetch p.productCategory c
        left join fetch p.images i
        where p.status = 'PUBLISHED'
          and p.shop.status in ('ACTIVE', 'WARNED')
          and p.shop.user.account.isActive = true
          and p.deleted = false
        order by p.featured desc, p.createdAt desc
    """)
    List<Product> findTopPublishedForRecommendation(Pageable pageable);

    @Query("""
        select p
        from Product p
        join fetch p.shop s
        join fetch p.productCategory c
        left join fetch p.images i
        where p.status = 'PUBLISHED'
          and p.shop.status in ('ACTIVE', 'WARNED')
          and p.shop.user.account.isActive = true
          and p.deleted = false
          and p.id <> :excludeId
          and (
               lower(c.name) like '%phụ kiện%'
            or lower(c.name) like '%sạc%'
            or lower(c.name) like '%cáp%'
            or lower(c.name) like '%tai nghe%'
            or lower(c.name) like '%chuột%'
            or lower(c.name) like '%bàn phím%'
            or lower(c.name) like '%loa%'
            or lower(c.name) like '%pin%'
            or lower(p.name) like '%sạc%'
            or lower(p.name) like '%tai nghe%'
            or lower(p.name) like '%cáp%'
          )
        order by p.createdAt desc
    """)
    List<Product> findPotentialAccessories(@Param("excludeId") UUID excludeId, Pageable pageable);
}

