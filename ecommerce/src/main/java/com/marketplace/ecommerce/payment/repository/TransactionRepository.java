package com.marketplace.ecommerce.payment.repository;

import com.marketplace.ecommerce.payment.entity.Transaction;
import com.marketplace.ecommerce.payment.valueObjects.ReferenceType;
import com.marketplace.ecommerce.payment.valueObjects.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    boolean existsByDedupeKey(String dedupeKey);

    boolean existsByReferenceTypeAndReferenceIdAndType(ReferenceType refType, UUID refId, TransactionType type);
}
