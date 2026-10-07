package com.marketplace.ecommerce.platform.service;

import com.marketplace.ecommerce.platform.dto.CommissionRateBreakdown;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.valueObjects.ConditionGrade;
import com.marketplace.ecommerce.shop.entity.Shop;

import java.math.BigDecimal;

public interface CommissionCalculationService {

    CommissionRateBreakdown calculateRateBreakdown(Shop shop, ProductCategory category, ConditionGrade conditionGrade);

    BigDecimal calculateFinalRate(Shop shop, ProductCategory category, ConditionGrade conditionGrade);
}
