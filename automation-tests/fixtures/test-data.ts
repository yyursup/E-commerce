/**
 * Dữ liệu kiểm thử mẫu và hàm tạo JWT hợp lệ cho 5 Business Flows (Playwright Automation).
 * TUYỆT ĐỐI KHÔNG sử dụng giấy tờ tùy thân thật, tài khoản production hay giao dịch tiền thật.
 */

export interface MockJwtPayload {
  sub: string;
  accountId: string;
  role: 'CUSTOMER' | 'BUSINESS' | 'ADMIN' | 'ROLE_BAN_REVIEW';
  account_verified?: boolean;
  exp?: number;
}

export function createMockJwt(payload: MockJwtPayload): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(
    JSON.stringify({
      sub: payload.sub,
      accountId: payload.accountId,
      role: payload.role,
      account_verified: payload.account_verified ?? true,
      iat: now,
      exp: payload.exp ?? now + 7200,
    }),
  ).toString('base64url');
  const signature = Buffer.from('mock-signature-for-playwright-tests').toString('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Ảnh PNG 1x1 pixel giả lập trong bộ nhớ (Tuyệt đối không dùng CCCD/giấy tờ thật)
 */
export const DUMMY_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

export const TEST_ACCOUNTS = {
  customer: {
    username: 'customer1',
    password: 'customer123@',
    email: 'customer1@gmail.com',
    phoneNumber: '0901234567',
    fullName: 'Lê Văn Mua Hàng',
    role: 'CUSTOMER' as const,
    accountId: 'acc-customer-001',
  },
  sellerCandidate: {
    username: 'new_seller',
    password: 'seller123@',
    email: 'newseller@techzone.vn',
    phoneNumber: '0912345678',
    fullName: 'Trần Minh Khôi',
    role: 'CUSTOMER' as const,
    accountId: 'acc-candidate-001',
  },
  seller: {
    username: 'seller1',
    password: 'seller123@',
    email: 'apple.reseller@gmail.com',
    phoneNumber: '0987654321',
    fullName: 'Nguyễn Thành Đạt (Apple Official)',
    role: 'BUSINESS' as const,
    accountId: 'acc-seller-001',
    shopId: 'shop-apple-001',
    shopName: 'Apple Official Store',
    hasShop: true,
    sellerStatus: 'APPROVED',
    shopStatus: 'ACTIVE',
  },
  admin: {
    username: 'admin',
    password: 'admin123@',
    email: 'admin@ecommerce.vn',
    phoneNumber: '0123456789',
    fullName: 'Quản Trị Viên Sàn E-commerce',
    role: 'ADMIN' as const,
    accountId: 'acc-admin-001',
  },
};

export const MOCK_TRUST_LEVELS = [
  { starLevel: 1, tierName: 'Cơ Bản', minDeposit: 0, isActive: true },
  { starLevel: 2, tierName: 'Tiềm Năng', minDeposit: 5000000, isActive: true },
  { starLevel: 3, tierName: 'Uy Tín', minDeposit: 10000000, isActive: true },
  { starLevel: 4, tierName: 'Vàng', minDeposit: 30000000, isActive: true },
  { starLevel: 5, tierName: 'Kim Cương', minDeposit: 50000000, isActive: true },
];

export const MOCK_SELLER_REQUEST = {
  requestId: '11111111-2222-3333-4444-555555555555',
  displayCode: 'REQ-SELLER-2026-01',
  type: 'SELLER_REGISTRATION',
  status: 'PENDING',
  createdAt: '2026-10-26T08:00:00',
  username: 'new_seller',
  email: 'newseller@techzone.vn',
  detail: {
    sellerType: 'INDIVIDUAL',
    shopName: 'TechZone Official',
    shopPhone: '0912345678',
    shopEmail: 'newseller@techzone.vn',
    description: 'Chuyên phân phối thiết bị công nghệ chính hãng bảo hành 12 tháng.',
    pickupAddress: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    returnAddress: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    taxCode: '0123456789',
    bankName: 'Vietcombank (VCB)',
    bankAccountName: 'TRAN MINH KHOI',
    bankAccountNumber: '0071001234567',
    isEscrowParticipated: true,
    initialDepositAmount: 10000000,
  },
};

export const MOCK_PRODUCTS = [
  {
    id: 'a1111111-b222-4333-8444-c55555555555',
    name: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên',
    sku: 'IP15PM-256-TITAN',
    basePrice: 28990000,
    originalPrice: 31990000,
    status: 'PUBLISHED',
    conditionGrade: 'GRADE_LIKE_NEW',
    warrantyType: 'OFFICIAL',
    warrantyMonths: 12,
    batteryHealth: 98,
    isRepaired: false,
    rating: 4.9,
    reviewCount: 25,
    sold: 120,
    quantity: 15,
    stockQuantity: 15,
    featured: true,
    description: 'Máy nguyên bản 100%, pin 98%, bảo hành chính hãng Apple Việt Nam.',
    shopId: 'shop-apple-001',
    shopName: 'Apple Official Store',
    categoryId: 'cat-phone-001',
    categoryName: 'Điện thoại & Tablet',
    images: [{ id: 'img-1', imageUrl: '/product-placeholder.svg', isThumbnail: true }],
    variants: [
      { id: 'var-titan-256', color: 'Titan Tự Nhiên', size: '256GB', price: 28990000, stock: 10 },
      { id: 'var-black-512', color: 'Titan Đen', size: '512GB', price: 32990000, stock: 5 },
    ],
  },
  {
    id: 'b2222222-c333-4444-9555-d66666666666',
    name: 'MacBook Air M3 13 inch 16GB/512GB Chính Hãng',
    sku: 'MBA-M3-13-16-512',
    basePrice: 26490000,
    originalPrice: 29990000,
    status: 'PUBLISHED',
    conditionGrade: 'GRADE_NEW',
    warrantyType: 'OFFICIAL',
    warrantyMonths: 12,
    batteryHealth: 100,
    isRepaired: false,
    rating: 5.0,
    reviewCount: 18,
    sold: 64,
    quantity: 8,
    stockQuantity: 8,
    featured: false,
    description: 'MacBook Air M3 mới 100% nguyên seal, chính hãng Apple Việt Nam.',
    shopId: 'shop-apple-001',
    shopName: 'Apple Official Store',
    categoryId: 'cat-laptop-001',
    categoryName: 'Laptop & MacBook',
    images: [{ id: 'img-2', imageUrl: '/product-placeholder.svg', isThumbnail: true }],
    variants: [],
  },
];

export const MOCK_PENDING_MODERATION_PRODUCTS = [
  {
    id: 'c3333333-d444-4555-a666-e77777777777',
    name: 'iPad Pro M2 11 inch WiFi 128GB Like New 99%',
    sku: 'IPAD-M2-11-128',
    basePrice: 17500000,
    price: 17500000,
    status: 'PENDING_APPROVAL',
    conditionGrade: 'GRADE_LIKE_NEW',
    warrantyType: 'SHOP',
    warrantyMonths: 6,
    batteryHealth: 96,
    isRepaired: false,
    stockQuantity: 3,
    quantity: 3,
    shopId: 'shop-apple-001',
    shopName: 'Apple Official Store',
    categoryName: 'Điện thoại & Tablet',
    image: '/product-placeholder.svg',
    description: 'Máy đẹp 99% không cấn móp, màn hình nguyên zin.',
  },
];

export const MOCK_ADDRESSES = [
  {
    id: 'addr-001',
    receiverName: 'Lê Văn Mua Hàng',
    receiverPhone: '0901234567',
    addressLine: '123 Nguyễn Huệ',
    ward: 'Phường Bến Nghé',
    wardCode: '20101',
    district: 'Quận 1',
    districtId: 1442,
    city: 'TP. Hồ Chí Minh',
    provinceId: 202,
    isDefault: true,
  },
];

export const MOCK_ORDERS = [
  {
    id: 'ord-escrow-001',
    orderNumber: 'ORD-20261026-0001',
    shopId: 'shop-apple-001',
    shopName: 'Apple Official Store',
    status: 'CONFIRMED',
    paymentMethod: 'WALLET',
    subtotal: 28990000,
    shippingFee: 30000,
    discountAmount: 0,
    total: 29020000,
    shippingName: 'Lê Văn Mua Hàng',
    shippingPhone: '0901234567',
    shippingAddress: '123 Nguyễn Huệ',
    shippingWard: 'Phường Bến Nghé',
    shippingDistrict: 'Quận 1',
    shippingCity: 'TP. Hồ Chí Minh',
    createdAt: '2026-10-26T08:30:00',
    hasActiveDispute: false,
    items: [
      {
        id: 'oi-001',
        productId: 'a1111111-b222-4333-8444-c55555555555',
        productName: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên',
        productImageUrl: '/product-placeholder.svg',
        quantity: 1,
        unitPrice: 28990000,
        totalPrice: 28990000,
        variantColor: 'Titan Tự Nhiên',
        variantSize: '256GB',
        conditionGrade: 'GRADE_LIKE_NEW',
        warrantyType: 'OFFICIAL',
        warrantyMonths: 12,
      },
    ],
  },
  {
    id: 'ord-escrow-002',
    orderNumber: 'ORD-20261026-0002',
    shopId: 'shop-apple-001',
    shopName: 'Apple Official Store',
    status: 'DELIVERED',
    paymentMethod: 'WALLET',
    subtotal: 26490000,
    shippingFee: 30000,
    discountAmount: 0,
    total: 26520000,
    shippingName: 'Lê Văn Mua Hàng',
    shippingPhone: '0901234567',
    shippingAddress: '123 Nguyễn Huệ',
    shippingWard: 'Phường Bến Nghé',
    shippingDistrict: 'Quận 1',
    shippingCity: 'TP. Hồ Chí Minh',
    createdAt: '2026-10-25T10:15:00',
    hasActiveDispute: false,
    items: [
      {
        id: 'oi-002',
        productId: 'b2222222-c333-4444-9555-d66666666666',
        productName: 'MacBook Air M3 13 inch 16GB/512GB Chính Hãng',
        productImageUrl: '/product-placeholder.svg',
        quantity: 1,
        unitPrice: 26490000,
        totalPrice: 26490000,
        conditionGrade: 'GRADE_NEW',
        warrantyType: 'OFFICIAL',
        warrantyMonths: 12,
      },
    ],
  },
];

export const MOCK_ADMIN_ESCROWS = [
  {
    escrowId: 'esc-1111-2222',
    orderId: 'ord-escrow-002',
    orderNumber: 'ORD-20261026-0002',
    status: 'HELD',
    amount: 26520000,
    platformCommission: 1326000,
    createdAt: '2026-10-25T10:15:00',
  },
];

export const MOCK_REPORTS = [
  {
    requestId: 'rep-11111111-2222-4333-8444-555555555555',
    id: 'rep-11111111-2222-4333-8444-555555555555',
    displayCode: 'REP-2026-0089',
    type: 'REPORT',
    targetType: 'PRODUCT',
    targetId: 'a1111111-b222-4333-8444-c55555555555',
    targetName: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên',
    status: 'PENDING',
    description: '[PRODUCT][COUNTERFEIT] Phát hiện sản phẩm có dấu hiệu thay vỏ không đúng mô tả nguyên bản.',
    evidenceUrl: '/product-placeholder.svg',
    createdAt: '2026-10-26T09:15:00',
  },
];

export const MOCK_POLICY_CLAUSES = [
  {
    code: 'CLAUSE_PROD_01',
    title: 'Điều 4.1 - Sai lệch tình trạng thiết bị công nghệ',
    description: 'Sản phẩm đăng bán không khớp tình trạng thực tế hoặc đã qua sửa chữa không khai báo.',
  },
  {
    code: 'CLAUSE_ORD_02',
    title: 'Điều 7.2 - Bảo vệ người mua và hoàn tiền ký quỹ Escrow',
    description: 'Hoàn trả 100% giá trị đơn hàng từ quỹ bảo lãnh khi phát sinh lỗi phần cứng từ phía người bán.',
  },
];

export const MOCK_SHOP_VIOLATIONS = [
  {
    id: 'viol-001',
    displayCode: 'REP-2026-0045',
    targetType: 'PRODUCT',
    targetName: 'Tai nghe AirPods Pro 2 USB-C',
    policyClauseCode: 'CLAUSE_PROD_01',
    policyClauseTitle: 'Điều 4.1 - Sai lệch tình trạng thiết bị công nghệ',
    description: 'Mô tả thiếu thông tin vết trầy trên hộp sạc.',
    moderatorNote: 'Nhắc nhở và cộng 1 gậy vi phạm quy chuẩn đăng bán.',
    status: 'APPROVED',
    createdAt: '2026-10-20T14:20:00',
    reviewedAt: '2026-10-21T09:00:00',
  },
];

export const MOCK_SELLER_ANALYTICS = {
  shopName: 'Apple Official Store',
  isKycVerified: true,
  startDate: '2026-10-12',
  endDate: '2026-10-26',
  totalRevenue: 145800000,
  netProfit: 138510000,
  platformFee: 7290000,
  totalOrders: 18,
  completedOrders: 15,
  pendingOrders: 2,
  cancelledOrders: 1,
  escrowHeldAmount: 55540000,
  salesTimeline: [
    { date: '2026-10-24', revenue: 45000000, orders: 5 },
    { date: '2026-10-25', revenue: 52000000, orders: 6 },
    { date: '2026-10-26', revenue: 48800000, orders: 7 },
  ],
  topProducts: [
    {
      productId: 'a1111111-b222-4333-8444-c55555555555',
      productName: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên',
      soldQuantity: 10,
      revenue: 289900000,
    },
  ],
};

export const MOCK_ADMIN_ANALYTICS = {
  startDate: '2026-10-12',
  endDate: '2026-10-26',
  totalGmv: 850000000,
  totalPlatformRevenue: 42500000,
  totalEscrowHeld: 125000000,
  totalActiveShops: 24,
  totalUsers: 350,
  totalOrders: 142,
  completedOrders: 120,
  disputedOrders: 3,
  dailyTimeline: [
    { date: '2026-10-24', gmv: 250000000, commission: 12500000 },
    { date: '2026-10-25', gmv: 310000000, commission: 15500000 },
    { date: '2026-10-26', gmv: 290000000, commission: 14500000 },
  ],
};

export const MOCK_SHOP_RANKING = [
  {
    rank: 1,
    shopId: 'shop-apple-001',
    shopName: 'Apple Official Store',
    totalRevenue: 540000000,
    orderCount: 85,
    rating: 4.9,
  },
  {
    rank: 2,
    shopId: 'shop-samsung-002',
    shopName: 'Samsung Galaxy Flagship',
    totalRevenue: 310000000,
    orderCount: 57,
    rating: 4.8,
  },
];
