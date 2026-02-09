package com.marketplace.ecommerce.request.repository;

import com.marketplace.ecommerce.request.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {

    Report findByRequestId(UUID requestId);


    @Query(value = """
              SELECT t.type
              FROM (
                SELECT 'USER' AS type WHERE EXISTS (SELECT 1 FROM accounts a WHERE a.id = :id)
                UNION ALL
                SELECT 'SHOP' AS type WHERE EXISTS (SELECT 1 FROM shops s WHERE s.id = :id)
                UNION ALL
                SELECT 'PRODUCT' AS type WHERE EXISTS (SELECT 1 FROM products p WHERE p.id = :id)
                UNION ALL
                SELECT 'REVIEW' AS type WHERE EXISTS (SELECT 1 FROM reviews r WHERE r.id = :id)
              ) t
            """, nativeQuery = true)
    List<String> resolveTargetTypes(@Param("id") UUID id);

}
