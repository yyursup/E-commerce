package com.marketplace.ecommerce.review.validate;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.review.dto.request.CreateReviewRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ReviewValidation {

    public void validateCanReview(UUID accountId, Order order, UUID productId) {
        if (!order.getUser().getAccount().getId().equals(accountId)) {
            throw new CustomException("You don't have permission to review this order.");
        }

        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new CustomException("The order must be completed before rating.");
        }

        if (!order.isReceivedByBuyer()) {
            throw new CustomException("Please confirm the delivery of the order before rating.");
        }

        boolean hasProduct = order.getItems().stream()
                .anyMatch(i -> i.getProduct().getId().equals(productId));

        if (!hasProduct) {
            throw new CustomException("This product is not in the order.");
        }
    }

    public UUID requireOrderId(CreateReviewRequest req) {
        if (req.getSubOrderId() == null) {
            throw new CustomException("Vui lòng chọn đơn hàng đã mua để đánh giá.");
        }
        return req.getSubOrderId();
    }

}
