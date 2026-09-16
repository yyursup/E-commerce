import { useState, useEffect } from 'react'
import { HiOutlineLocationMarker } from 'react-icons/hi'
import { locationService } from '../services/locationService'
import { cn } from '../lib/cn'

export default function GhnAddressSelector({
  label,
  value,
  onChange,
  error,
  isDark = false,
  required = false,
  disabled = false,
  hint = '',
}) {
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [wards, setWards] = useState([])

  const [selectedProvinceId, setSelectedProvinceId] = useState('')
  const [selectedDistrictId, setSelectedDistrictId] = useState('')
  const [selectedWardCode, setSelectedWardCode] = useState('')
  const [streetAddress, setStreetAddress] = useState('')

  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)

  // 1. Tải danh sách Tỉnh/Thành từ API GHN
  useEffect(() => {
    let isMounted = true
    const loadProvinces = async () => {
      try {
        setLoadingProvinces(true)
        const res = await locationService.getProvinces()
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
        if (isMounted) setProvinces(list)
      } catch (err) {
        console.error('Lỗi khi tải danh sách Tỉnh/Thành GHN:', err)
      } finally {
        if (isMounted) setLoadingProvinces(false)
      }
    }
    loadProvinces()
    return () => {
      isMounted = false
    }
  }, [])

  // 2. Tải danh sách Quận/Huyện khi Tỉnh thay đổi
  useEffect(() => {
    if (!selectedProvinceId) {
      setDistricts([])
      setSelectedDistrictId('')
      setWards([])
      setSelectedWardCode('')
      return
    }

    let isMounted = true
    const loadDistricts = async () => {
      try {
        setLoadingDistricts(true)
        const res = await locationService.getDistricts(selectedProvinceId)
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
        if (isMounted) {
          setDistricts(list)
          // Nếu district hiện tại không nằm trong list mới thì reset
          if (!list.some((d) => String(d.DistrictID || d.districtId) === String(selectedDistrictId))) {
            setSelectedDistrictId('')
            setWards([])
            setSelectedWardCode('')
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải Quận/Huyện GHN:', err)
      } finally {
        if (isMounted) setLoadingDistricts(false)
      }
    }
    loadDistricts()
    return () => {
      isMounted = false
    }
  }, [selectedProvinceId])

  // 3. Tải danh sách Phường/Xã khi Quận/Huyện thay đổi
  useEffect(() => {
    if (!selectedDistrictId) {
      setWards([])
      setSelectedWardCode('')
      return
    }

    let isMounted = true
    const loadWards = async () => {
      try {
        setLoadingWards(true)
        const res = await locationService.getWards(selectedDistrictId)
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
        if (isMounted) {
          setWards(list)
          if (!list.some((w) => String(w.WardCode || w.wardCode) === String(selectedWardCode))) {
            setSelectedWardCode('')
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải Phường/Xã GHN:', err)
      } finally {
        if (isMounted) setLoadingWards(false)
      }
    }
    loadWards()
    return () => {
      isMounted = false
    }
  }, [selectedDistrictId])

  // 4. Khi người dùng thay đổi Tỉnh / Huyện / Xã / Số nhà, ghép thành chuỗi hoàn chỉnh
  const triggerAddressChange = (provId, distId, wardCd, street) => {
    const prov = provinces.find((p) => String(p.ProvinceID || p.provinceId) === String(provId))
    const dist = districts.find((d) => String(d.DistrictID || d.districtId) === String(distId))
    const ward = wards.find((w) => String(w.WardCode || w.wardCode) === String(wardCd))

    const provName = prov?.ProvinceName || prov?.provinceName || ''
    const distName = dist?.DistrictName || dist?.districtName || ''
    const wardName = ward?.WardName || ward?.wardName || ''

    const parts = [street?.trim(), wardName, distName, provName].filter(Boolean)
    const fullAddress = parts.join(', ')

    if (onChange) {
      onChange(fullAddress, {
        provinceId: provId ? Number(provId) : null,
        districtId: distId ? Number(distId) : null,
        wardCode: wardCd || '',
        provinceName: provName,
        districtName: distName,
        wardName: wardName,
        streetAddress: street || '',
      })
    }
  }

  const handleProvinceChange = (e) => {
    const newProvId = e.target.value
    setSelectedProvinceId(newProvId)
    setSelectedDistrictId('')
    setSelectedWardCode('')
    triggerAddressChange(newProvId, '', '', streetAddress)
  }

  const handleDistrictChange = (e) => {
    const newDistId = e.target.value
    setSelectedDistrictId(newDistId)
    setSelectedWardCode('')
    triggerAddressChange(selectedProvinceId, newDistId, '', streetAddress)
  }

  const handleWardChange = (e) => {
    const newWardCd = e.target.value
    setSelectedWardCode(newWardCd)
    triggerAddressChange(selectedProvinceId, selectedDistrictId, newWardCd, streetAddress)
  }

  const handleStreetChange = (e) => {
    const newStreet = e.target.value
    setStreetAddress(newStreet)
    triggerAddressChange(selectedProvinceId, selectedDistrictId, selectedWardCode, newStreet)
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label
          className={cn(
            'flex items-center gap-1.5 text-sm font-semibold',
            isDark ? 'text-slate-200' : 'text-stone-800'
          )}
        >
          <HiOutlineLocationMarker className="h-4 w-4 text-amber-500 shrink-0" />
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </label>
        {hint && (
          <span className="text-[11px] text-stone-400 dark:text-slate-500">{hint}</span>
        )}
      </div>

      {/* Grid 3 Cột: Tỉnh/Thành - Quận/Huyện - Phường/Xã (Chuẩn GHN) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Dropdown Tỉnh/Thành */}
        <div>
          <select
            disabled={disabled || loadingProvinces}
            value={selectedProvinceId}
            onChange={handleProvinceChange}
            className={cn(
              'w-full rounded-xl border px-3 py-2.5 text-xs outline-none transition font-medium',
              isDark
                ? 'border-slate-700 bg-slate-800 text-white disabled:bg-slate-900 disabled:text-slate-500'
                : 'border-stone-300 bg-white text-stone-900 disabled:bg-stone-100 disabled:text-stone-400',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
          >
            <option value="">
              {loadingProvinces ? '-- Đang tải Tỉnh/Thành... --' : '-- Chọn Tỉnh / Thành phố --'}
            </option>
            {provinces.map((p) => {
              const id = p.ProvinceID || p.provinceId
              const name = p.ProvinceName || p.provinceName
              return (
                <option key={id} value={id}>
                  {name}
                </option>
              )
            })}
          </select>
        </div>

        {/* Dropdown Quận/Huyện */}
        <div>
          <select
            disabled={disabled || !selectedProvinceId || loadingDistricts}
            value={selectedDistrictId}
            onChange={handleDistrictChange}
            className={cn(
              'w-full rounded-xl border px-3 py-2.5 text-xs outline-none transition font-medium',
              isDark
                ? 'border-slate-700 bg-slate-800 text-white disabled:bg-slate-900 disabled:text-slate-500'
                : 'border-stone-300 bg-white text-stone-900 disabled:bg-stone-100 disabled:text-stone-400',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
          >
            <option value="">
              {loadingDistricts
                ? '-- Đang tải Quận/Huyện... --'
                : !selectedProvinceId
                ? '-- Chọn Tỉnh/Thành trước --'
                : '-- Chọn Quận / Huyện --'}
            </option>
            {districts.map((d) => {
              const id = d.DistrictID || d.districtId
              const name = d.DistrictName || d.districtName
              return (
                <option key={id} value={id}>
                  {name}
                </option>
              )
            })}
          </select>
        </div>

        {/* Dropdown Phường/Xã */}
        <div>
          <select
            disabled={disabled || !selectedDistrictId || loadingWards}
            value={selectedWardCode}
            onChange={handleWardChange}
            className={cn(
              'w-full rounded-xl border px-3 py-2.5 text-xs outline-none transition font-medium',
              isDark
                ? 'border-slate-700 bg-slate-800 text-white disabled:bg-slate-900 disabled:text-slate-500'
                : 'border-stone-300 bg-white text-stone-900 disabled:bg-stone-100 disabled:text-stone-400',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
          >
            <option value="">
              {loadingWards
                ? '-- Đang tải Phường/Xã... --'
                : !selectedDistrictId
                ? '-- Chọn Quận/Huyện trước --'
                : '-- Chọn Phường / Xã --'}
            </option>
            {wards.map((w) => {
              const code = w.WardCode || w.wardCode
              const name = w.WardName || w.wardName
              return (
                <option key={code} value={code}>
                  {name}
                </option>
              )
            })}
          </select>
        </div>
      </div>

      {/* Số nhà, tên đường, tòa nhà */}
      <div>
        <input
          type="text"
          disabled={disabled}
          value={streetAddress}
          onChange={handleStreetChange}
          placeholder="Số nhà, tên đường, thôn/xóm/ấp (Ví dụ: 123 Nguyễn Văn Cừ, Tòa A Tầng 5)"
          className={cn(
            'w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition',
            isDark
              ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500 disabled:bg-slate-900 disabled:text-slate-500'
              : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400 disabled:bg-stone-100 disabled:text-stone-400',
            error && 'border-red-500/70',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        />
      </div>

      {/* Preview địa chỉ đầy đủ */}
      {value && (
        <div
          className={cn(
            'rounded-xl px-3 py-2 text-[11px] font-medium border flex items-start gap-1.5 transition-colors',
            isDark
              ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
              : 'border-amber-200 bg-amber-50/80 text-amber-800'
          )}
        >
          <span className="font-bold shrink-0">Địa chỉ GHN:</span>
          <span className="break-words">{value}</span>
        </div>
      )}

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}
