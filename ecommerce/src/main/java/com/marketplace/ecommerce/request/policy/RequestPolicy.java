package com.marketplace.ecommerce.request.policy;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.SellerRepository;
import com.marketplace.ecommerce.request.valueObjects.ApproveSellerContext;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class RequestPolicy {
    private final ReportRepository reportRepository;
    private final SellerRepository sellerRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;

    public TargetType resolve(UUID targetId) {
        List<String> types = reportRepository.resolveTargetTypes(targetId);

        if (types == null || types.isEmpty()) {
            throw new CustomException("Target not found: " + targetId);
        }
        if (types.size() > 1) {
            throw new CustomException("Target is ambiguous (matches multiple types): " + targetId);
        }

        try {
            return TargetType.valueOf(types.get(0));
        } catch (IllegalArgumentException ex) {
            throw new CustomException("Invalid target type returned from DB: " + types.get(0));
        }
    }

    public ApproveSellerContext validateApproveSellerRequest(Request req, UUID requestId) {

        if (req.getStatus() != RequestStatus.PENDING) {
            throw new CustomException("Only PENDING request can be approved");
        }

        Account ownerAccount = req.getAccount();
        if (ownerAccount == null) {
            throw new CustomException("Request has no owner account");
        }

        User user = userRepository.findByAccountId(ownerAccount.getId())
                .orElseThrow(() -> new CustomException("User profile not found for account: " + ownerAccount.getId()));
        if (shopRepository.existsByUserId(user.getId())) {
            throw new CustomException("This user already has a shop");
        }

        Seller sellerDetail = sellerRepository.findById(requestId)
                .orElseThrow(() -> new CustomException("Seller detail not found: " + requestId));

        String shopName = sellerDetail.getShopName();
        if (shopName == null || shopName.trim().isEmpty()) {
            throw new CustomException("Shop name is required");
        }

        if (shopRepository.existsByNameIgnoreCase(shopName)) {
            throw new CustomException("Shop name already exists: " + shopName);
        }
        return new ApproveSellerContext(user, sellerDetail, shopName.trim());
    }
}
