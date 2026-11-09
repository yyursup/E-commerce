import { describe, it, expect } from 'vitest'
import { getVariantLabelsByCategory } from '../../lib/variantMapping'

const attr1 = (name) => getVariantLabelsByCategory(name).attr1

describe('getVariantLabelsByCategory', () => {
  it('always returns the four label/placeholder fields', () => {
    for (const name of [undefined, 'Điện thoại', 'Không khớp gì']) {
      expect(Object.keys(getVariantLabelsByCategory(name)).sort()).toEqual(['attr1', 'attr2', 'ph1', 'ph2'])
    }
  })

  it('uses the generic labels when no category is chosen', () => {
    const expected = getVariantLabelsByCategory('Danh mục chung')
    expect(getVariantLabelsByCategory(undefined)).toEqual(expected)
    expect(getVariantLabelsByCategory('')).toEqual(expected)
    expect(expected.attr1).toBe('Màu sắc / Mùi hương / Phân loại')
  })

  it.each([
    ['Điện thoại', 'Màu sắc / Phiên bản', 'Cấu hình / Dung lượng'],
    ['Laptop', 'Màu sắc / Phiên bản', 'Cấu hình / Dung lượng'],
    ['Máy tính bảng', 'Màu sắc / Phiên bản', 'Cấu hình / Dung lượng'],
    ['Tai nghe', 'Màu sắc / Phiên bản', 'Cấu hình / Dung lượng'],
    ['Phụ kiện điện thoại', 'Màu sắc / Phiên bản', 'Cấu hình / Dung lượng'],
    ['Mỹ phẩm', 'Mùi hương / Phân loại', 'Dung tích / Trọng lượng'],
    ['Nước hoa', 'Mùi hương / Phân loại', 'Dung tích / Trọng lượng'],
    ['Thời trang nam', 'Màu sắc / Họa tiết', 'Kích cỡ (Size)'],
    ['Giày dép', 'Màu sắc / Họa tiết', 'Kích cỡ (Size)'],
    ['Thực phẩm', 'Hương vị / Vị', 'Quy cách / Trọng lượng'],
    ['Cà phê', 'Hương vị / Vị', 'Quy cách / Trọng lượng'],
    ['Văn phòng phẩm', 'Loại bìa / Định dạng', 'Phiên bản / Tập'],
    ['Nội thất', 'Chất liệu / Màu sắc', 'Kích thước / Dung tích'],
    ['Đồ gia dụng', 'Chất liệu / Màu sắc', 'Kích thước / Dung tích'],
    ['Thể thao', 'Màu sắc / Kiểu dáng', 'Kích cỡ / Tải trọng'],
    ['Mẹ & Bé', 'Màu sắc / Mẫu mã', 'Độ tuổi / Kích cỡ'],
    ['Đồ chơi', 'Màu sắc / Mẫu mã', 'Độ tuổi / Kích cỡ'],
  ])('maps "%s" to %s / %s', (name, expected1, expected2) => {
    const labels = getVariantLabelsByCategory(name)
    expect(labels.attr1).toBe(expected1)
    expect(labels.attr2).toBe(expected2)
  })

  it('matches regardless of letter case', () => {
    expect(attr1('ĐIỆN THOẠI')).toBe(attr1('điện thoại'))
    expect(attr1('LAPTOP GAMING')).toBe('Màu sắc / Phiên bản')
  })

  it('checks beauty before fashion, so "Chăm sóc da" is not read as fashion', () => {
    expect(attr1('Chăm sóc da')).toBe('Mùi hương / Phân loại')
  })

  it('falls back to generic slots for an unrecognised category', () => {
    expect(getVariantLabelsByCategory('Linh kiện máy bay')).toEqual({
      attr1: 'Màu sắc / Phân loại 1',
      attr2: 'Kích cỡ / Phân loại 2',
      ph1: 'VD: Đen, Trắng, Loại 1...',
      ph2: 'VD: Lớn, Nhỏ, 100g, 50ml...',
    })
  })
})
