import { Page } from '@playwright/test';
import {
  createMockJwt,
  TEST_ACCOUNTS,
  MOCK_TRUST_LEVELS,
  MOCK_SELLER_REQUEST,
  MOCK_PRODUCTS,
  MOCK_PENDING_MODERATION_PRODUCTS,
  MOCK_ADDRESSES,
  MOCK_ORDERS,
  MOCK_ADMIN_ESCROWS,
  MOCK_REPORTS,
  MOCK_POLICY_CLAUSES,
  MOCK_SHOP_VIOLATIONS,
  MOCK_SELLER_ANALYTICS,
  MOCK_ADMIN_ANALYTICS,
  MOCK_SHOP_RANKING,
} from './test-data';

export interface SessionSeedOptions {
  accountVerified?: boolean;
  hasShop?: boolean;
  sellerStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  shopStatus?: 'ACTIVE' | 'PENDING_DEPOSIT' | 'CLOSED' | 'SUSPENDED';
  violationCount?: number;
  disciplineLevel?: string;
}

/**
 * Thiết lập trạng thái đăng nhập vào localStorage (auth-storage & access_token)
 * tương thích với Zustand persist của cả 3 cổng Frontend (:3000, :3001, :3002).
 */
export async function seedAuthenticatedSession(
  page: Page,
  role: 'CUSTOMER' | 'BUSINESS' | 'ADMIN' | 'SELLER_CANDIDATE',
  options: SessionSeedOptions = {},
) {
  const account =
    role === 'CUSTOMER'
      ? TEST_ACCOUNTS.customer
      : role === 'SELLER_CANDIDATE'
        ? TEST_ACCOUNTS.sellerCandidate
        : role === 'BUSINESS'
          ? TEST_ACCOUNTS.seller
          : TEST_ACCOUNTS.admin;

  const isVerified = options.accountVerified ?? true;
  const effectiveRole = role === 'SELLER_CANDIDATE' ? 'CUSTOMER' : account.role;

  const token = createMockJwt({
    sub: account.username,
    accountId: account.accountId,
    role: effectiveRole,
    account_verified: isVerified,
  });

  const userObj: Record<string, unknown> = {
    id: account.accountId,
    accountId: account.accountId,
    username: account.username,
    email: account.email,
    fullName: account.fullName,
    phoneNumber: account.phoneNumber,
    role: effectiveRole,
    accountVerified: isVerified,
    disciplineLevel: options.disciplineLevel ?? 'NONE',
    violationCount: options.violationCount ?? 0,
  };

  if (role === 'BUSINESS') {
    userObj.shopId = TEST_ACCOUNTS.seller.shopId;
    userObj.shopName = TEST_ACCOUNTS.seller.shopName;
    userObj.hasShop = options.hasShop ?? true;
    userObj.sellerStatus = options.sellerStatus ?? 'APPROVED';
    userObj.shopStatus = options.shopStatus ?? 'ACTIVE';
  } else if (role === 'SELLER_CANDIDATE') {
    userObj.hasShop = options.hasShop ?? false;
    userObj.sellerStatus = options.sellerStatus ?? 'NONE';
    if (options.shopStatus) {
      userObj.shopStatus = options.shopStatus;
    }
  }

  await page.addInitScript(
    ({ tokenVal, userVal, verifiedVal }) => {
      window.sessionStorage.setItem('welcomeModalShown', '1');
      window.localStorage.setItem('access_token', tokenVal);
      window.localStorage.setItem('refresh_token', tokenVal);
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: userVal,
            token: tokenVal,
            refreshToken: tokenVal,
            isAuthenticated: true,
            accountVerified: verifiedVal,
          },
          version: 0,
        }),
      );
    },
    { tokenVal: token, userVal: userObj, verifiedVal: isVerified },
  );
}

/**
 * Thiết lập Route Interception cho toàn bộ API phục vụ 5 Business Flows.
 */
