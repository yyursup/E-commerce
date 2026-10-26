package com.marketplace.ecommerce.review.validate;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.review.dto.request.CreateReviewRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ReviewValidationTest {

    private final ReviewValidation validator = new ReviewValidation();

    private UUID accountId;
    private Order order;
    private UUID productId;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        productId = UUID.randomUUID();

        Account acc = new Account();
        acc.setId(accountId);
        acc.setDisciplineLevel(DisciplineLevel.NONE);

        User u = new User();
        u.setAccount(acc);

        Product p = new Product();
        p.setId(productId);

        OrderItem item = new OrderItem();
        item.setProduct(p);

        order = new Order();
        order.setUser(u);
        order.setStatus(OrderStatus.COMPLETED);
        order.setReceivedByBuyer(true);
        order.setItems(Set.of(item));
    }

    @Test
    @DisplayName("validateCanReview thành công khi đơn hợp lệ và đã nhận hàng")
    void testValidateCanReview_Success() {
        assertDoesNotThrow(() -> validator.validateCanReview(accountId, order, productId));
    }

    @Test
    @DisplayName("Ném lỗi khi sai tài khoản đánh giá")
    void testValidateCanReview_WrongAccount() {
        assertThrows(CustomException.class, () -> validator.validateCanReview(UUID.randomUUID(), order, productId));
    }

    @Test
    @DisplayName("Ném lỗi khi tài khoản bị khóa/đình chỉ")
    void testValidateCanReview_Suspended() {
        order.getUser().getAccount().setDisciplineLevel(DisciplineLevel.SUSPENDED);
        assertThrows(CustomException.class, () -> validator.validateCanReview(accountId, order, productId));
    }

    @Test
    @DisplayName("Ném lỗi khi đơn chưa hoàn thành hoặc chưa nhận hàng")
    void testValidateCanReview_NotCompleted() {
        order.setStatus(OrderStatus.SHIPPING);
        assertThrows(CustomException.class, () -> validator.validateCanReview(accountId, order, productId));

        order.setStatus(OrderStatus.COMPLETED);
        order.setReceivedByBuyer(false);
        assertThrows(CustomException.class, () -> validator.validateCanReview(accountId, order, productId));
    }

    @Test
    @DisplayName("Ném lỗi khi sản phẩm không có trong đơn")
    void testValidateCanReview_ProductNotInOrder() {
        assertThrows(CustomException.class, () -> validator.validateCanReview(accountId, order, UUID.randomUUID()));
    }

    @Test
    @DisplayName("requireOrderId trả về subOrderId hoặc ném lỗi nếu null")
    void testRequireOrderId() {
        CreateReviewRequest req = new CreateReviewRequest();
        assertThrows(CustomException.class, () -> validator.requireOrderId(req));

        UUID id = UUID.randomUUID();
        req.setSubOrderId(id);
        assertEquals(id, validator.requireOrderId(req));
    }
}
