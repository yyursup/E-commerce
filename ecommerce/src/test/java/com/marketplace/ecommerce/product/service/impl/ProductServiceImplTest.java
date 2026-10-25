package com.marketplace.ecommerce.product.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.dto.request.CreateProductRequest;
import com.marketplace.ecommerce.product.dto.request.ProductImageRequest;
import com.marketplace.ecommerce.product.dto.request.ProductVariantRequest;
import com.marketplace.ecommerce.product.dto.request.UpdateProductRequest;
import com.marketplace.ecommerce.product.dto.response.SellerProductResponse;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.repository.ProductCategoryRepository;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.service.InventoryHistoryService;
import com.marketplace.ecommerce.product.service.ProductImageService;
import com.marketplace.ecommerce.product.validate.ProductValidation;
import com.marketplace.ecommerce.product.valueObjects.ConditionGrade;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.product.valueObjects.WarrantyType;
import com.marketplace.ecommerce.request.valueObjects.SellerType;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
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
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ShopRepository shopRepository;
    @Mock
    private ProductImageService productImageService;
    @Mock
    private ProductCategoryRepository productCategoryRepository;
    @Mock
    private InventoryHistoryService inventoryHistoryService;
    @Mock
    private ProductValidation productValidation;

    @InjectMocks
    private ProductServiceImpl productService;

    private UUID accountId;
    private User sampleUser;
    private Shop sampleShop;
    private ProductCategory sampleCategory;
    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();

        Account account = new Account();
        account.setId(accountId);
        account.setDisciplineLevel(DisciplineLevel.NONE);

        sampleUser = new User();
        sampleUser.setId(UUID.randomUUID());
        sampleUser.setAccount(account);

        sampleShop = new Shop();
        sampleShop.setId(UUID.randomUUID());
        sampleShop.setUser(sampleUser);
        sampleShop.setStatus(ShopStatus.ACTIVE);
        sampleShop.setSellerType(SellerType.BUSINESS);
        sampleShop.setTrustLevel(3);

        sampleCategory = new ProductCategory();
        sampleCategory.setId(UUID.randomUUID());
        sampleCategory.setName("Laptop");

        sampleProduct = Product.builder()
                .id(UUID.randomUUID())
                .shop(sampleShop)
                .productCategory(sampleCategory)
                .name("MacBook Pro M3")
                .sku("MBP-M3-001")
                .basePrice(BigDecimal.valueOf(30000000))
                .quantity(10)
                .status(ProductStatus.PENDING_APPROVAL)
                .deleted(false)
                .build();
    }

    @Test
    @DisplayName("createProduct tự động duyệt PUBLISHED cho Shop doanh nghiệp đăng hàng Brand New")
    void testCreateProduct_AutoPublish() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));

        CreateProductRequest req = new CreateProductRequest();
        req.setName("iPhone 15 Pro Max");
        req.setSku("IP15-PM-01");
        req.setBasePrice(BigDecimal.valueOf(25000000));
        req.setStockQuantity(5);
        req.setCategoryId(sampleCategory.getId());
        req.setConditionGrade(ConditionGrade.GRADE_NEW);

        when(productRepository.existsBySkuAndDeletedFalse("IP15-PM-01")).thenReturn(false);
        when(productCategoryRepository.findById(sampleCategory.getId())).thenReturn(Optional.of(sampleCategory));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> {
            Product p = inv.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });

        SellerProductResponse res = productService.createProduct(accountId, req);
        assertNotNull(res);
        assertEquals(ProductStatus.PUBLISHED.name(), res.getStatus());
        verify(productValidation).validateVariants(req.getVariants());
    }

    @Test
    @DisplayName("createProduct chuyển sang PENDING_APPROVAL khi phát hiện từ khóa nghi vấn")
    void testCreateProduct_BannedKeyword() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));

        CreateProductRequest req = new CreateProductRequest();
        req.setName("Tai nghe AirPods Pro hàng rep 1:1 siêu xịn");
        req.setDescription("Bao check hàng nhái đổi mới");
        req.setSku("AP-REP-01");
        req.setBasePrice(BigDecimal.valueOf(300000));
        req.setStockQuantity(20);
        req.setCategoryId(sampleCategory.getId());
        req.setConditionGrade(ConditionGrade.GRADE_NEW);

        when(productRepository.existsBySkuAndDeletedFalse("AP-REP-01")).thenReturn(false);
        when(productCategoryRepository.findById(sampleCategory.getId())).thenReturn(Optional.of(sampleCategory));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        SellerProductResponse res = productService.createProduct(accountId, req);
        assertEquals(ProductStatus.PENDING_APPROVAL.name(), res.getStatus());
    }

    @Test
    @DisplayName("createProduct ném lỗi khi SKU đã tồn tại")
    void testCreateProduct_DuplicateSku() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));

        CreateProductRequest req = new CreateProductRequest();
        req.setSku("EXISTING-SKU");
        when(productRepository.existsBySkuAndDeletedFalse("EXISTING-SKU")).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () -> productService.createProduct(accountId, req));
        assertTrue(ex.getMessage().contains("SKU already exists"));
    }

    @Test
    @DisplayName("deleteProduct soft-delete thành công")
    void testDeleteProduct_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));
        when(productRepository.softDeleteByAccountId(sampleProduct.getId(), accountId)).thenReturn(1);

        assertDoesNotThrow(() -> productService.deleteProduct(accountId, sampleProduct.getId()));
    }

    @Test
    @DisplayName("approveProduct chuyển trạng thái PENDING_APPROVAL sang PUBLISHED")
    void testApproveProduct() {
        when(productRepository.findByIdAndDeletedFalse(sampleProduct.getId())).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        SellerProductResponse res = productService.approveProduct(accountId, sampleProduct.getId());
        assertEquals(ProductStatus.PUBLISHED.name(), res.getStatus());
        assertEquals(accountId, sampleProduct.getReviewedBy());
    }

    @Test
    @DisplayName("rejectProduct chuyển trạng thái PENDING_APPROVAL sang REJECTED kèm lý do")
    void testRejectProduct() {
        when(productRepository.findByIdAndDeletedFalse(sampleProduct.getId())).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        SellerProductResponse res = productService.rejectProduct(accountId, sampleProduct.getId(), "Ảnh chụp mờ");
        assertEquals(ProductStatus.REJECTED.name(), res.getStatus());
        assertEquals("Ảnh chụp mờ", sampleProduct.getRejectionReason());
    }

    @Test
    @DisplayName("deactivateProductsOnShopClose cập nhật toàn bộ sản phẩm của shop sang INACTIVE")
    void testDeactivateProductsOnShopClose() {
        productService.deactivateProductsOnShopClose(null); // Không ném lỗi khi shopId null
        UUID shopId = UUID.randomUUID();
        productService.deactivateProductsOnShopClose(shopId);

        verify(productRepository).updateStatusByShopId(
                eq(shopId),
                eq(List.of(ProductStatus.PUBLISHED, ProductStatus.PENDING_APPROVAL)),
                eq(ProductStatus.INACTIVE),
                any()
        );
    }

    @Test
    @DisplayName("updateProduct cập nhật đầy đủ các trường cơ bản, phân loại và trạng thái")
    void testUpdateProduct_Success() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));
        when(productRepository.findByIdAndDeletedFalse(sampleProduct.getId())).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateProductRequest req = new UpdateProductRequest();
        req.setName("MacBook Pro M3 Max 36GB");
        req.setDescription("Bản nâng cấp RAM");
        req.setBasePrice(BigDecimal.valueOf(45000000));
        req.setStockQuantity(15);
        req.setStatus("PUBLISHED");
        req.setSku("MBP-M3-001"); // Giữ nguyên SKU

        ProductVariantRequest vReq = new ProductVariantRequest();
        vReq.setColor("Space Black");
        vReq.setSize("16 inch");
        vReq.setPrice(BigDecimal.valueOf(45000000));
        vReq.setStock(15);
        req.setVariants(List.of(vReq));

        SellerProductResponse res = productService.updateProduct(accountId, sampleProduct.getId(), req);
        assertNotNull(res);
        assertEquals("MacBook Pro M3 Max 36GB", sampleProduct.getName());
        assertEquals(15, sampleProduct.getQuantity());
        verify(productValidation).validateVariants(req.getVariants());
        verify(inventoryHistoryService, atLeastOnce()).logInventoryChange(any(), any(), any(), anyInt(), anyInt(), any(), any(), any());
    }

    @Test
    @DisplayName("updateProduct ném lỗi khi không phải chủ shop, SKU bị trùng, hoặc hơn 1 ảnh thumbnail")
    void testUpdateProduct_Errors() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));

        // 1. Không phải chủ sở hữu sản phẩm
        Shop otherShop = Shop.builder().id(UUID.randomUUID()).build();
        Product otherProduct = Product.builder().id(UUID.randomUUID()).shop(otherShop).build();
        when(productRepository.findByIdAndDeletedFalse(otherProduct.getId())).thenReturn(Optional.of(otherProduct));

        UpdateProductRequest req = new UpdateProductRequest();
        assertThrows(CustomException.class, () -> productService.updateProduct(accountId, otherProduct.getId(), req));

        // 2. Trùng SKU
        when(productRepository.findByIdAndDeletedFalse(sampleProduct.getId())).thenReturn(Optional.of(sampleProduct));
        req.setSku("EXISTING_ANOTHER_SKU");
        when(productRepository.existsBySkuAndDeletedFalse("EXISTING_ANOTHER_SKU")).thenReturn(true);
        assertThrows(CustomException.class, () -> productService.updateProduct(accountId, sampleProduct.getId(), req));

        // 3. Status không hợp lệ
        req.setSku(null);
        req.setStatus("INVALID_STATUS");
        assertThrows(CustomException.class, () -> productService.updateProduct(accountId, sampleProduct.getId(), req));

        // 4. Category không tìm thấy
        req.setStatus(null);
        UUID randomCatId = UUID.randomUUID();
        req.setCategoryId(randomCatId);
        when(productCategoryRepository.findById(randomCatId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> productService.updateProduct(accountId, sampleProduct.getId(), req));

        // 5. Nhiều hơn 1 thumbnail
        req.setCategoryId(null);
        ProductImageRequest img1 = new ProductImageRequest(UUID.randomUUID(), "img1.jpg", true, 0);
        ProductImageRequest img2 = new ProductImageRequest(UUID.randomUUID(), "img2.jpg", true, 1);
        req.setImages(List.of(img1, img2));
        assertThrows(CustomException.class, () -> productService.updateProduct(accountId, sampleProduct.getId(), req));
    }

    @Test
    @DisplayName("toggleFeatured bật/tắt nổi bật và giới hạn tối đa 5 sản phẩm")
    void testToggleFeatured() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));
        when(productRepository.findByIdAndDeletedFalse(sampleProduct.getId())).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        // Bật nổi bật khi chưa đạt giới hạn
        when(productRepository.countByShopIdAndFeaturedTrueAndDeletedFalse(sampleShop.getId())).thenReturn(3L);
        sampleProduct.setFeatured(false);

        SellerProductResponse res = productService.toggleFeatured(accountId, sampleProduct.getId());
        assertTrue(sampleProduct.isFeatured());

        // Ném lỗi khi đã đủ 5 sản phẩm nổi bật
        sampleProduct.setFeatured(false);
        when(productRepository.countByShopIdAndFeaturedTrueAndDeletedFalse(sampleShop.getId())).thenReturn(5L);
        assertThrows(CustomException.class, () -> productService.toggleFeatured(accountId, sampleProduct.getId()));
    }

    @Test
    @DisplayName("getPendingProducts lấy danh sách sản phẩm chờ duyệt")
    void testGetPendingProducts() {
        when(productRepository.findByStatusAndDeletedFalseOrderByCreatedAtDesc(ProductStatus.PENDING_APPROVAL))
                .thenReturn(List.of(sampleProduct));

        List<SellerProductResponse> list = productService.getPendingProducts();
        assertNotNull(list);
        assertEquals(1, list.size());
    }

    @Test
    @DisplayName("getShopByAccountId các trường hợp lỗi quyền hạn và trạng thái gian hàng")
    void testGetShopByAccountId_Errors() {
        // User không tồn tại
        UUID notFoundAcc = UUID.randomUUID();
        when(userRepository.findByAccountId(notFoundAcc)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> productService.deleteProduct(notFoundAcc, sampleProduct.getId()));

        // Shop không tồn tại
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> productService.deleteProduct(accountId, sampleProduct.getId()));

        // Account bị BANNED/SUSPENDED
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));
        sampleUser.getAccount().setDisciplineLevel(DisciplineLevel.BANNED);
        assertThrows(CustomException.class, () -> productService.deleteProduct(accountId, sampleProduct.getId()));

        sampleUser.getAccount().setDisciplineLevel(DisciplineLevel.SUSPENDED);
        assertThrows(CustomException.class, () -> productService.deleteProduct(accountId, sampleProduct.getId()));

        // Shop bị CLOSED
        sampleUser.getAccount().setDisciplineLevel(DisciplineLevel.NONE);
        sampleShop.setStatus(ShopStatus.CLOSED);
        assertThrows(CustomException.class, () -> productService.deleteProduct(accountId, sampleProduct.getId()));

        // Shop PENDING_DEPOSIT
        sampleShop.setStatus(ShopStatus.PENDING_DEPOSIT);
        assertThrows(CustomException.class, () -> productService.deleteProduct(accountId, sampleProduct.getId()));
    }

    @Test
    @DisplayName("determineInitialProductStatus cho flycam/drone và hàng đã qua sử dụng")
    void testDetermineInitialProductStatus_SpecialRules() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));
        when(productRepository.existsBySkuAndDeletedFalse(anyString())).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        // 1. Danh mục Flycam / Drone -> PENDING_APPROVAL
        ProductCategory droneCategory = new ProductCategory();
        droneCategory.setId(UUID.randomUUID());
        droneCategory.setName("Thiết bị bay Drone Flycam");
        when(productCategoryRepository.findById(droneCategory.getId())).thenReturn(Optional.of(droneCategory));

        CreateProductRequest req1 = new CreateProductRequest();
        req1.setName("DJI Mini 4 Pro");
        req1.setSku("DJI-M4P");
        req1.setBasePrice(BigDecimal.valueOf(20000000));
        req1.setStockQuantity(5);
        req1.setCategoryId(droneCategory.getId());
        req1.setConditionGrade(ConditionGrade.GRADE_NEW);

        SellerProductResponse res1 = productService.createProduct(accountId, req1);
        assertEquals(ProductStatus.PENDING_APPROVAL.name(), res1.getStatus());

        // 2. Hàng cũ (Like New 99%) -> PENDING_APPROVAL
        when(productCategoryRepository.findById(sampleCategory.getId())).thenReturn(Optional.of(sampleCategory));
        CreateProductRequest req2 = new CreateProductRequest();
        req2.setName("iPhone 14 Like New");
        req2.setSku("IP14-99");
        req2.setBasePrice(BigDecimal.valueOf(12000000));
        req2.setStockQuantity(2);
        req2.setCategoryId(sampleCategory.getId());
        req2.setConditionGrade(ConditionGrade.GRADE_LIKE_NEW);

        SellerProductResponse res2 = productService.createProduct(accountId, req2);
        assertEquals(ProductStatus.PENDING_APPROVAL.name(), res2.getStatus());
    }

    @Test
    @DisplayName("approveProduct và rejectProduct kiểm duyệt sản phẩm thành công và các lỗi liên quan")
    void testApproveAndRejectProduct() {
        UUID adminId = UUID.randomUUID();
        UUID prodId = sampleProduct.getId();
        sampleProduct.setStatus(ProductStatus.PENDING_APPROVAL);

        when(productRepository.findByIdAndDeletedFalse(prodId)).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        // Approve thành công
        SellerProductResponse approved = productService.approveProduct(adminId, prodId);
        assertEquals(ProductStatus.PUBLISHED.name(), approved.getStatus());

        // Approve lỗi khi status không phải PENDING_APPROVAL
        assertThrows(CustomException.class, () -> productService.approveProduct(adminId, prodId));

        // Reject thành công
        sampleProduct.setStatus(ProductStatus.PENDING_APPROVAL);
        SellerProductResponse rejected = productService.rejectProduct(adminId, prodId, "Ảnh chụp bị mờ");
        assertEquals(ProductStatus.REJECTED.name(), rejected.getStatus());
        assertEquals("Ảnh chụp bị mờ", sampleProduct.getRejectionReason());

        // Reject với default reason
        sampleProduct.setStatus(ProductStatus.PENDING_APPROVAL);
        productService.rejectProduct(adminId, prodId, "");
        assertEquals("Không đạt tiêu chuẩn kiểm duyệt của sàn", sampleProduct.getRejectionReason());

        // Reject lỗi khi status không phải PENDING_APPROVAL
        assertThrows(CustomException.class, () -> productService.rejectProduct(adminId, prodId, "Lỗi"));

        // Không tìm thấy sản phẩm
        UUID notFound = UUID.randomUUID();
        when(productRepository.findByIdAndDeletedFalse(notFound)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> productService.approveProduct(adminId, notFound));
        assertThrows(CustomException.class, () -> productService.rejectProduct(adminId, notFound, "Lý do"));
    }

    @Test
    @DisplayName("deleteProduct ném ngoại lệ khi không có quyền hoặc sản phẩm không tìm thấy (updated == 0)")
    void testDeleteProduct_UpdatedZero() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));
        when(productRepository.softDeleteByAccountId(sampleProduct.getId(), accountId)).thenReturn(0);

        CustomException ex = assertThrows(CustomException.class, () -> productService.deleteProduct(accountId, sampleProduct.getId()));
        assertTrue(ex.getMessage().contains("Product can not found or you don't have permission"));
    }

    @Test
    @DisplayName("createProduct bao phủ biến thể, thông tin bảo hành, tình trạng máy và category không tìm thấy")
    void testCreateProduct_WithVariantsAndSpecs() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));

        // Category not found
        CreateProductRequest reqMissingCat = new CreateProductRequest();
        reqMissingCat.setCategoryId(UUID.randomUUID());
        reqMissingCat.setSku("SKU-1");
        when(productCategoryRepository.findById(reqMissingCat.getCategoryId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> productService.createProduct(accountId, reqMissingCat));

        // Full Create with variants
        CreateProductRequest req = new CreateProductRequest();
        req.setName("iPad Pro M4");
        req.setDescription("Bản 256GB Wifi");
        req.setSku("IPAD-M4-256");
        req.setBasePrice(BigDecimal.valueOf(25000000));
        req.setStockQuantity(10);
        req.setCategoryId(sampleCategory.getId());
        req.setConditionGrade(ConditionGrade.GRADE_NEW);
        req.setWarrantyType(WarrantyType.OFFICIAL);
        req.setWarrantyMonths(24);
        req.setBatteryHealth(100);
        req.setIsRepaired(false);
        req.setRepairDetails("Chưa sửa chữa");
        req.setSpecifications("{\"ram\":\"8GB\"}");

        ProductVariantRequest vr = new ProductVariantRequest();
        vr.setColor("Bạc");
        vr.setSize("11 inch");
        vr.setPrice(BigDecimal.valueOf(25000000));
        vr.setStock(10);
        req.setVariants(List.of(vr));

        when(productCategoryRepository.findById(sampleCategory.getId())).thenReturn(Optional.of(sampleCategory));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        SellerProductResponse res = productService.createProduct(accountId, req);
        assertNotNull(res);
        verify(inventoryHistoryService, atLeast(2)).logInventoryChange(any(), any(), any(), anyInt(), anyInt(), any(), any(), any());
    }

    @Test
    @DisplayName("updateProduct bao phủ toàn bộ applyBasicFields, applyVariants (cũ, mới, cập nhật kho) và applyImages")
    void testUpdateProduct_ComprehensiveVariantsAndImages() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));
        when(productRepository.findByIdAndDeletedFalse(sampleProduct.getId())).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        // Chuẩn bị variant có sẵn
        UUID existingVarId = UUID.randomUUID();
        com.marketplace.ecommerce.product.entity.ProductVariant existingVar = com.marketplace.ecommerce.product.entity.ProductVariant.builder()
                .id(existingVarId)
                .product(sampleProduct)
                .color("Cũ")
                .size("Nhỏ")
                .price(BigDecimal.valueOf(1000000))
                .stock(5)
                .deleted(false)
                .build();
        sampleProduct.getVariants().add(existingVar);

        UpdateProductRequest req = new UpdateProductRequest();
        req.setName("MacBook Pro M3 Max Đầy Đủ");
        req.setDescription("Mô tả chi tiết");
        req.setBasePrice(BigDecimal.valueOf(50000000));
        req.setStockQuantity(20);
        req.setConditionGrade(ConditionGrade.GRADE_LIKE_NEW);
        req.setWarrantyType(WarrantyType.SHOP);
        req.setWarrantyMonths(6);
        req.setBatteryHealth(95);
        req.setIsRepaired(true);
        req.setRepairDetails("Thay pin");
        req.setSpecifications("{\"chip\":\"M3 Max\"}");

        // Cập nhật category
        UUID newCatId = UUID.randomUUID();
        ProductCategory newCat = new ProductCategory();
        newCat.setId(newCatId);
        newCat.setName("Máy tính xách tay cao cấp");
        req.setCategoryId(newCatId);
        when(productCategoryRepository.findById(newCatId)).thenReturn(Optional.of(newCat));

        // Images: 1 thumbnail, 1 ảnh thường (displayOrder null)
        ProductImageRequest img1 = new ProductImageRequest(UUID.randomUUID(), "thumb.jpg", true, 0);
        ProductImageRequest img2 = new ProductImageRequest(UUID.randomUUID(), "detail.jpg", false, null);
        req.setImages(List.of(img1, img2));

        // Variants: 1 variant cũ đổi kho (5 -> 12), 1 variant mới (id null)
        ProductVariantRequest vrOld = new ProductVariantRequest();
        vrOld.setId(existingVarId);
        vrOld.setColor("Xám Không Gian");
        vrOld.setSize("16 inch");
        vrOld.setPrice(BigDecimal.valueOf(52000000));
        vrOld.setStock(12);

        ProductVariantRequest vrNew = new ProductVariantRequest();
        vrNew.setId(null);
        vrNew.setColor("Bạc");
        vrNew.setSize("16 inch");
        vrNew.setPrice(BigDecimal.valueOf(52000000));
        vrNew.setStock(8);

        req.setVariants(List.of(vrOld, vrNew));

        SellerProductResponse res = productService.updateProduct(accountId, sampleProduct.getId(), req);
        assertNotNull(res);
        assertEquals(2, sampleProduct.getImages().size());
        assertEquals(2, sampleProduct.getVariants().size());
        assertFalse(existingVar.getDeleted());
        assertEquals(12, existingVar.getStock());
    }

    @Test
    @DisplayName("determineInitialProductStatus cho người bán cá nhân có ký quỹ và không ký quỹ")
    void testDetermineInitialProductStatus_EscrowTrust() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(productRepository.existsBySkuAndDeletedFalse(anyString())).thenReturn(false);
        when(productCategoryRepository.findById(sampleCategory.getId())).thenReturn(Optional.of(sampleCategory));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        // 1. Seller INDIVIDUAL có EscrowFund trustLevel >= 2 -> PUBLISHED
        sampleShop.setSellerType(SellerType.INDIVIDUAL);
        sampleShop.setTrustLevel(null);
        com.marketplace.ecommerce.shop.entity.ShopEscrowFund fund = new com.marketplace.ecommerce.shop.entity.ShopEscrowFund();
        fund.setCurrentTrustLevel(3);
        sampleShop.setEscrowFund(fund);
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));

        CreateProductRequest reqTrusted = new CreateProductRequest();
        reqTrusted.setName("Sạc Anker chính hãng");
        reqTrusted.setSku("ANK-01");
        reqTrusted.setBasePrice(BigDecimal.valueOf(500000));
        reqTrusted.setStockQuantity(10);
        reqTrusted.setCategoryId(sampleCategory.getId());
        reqTrusted.setConditionGrade(ConditionGrade.GRADE_NEW);

        SellerProductResponse resTrusted = productService.createProduct(accountId, reqTrusted);
        assertEquals(ProductStatus.PUBLISHED.name(), resTrusted.getStatus());

        // 2. Seller INDIVIDUAL không có ký quỹ (trust < 2) -> PENDING_APPROVAL
        fund.setCurrentTrustLevel(1);
        CreateProductRequest reqUntrusted = new CreateProductRequest();
        reqUntrusted.setName("Cáp sạc Anker");
        reqUntrusted.setSku("ANK-02");
        reqUntrusted.setBasePrice(BigDecimal.valueOf(100000));
        reqUntrusted.setStockQuantity(10);
        reqUntrusted.setCategoryId(sampleCategory.getId());
        reqUntrusted.setConditionGrade(ConditionGrade.GRADE_NEW);

        SellerProductResponse resUntrusted = productService.createProduct(accountId, reqUntrusted);
        assertEquals(ProductStatus.PENDING_APPROVAL.name(), resUntrusted.getStatus());
    }

}
