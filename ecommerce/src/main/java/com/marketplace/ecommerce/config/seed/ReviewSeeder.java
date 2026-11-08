package com.marketplace.ecommerce.config.seed;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductImage;
import com.marketplace.ecommerce.review.dto.projection.ShopReviewStatsProjection;
import com.marketplace.ecommerce.review.entity.Reply;
import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.repository.ReplyRepository;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReviewSeeder {

    private final ReviewRepository reviewRepository;
    private final ReplyRepository replyRepository;
    private final OrderRepository orderRepository;
    private final ShopRepository shopRepository;

    private final Random random = new Random();

    public void seed() {
        long existingReviewCount = reviewRepository.count();
        if (existingReviewCount >= 50) {
            log.debug("Skip seed reviews: already {} reviews present", existingReviewCount);
            return;
        }

        log.info("Seeding verified purchase reviews for multi-vendor shops...");

        List<Shop> shops = shopRepository.findAll();
        if (shops.isEmpty()) {
            log.warn("Cannot seed reviews: No shops found in database.");
            return;
        }

        // 1. Ensure all shops have enough COMPLETED orders with receivedByBuyer = true
        for (Shop shop : shops) {
            long completedOrders = orderRepository.findAll().stream()
                    .filter(o -> o.getShop() != null
                            && o.getShop().getId().equals(shop.getId())
                            && o.getStatus() == OrderStatus.COMPLETED
                            && o.isReceivedByBuyer())
                    .count();

            if (completedOrders < 8) {
                List<Order> candidates = orderRepository.findAll().stream()
                        .filter(o -> o.getShop() != null
                                && o.getShop().getId().equals(shop.getId())
                                && o.getStatus() != OrderStatus.COMPLETED
                                && o.getStatus() != OrderStatus.CANCELLED)
                        .limit(8 - completedOrders)
                        .collect(Collectors.toList());

                for (Order ord : candidates) {
                    ord.setStatus(OrderStatus.COMPLETED);
                    ord.setReceivedByBuyer(true);
                    LocalDateTime del = ord.getCreatedAt().plusDays(2);
                    ord.setDeliveredAt(del);
                    ord.setReceivedAt(del.plusHours(6));
                    orderRepository.save(ord);
                }
            }
        }

        // 2. Fetch all COMPLETED orders that were received by buyer
        List<Order> completedOrders = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED && o.isReceivedByBuyer())
                .collect(Collectors.toList());

        int createdReviewsCount = 0;

        for (Order order : completedOrders) {
            User buyer = order.getUser();
            Shop shop = order.getShop();
            if (buyer == null || shop == null || order.getItems() == null || order.getItems().isEmpty()) {
                continue;
            }

            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                if (product == null) {
                    continue;
                }

                boolean alreadyReviewed = reviewRepository.existsByUserIdAndProductIdAndSubOrderIdAndStatus(
                        buyer.getId(), product.getId(), order.getId(), ReviewStatus.ACTIVE);
                if (alreadyReviewed) {
                    continue;
                }

                // 85% 5 stars, 15% 4 stars (average ~4.85)
                int rating = random.nextInt(100) < 85 ? 5 : 4;
                String comment = getRealisticReviewComment(shop.getName(), product.getName(), rating);

                LocalDateTime reviewTime = order.getReceivedAt() != null
                        ? order.getReceivedAt().plusHours(ThreadLocalRandom.current().nextInt(2, 48))
                        : order.getCreatedAt().plusDays(3);
                if (reviewTime.isAfter(LocalDateTime.now())) {
                    reviewTime = LocalDateTime.now().minusHours(ThreadLocalRandom.current().nextInt(1, 24));
                }

                Review review = Review.builder()
                        .user(buyer)
                        .product(product)
                        .subOrderId(order.getId())
                        .status(ReviewStatus.ACTIVE)
                        .rating(rating)
                        .comment(comment)
                        .imageUrls(new ArrayList<>())
                        .build();
                review.setCreatedAt(reviewTime);
                review.setUpdatedAt(reviewTime);

                if (product.getImages() != null && !product.getImages().isEmpty() && random.nextBoolean()) {
                    ProductImage firstImg = product.getImages().iterator().next();
                    review.getImageUrls().add(firstImg.getImageUrl());
                }

                Review savedReview = reviewRepository.save(review);
                createdReviewsCount++;

                if (random.nextInt(100) < 35) {
                    Reply reply = Reply.builder()
                            .review(savedReview)
                            .reply(getRealisticSellerReply(shop.getName()))
                            .build();
                    reply.setRepliedAt(reviewTime.plusHours(ThreadLocalRandom.current().nextInt(1, 12)));
                    replyRepository.save(reply);
                }
            }
        }

        // 3. Update average_rating in shops table based on verified reviews
        for (Shop shop : shops) {
            ShopReviewStatsProjection stats = reviewRepository.getShopStats(shop.getId(), ReviewStatus.ACTIVE);
            if (stats != null && stats.getTotalReviews() != null && stats.getTotalReviews() > 0 && stats.getAvgRating() != null) {
                float realAvg = (float) (Math.round(stats.getAvgRating() * 10.0) / 10.0);
                shop.setAverageRating(realAvg);
                shopRepository.save(shop);
                log.info("Updated shop '{}' averageRating to {} (from {} verified reviews)",
                        shop.getName(), realAvg, stats.getTotalReviews());
            }
        }

        log.info("Successfully seeded {} verified purchase reviews across all shops", createdReviewsCount);
    }

    private String getRealisticReviewComment(String shopName, String productName, int rating) {
        String sName = shopName != null ? shopName.toLowerCase() : "";
        String pName = productName != null ? productName.toLowerCase() : "";

        List<String> options = new ArrayList<>();
        if (sName.contains("apple") || pName.contains("iphone") || pName.contains("macbook") || pName.contains("airpods") || pName.contains("ipad")) {
            options.add("Máy mới 100% nguyên seal VN/A, kích hoạt bảo hành điện tử chính hãng chuẩn chỉ. Đóng gói rất cẩn thận nhiều lớp chống sốc, giao hàng siêu nhanh. 5 sao cho shop!");
            options.add("Sản phẩm chính hãng Apple dùng cực kỳ mượt mà, pin trâu, màn hình sắc nét không một vết xước. Shop tư vấn rất có tâm.");
            options.add("Hàng chuẩn xịn Apple, nguyên đai nguyên kiện, phụ kiện theo máy đầy đủ. Dùng rất sướng, xứng đáng từng đồng.");
            options.add("Giao hàng siêu tốc trong ngày, đóng gói cẩn thận có tem niêm phong. Mua hàng của E-Mall rất yên tâm về nguồn gốc.");
            options.add("Tai nghe / máy dùng âm thanh đỉnh cao, kết nối iPhone tích tắc. Rất hài lòng với chất lượng dịch vụ của cửa hàng.");
        } else if (sName.contains("samsung") || pName.contains("galaxy") || pName.contains("fold") || pName.contains("flip")) {
            options.add("Samsung Galaxy chính hãng mới 100% nguyên seal, màn hình Dynamic AMOLED 2X hiển thị ngoài trời nắng cực nét. Galaxy AI dùng rất tiện lợi!");
            options.add("Máy chụp ảnh sắc nét từng chi tiết, zoom 100x đỉnh cao. Đóng gói hộp chắc chắn, kích hoạt bảo hành điện tử Samsung Care+ thành công ngay.");
            options.add("Hàng chính hãng phân phối Samsung Vina, bút S-Pen viết vẽ cực êm không có độ trễ. Giao hàng hỏa tốc trong 24h.");
            options.add("Đồng hồ / điện thoại Galaxy thiết kế sang trọng, pin dùng thoải mái cả ngày. Shop hỗ trợ kỹ thuật cài đặt rất nhiệt tình.");
        } else if (sName.contains("gearvn") || pName.contains("rtx") || pName.contains("intel") || pName.contains("rog") || pName.contains("gaming")) {
            options.add("Linh kiện PC đóng gói bóng khí chống sốc 5 lớp rất an tâm, tem bảo hành chính hãng đầy đủ. Test benchmark hiệu năng cực cao và mát mẻ!");
            options.add("Laptop gaming Asus ROG chiến mượt mà mọi tựa game AAA ở thiết lập đồ họa Ultra, màn hình 240Hz siêu nhạy không bóng mờ.");
            options.add("Card đồ họa chạy cực êm không bị coil whine, nhiệt độ mát mẻ dưới 65 độ C khi render video. GearVN uy tín số 1!");
            options.add("Bàn phím cơ gõ âm đầm chắc, switch mượt mà, layout đẹp xuất sắc. Rất hài lòng về thời gian giao hàng và chất lượng dịch vụ.");
        } else if (sName.contains("sony") || pName.contains("wh-1000") || pName.contains("wf-1000") || pName.contains("alpha") || pName.contains("lens")) {
            options.add("Khả năng chống ồn chủ động ANC đỉnh chóp của Sony, cách ly tiếng ồn đường phố hoàn hảo. Âm bass sâu chắc, dải mid trong trẻo chuẩn Hi-Res.");
            options.add("Máy ảnh Sony Alpha lấy nét theo mắt người và động vật siêu nhanh, quay video 4K 10-bit màu sắc chân thực. Hàng chính hãng Sony VN bảo hành 2 năm.");
            options.add("Loa Bluetooth âm lượng to khủng, chống nước chuẩn IP67 mang đi du lịch dã ngoại cực đã. Pin trâu dùng cả ngày không hết.");
            options.add("Micro không dây bắt sóng cực xa và ổn định, lọc gió ngoài trời rất tốt, cắm vào máy ảnh nhận ngay không cần cài đặt rườm rà.");
        } else if (sName.contains("anker") || sName.contains("baseus") || pName.contains("sạc") || pName.contains("cáp") || pName.contains("hub")) {
            options.add("Củ sạc GaN công suất cao sạc cùng lúc cả MacBook và iPhone không hề bị nóng, kích thước nhỏ gọn tiện lợi bỏ balo.");
            options.add("Pin sạc dự phòng sạc siêu nhanh chuẩn PD, màn hình hiển thị công suất chính xác từng watt. Dung lượng chuẩn không ảo.");
            options.add("Dây cáp bện dù siêu bền chống gập gãy, đầu cắm mạ kim loại chắc chắn cắm khít cổng sạc. Truyền dữ liệu tốc độ cao mượt mà.");
            options.add("Hub Type-C xuất màn hình ngoài 4K 60Hz không giật lag hay chập chờn, cổng mạng LAN cắm nhận luôn mạng dây tốc độ gigabit.");
        } else if (sName.contains("xiaomi") || pName.contains("robot") || pName.contains("camera") || pName.contains("purifier") || pName.contains("smart")) {
            options.add("Robot hút bụi lau nhà tự động lập bản đồ phòng rất thông minh, tự giặt và sấy khô giẻ lau sạch sẽ giúp tiết kiệm bao nhiêu thời gian.");
            options.add("Camera an ninh hình ảnh 2.5K rõ nét cả ban đêm có màu, đàm thoại 2 chiều to rõ, kết nối ứng dụng Mi Home quản lý từ xa rất mượt.");
            options.add("Máy lọc không khí hoạt động êm ái ban đêm không nghe tiếng động, đo bụi mịn PM2.5 nhạy, không khí phòng ngủ thoáng mát hơn hẳn.");
            options.add("Smartband đo bước chân và nhịp tim liên tục chuẩn xác, pin trâu dùng gần 2 tuần mới phải sạc lại. Rất đáng đồng tiền bát gạo!");
        } else {
            options.add("Sản phẩm điện tử chính hãng chuẩn xịn, tem bảo hành đầy đủ, đóng gói chống sốc nhiều lớp. Shop giao hàng cực nhanh!");
            options.add("Hàng chuẩn mô tả 100%, kết nối nhanh chóng mượt mà, đầy đủ phụ kiện theo hộp. Đánh giá 5 sao cho chất lượng dịch vụ!");
            options.add("Thiết bị công nghệ hoạt động ổn định, giá cả hợp lý so với các trung tâm điện máy. Sẽ tiếp tục ủng hộ shop các đơn sau!");
        }

        if (rating == 4) {
            return options.get(random.nextInt(options.size())).replace("5 sao", "4 sao")
                    + " (Giao hàng hơi lâu hơn dự kiến một chút nhưng bù lại hàng rất tốt).";
        }
        return options.get(random.nextInt(options.size()));
    }

    private String getRealisticSellerReply(String shopName) {
        List<String> replies = List.of(
                "Dạ " + shopName + " chân thành cảm ơn bạn đã tin tưởng và ủng hộ sản phẩm! Nếu trong quá trình sử dụng có bất kỳ thắc mắc nào, bạn cứ nhắn tin cho shop hỗ trợ ngay nhé ạ. Chúc bạn có những trải nghiệm thật tuyệt vời!",
                "Cảm ơn bạn rất nhiều vì đã dành thời gian đánh giá 5 sao cho shop! Sự hài lòng của bạn là động lực to lớn để shop không ngừng hoàn thiện chất lượng và dịch vụ hơn nữa ạ. Chúc bạn một ngày ngập tràn niềm vui!",
                "Dạ shop cảm ơn phản hồi tích cực từ bạn ạ! Cần tư vấn thêm về cách sử dụng hay chính sách bảo hành, bạn cứ liên hệ với shop bất cứ lúc nào nhé. Rất mong được tiếp tục phục vụ bạn ở những đơn hàng tới ạ!"
        );
        return replies.get(random.nextInt(replies.size()));
    }
}
