package com.marketplace.ecommerce.request.repository;

import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RequestRepository extends JpaRepository<Request, UUID> {

    Page<Request> findAllRequestByAccountId(UUID accountId, Pageable pageable);

    List<Request> findByAccountIdAndTypeOrderByCreatedAtDesc(UUID accountId, RequestType type);

    boolean existsByAccountIdAndTypeAndStatus(UUID accountId, RequestType type, RequestStatus status);

    @Query(
        value = """
            SELECT req FROM Request req
            WHERE (:type IS NULL OR req.type = :type)
              AND (:status IS NULL OR req.status = :status)
              AND NOT EXISTS (
                  SELECT 1 FROM Report rep
                  WHERE rep.id = req.id
                    AND req.type = com.marketplace.ecommerce.request.valueObjects.RequestType.REPORT
                    AND rep.targetType = com.marketplace.ecommerce.request.valueObjects.TargetType.ORDER
                    AND rep.stage != com.marketplace.ecommerce.request.valueObjects.ReportStage.ESCALATED_TO_ADMIN
                    AND rep.escalatedAt IS NULL
              )
        """,
        countQuery = """
            SELECT count(req) FROM Request req
            WHERE (:type IS NULL OR req.type = :type)
              AND (:status IS NULL OR req.status = :status)
              AND NOT EXISTS (
                  SELECT 1 FROM Report rep
                  WHERE rep.id = req.id
                    AND req.type = com.marketplace.ecommerce.request.valueObjects.RequestType.REPORT
                    AND rep.targetType = com.marketplace.ecommerce.request.valueObjects.TargetType.ORDER
                    AND rep.stage != com.marketplace.ecommerce.request.valueObjects.ReportStage.ESCALATED_TO_ADMIN
                    AND rep.escalatedAt IS NULL
              )
        """
    )
    Page<Request> findAllAdminRequests(
            @Param("type") RequestType type,
            @Param("status") RequestStatus status,
            Pageable pageable
    );
}
