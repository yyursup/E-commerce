package com.marketplace.ecommerce.review.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.review.dto.request.ReplyRequest;
import com.marketplace.ecommerce.review.dto.response.SellerReplyResponse;
import com.marketplace.ecommerce.review.entity.Reply;
import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.repository.ReplyRepository;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReplyServiceImplTest {

    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private ReplyRepository replyRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ReplyServiceImpl replyService;

    private UUID accountId;
    private UUID reviewId;
    private User seller;
    private Account account;
    private Shop shop;
    private Product product;
    private Review review;
    private Reply reply;
    private ReplyRequest request;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        reviewId = UUID.randomUUID();

        account = Account.builder()
                .id(accountId)
                .disciplineLevel(DisciplineLevel.NONE)
                .build();

        seller = new User();
        seller.setId(UUID.randomUUID());
        seller.setAccount(account);

        shop = new Shop();
        shop.setId(UUID.randomUUID());
        shop.setUser(seller);

        product = Product.builder()
                .id(UUID.randomUUID())
                .shop(shop)
                .build();

        review = Review.builder()
                .id(reviewId)
                .product(product)
                .build();

        reply = Reply.builder()
                .id(UUID.randomUUID())
                .review(review)
                .reply("Cảm ơn quý khách đã ủng hộ shop!")
                .repliedAt(LocalDateTime.now())
                .build();

        request = new ReplyRequest();
        request.setReviewId(reviewId);
        request.setReply("Dạ cảm ơn bạn nhiều nhé!");
    }

    @Test
    @DisplayName("replyToReview ném ngoại lệ khi không tìm thấy tài khoản")
    void testReplyToReview_AccountNotFound() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> replyService.replyToReview(accountId, request));
    }

    @Test
    @DisplayName("replyToReview ném ngoại lệ khi tài khoản bị khóa hoặc tạm khóa")
    void testReplyToReview_BannedOrSuspended() {
        account.setDisciplineLevel(DisciplineLevel.SUSPENDED);
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(seller));
        assertThrows(CustomException.class, () -> replyService.replyToReview(accountId, request));

        account.setDisciplineLevel(DisciplineLevel.BANNED);
        assertThrows(CustomException.class, () -> replyService.replyToReview(accountId, request));
    }

    @Test
    @DisplayName("replyToReview ném ngoại lệ khi đánh giá không tồn tại")
    void testReplyToReview_ReviewNotFound() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(seller));
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> replyService.replyToReview(accountId, request));
    }

    @Test
    @DisplayName("replyToReview ném ngoại lệ khi người dùng không phải chủ shop")
    void testReplyToReview_NotShopOwner() {
        User otherSeller = new User();
        otherSeller.setId(UUID.randomUUID());
        shop.setUser(otherSeller);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(seller));
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));

        assertThrows(CustomException.class, () -> replyService.replyToReview(accountId, request));
    }

    @Test
    @DisplayName("replyToReview ném ngoại lệ khi đánh giá đã được phản hồi trước đó")
    void testReplyToReview_AlreadyReplied() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(seller));
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));
        when(replyRepository.existsByReviewId(reviewId)).thenReturn(true);

        assertThrows(CustomException.class, () -> replyService.replyToReview(accountId, request));
    }

    @Test
    @DisplayName("replyToReview tạo phản hồi thành công")
    void testReplyToReview_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(seller));
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));
        when(replyRepository.existsByReviewId(reviewId)).thenReturn(false);

        SellerReplyResponse res = replyService.replyToReview(accountId, request);
        assertNotNull(res);
        assertEquals("Dạ cảm ơn bạn nhiều nhé!", res.getReply());
        verify(replyRepository).save(any(Reply.class));
    }

    @Test
    @DisplayName("updateReply ném ngoại lệ khi quá 7 ngày hoặc quyền không hợp lệ")
    void testUpdateReply_ValidationErrors() {
        // Tài khoản không tìm thấy
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> replyService.updateReply(accountId, request));

        // Tài khoản bị phạt
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(seller));
        account.setDisciplineLevel(DisciplineLevel.SUSPENDED);
        assertThrows(CustomException.class, () -> replyService.updateReply(accountId, request));
        account.setDisciplineLevel(DisciplineLevel.NONE);

        // Reply không tìm thấy
        when(replyRepository.findByReviewId(reviewId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> replyService.updateReply(accountId, request));

        // Không phải chủ shop
        User otherSeller = new User();
        otherSeller.setId(UUID.randomUUID());
        shop.setUser(otherSeller);
        when(replyRepository.findByReviewId(reviewId)).thenReturn(Optional.of(reply));
        assertThrows(CustomException.class, () -> replyService.updateReply(accountId, request));

        // Quá 7 ngày
        shop.setUser(seller);
        reply.setRepliedAt(LocalDateTime.now().minusDays(8));
        assertThrows(CustomException.class, () -> replyService.updateReply(accountId, request));
    }

    @Test
    @DisplayName("updateReply cập nhật phản hồi thành công trong thời hạn 7 ngày")
    void testUpdateReply_Success() {
        reply.setRepliedAt(LocalDateTime.now().minusDays(2));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(seller));
        when(replyRepository.findByReviewId(reviewId)).thenReturn(Optional.of(reply));
        when(replyRepository.save(any(Reply.class))).thenAnswer(invocation -> invocation.getArgument(0));

        request.setReply("Dạ shop đã cập nhật lại nội dung phản hồi!");
        SellerReplyResponse res = replyService.updateReply(accountId, request);

        assertNotNull(res);
        assertEquals("Dạ shop đã cập nhật lại nội dung phản hồi!", res.getReply());
        verify(replyRepository).save(reply);
    }

    @Test
    @DisplayName("replyToReview và updateReply ném ngoại lệ khi shop bị SUSPENDED hoặc BANNED")
    void testReply_ShopSuspendedOrBanned() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(seller));
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));
        when(replyRepository.findByReviewId(reviewId)).thenReturn(Optional.of(reply));

        // 1. replyToReview with shop SUSPENDED
        shop.setStatus(ShopStatus.SUSPENDED);
        CustomException ex1 = assertThrows(CustomException.class, () -> replyService.replyToReview(accountId, request));
        assertTrue(ex1.getMessage().contains("tạm dừng hoạt động"));

        // 2. replyToReview with shop BANNED
        shop.setStatus(ShopStatus.BANNED);
        CustomException ex2 = assertThrows(CustomException.class, () -> replyService.replyToReview(accountId, request));
        assertTrue(ex2.getMessage().contains("bị cấm"));

        // 3. updateReply with shop SUSPENDED
        shop.setStatus(ShopStatus.SUSPENDED);
        assertThrows(CustomException.class, () -> replyService.updateReply(accountId, request));

        // 4. updateReply with shop BANNED
        shop.setStatus(ShopStatus.BANNED);
        assertThrows(CustomException.class, () -> replyService.updateReply(accountId, request));

        // 5. Account status BANNED
        shop.setStatus(ShopStatus.ACTIVE);
        account.setStatus(AccountStatus.BANNED);
        assertThrows(CustomException.class, () -> replyService.replyToReview(accountId, request));
        assertThrows(CustomException.class, () -> replyService.updateReply(accountId, request));
    }
}
