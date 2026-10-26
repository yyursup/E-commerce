package com.marketplace.ecommerce.review.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.file.service.FileService;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.review.dto.request.CreateReviewRequest;
import com.marketplace.ecommerce.review.dto.request.UpdateReviewRequest;
import com.marketplace.ecommerce.review.dto.response.ReviewResponse;
import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.repository.ReplyRepository;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.validate.ReviewValidation;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReviewServiceImplTest {

    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private ReplyRepository replyRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ReviewValidation reviewValidation;
    @Mock
    private FileService fileService;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private UUID accountId;
    private User sampleUser;
    private Product sampleProduct;
    private Order sampleOrder;
    private Review sampleReview;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();

        Account acc = new Account();
        acc.setId(accountId);

        sampleUser = new User();
        sampleUser.setId(UUID.randomUUID());
        sampleUser.setAccount(acc);
        sampleUser.setFullName("Nguyen Van Reviewer");
        sampleUser.setEmail("reviewer@test.com");

        sampleProduct = new Product();
        sampleProduct.setId(UUID.randomUUID());
        sampleProduct.setName("MacBook");

        sampleOrder = new Order();
        sampleOrder.setId(UUID.randomUUID());
        sampleOrder.setUser(sampleUser);

        sampleReview = Review.builder()
                .id(UUID.randomUUID())
                .user(sampleUser)
                .product(sampleProduct)
                .subOrderId(sampleOrder.getId())
                .rating(5)
                .comment("San pham tuyet voi")
                .status(ReviewStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("createReview tạo đánh giá thành công")
    void testCreateReview_Success() {
        CreateReviewRequest req = new CreateReviewRequest();
        req.setSubOrderId(sampleOrder.getId());
        req.setRating(5);
        req.setComment("Rất ưng ý");

        when(reviewValidation.requireOrderId(req)).thenReturn(sampleOrder.getId());
        when(productRepository.findById(sampleProduct.getId())).thenReturn(Optional.of(sampleProduct));
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.of(sampleOrder));
        when(reviewRepository.existsByUserIdAndProductIdAndSubOrderIdAndStatus(
                sampleUser.getId(), sampleProduct.getId(), sampleOrder.getId(), ReviewStatus.ACTIVE)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> inv.getArgument(0));

        ReviewResponse res = reviewService.createReview(accountId, sampleProduct.getId(), req);
        assertNotNull(res);
        assertEquals(5, res.getRating());
        verify(reviewValidation).validateCanReview(accountId, sampleOrder, sampleProduct.getId());
    }

    @Test
    @DisplayName("createReview ném lỗi khi đã đánh giá đơn hàng này trước đó")
    void testCreateReview_AlreadyReviewed() {
        CreateReviewRequest req = new CreateReviewRequest();
        req.setSubOrderId(sampleOrder.getId());

        when(reviewValidation.requireOrderId(req)).thenReturn(sampleOrder.getId());
        when(productRepository.findById(sampleProduct.getId())).thenReturn(Optional.of(sampleProduct));
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.of(sampleOrder));
        when(reviewRepository.existsByUserIdAndProductIdAndSubOrderIdAndStatus(
                sampleUser.getId(), sampleProduct.getId(), sampleOrder.getId(), ReviewStatus.ACTIVE)).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () -> reviewService.createReview(accountId, sampleProduct.getId(), req));
        assertTrue(ex.getMessage().contains("already reviewing"));
    }

    @Test
    @DisplayName("getMyReview trả về đánh giá của tôi")
    void testGetMyReview() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(reviewRepository.findByUserIdAndProductIdAndSubOrderId(sampleUser.getId(), sampleProduct.getId(), sampleOrder.getId()))
                .thenReturn(Optional.of(sampleReview));

        ReviewResponse res = reviewService.getMyReview(accountId, sampleProduct.getId(), sampleOrder.getId());
        assertNotNull(res);
        assertEquals("San pham tuyet voi", res.getComment());
    }

    @Test
    @DisplayName("deleteReview chuyển trạng thái sang DELETED")
    void testDeleteReview() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(reviewRepository.findById(sampleReview.getId())).thenReturn(Optional.of(sampleReview));

        reviewService.deleteReview(accountId, sampleReview.getId());

        assertEquals(ReviewStatus.DELETED, sampleReview.getStatus());
        verify(reviewRepository).save(sampleReview);
    }

    @Test
    @DisplayName("updateReview cập nhật nội dung đánh giá trong vòng 7 ngày")
    void testUpdateReview_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(reviewRepository.findById(sampleReview.getId())).thenReturn(Optional.of(sampleReview));
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateReviewRequest req = new UpdateReviewRequest();
        req.setRating(4);
        req.setComment("Đã dùng 3 ngày, pin tạm ổn");

        ReviewResponse res = reviewService.updateReview(accountId, sampleReview.getId(), req);
        assertEquals(4, res.getRating());
        assertEquals("Đã dùng 3 ngày, pin tạm ổn", sampleReview.getComment());
    }

    @Test
    @DisplayName("updateReview ném lỗi nếu quá hạn 7 ngày")
    void testUpdateReview_Expired7Days() {
        sampleReview.setCreatedAt(LocalDateTime.now().minusDays(8));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(reviewRepository.findById(sampleReview.getId())).thenReturn(Optional.of(sampleReview));

        UpdateReviewRequest req = new UpdateReviewRequest();
        CustomException ex = assertThrows(CustomException.class, () -> reviewService.updateReview(accountId, sampleReview.getId(), req));
        assertTrue(ex.getMessage().contains("within 7 days"));
    }

    @Test
    @DisplayName("getProductReviews lọc và phân trang đánh giá sản phẩm")
    void testGetProductReviews() {
        Page<Review> page = new PageImpl<>(List.of(sampleReview));
        when(reviewRepository.findWithFilters(sampleProduct.getId(), ReviewStatus.ACTIVE, 5, null, Pageable.unpaged()))
                .thenReturn(page);

        Page<ReviewResponse> res = reviewService.getProductReviews(sampleProduct.getId(), 5, null, Pageable.unpaged());
        assertEquals(1, res.getTotalElements());
    }

    @Test
    @DisplayName("getMyReviews phân trang danh sách đánh giá của tôi thành công và khi user không tồn tại")
    void testGetMyReviews() {
        // User không tồn tại
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> reviewService.getMyReviews(accountId, Pageable.unpaged()));

        // Thành công
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        Page<Review> page = new PageImpl<>(List.of(sampleReview));
        when(reviewRepository.findByUserIdWithDetails(sampleUser.getId(), Pageable.unpaged())).thenReturn(page);

        Page<ReviewResponse> res = reviewService.getMyReviews(accountId, Pageable.unpaged());
        assertNotNull(res);
        assertEquals(1, res.getTotalElements());
    }

    @Test
    @DisplayName("getMyReview ném ngoại lệ khi user hoặc review không tìm thấy")
    void testGetMyReview_Exceptions() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> reviewService.getMyReview(accountId, sampleProduct.getId(), sampleOrder.getId()));

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(reviewRepository.findByUserIdAndProductIdAndSubOrderId(sampleUser.getId(), sampleProduct.getId(), sampleOrder.getId()))
                .thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> reviewService.getMyReview(accountId, sampleProduct.getId(), sampleOrder.getId()));
    }

    @Test
    @DisplayName("deleteReview và updateReview ném lỗi quyền hạn khi không phải tác giả đánh giá")
    void testReview_NotAuthor() {
        User otherUser = new User();
        otherUser.setId(UUID.randomUUID());
        otherUser.setFullName("Người khác");

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(otherUser));
        when(reviewRepository.findById(sampleReview.getId())).thenReturn(Optional.of(sampleReview));

        // deleteReview not author
        CustomException exDel = assertThrows(CustomException.class, () -> reviewService.deleteReview(accountId, sampleReview.getId()));
        assertTrue(exDel.getMessage().contains("permission to delete"));

        // updateReview not author
        UpdateReviewRequest req = new UpdateReviewRequest();
        CustomException exUp = assertThrows(CustomException.class, () -> reviewService.updateReview(accountId, sampleReview.getId(), req));
        assertTrue(exUp.getMessage().contains("permission to update"));
    }

    @Test
    @DisplayName("createReview ném ngoại lệ khi không tìm thấy Product hoặc Order")
    void testCreateReview_NotFound() {
        CreateReviewRequest req = new CreateReviewRequest();
        req.setSubOrderId(sampleOrder.getId());

        when(reviewValidation.requireOrderId(req)).thenReturn(sampleOrder.getId());
        when(productRepository.findById(sampleProduct.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> reviewService.createReview(accountId, sampleProduct.getId(), req));

        when(productRepository.findById(sampleProduct.getId())).thenReturn(Optional.of(sampleProduct));
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> reviewService.createReview(accountId, sampleProduct.getId(), req));
    }

    @Test
    @DisplayName("createReview và updateReview bao phủ tải ảnh, video và xử lý exception khi upload file")
    void testReview_WithImagesAndVideos() throws Exception {
        org.springframework.web.multipart.MultipartFile mockFile1 = mock(org.springframework.web.multipart.MultipartFile.class);
        when(mockFile1.isEmpty()).thenReturn(false);
        when(mockFile1.getOriginalFilename()).thenReturn("review1.jpg");

        org.springframework.web.multipart.MultipartFile mockFileEmpty = mock(org.springframework.web.multipart.MultipartFile.class);
        when(mockFileEmpty.isEmpty()).thenReturn(true);

        org.springframework.web.multipart.MultipartFile mockFileError = mock(org.springframework.web.multipart.MultipartFile.class);
        when(mockFileError.isEmpty()).thenReturn(false);

        when(fileService.uploadFile(mockFile1, "reviews")).thenReturn("file-123");
        when(fileService.getFileUrl("file-123")).thenReturn("https://cdn.example.com/file-123.jpg");
        when(fileService.uploadFile(mockFileError, "reviews")).thenThrow(new RuntimeException("S3 error"));

        // Create with images & videos
        CreateReviewRequest createReq = new CreateReviewRequest();
        createReq.setSubOrderId(sampleOrder.getId());
        createReq.setRating(5);
        createReq.setComment("Đánh giá kèm ảnh");
        createReq.setImages(List.of(mockFile1, mockFileEmpty));
        createReq.setVideos(List.of(mockFileError));

        when(reviewValidation.requireOrderId(createReq)).thenReturn(sampleOrder.getId());
        when(productRepository.findById(sampleProduct.getId())).thenReturn(Optional.of(sampleProduct));
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.of(sampleOrder));
        when(reviewRepository.existsByUserIdAndProductIdAndSubOrderIdAndStatus(
                sampleUser.getId(), sampleProduct.getId(), sampleOrder.getId(), ReviewStatus.ACTIVE)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> inv.getArgument(0));

        ReviewResponse createRes = reviewService.createReview(accountId, sampleProduct.getId(), createReq);
        assertNotNull(createRes);

        // Update with newImages & newVideos
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(reviewRepository.findById(sampleReview.getId())).thenReturn(Optional.of(sampleReview));

        UpdateReviewRequest updateReq = new UpdateReviewRequest();
        updateReq.setRating(5);
        updateReq.setComment("Cập nhật có video");
        updateReq.setNewImages(List.of(mockFile1));
        updateReq.setNewVideos(List.of(mockFileEmpty));

        ReviewResponse updateRes = reviewService.updateReview(accountId, sampleReview.getId(), updateReq);
        assertNotNull(updateRes);
    }

}
