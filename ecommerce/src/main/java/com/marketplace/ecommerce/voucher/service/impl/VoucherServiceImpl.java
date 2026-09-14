package com.marketplace.ecommerce.voucher.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
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
        List<UserVoucher> userVouchers = userVoucherRepository.findMyVouchersWithDetails(user.getId(), UserVoucherStatus.UNUSED);

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

        long userClaimCount = userVoucherRepository.countByUserIdAndVoucherIdAndStatus(user.getId(), voucher.getId(), UserVoucherStatus.UNUSED);
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
            BigDecimal shippingFee
    ) {
        if (voucherCode == null || voucherCode.isBlank()) {
            throw new CustomException("Mã voucher không được để trống");
        }

        Voucher voucher = voucherRepository.findByCodeIgnoreCase(voucherCode.trim())
                .orElseThrow(() -> new CustomException("Mã voucher '" + voucherCode + "' không tồn tại"));

        if (!voucher.isCurrentlyActive()) {
            throw new CustomException("Voucher '" + voucher.getCode() + "' đã hết hạn hoặc hết lượt sử dụng");
        }

        if (voucher.getScope() == VoucherScope.SHOP) {
            if (voucher.getShop() == null || !voucher.getShop().getId().equals(shopId)) {
                throw new CustomException("Voucher '" + voucher.getCode() + "' chỉ áp dụng cho sản phẩm của shop: "
                        + (voucher.getShop() != null ? voucher.getShop().getName() : "khác"));
            }
        }

        BigDecimal safeSubtotal = subtotal != null ? subtotal : BigDecimal.ZERO;
        BigDecimal safeShipping = shippingFee != null ? shippingFee : BigDecimal.ZERO;

        if (voucher.getMinOrderValue() != null && safeSubtotal.compareTo(voucher.getMinOrderValue()) < 0) {
            throw new CustomException("Đơn hàng chưa đạt giá trị tối thiểu "
                    + voucher.getMinOrderValue() + "đ để áp dụng voucher này");
        }

        if (accountId != null) {
            User user = getUser(accountId);
            long usedCount = userVoucherRepository.countByUserIdAndVoucherIdAndStatus(user.getId(), voucher.getId(), UserVoucherStatus.USED);
            int maxLimit = voucher.getUserUsageLimit() != null ? voucher.getUserUsageLimit() : 1;
            if (usedCount >= maxLimit) {
                throw new CustomException("Bạn đã sử dụng hết số lần cho phép đối với voucher này (" + maxLimit + " lần)");
            }
        }

        BigDecimal discountAmount = calculateDiscount(voucher, safeSubtotal, safeShipping);
        BigDecimal finalTotal = safeSubtotal.add(safeShipping).subtract(discountAmount);
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) {
            finalTotal = BigDecimal.ZERO;
        }

        return VoucherCalculationResponse.builder()
                .valid(true)
                .message("Áp dụng mã giảm giá thành công!")
                .voucherId(voucher.getId())
                .voucherCode(voucher.getCode())
                .title(voucher.getTitle())
                .discountAmount(discountAmount)
                .subtotal(safeSubtotal)
                .shippingFee(safeShipping)
                .finalTotal(finalTotal)
                .build();
    }

    @Override
    @Transactional
    public BigDecimal applyVoucherToOrder(Order order, String voucherCode) {
        if (voucherCode == null || voucherCode.isBlank()) {
            return BigDecimal.ZERO;
        }

        Voucher voucher = voucherRepository.findByCodeIgnoreCase(voucherCode.trim())
                .orElseThrow(() -> new CustomException("Mã voucher '" + voucherCode + "' không tồn tại"));

        if (!voucher.isCurrentlyActive()) {
            throw new CustomException("Voucher '" + voucher.getCode() + "' đã hết hạn hoặc hết lượt sử dụng");
        }

        if (voucher.getScope() == VoucherScope.SHOP) {
            if (voucher.getShop() == null || !voucher.getShop().getId().equals(order.getShop().getId())) {
                throw new CustomException("Voucher này chỉ áp dụng cho Shop: "
                        + (voucher.getShop() != null ? voucher.getShop().getName() : ""));
            }
        }

        BigDecimal subtotal = order.getSubtotal() != null ? order.getSubtotal() : BigDecimal.ZERO;
        BigDecimal shippingFee = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;

        if (voucher.getMinOrderValue() != null && subtotal.compareTo(voucher.getMinOrderValue()) < 0) {
            throw new CustomException("Đơn hàng chưa đạt giá trị tối thiểu " + voucher.getMinOrderValue() + "đ để dùng voucher");
        }

        User user = order.getUser();
        long usedCount = userVoucherRepository.countByUserIdAndVoucherIdAndStatus(user.getId(), voucher.getId(), UserVoucherStatus.USED);
        int maxLimit = voucher.getUserUsageLimit() != null ? voucher.getUserUsageLimit() : 1;
        if (usedCount >= maxLimit) {
            throw new CustomException("Bạn đã dùng hết số lần cho phép của voucher này");
        }

        BigDecimal discountAmount = calculateDiscount(voucher, subtotal, shippingFee);

        // Update voucher usage count
        voucher.setUsedCount(voucher.getUsedCount() + 1);
        voucherRepository.save(voucher);

        // Update or create UserVoucher record as USED
        Optional<UserVoucher> existingUv = userVoucherRepository.findByUserIdAndVoucherIdAndStatus(
                user.getId(), voucher.getId(), UserVoucherStatus.UNUSED
        );

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

        order.setVoucher(voucher);
        order.setDiscountAmount(discountAmount);
        log.info("Voucher {} applied to order {}: discount={}", voucher.getCode(), order.getOrderNumber(), discountAmount);

        return discountAmount;
    }

    @Override
    @Transactional
    public void rollbackVoucherUsage(Order order) {
        if (order.getVoucher() == null) {
            return;
        }

        Voucher voucher = order.getVoucher();
        if (voucher.getUsedCount() > 0) {
            voucher.setUsedCount(voucher.getUsedCount() - 1);
            voucherRepository.save(voucher);
        }

        Optional<UserVoucher> uvOpt = userVoucherRepository.findByOrderId(order.getId());
        if (uvOpt.isPresent()) {
            UserVoucher uv = uvOpt.get();
            uv.setStatus(UserVoucherStatus.UNUSED);
            uv.setOrder(null);
            uv.setUsedAt(null);
            userVoucherRepository.save(uv);
        }

        log.info("Rollback voucher {} for cancelled order {}", voucher.getCode(), order.getOrderNumber());
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

    private BigDecimal calculateDiscount(Voucher voucher, BigDecimal subtotal, BigDecimal shippingFee) {
        BigDecimal discount = BigDecimal.ZERO;

        switch (voucher.getVoucherType()) {
            case PERCENTAGE -> {
                BigDecimal rate = voucher.getDiscountValue().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
                discount = subtotal.multiply(rate).setScale(0, RoundingMode.HALF_UP);
                if (voucher.getMaxDiscountAmount() != null && discount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                    discount = voucher.getMaxDiscountAmount();
                }
                if (discount.compareTo(subtotal) > 0) {
                    discount = subtotal;
                }
            }
            case FIXED_AMOUNT -> {
                discount = voucher.getDiscountValue();
                if (discount.compareTo(subtotal) > 0) {
                    discount = subtotal;
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
                    user.getId(), UserVoucherStatus.UNUSED
            );
            Set<UUID> set = new HashSet<>();
            for (UserVoucher uv : uvList) {
                set.add(uv.getVoucher().getId());
            }
            return set;
        } catch (Exception e) {
            return Collections.emptySet();
        }
    }
}
