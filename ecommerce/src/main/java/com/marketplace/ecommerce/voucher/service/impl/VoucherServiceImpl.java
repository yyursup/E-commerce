package com.marketplace.ecommerce.voucher.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.cart.entity.Cart;
import com.marketplace.ecommerce.cart.entity.CartItem;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.repository.ProductCategoryRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.voucher.dto.*;
import com.marketplace.ecommerce.voucher.entity.UserVoucher;
import com.marketplace.ecommerce.voucher.entity.Voucher;
import com.marketplace.ecommerce.voucher.repository.UserVoucherRepository;
import com.marketplace.ecommerce.voucher.repository.VoucherRepository;
import com.marketplace.ecommerce.voucher.service.VoucherService;
import com.marketplace.ecommerce.voucher.valueObjects.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final OrderRepository orderRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final CartRepository cartRepository;

    @Override
    @Transactional(readOnly = true)
    public List<VoucherResponse> listActiveVouchers(VoucherScope scope, UUID shopId, UUID accountId) {
        LocalDateTime now = LocalDateTime.now();
        List<Voucher> vouchers;

        if (scope != null) {
            if (scope == VoucherScope.SHOP && shopId != null) {
                vouchers = voucherRepository.findActiveByShopId(VoucherStatus.ACTIVE, shopId, now);
            } else {
                vouchers = voucherRepository.findActiveByScope(VoucherStatus.ACTIVE, scope, now);
            }
        } else if (shopId != null) {
            vouchers = voucherRepository.findActiveForCheckout(VoucherStatus.ACTIVE, shopId, now);
        } else {
            vouchers = voucherRepository.findAllCurrentlyActive(VoucherStatus.ACTIVE, now);
        }

        Set<UUID> claimedVoucherIds = getClaimedVoucherIds(accountId);

        return vouchers.stream()
                .map(v -> {
                    VoucherResponse resp = VoucherResponse.from(v);
                    resp.setClaimed(claimedVoucherIds.contains(v.getId()));
                    return resp;
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VoucherResponse> getShopVouchers(UUID shopId, UUID accountId) {
        if (shopId == null) {
            throw new CustomException("Shop ID không được để trống");
        }
        LocalDateTime now = LocalDateTime.now();
        List<Voucher> vouchers = voucherRepository.findActiveByShopId(VoucherStatus.ACTIVE, shopId, now);
        Set<UUID> claimedVoucherIds = getClaimedVoucherIds(accountId);

        return vouchers.stream()
                .map(v -> {
                    VoucherResponse resp = VoucherResponse.from(v);
                    resp.setClaimed(claimedVoucherIds.contains(v.getId()));
                    return resp;
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserVoucherResponse> getMyVouchers(UUID accountId) {
        User user = getUser(accountId);
        List<UserVoucher> userVouchers = userVoucherRepository.findMyVouchersWithDetails(user.getId(),
                UserVoucherStatus.UNUSED);

        return userVouchers.stream()
                .filter(uv -> uv.getVoucher().isCurrentlyActive())
                .map(UserVoucherResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public UserVoucherResponse claimVoucher(UUID accountId, UUID voucherId) {
        User user = getUser(accountId);
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new CustomException("Không tìm thấy voucher"));

        if (!voucher.isCurrentlyActive()) {
            throw new CustomException("Voucher hiện không khả dụng hoặc đã hết lượt sử dụng");
        }

        long userClaimCount = userVoucherRepository.countByUserIdAndVoucherIdAndStatus(user.getId(), voucher.getId(),
                UserVoucherStatus.UNUSED);
        int maxLimit = voucher.getUserUsageLimit() != null ? voucher.getUserUsageLimit() : 1;
        if (userClaimCount >= maxLimit) {
            throw new CustomException("Bạn đã thu thập voucher này vào kho rồi!");
        }

        UserVoucher userVoucher = UserVoucher.builder()
                .user(user)
                .voucher(voucher)
                .status(UserVoucherStatus.UNUSED)
                .claimedAt(LocalDateTime.now())
                .build();

        userVoucher = userVoucherRepository.save(userVoucher);
        return UserVoucherResponse.from(userVoucher);
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherCalculationResponse validateAndCalculate(
            UUID accountId,
            String voucherCode,
            UUID shopId,
            BigDecimal subtotal,
            BigDecimal shippingFee) {
        if (voucherCode == null || voucherCode.isBlank()) {
            throw new CustomException("Mã voucher không được để trống");
        }

        Voucher voucher = voucherRepository.findByCodeIgnoreCase(voucherCode.trim())
                .orElseThrow(() -> new CustomException("Mã voucher '" + voucherCode + "' không tồn tại"));

        if (voucher.getScope() == VoucherScope.SHOP) {
            return validateAndCalculateMulti(accountId, voucher.getCode(), null, shopId, subtotal, shippingFee);
        } else {
            return validateAndCalculateMulti(accountId, null, voucher.getCode(), shopId, subtotal, shippingFee);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherCalculationResponse validateAndCalculateMulti(
            UUID accountId,
            String shopVoucherCode,
            String platformVoucherCode,
            UUID shopId,
            BigDecimal subtotal,
            BigDecimal shippingFee) {

        boolean hasShopCode = shopVoucherCode != null && !shopVoucherCode.isBlank();
        boolean hasPlatformCode = platformVoucherCode != null && !platformVoucherCode.isBlank();

        if (!hasShopCode && !hasPlatformCode) {
            throw new CustomException("Vui lòng cung cấp ít nhất 1 mã voucher");
        }

        BigDecimal safeSubtotal = subtotal != null ? subtotal : BigDecimal.ZERO;
        BigDecimal safeShipping = shippingFee != null ? shippingFee : BigDecimal.ZERO;

        User user = null;
        if (accountId != null) {
            user = getUser(accountId);
        }

        Voucher shopVoucher = null;
        BigDecimal shopDiscount = BigDecimal.ZERO;
        if (hasShopCode) {
            shopVoucher = voucherRepository.findByCodeIgnoreCase(shopVoucherCode.trim())
                    .orElseThrow(() -> new CustomException("Mã voucher shop '" + shopVoucherCode + "' không tồn tại"));

            if (shopVoucher.getScope() != VoucherScope.SHOP) {
                throw new CustomException("Mã '" + shopVoucher.getCode() + "' không phải là Voucher của Shop");
            }
            if (shopVoucher.getShop() == null || !shopVoucher.getShop().getId().equals(shopId)) {
                throw new CustomException("Voucher '" + shopVoucher.getCode() + "' chỉ áp dụng cho sản phẩm của shop: "
                        + (shopVoucher.getShop() != null ? shopVoucher.getShop().getName() : ""));
            }

            shopDiscount = validateAndGetDiscount(shopVoucher, user, shopId, safeSubtotal, safeShipping);
        }

        Voucher platformVoucher = null;
        BigDecimal platformDiscount = BigDecimal.ZERO;
        if (hasPlatformCode) {
            platformVoucher = voucherRepository.findByCodeIgnoreCase(platformVoucherCode.trim())
                    .orElseThrow(() -> new CustomException("Mã voucher sàn '" + platformVoucherCode + "' không tồn tại"));

            if (platformVoucher.getScope() != VoucherScope.PLATFORM) {
                throw new CustomException("Mã '" + platformVoucher.getCode() + "' không phải là Voucher của Sàn");
            }

            platformDiscount = validateAndGetDiscount(platformVoucher, user, shopId, safeSubtotal, safeShipping);
        }

        BigDecimal totalDiscount = shopDiscount.add(platformDiscount);
        BigDecimal maxAllowedDiscount = safeSubtotal.add(safeShipping);
        if (totalDiscount.compareTo(maxAllowedDiscount) > 0) {
            totalDiscount = maxAllowedDiscount;
        }

        BigDecimal finalTotal = safeSubtotal.add(safeShipping).subtract(totalDiscount);
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) {
            finalTotal = BigDecimal.ZERO;
        }

        List<VoucherResponse> appliedList = new ArrayList<>();
        if (shopVoucher != null) {
            appliedList.add(VoucherResponse.from(shopVoucher));
        }
        if (platformVoucher != null) {
            appliedList.add(VoucherResponse.from(platformVoucher));
        }

        String primaryCode = shopVoucher != null ? shopVoucher.getCode() : (platformVoucher != null ? platformVoucher.getCode() : null);
        String primaryTitle = shopVoucher != null ? shopVoucher.getTitle() : (platformVoucher != null ? platformVoucher.getTitle() : null);
        UUID primaryId = shopVoucher != null ? shopVoucher.getId() : (platformVoucher != null ? platformVoucher.getId() : null);

        return VoucherCalculationResponse.builder()
                .valid(true)
                .message("Áp dụng mã giảm giá thành công!")
                .voucherId(primaryId)
                .voucherCode(primaryCode)
                .code(primaryCode)
                .title(primaryTitle)
                .shopVoucherCode(shopVoucher != null ? shopVoucher.getCode() : null)
                .shopVoucherTitle(shopVoucher != null ? shopVoucher.getTitle() : null)
                .shopDiscountAmount(shopDiscount)
                .platformVoucherCode(platformVoucher != null ? platformVoucher.getCode() : null)
                .platformVoucherTitle(platformVoucher != null ? platformVoucher.getTitle() : null)
                .platformDiscountAmount(platformDiscount)
                .appliedVouchers(appliedList)
                .discountAmount(totalDiscount)
                .subtotal(safeSubtotal)
                .shippingFee(safeShipping)
                .finalTotal(finalTotal)
                .build();
    }

    private BigDecimal validateAndGetDiscount(
            Voucher voucher,
            User user,
            UUID shopId,
            BigDecimal subtotal,
            BigDecimal shippingFee) {

        if (!voucher.isCurrentlyActive()) {
            throw new CustomException("Voucher '" + voucher.getCode() + "' đã hết hạn hoặc hết lượt sử dụng");
        }

        BigDecimal eligibleSubtotal = subtotal;

        // Category-aware validation
        if (voucher.getCategory() != null && user != null) {
            Optional<Cart> cartOpt = cartRepository.findByUserIdWithItems(user.getId());
            if (cartOpt.isPresent()) {
                List<CartItem> matchingItems = cartOpt.get().getItems().stream()
                        .filter(i -> !Boolean.TRUE.equals(i.getDeleted()))
                        .filter(i -> shopId == null || (i.getProduct().getShop() != null
                                && i.getProduct().getShop().getId().equals(shopId)))
                        .filter(i -> isCategoryHierarchyMatch(i.getProduct().getProductCategory(),
                                voucher.getCategory()))
                        .toList();

                if (matchingItems.isEmpty()) {
                    throw new CustomException("Mã voucher '" + voucher.getCode()
                            + "' chỉ áp dụng cho sản phẩm thuộc ngành hàng: " + voucher.getCategory().getName());
                }

                eligibleSubtotal = matchingItems.stream()
                        .map(i -> i.getProduct().getBasePrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                if (voucher.getMinOrderValue() != null && eligibleSubtotal.compareTo(voucher.getMinOrderValue()) < 0) {
                    throw new CustomException("Tổng giá trị các sản phẩm thuộc ngành hàng '"
                            + voucher.getCategory().getName() + "' phải đạt tối thiểu "
                            + new IntlFormatHelper(voucher.getMinOrderValue()) + "đ để áp dụng voucher này");
                }
            }
        } else if (voucher.getMinOrderValue() != null && subtotal.compareTo(voucher.getMinOrderValue()) < 0) {
            throw new CustomException("Đơn hàng chưa đạt giá trị tối thiểu "
                    + voucher.getMinOrderValue() + "đ để áp dụng voucher '" + voucher.getCode() + "'");
        }

        boolean isFirstOrderVoucher = Boolean.TRUE.equals(voucher.getIsFirstOrderOnly())
                || "ECOMNEW15".equalsIgnoreCase(voucher.getCode());

        if (isFirstOrderVoucher) {
            if (user == null) {
                throw new CustomException("Vui lòng đăng nhập để sử dụng mã ưu đãi dành cho khách hàng mới.");
            }
            long completedOrders = orderRepository.countCompletedOrdersByUserId(user.getId());
            if (completedOrders > 0) {
                throw new CustomException("Mã giảm giá '" + voucher.getCode()
                        + "' chỉ dành riêng cho khách hàng mới chưa có đơn hàng hoàn thành nào.");
            }
        }

        if (user != null) {
            long usedCount = userVoucherRepository.countByUserIdAndVoucherIdAndStatus(user.getId(), voucher.getId(),
                    UserVoucherStatus.USED);
            int maxLimit = voucher.getUserUsageLimit() != null ? voucher.getUserUsageLimit() : 1;
            if (usedCount >= maxLimit) {
                throw new CustomException(
                        "Bạn đã sử dụng hết số lần cho phép đối với voucher '" + voucher.getCode() + "' (" + maxLimit + " lần)");
            }
        }

        return calculateDiscount(voucher, eligibleSubtotal, shippingFee);
    }

    @Override
    @Transactional
    public BigDecimal applyVoucherToOrder(Order order, String voucherCode) {
        if (voucherCode == null || voucherCode.isBlank()) {
            return BigDecimal.ZERO;
        }

        Voucher voucher = voucherRepository.findByCodeIgnoreCase(voucherCode.trim())
                .orElseThrow(() -> new CustomException("Mã voucher '" + voucherCode + "' không tồn tại"));

        if (voucher.getScope() == VoucherScope.SHOP) {
            return applyVouchersToOrder(order, voucher.getCode(), null);
        } else {
            return applyVouchersToOrder(order, null, voucher.getCode());
        }
    }

    @Override
    @Transactional
    public BigDecimal applyVouchersToOrder(Order order, String shopVoucherCode, String platformVoucherCode) {
        boolean hasShopCode = shopVoucherCode != null && !shopVoucherCode.isBlank();
        boolean hasPlatformCode = platformVoucherCode != null && !platformVoucherCode.isBlank();

        if (!hasShopCode && !hasPlatformCode) {
            return BigDecimal.ZERO;
        }

        User user = order.getUser();
        UUID shopId = order.getShop() != null ? order.getShop().getId() : null;
        BigDecimal subtotal = order.getSubtotal() != null ? order.getSubtotal() : BigDecimal.ZERO;
        BigDecimal shippingFee = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;

        BigDecimal shopDiscount = BigDecimal.ZERO;
        if (hasShopCode) {
            Voucher shopVoucher = voucherRepository.findByCodeIgnoreCase(shopVoucherCode.trim())
                    .orElseThrow(() -> new CustomException("Mã voucher shop '" + shopVoucherCode + "' không tồn tại"));

            if (shopVoucher.getScope() != VoucherScope.SHOP) {
                throw new CustomException("Voucher '" + shopVoucher.getCode() + "' không phải là Voucher của Shop");
            }
            if (shopVoucher.getShop() == null || !shopVoucher.getShop().getId().equals(shopId)) {
                throw new CustomException("Voucher này chỉ áp dụng cho Shop: "
                        + (shopVoucher.getShop() != null ? shopVoucher.getShop().getName() : ""));
            }

            shopDiscount = validateAndGetDiscount(shopVoucher, user, shopId, subtotal, shippingFee);

            // Update voucher usage count
            shopVoucher.setUsedCount(shopVoucher.getUsedCount() + 1);
            voucherRepository.save(shopVoucher);

            // Update or create UserVoucher record as USED
            recordUserVoucherUsed(user, shopVoucher, order);

            order.setShopVoucher(shopVoucher);
            order.setShopVoucherCode(shopVoucher.getCode());
            order.setShopDiscountAmount(shopDiscount);
        }

        BigDecimal platformDiscount = BigDecimal.ZERO;
        if (hasPlatformCode) {
            Voucher platformVoucher = voucherRepository.findByCodeIgnoreCase(platformVoucherCode.trim())
                    .orElseThrow(() -> new CustomException("Mã voucher sàn '" + platformVoucherCode + "' không tồn tại"));

            if (platformVoucher.getScope() != VoucherScope.PLATFORM) {
                throw new CustomException("Voucher '" + platformVoucher.getCode() + "' không phải là Voucher của Sàn");
            }

            platformDiscount = validateAndGetDiscount(platformVoucher, user, shopId, subtotal, shippingFee);

            // Update voucher usage count
            platformVoucher.setUsedCount(platformVoucher.getUsedCount() + 1);
            voucherRepository.save(platformVoucher);

            // Update or create UserVoucher record as USED
            recordUserVoucherUsed(user, platformVoucher, order);

            order.setPlatformVoucher(platformVoucher);
            order.setPlatformVoucherCode(platformVoucher.getCode());
            order.setPlatformDiscountAmount(platformDiscount);
        }

        BigDecimal totalDiscount = shopDiscount.add(platformDiscount);
        BigDecimal maxAllowed = subtotal.add(shippingFee);
        if (totalDiscount.compareTo(maxAllowed) > 0) {
            totalDiscount = maxAllowed;
        }

        order.setDiscountAmount(totalDiscount);

        // Populate backward-compatible fields
        if (order.getShopVoucher() != null) {
            order.setVoucher(order.getShopVoucher());
            order.setVoucherCode(order.getShopVoucherCode());
        } else if (order.getPlatformVoucher() != null) {
            order.setVoucher(order.getPlatformVoucher());
            order.setVoucherCode(order.getPlatformVoucherCode());
        }

        log.info("Vouchers applied to order {}: shopVoucher={}, platformVoucher={}, shopDiscount={}, platformDiscount={}, totalDiscount={}",
                order.getOrderNumber(), order.getShopVoucherCode(), order.getPlatformVoucherCode(),
                shopDiscount, platformDiscount, totalDiscount);

        return totalDiscount;
    }

    private void recordUserVoucherUsed(User user, Voucher voucher, Order order) {
        Optional<UserVoucher> existingUv = userVoucherRepository.findByUserIdAndVoucherIdAndStatus(
                user.getId(), voucher.getId(), UserVoucherStatus.UNUSED);

        UserVoucher uv;
        if (existingUv.isPresent()) {
            uv = existingUv.get();
            uv.setStatus(UserVoucherStatus.USED);
            uv.setOrder(order);
            uv.setUsedAt(LocalDateTime.now());
        } else {
            uv = UserVoucher.builder()
                    .user(user)
                    .voucher(voucher)
                    .status(UserVoucherStatus.USED)
                    .order(order)
                    .claimedAt(LocalDateTime.now())
                    .usedAt(LocalDateTime.now())
                    .build();
        }
        userVoucherRepository.save(uv);
    }

    @Override
    @Transactional
    public void rollbackVoucherUsage(Order order) {
        if (order.getShopVoucher() != null) {
            Voucher v = order.getShopVoucher();
            if (v.getUsedCount() > 0) {
                v.setUsedCount(v.getUsedCount() - 1);
                voucherRepository.save(v);
            }
        }

        if (order.getPlatformVoucher() != null) {
            Voucher v = order.getPlatformVoucher();
            if (v.getUsedCount() > 0) {
                v.setUsedCount(v.getUsedCount() - 1);
                voucherRepository.save(v);
            }
        }

        if (order.getVoucher() != null
                && (order.getShopVoucher() == null || !order.getShopVoucher().getId().equals(order.getVoucher().getId()))
                && (order.getPlatformVoucher() == null || !order.getPlatformVoucher().getId().equals(order.getVoucher().getId()))) {
            Voucher v = order.getVoucher();
            if (v.getUsedCount() > 0) {
                v.setUsedCount(v.getUsedCount() - 1);
                voucherRepository.save(v);
            }
        }

        List<UserVoucher> uvList = userVoucherRepository.findByOrderId(order.getId());
        for (UserVoucher uv : uvList) {
            uv.setStatus(UserVoucherStatus.UNUSED);
            uv.setOrder(null);
            uv.setUsedAt(null);
        }
        if (!uvList.isEmpty()) {
            userVoucherRepository.saveAll(uvList);
        }

        log.info("Rollback {} voucher(s) for cancelled order {}", uvList.size(), order.getOrderNumber());
    }

    @Override
    @Transactional
    public VoucherResponse createVoucher(UUID accountId, CreateVoucherRequest req) {
        User user = getUser(accountId);

        String code = req.getCode().trim().toUpperCase();
        if (voucherRepository.existsByCodeIgnoreCase(code)) {
            throw new CustomException("Mã voucher '" + code + "' đã tồn tại trên hệ thống");
        }

        Shop shop = null;
        VoucherScope scope = req.getScope() != null ? req.getScope() : VoucherScope.PLATFORM;

        if (scope == VoucherScope.SHOP) {
            if (req.getShopId() != null) {
                shop = shopRepository.findById(req.getShopId())
                        .orElseThrow(() -> new CustomException("Shop không tồn tại"));
            } else {
                shop = shopRepository.findByUserId(user.getId())
                        .orElseThrow(() -> new CustomException("Tài khoản chưa đăng ký Shop"));
            }
        }

        ProductCategory category = null;
        if (req.getCategoryId() != null) {
            category = productCategoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new CustomException("Không tìm thấy ngành hàng"));
        }

        Voucher voucher = Voucher.builder()
                .code(code)
                .title(req.getTitle().trim())
                .description(req.getDescription())
                .voucherType(req.getVoucherType())
                .discountValue(req.getDiscountValue())
                .maxDiscountAmount(req.getMaxDiscountAmount())
                .minOrderValue(req.getMinOrderValue())
                .usageLimit(req.getUsageLimit())
                .usedCount(0)
                .userUsageLimit(req.getUserUsageLimit() != null ? req.getUserUsageLimit() : 1)
                .startDate(req.getStartDate() != null ? req.getStartDate() : LocalDateTime.now())
                .endDate(req.getEndDate())
                .status(VoucherStatus.ACTIVE)
                .scope(scope)
                .shop(shop)
                .category(category)
                .isFirstOrderOnly(req.getIsFirstOrderOnly() != null ? req.getIsFirstOrderOnly() : false)
                .build();

        voucher = voucherRepository.save(voucher);
        return VoucherResponse.from(voucher);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VoucherResponse> getShopManageVouchers(UUID accountId) {
        User user = getUser(accountId);
        Shop shop = shopRepository.findByUserId(user.getId())
                .orElseThrow(() -> new CustomException("Tài khoản chưa sở hữu Shop nào"));

        List<Voucher> vouchers = voucherRepository.findByShopIdOrderByCreatedAtDesc(shop.getId());
        return vouchers.stream().map(VoucherResponse::from).toList();
    }

    private boolean isCategoryHierarchyMatch(ProductCategory productCategory, ProductCategory targetCategory) {
        if (productCategory == null || targetCategory == null) {
            return false;
        }
        ProductCategory cur = productCategory;
        while (cur != null) {
            if (cur.getId().equals(targetCategory.getId())) {
                return true;
            }
            cur = cur.getParent();
        }
        return false;
    }

    private BigDecimal calculateDiscount(Voucher voucher, BigDecimal eligibleSubtotal, BigDecimal shippingFee) {
        BigDecimal discount = BigDecimal.ZERO;

        switch (voucher.getVoucherType()) {
            case PERCENTAGE -> {
                BigDecimal rate = voucher.getDiscountValue().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
                discount = eligibleSubtotal.multiply(rate).setScale(0, RoundingMode.HALF_UP);
                if (voucher.getMaxDiscountAmount() != null && discount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                    discount = voucher.getMaxDiscountAmount();
                }
                if (discount.compareTo(eligibleSubtotal) > 0) {
                    discount = eligibleSubtotal;
                }
            }
            case FIXED_AMOUNT -> {
                discount = voucher.getDiscountValue();
                if (discount.compareTo(eligibleSubtotal) > 0) {
                    discount = eligibleSubtotal;
                }
            }
            case FREE_SHIPPING -> {
                if (voucher.getDiscountValue() != null && voucher.getDiscountValue().compareTo(BigDecimal.ZERO) > 0) {
                    discount = voucher.getDiscountValue().min(shippingFee);
                } else {
                    discount = shippingFee;
                }
            }
        }
        return discount;
    }

    private User getUser(UUID accountId) {
        if (accountId == null) {
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này");
        }
        return userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin người dùng"));
    }

    private Set<UUID> getClaimedVoucherIds(UUID accountId) {
        if (accountId == null) {
            return Collections.emptySet();
        }
        try {
            User user = getUser(accountId);
            List<UserVoucher> uvList = userVoucherRepository.findByUserIdAndStatusOrderByCreatedAtDesc(
                    user.getId(), UserVoucherStatus.UNUSED);
            Set<UUID> set = new HashSet<>();
            for (UserVoucher uv : uvList) {
                set.add(uv.getVoucher().getId());
            }
            return set;
        } catch (Exception e) {
            return Collections.emptySet();
        }
    }

    private static class IntlFormatHelper {
        private final BigDecimal val;

        IntlFormatHelper(BigDecimal val) {
            this.val = val;
        }

        @Override
        public String toString() {
            return val != null ? val.stripTrailingZeros().toPlainString() : "0";
        }
    }
}
