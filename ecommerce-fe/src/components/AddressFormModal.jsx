import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { userAddressService } from '../services/userAddressService';
import { locationService } from '../services/locationService';
import { cn } from '../lib/cn';
import { HiX } from 'react-icons/hi';

export default function AddressFormModal({ isOpen, onClose, onSuccess, isDark }) {
    const [loading, setLoading] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

    const selectedProvinceId = watch('provinceId');
    const selectedDistrictId = watch('districtId');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            reset({ isDefault: true }); // Mặc định chọn luôn
            fetchProvinces();
        }
    }, [isOpen]);

    const fetchProvinces = async () => {
        try {
            const res = await locationService.getProvinces();
            setProvinces(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Failed to load provinces", error);
        }
    }

    // Load Districts when Province changes
    useEffect(() => {
        if (selectedProvinceId) {
            locationService.getDistricts(selectedProvinceId).then(res => {
                setDistricts(Array.isArray(res.data) ? res.data : []);
                setWards([]); // Clear wards
            }).catch(console.error);
        } else {
            setDistricts([]);
            setWards([]);
        }
    }, [selectedProvinceId]);

    // Load Wards when District changes
    useEffect(() => {
        if (selectedDistrictId) {
            locationService.getWards(selectedDistrictId).then(res => {
                setWards(Array.isArray(res.data) ? res.data : []);
            }).catch(console.error);
        } else {
            setWards([]);
        }
    }, [selectedDistrictId]);

    const onSubmit = async (data) => {
        setLoading(true);
        // Data enrichment
        const province = provinces.find(p => String(p.ProvinceID) === String(data.provinceId));
        const district = districts.find(d => String(d.DistrictID) === String(data.districtId));
        const ward = wards.find(w => String(w.WardCode) === String(data.wardCode));

        const payload = {
            receiverName: data.receiverName,
            receiverPhone: data.receiverPhone,
            addressLine: data.addressLine,
            districtId: Number(data.districtId),
            wardCode: data.wardCode,
            city: province?.ProvinceName || undefined,
            district: district?.DistrictName || undefined,
            ward: ward?.WardName || undefined,
            isDefault: data.isDefault
        };

        try {
            const res = await userAddressService.createMyAddress(payload);
            toast.success('Thêm địa chỉ thành công');
            onSuccess(res.data); // Trả về address mới tạo
            onClose();
        } catch (error) {
            console.error('Create address error:', error);
            toast.error(error.message || 'Có lỗi xảy ra.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className={cn(
                "relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl shadow-xl transition-all transform scale-100 opacity-100",
                isDark ? "bg-slate-900 border border-slate-700" : "bg-white"
            )}>
                {/* Header */}
                <div className={cn("flex items-center justify-between px-6 py-4 border-b", isDark ? "border-slate-800" : "border-stone-100")}>
                    <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-stone-900")}>
                        Thêm địa chỉ mới
                    </h3>
                    <button onClick={onClose} className={cn("p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10", isDark ? "text-slate-400" : "text-stone-500")}>
                        <HiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    <form id="address-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className={cn("label block text-sm font-medium mb-1", isDark ? "text-gray-300" : "text-gray-700")}>Họ tên người nhận</label>
                                <input
                                    {...register('receiverName', { required: "Vui lòng nhập họ tên" })}
                                    className={cn("w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-amber-500/20", isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-300")}
                                    placeholder="Nguyễn Văn A"
                                />
                                {errors.receiverName && <span className="text-xs text-red-500">{errors.receiverName.message}</span>}
                            </div>
                            <div>
                                <label className={cn("label block text-sm font-medium mb-1", isDark ? "text-gray-300" : "text-gray-700")}>Số điện thoại</label>
                                <input
                                    {...register('receiverPhone', { required: "Vui lòng nhập SĐT", pattern: { value: /^[0-9]{10,11}$/, message: "SĐT không hợp lệ" } })}
                                    className={cn("w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-amber-500/20", isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-300")}
                                    placeholder="0901234567"
                                />
                                {errors.receiverPhone && <span className="text-xs text-red-500">{errors.receiverPhone.message}</span>}
                            </div>

                            {/* Location */}
                            <div>
                                <label className={cn("label block text-sm font-medium mb-1", isDark ? "text-gray-300" : "text-gray-700")}>Tỉnh / Thành phố</label>
                                <select
                                    {...register('provinceId', { required: "Chọn Tỉnh/Thành" })}
                                    className={cn("w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-amber-500/20", isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-300")}
                                >
                                    <option value="">Chọn Tỉnh/Thành</option>
                                    {provinces.map(p => (
                                        <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>
                                    ))}
                                </select>
                                {errors.provinceId && <span className="text-xs text-red-500">{errors.provinceId.message}</span>}
                            </div>
                            <div>
                                <label className={cn("label block text-sm font-medium mb-1", isDark ? "text-gray-300" : "text-gray-700")}>Quận / Huyện</label>
                                <select
                                    {...register('districtId', { required: "Chọn Quận/Huyện" })}
                                    disabled={!selectedProvinceId}
                                    className={cn("w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50", isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-300")}
                                >
                                    <option value="">Chọn Quận/Huyện</option>
                                    {districts.map(d => (
                                        <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>
                                    ))}
                                </select>
                                {errors.districtId && <span className="text-xs text-red-500">{errors.districtId.message}</span>}
                            </div>
                            <div>
                                <label className={cn("label block text-sm font-medium mb-1", isDark ? "text-gray-300" : "text-gray-700")}>Phường / Xã</label>
                                <select
                                    {...register('wardCode', { required: "Chọn Phường/Xã" })}
                                    disabled={!selectedDistrictId}
                                    className={cn("w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50", isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-300")}
                                >
                                    <option value="">Chọn Phường/Xã</option>
                                    {wards.map(w => (
                                        <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>
                                    ))}
                                </select>
                                {errors.wardCode && <span className="text-xs text-red-500">{errors.wardCode.message}</span>}
                            </div>

                            <div className="">
                                <label className={cn("label block text-sm font-medium mb-1", isDark ? "text-gray-300" : "text-gray-700")}>Địa chỉ cụ thể</label>
                                <input
                                    {...register('addressLine', { required: "Nhập số nhà, tên đường" })}
                                    className={cn("w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-amber-500/20", isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-300")}
                                    placeholder="Số 123, đường ABC..."
                                />
                                {errors.addressLine && <span className="text-xs text-red-500">{errors.addressLine.message}</span>}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                            <input type="checkbox" {...register('isDefault')} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                            <span className={cn("text-sm", isDark ? "text-slate-300" : "text-gray-700")}>Đặt làm địa chỉ mặc định</span>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className={cn("flex items-center justify-end gap-3 px-6 py-4 border-t bg-stone-50 dark:bg-slate-800/50", isDark ? "border-slate-800" : "border-stone-100")}>
                    <button
                        onClick={onClose}
                        className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", isDark ? "text-slate-300 hover:bg-slate-800" : "text-stone-600 hover:bg-stone-100")}
                    >
                        Hủy bỏ
                    </button>
                    <button
                        form="address-form"
                        disabled={loading}
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Đang lưu...' : 'Hoàn tất'}
                    </button>
                </div>
            </div>
        </div>
    );
}
