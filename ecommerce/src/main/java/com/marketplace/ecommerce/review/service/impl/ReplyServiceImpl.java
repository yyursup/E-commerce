package com.marketplace.ecommerce.review.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import com.marketplace.ecommerce.review.dto.request.ReplyRequest;
import com.marketplace.ecommerce.review.dto.response.SellerReplyResponse;
import com.marketplace.ecommerce.review.entity.Reply;
import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.repository.ReplyRepository;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.service.ReplyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReplyServiceImpl implements ReplyService {

    private final ReviewRepository reviewRepository;
    private final ReplyRepository replyRepository;
    private final UserRepository userRepository;


    @Override
    public SellerReplyResponse updateReply(UUID accountId, ReplyRequest request) {

        User seller = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy tài khoản người dùng."));

        if (seller.getAccount().getDisciplineLevel() == DisciplineLevel.BANNED
                || seller.getAccount().getStatus() == AccountStatus.BANNED) {
            throw new CustomException("Bạn không thể cập nhật phản hồi này do tài khoản đã bị khóa vĩnh viễn.");
        }
        Reply reply = replyRepository.findByReviewId(request.getReviewId())
                .orElseThrow(() -> new CustomException("Không tìm thấy đánh giá."));

        Shop shop = reply.getReview().getProduct().getShop();
        assert shop != null : "Gian hàng không tìm thấy";

        if (shop.getStatus() == ShopStatus.SUSPENDED || shop.getStatus() == ShopStatus.BANNED) {
            throw new CustomException("Gian hàng của bạn đang bị tạm dừng hoạt động hoặc bị cấm, không thể cập nhật phản hồi.");
        }

        if (!shop.getUser().getId().equals(seller.getId())) {
            throw new CustomException("Bạn không có quyền cập nhật phản hồi này.");
        }

        if (reply.getRepliedAt()
                .plusDays(7)
                .isBefore(LocalDateTime.now())) {
            throw new CustomException("Phản hồi đánh giá chỉ có thể cập nhật trong vòng 7 ngày.");
        }

        reply.setReply(request.getReply());

        return SellerReplyResponse.from(replyRepository.save(reply));
    }


    @Override
    @Transactional
    public SellerReplyResponse replyToReview(UUID accountId, ReplyRequest request) {

        User seller = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy tài khoản người dùng."));

        if (seller.getAccount().getDisciplineLevel() == DisciplineLevel.BANNED
                || seller.getAccount().getStatus() == AccountStatus.BANNED) {
            throw new CustomException("Bạn không thể phản hồi đánh giá này do tài khoản đã bị khóa vĩnh viễn.");
        }
        Review review = reviewRepository.findById(request.getReviewId())
                .orElseThrow(() -> new CustomException("Không tìm thấy đánh giá."));

        Shop shop = review.getProduct().getShop();
        assert shop != null : "Gian hàng không tìm thấy";

        if (shop.getStatus() == ShopStatus.SUSPENDED || shop.getStatus() == ShopStatus.BANNED) {
            throw new CustomException("Gian hàng của bạn đang bị tạm dừng hoạt động hoặc bị cấm, không thể phản hồi đánh giá.");
        }

        if (!shop.getUser().getId().equals(seller.getId())) {
            throw new CustomException("Bạn không có quyền phản hồi đánh giá này.");
        }

        if (replyRepository.existsByReviewId(request.getReviewId())) {
            throw new CustomException("Đánh giá này đã được phản hồi trước đó.");
        }

        Reply reply = Reply.builder()
                .review(review)
                .reply(request.getReply())
                .build();

        replyRepository.save(reply);
        return SellerReplyResponse.from(reply);
    }


}
