package com.marketplace.ecommerce.request.repository;

import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;
@Repository
public interface RequestRepository extends JpaRepository<Request, UUID> {

    Page<Request> findAllRequestByAccountId(UUID accountId, Pageable pageable);

    Page<Request> findAllByStatus(RequestStatus status, Pageable pageable);
}
