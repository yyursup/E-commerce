export const getVariantLabelsByCategory = (categoryName) => {
  if (!categoryName || categoryName === 'Danh mục chung') return { attr1: 'Màu sắc', attr2: 'Kích cỡ' }
  
  const name = categoryName.toLowerCase()
  
  // Nhóm Thời trang, Giày dép
  if (name.includes('thời trang') || name.includes('áo') || name.includes('quần') || name.includes('giày') || name.includes('túi')) {
    return { attr1: 'Màu sắc', attr2: 'Kích cỡ (S, M, L...)' }
  }
  
  // Nhóm Công nghệ
  if (name.includes('điện thoại') || name.includes('tablet') || name.includes('máy tính') || name.includes('laptop') || name.includes('điện tử')) {
    return { attr1: 'Màu sắc', attr2: 'Cấu hình / Dung lượng' }
  }
  
  // Nhóm Làm đẹp & Sức khỏe
  if (name.includes('chăm sóc da') || name.includes('làm đẹp') || name.includes('sức khỏe') || name.includes('mỹ phẩm')) {
    return { attr1: 'Mùi hương / Phân loại', attr2: 'Dung tích / Trọng lượng' }
  }
  
  // Nhóm Sách
  if (name.includes('sách') || name.includes('tiểu thuyết') || name.includes('văn học')) {
    return { attr1: 'Loại bìa', attr2: 'Phiên bản' }
  }
  
  // Nhóm Nội thất / Gia dụng
  if (name.includes('nội thất') || name.includes('gia dụng') || name.includes('bếp') || name.includes('đồ chơi')) {
    return { attr1: 'Chất liệu', attr2: 'Kích thước' }
  }

  // Mặc định
  return { attr1: 'Màu sắc', attr2: 'Kích cỡ / Phân loại' }
}