export async function setupStandardApiMocks(page: Page) {
  // Ngăn popup voucher chào mừng che khuất nút nổi trên trang chủ Buyer (:3000)
  await page.addInitScript(() => {
    window.sessionStorage.setItem('welcomeModalShown', '1');
  });

  // Fallback mặc định cho các API phụ (notifications, live, policies, file upload...) để không bị lỗi kết nối
  await page.route(/\/files\//, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: '/product-placeholder.svg', fileName: 'mock-evidence.png' }),
    });
  });

  await page.route(/auth\/refresh-token/, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'mock-token', refreshToken: 'mock-refresh-token' }),
    });
  });

  await page.route(/\/api\/v1\//, async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.includes('/file')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: '/product-placeholder.svg' }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // 1. Auth & User Profile APIs
  await page.route(/\/api\/v1\/auth\/me(\?|$)/, async (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accountId: TEST_ACCOUNTS.customer.accountId,
        username: TEST_ACCOUNTS.customer.username,
        email: TEST_ACCOUNTS.customer.email,
        phoneNumber: TEST_ACCOUNTS.customer.phoneNumber,
        role: 'CUSTOMER',
        accountVerified: true,
      }),
    }),
  );

  await page.route(/\/api\/v1\/user\/me(\?|$)/, async (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: TEST_ACCOUNTS.customer.accountId,
        fullName: TEST_ACCOUNTS.customer.fullName,
        email: TEST_ACCOUNTS.customer.email,
        phoneNumber: TEST_ACCOUNTS.customer.phoneNumber,
        role: 'CUSTOMER',
        disciplineLevel: 'NONE',
        violationCount: 0,
      }),
    }),
  );

  await page.route(/\/api\/v1\/auth\/users/, async (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { email: 'customer1@gmail.com', role: 'CUSTOMER' },
        { email: 'apple.reseller@gmail.com', role: 'BUSINESS' },
      ]),
    }),
  );

  // 2. Flow 1: eKYC & Seller Onboarding & Trust Levels & GHN Locations & VietQR Banks
  await page.route(/\/api\/v1\/trust-levels/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_TRUST_LEVELS),
    }),
  );

  await page.route(/\/api\/v1\/kyc\//, (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith('/sessions:start')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 'kyc-sess-2026-001',
          status: 'IN_PROGRESS',
        }),
      });
    }
    if (pathname.endsWith('/upload')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          uploaded: true,
          fileHash: 'mock-vnpt-hash-001',
        }),
      });
    }
    if (pathname.endsWith('/fullFlow-upload')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ocrFullName: 'TRẦN MINH KHÔI',
          ocrIdNumber: '079099001234',
          ocrDob: '15/08/1999',
          cardType: 'CCCD Gắn Chip',
        }),
      });
    }
    if (pathname.endsWith('/compare')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 'kyc-sess-2026-001',
          status: 'VERIFIED',
          compareResult: 'MATCH',
          prob: 98.7,
          message: 'Khuôn mặt trùng khớp với giấy tờ tùy thân',
        }),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });

  await page.route('https://api.vietqr.io/v2/banks', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: '00',
        data: [
          {
            id: 1,
            name: 'Ngân hàng TMCP Ngoại Thương Việt Nam',
            code: 'VCB',
            shortName: 'Vietcombank',
            bin: '970436',
          },
          {
            id: 2,
            name: 'Ngân hàng TMCP Quân Đội',
            code: 'MB',
            shortName: 'MBBank',
            bin: '970422',
          },
        ],
      }),
    }),
  );

  await page.route(/\/api\/v1\/shipping\//, (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.includes('/provinces')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ ProvinceID: 202, ProvinceName: 'TP. Hồ Chí Minh' }]),
      });
    }
    if (pathname.includes('/districts')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ DistrictID: 1442, DistrictName: 'Quận 1' }]),
      });
    }
    if (pathname.includes('/wards')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ WardCode: '20101', WardName: 'Phường Bến Nghé' }]),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ total: 30000, service_fee: 30000 }),
    });
  });

  // 3. Requests & Moderation APIs (Flow 1 & Flow 3)
  await page.route(/\/api\/v1\/request(\/|\?|$)/, (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;

    if (pathname.endsWith('/regis-seller')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SELLER_REQUEST),
      });
    }

    if (pathname.endsWith('/admin')) {
      const type = url.searchParams.get('type');
      if (type === 'REPORT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: MOCK_REPORTS,
            totalPages: 1,
            totalElements: MOCK_REPORTS.length,
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [MOCK_SELLER_REQUEST],
          totalPages: 1,
          totalElements: 1,
        }),
      });
    }

    if (pathname.includes('/approve')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_SELLER_REQUEST, status: 'APPROVED' }),
      });
    }

    if (pathname.includes('/reject')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_SELLER_REQUEST, status: 'REJECTED' }),
      });
    }

    if (pathname.endsWith('/ban-review/status')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          username: 'banned_buyer',
          status: 'BANNED',
          violationCount: 7,
          blockReason: 'MAX_VIOLATIONS_REACHED',
          canSubmit: true,
          latestAppeal: null,
        }),
      });
    }

    if (pathname.endsWith('/ban-review')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          requestId: 'appeal-001',
          displayCode: 'APP-2026-001',
          status: 'PENDING',
        }),
      });
    }

    if (pathname.includes('rep-')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...MOCK_REPORTS[0],
          detail: {
            targetType: 'PRODUCT',
            targetName: MOCK_REPORTS[0].targetName,
            description: MOCK_REPORTS[0].description,
          },
        }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SELLER_REQUEST),
    });
  });

  // 4. Flow 2: Products, Seller Products, Cart, Checkout, Order, Escrow
  await page.route(/\/api\/v1\/seller(\/|\?|$)/, (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.includes('/by-shop')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PRODUCTS),
      });
    }
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() || {};
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...MOCK_PRODUCTS[0],
          id: 'new-prod-001',
          name: body.name || 'Sản phẩm mới đăng',
        }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PRODUCTS),
    });
  });

  await page.route(/\/api\/v1\/product(\/|\?|$)/, async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;

    const detailMatch = pathname.match(/\/api\/v1\/product\/([^/]+)$/);
    if (detailMatch && detailMatch[1] !== 'shop') {
      const productId = detailMatch[1];
      const found = MOCK_PRODUCTS.find((p) => p.id === productId) || MOCK_PRODUCTS[0];
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(found),
      });
    }

    if (pathname.endsWith('/similar')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([MOCK_PRODUCTS[1]]),
      });
    }

    const searchKeyword = (url.searchParams.get('search') || '').toLowerCase();
    const filtered = searchKeyword
      ? MOCK_PRODUCTS.filter((p) => p.name.toLowerCase().includes(searchKeyword))
      : MOCK_PRODUCTS;

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: filtered,
        totalPages: filtered.length > 0 ? 1 : 0,
        totalElements: filtered.length,
      }),
    });
  });

  await page.route(/\/api\/v1\/admin\/products/, (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith('/approve')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'PUBLISHED' }),
      });
    }
    if (pathname.endsWith('/reject')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'REJECTED' }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PENDING_MODERATION_PRODUCTS),
    });
  });

  await page.route(/\/api\/v1\/category/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'cat-phone-001', name: 'Điện thoại & Tablet' },
        { id: 'cat-laptop-001', name: 'Laptop & MacBook' },
      ]),
    }),
  );

  await page.route(/\/api\/v1\/shop(\/|\?|$)/, (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith('/my-violations')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SHOP_VIOLATIONS),
      });
    }
    if (pathname.endsWith('/my-shop')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'shop-apple-001',
          name: 'Apple Official Store',
          violationCount: 1,
          disciplineLevel: 'WARNING',
        }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'shop-apple-001',
        name: 'Apple Official Store',
        city: 'TP. Hồ Chí Minh',
        districtId: 1442,
        wardCode: '20101',
        rating: 4.9,
      }),
    });
  });

  await page.route(/\/api\/v1\/recommendations/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
  );

  await page.route(/\/api\/v1\/wishlist/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ wishlisted: false, wishlistCount: 12 }),
    }),
  );

  await page.route(/\/api\/v1\/review/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], totalElements: 0 }),
    }),
  );

  await page.route(/\/api\/v1\/vouchers/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [] }),
    }),
  );

  await page.route(/\/api\/v1\/address/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ADDRESSES),
    }),
  );

  await page.route(/\/api\/v1\/cart/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'cart-001',
        totalPrice: 28990000,
        items: [
          {
            id: 'ci-001',
            productId: MOCK_PRODUCTS[0].id,
            productName: MOCK_PRODUCTS[0].name,
            productImageUrl: '/product-placeholder.svg',
            shopId: 'shop-apple-001',
            shopName: 'Apple Official Store',
            unitPrice: 28990000,
            price: 28990000,
            quantity: 1,
            totalPrice: 28990000,
            variantId: 'var-titan-256',
            variantColor: 'Titan Tự Nhiên',
            variantSize: '256GB',
            conditionGrade: 'LIKE_NEW',
            warrantyType: 'OFFICIAL',
            warrantyMonths: 10,
          },
        ],
      }),
    }),
  );

  await page.route(/\/api\/v1\/checkout\/confirm/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        shopId: 'shop-apple-001',
        shopName: 'Apple Official Store',
        shopDistrictId: 1442,
        shopWardCode: '20101',
        shopAddress: 'Quận 1, TP. Hồ Chí Minh',
      }),
    }),
  );

  await page.route(/\/api\/v1\/checkout\/quote/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        subtotal: 28990000,
        shippingFee: 30000,
        shopDiscountAmount: 0,
        platformDiscountAmount: 0,
        discountAmount: 0,
        finalTotal: 29020000,
      }),
    }),
  );

  await page.route(/\/api\/v1\/wallet/, (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.includes('/transactions')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalPages: 0, totalElements: 0 }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'wallet-001',
        availableBalance: 50000000,
        lockedBalance: 0,
        currency: 'VND',
      }),
    });
  });

  await page.route(/\/api\/v1\/shop-escrow-fund/, (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.includes('/transactions')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [
            {
              id: 'tx-esc-001',
              type: 'INITIAL_DEPOSIT',
              amount: 10000000,
              balanceAfter: 10000000,
              note: 'Nạp tiền ký quỹ khởi tạo Shop 3 Sao',
              createdAt: '2026-10-20T09:00:00',
            },
          ],
          totalPages: 1,
          totalElements: 1,
        }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        shopId: 'shop-apple-001',
        shopName: 'Apple Official Store',
        currentBalance: 10000000,
        committedAmount: 10000000,
        starLevel: 3,
        tierName: 'Uy Tín',
        shopStatus: 'ACTIVE',
      }),
    });
  });

  await page.route(/\/api\/v1\/escrow/, (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.includes('/release')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'RELEASED', message: 'Đã giải ngân ký quỹ thành công' }),
      });
    }
    if (pathname.includes('/refund')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'REFUNDED', message: 'Đã hoàn tiền ký quỹ thành công' }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: MOCK_ADMIN_ESCROWS,
        totalPages: 1,
        totalElements: MOCK_ADMIN_ESCROWS.length,
      }),
    });
  });

  await page.route(/\/api\/v1\/order(\/|\?|$)/, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const pathname = url.pathname;

    if (pathname === '/api/v1/order/shop-ranking') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SHOP_RANKING),
      });
    }

    if (pathname === '/api/v1/order/shops') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ORDERS),
      });
    }

    if (
      pathname.endsWith('/received') ||
      pathname.endsWith('/status') ||
      pathname.endsWith('/cancel')
    ) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_ORDERS[1], status: 'COMPLETED' }),
      });
    }

    if (req.method() === 'POST' && pathname === '/api/v1/order') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ORDERS[0]),
      });
    }

    if (pathname === '/api/v1/order/me') {
      const statusFilter = url.searchParams.get('status');
      const filtered = statusFilter
        ? MOCK_ORDERS.filter((o) => o.status === statusFilter)
        : MOCK_ORDERS;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(filtered),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ORDERS[0]),
    });
  });

  // 5. Flow 3: Reports & Policy Clauses
  await page.route(/\/api\/v1\/report(\/|\?|$)/, (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith('/policy-clauses')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_POLICY_CLAUSES),
      });
    }
    if (pathname.endsWith('/handle')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'APPROVED', message: 'Đã xử lý báo cáo vi phạm' }),
      });
    }
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'rep-new-001',
          status: 'PENDING',
          message: 'Gửi báo cáo thành công',
        }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_REPORTS),
    });
  });

  // 6. Flow 4: AI Conversational Commerce & Live Chat Support
  await page.route(/\/api\/v1\/chat\/ai(\?|$)/, async (route) => {
    const body = route.request().postDataJSON() || {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const lastUserText = (messages[messages.length - 1]?.text || '').toLowerCase();

    if (lastUserText.includes('lỗi_dịch_vụ')) {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Trợ lý AI đang bảo trì hệ thống mô hình ngôn ngữ.' }),
      });
    }

    if (messages.length >= 2) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reply:
            'Dựa trên câu hỏi trước của bạn về iPhone 15 Pro Max, mẫu này hiện có sẵn bản 256GB Titan Tự Nhiên với pin 98% và được bảo vệ 100% bởi Quỹ ký quỹ Escrow.',
          productCards: [
            {
              id: MOCK_PRODUCTS[0].id,
              name: MOCK_PRODUCTS[0].name,
              basePrice: MOCK_PRODUCTS[0].basePrice,
              productUrl: `/products/${MOCK_PRODUCTS[0].id}`,
              thumbnailUrl: '/product-placeholder.svg',
            },
          ],
          choices: ['Chính sách bảo hành ra sao?', 'So sánh với MacBook Air M3'],
        }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        reply:
          'Xin chào! Tôi là Trợ lý AI của sàn. Dưới đây là gợi ý điện thoại flagship phù hợp với nhu cầu của bạn:',
        productCards: [
          {
            id: MOCK_PRODUCTS[0].id,
            name: MOCK_PRODUCTS[0].name,
            basePrice: MOCK_PRODUCTS[0].basePrice,
            productUrl: `/products/${MOCK_PRODUCTS[0].id}`,
            thumbnailUrl: '/product-placeholder.svg',
          },
        ],
        choices: ['Tư vấn chi tiết cấu hình', 'Kiểm tra bảo hành'],
      }),
    });
  });

  await page.route(/\/api\/v1\/chat\/threads/, (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;

    if (pathname.endsWith('/support')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'thread-support-001',
          type: 'SUPPORT',
          status: 'OPEN',
          customerName: TEST_ACCOUNTS.customer.fullName,
        }),
      });
    }

    if (pathname.includes('/messages')) {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() || {};
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: `msg-${Date.now()}`,
            threadId: 'thread-support-001',
            senderId: TEST_ACCOUNTS.customer.accountId,
            senderRole: 'CUSTOMER',
            content: body.content,
            createdAt: new Date().toISOString(),
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [
            {
              id: 'msg-history-002',
              threadId: 'thread-support-001',
              senderId: 'acc-admin-001',
              senderRole: 'ADMIN',
              senderName: 'Ban Quản Trị CSKH',
              content: 'Chào bạn, bộ phận CSKH có thể hỗ trợ gì cho đơn hàng của bạn?',
              createdAt: '2026-10-26T08:05:00',
            },
            {
              id: 'msg-history-001',
              threadId: 'thread-support-001',
              senderId: TEST_ACCOUNTS.customer.accountId,
              senderRole: 'CUSTOMER',
              senderName: TEST_ACCOUNTS.customer.fullName,
              content: 'Tôi cần hỗ trợ kiểm tra trạng thái giải ngân đơn hàng.',
              createdAt: '2026-10-26T08:00:00',
            },
          ],
        }),
      });
    }

    if (pathname.endsWith('/read')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    }

    const type = url.searchParams.get('type');
    if (type === 'SHOP') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'thread-shop-001',
            type: 'SHOP',
            shopId: 'shop-apple-001',
            shopName: 'Apple Official Store',
            customerId: TEST_ACCOUNTS.customer.accountId,
            customerName: TEST_ACCOUNTS.customer.fullName,
            lastMessage: 'Shop ơi máy còn màu Titan Tự Nhiên không?',
            lastMessageAt: '2026-10-26T09:00:00',
            unreadCount: 1,
          },
        ]),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'thread-support-001',
          type: 'SUPPORT',
          customerId: TEST_ACCOUNTS.customer.accountId,
          customerName: TEST_ACCOUNTS.customer.fullName,
          lastMessage: 'Chào bạn, bộ phận CSKH có thể hỗ trợ gì cho đơn hàng của bạn?',
          lastMessageAt: '2026-10-26T08:05:00',
          unreadCount: 0,
        },
      ]),
    });
  });

  // 7. Flow 5: Multi-Role Analytics & Reporting APIs
  await page.route(/\/api\/v1\/statistics\/seller\/dashboard/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SELLER_ANALYTICS),
    }),
  );

  await page.route(/\/api\/v1\/statistics\/admin\/dashboard/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ADMIN_ANALYTICS),
    }),
  );

  await page.route(/\/api\/v1\/commissions/, (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith('/overview')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalCommission: 42500000,
          totalOrders: 120,
          averageCommissionRate: 5.0,
        }),
      });
    }
    if (pathname.endsWith('/by-month')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ year: 2026, month: 10, totalCommission: 42500000 }]),
      });
    }
    if (pathname.endsWith('/by-category')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            categoryId: 'cat-phone-001',
            categoryName: 'Điện thoại & Tablet',
            totalCommission: 28000000,
          },
          {
            categoryId: 'cat-laptop-001',
            categoryName: 'Laptop & MacBook',
            totalCommission: 14500000,
          },
        ]),
      });
    }
    if (pathname.endsWith('/top-sellers')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            sellerId: 'shop-apple-001',
            shopName: 'Apple Official Store',
            totalCommission: 27000000,
          },
        ]),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [
          {
            id: 'comm-001',
            orderId: 'ord-escrow-002',
            orderNumber: 'ORD-20261026-0002',
            shopName: 'Apple Official Store',
            orderAmount: 26520000,
            commissionRate: 5.0,
            commissionAmount: 1326000,
            createdAt: '2026-10-25T10:15:00',
          },
        ],
        totalPages: 1,
        totalElements: 1,
      }),
    });
  });
}
