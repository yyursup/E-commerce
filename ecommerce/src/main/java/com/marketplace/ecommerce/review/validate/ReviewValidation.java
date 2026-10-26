package com.marketplace.ecommerce.review.validate;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
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
            throw new CustomException("Bạn không có quyền đánh giá đơn hàng này.");
        }

        Account account = order.getUser().getAccount();
        if (account.getDisciplineLevel() == DisciplineLevel.SUSPENDED
                || account.getStatus() == AccountStatus.SUSPENDED
                || account.getDisciplineLevel() == DisciplineLevel.BANNED
                || account.getStatus() == AccountStatus.BANNED) {
            throw new CustomException("Bạn không thể đánh giá đơn hàng do tài khoản đang bị tạm ngưng hoặc đã bị khóa vĩnh viễn.");
        }

        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new CustomException("Đơn hàng phải ở trạng thái hoàn tất trước khi đánh giá.");
        }

        if (!order.isReceivedByBuyer()) {
            throw new CustomException("Vui lòng xác nhận đã nhận hàng trước khi thực hiện đánh giá.");
        }

        boolean hasProduct = order.getItems().stream()
                .anyMatch(i -> i.getProduct().getId().equals(productId));

        if (!hasProduct) {
            throw new CustomException("Sản phẩm này không thuộc đơn hàng đã chọn.");
        }
    }

    public UUID requireOrderId(CreateReviewRequest req) {
        if (req.getSubOrderId() == null) {
            throw new CustomException("Vui lòng chọn đơn hàng đã mua để đánh giá.");
        }
        return req.getSubOrderId();
    }

}
