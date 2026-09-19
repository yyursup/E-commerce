/**
 * Dynamic variant labels and placeholder suggestions based on product category.
 * Automatically adapts the 2 customizable variant attribute columns to match industry standards (Shopee/Lazada).
 */
export const getVariantLabelsByCategory = (categoryName) => {
  if (!categoryName || categoryName === 'Danh mục chung') {
    return {
      attr1: 'Màu sắc / Mùi hương / Phân loại',
      attr2: 'Kích cỡ / Dung tích / Cấu hình',
      ph1: 'VD: Đen, Hoa hồng, Bìa cứng, Titan...',
      ph2: 'VD: XL, 50ml, 256GB, 500g...',
    }
  }

  const name = categoryName.toLowerCase()

  // Nhóm Làm đẹp & Sức khỏe (Mỹ phẩm, Chăm sóc da, Nước hoa, TPCN...)
  if (
    name.includes('sức khỏe') ||
    name.includes('sắc đẹp') ||
    name.includes('làm đẹp') ||
    name.includes('chăm sóc da') ||
    name.includes('chăm sóc cá nhân') ||
    name.includes('mỹ phẩm') ||
    name.includes('nước hoa') ||
    name.includes('son') ||
    name.includes('skincare') ||
    name.includes('makeup')
  ) {
    return {
      attr1: 'Mùi hương / Phân loại',
      attr2: 'Dung tích / Trọng lượng',
      ph1: 'VD: Hương hoa hồng, Tự nhiên, Màu #01...',
      ph2: 'VD: 50ml, 100g, Hộp 30 viên...',
    }
  }

  // Nhóm Thời trang, Giày dép, Phụ kiện
  if (
    name.includes('thời trang') ||
    name.includes('áo') ||
    name.includes('quần') ||
    name.includes('giày') ||
    name.includes('dép') ||
    name.includes('túi') ||
    name.includes('ví') ||
    name.includes('đồng hồ') ||
    name.includes('trang sức') ||
    name.includes('nón') ||
    name.includes('mũ')
  ) {
    return {
      attr1: 'Màu sắc / Họa tiết',
      attr2: 'Kích cỡ (Size)',
      ph1: 'VD: Đen, Trắng, Xanh navy, Kẻ sọc...',
      ph2: 'VD: S, M, L, XL, 39, 40, FreeSize...',
    }
  }

  // Nhóm Công nghệ, Điện tử, Điện thoại, Máy tính
  if (
    name.includes('điện thoại') ||
    name.includes('tablet') ||
    name.includes('máy tính') ||
    name.includes('laptop') ||
    name.includes('điện tử') ||
    name.includes('công nghệ') ||
    name.includes('phụ kiện công nghệ') ||
    name.includes('tai nghe') ||
    name.includes('loa') ||
    name.includes('camera') ||
    name.includes('âm thanh')
  ) {
    return {
      attr1: 'Màu sắc / Phiên bản',
      attr2: 'Cấu hình / Dung lượng',
      ph1: 'VD: Titan Tự Nhiên, Xám Không Gian, Đen...',
      ph2: 'VD: 128GB, 256GB, 16GB RAM/512GB SSD...',
    }
  }

  // Nhóm Thực phẩm, Đồ ăn, Bách hóa, Nông sản
  if (
    name.includes('thực phẩm') ||
    name.includes('đồ ăn') ||
    name.includes('bách hóa') ||
    name.includes('đồ uống') ||
    name.includes('nước giải khát') ||
    name.includes('trà') ||
    name.includes('cà phê') ||
    name.includes('nông sản') ||
    name.includes('snack') ||
    name.includes('bánh kẹo')
  ) {
    return {
      attr1: 'Hương vị / Vị',
      attr2: 'Quy cách / Trọng lượng',
      ph1: 'VD: Vị dâu, Truyền thống, Không đường...',
      ph2: 'VD: Gói 500g, Thùng 24 lon, Chai 1L...',
    }
  }

  // Nhóm Sách & Văn phòng phẩm
  if (
    name.includes('sách') ||
    name.includes('tiểu thuyết') ||
    name.includes('văn học') ||
    name.includes('truyện') ||
    name.includes('văn phòng phẩm') ||
    name.includes('dụng cụ học tập')
  ) {
    return {
      attr1: 'Loại bìa / Định dạng',
      attr2: 'Phiên bản / Tập',
      ph1: 'VD: Bìa cứng, Bìa mềm, Sách nói...',
      ph2: 'VD: Bản đặc biệt, Tập 1, Hộp quà tặng...',
    }
  }

  // Nhóm Nội thất, Nhà cửa & Đời sống, Gia dụng
  if (
    name.includes('nội thất') ||
    name.includes('gia dụng') ||
    name.includes('nhà cửa') ||
    name.includes('đời sống') ||
    name.includes('bếp') ||
    name.includes('phòng khách') ||
    name.includes('phòng ngủ') ||
    name.includes('đèn') ||
    name.includes('dụng cụ sửa chữa')
  ) {
    return {
      attr1: 'Chất liệu / Màu sắc',
      attr2: 'Kích thước / Dung tích',
      ph1: 'VD: Inox 304, Gỗ sồi, Trắng ngọc...',
      ph2: 'VD: 1.8L, 40x60cm, Bộ 4 món, 2 tầng...',
    }
  }

  // Nhóm Thể thao & Du lịch, Dã ngoại
  if (
    name.includes('thể thao') ||
    name.includes('du lịch') ||
    name.includes('dã ngoại') ||
    name.includes('camping') ||
    name.includes('gym') ||
    name.includes('yoga')
  ) {
    return {
      attr1: 'Màu sắc / Kiểu dáng',
      attr2: 'Kích cỡ / Tải trọng',
      ph1: 'VD: Đen viền cam, Rằn ri, Cổ cao...',
      ph2: 'VD: Size L, Tải 120kg, Dày 8mm...',
    }
  }

  // Nhóm Mẹ & Bé, Đồ chơi trẻ em
  if (
    name.includes('mẹ & bé') ||
    name.includes('mẹ và bé') ||
    name.includes('em bé') ||
    name.includes('trẻ em') ||
    name.includes('đồ chơi')
  ) {
    return {
      attr1: 'Màu sắc / Mẫu mã',
      attr2: 'Độ tuổi / Kích cỡ',
      ph1: 'VD: Xanh pastel, Hồng nhạt, Hình gấu...',
      ph2: 'VD: 0-6 tháng, Size L (9-14kg), 3+ tuổi...',
    }
  }

  // Mặc định cho các ngành hàng khác
  return {
    attr1: 'Màu sắc / Phân loại 1',
    attr2: 'Kích cỡ / Phân loại 2',
    ph1: 'VD: Đen, Trắng, Loại 1...',
    ph2: 'VD: Lớn, Nhỏ, 100g, 50ml...',
  }
}
