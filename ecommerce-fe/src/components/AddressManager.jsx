import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { userAddressService } from '../services/userAddressService';
import { locationService } from '../services/locationService';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/cn';
import { HiOutlineTrash, HiOutlinePencil, HiPlus } from 'react-icons/hi';

export default function AddressManager({ isDark }) {
    const { isAuthenticated, token } = useAuthStore();
    const [addresses, setAddresses] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);

    // Location Data
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    // Form for add/edit
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

    const selectedProvinceId = watch('provinceId');
    const selectedDistrictId = watch('districtId');

    const fetchAddresses = async () => {
        // Only fetch if user is authenticated and has token
        if (!isAuthenticated || !token) {
            setAddresses([]);
            return;
        }

        try {
            setLoading(true);
            const res = await userAddressService.listMyAddresses();
            setAddresses(res.data || []);
        } catch (error) {
            console.error("Failed to load addresses", error);
            if (error.response?.status !== 401) {
                toast.error('Không thể tải danh sách địa chỉ');
            }
            setAddresses([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchProvinces = async () => {
        try {
            const res = await locationService.getProvinces();
            setProvinces(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Failed to load provinces", error);
        }
    }

    useEffect(() => {
        if (isAuthenticated && token) {
            fetchAddresses();
        }
        fetchProvinces();
    }, [isAuthenticated, token]);

    useEffect(() => {
        if (selectedProvinceId) {
            locationService.getDistricts(selectedProvinceId).then(res => {
                setDistricts(Array.isArray(res.data) ? res.data : []);
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

    const onEdit = (addr) => {
        setEditingId(addr.id);
        setIsAdding(false);

        // Map fields from Address Interface to Form
        setValue('receiverName', addr.receiverName);
        setValue('receiverPhone', addr.receiverPhone);
        setValue('addressLine', addr.addressLine);
        setValue('isDefault', addr.isDefault || false);

        // Set location IDs if available
        if (addr.districtId) setValue('districtId', addr.districtId);
        if (addr.wardCode) setValue('wardCode', addr.wardCode);

        // For province, simpler to rely on user re-selecting if not provided, 
        // as we can't derive ProvinceID from DistrictID easily without a lookup.
        // But if backend sends provinceId (optional in typical flows), set it.
        // If not, the District dropdown might be empty until Province is picked. 
        // Improvement: If we had a full address tree or provinceId in response, we'd set it.
        // Assuming user might need to re-select province to edit location if ID is missing.
        if (addr.provinceId) setValue('provinceId', addr.provinceId);
    };

    const onDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
        if (!isAuthenticated || !token) {
            toast.error('Vui lòng đăng nhập để thực hiện thao tác này');
            return;
        }
        try {
            await userAddressService.deleteMyAddress(id);
            toast.success('Đã xóa địa chỉ');
            fetchAddresses();
        } catch (error) {
            console.error('Delete address error:', error);
            toast.error(error.response?.data?.message || 'Xóa thất bại');
        }
    };

    const onSetDefault = async (id) => {
        if (!isAuthenticated || !token) {
            toast.error('Vui lòng đăng nhập để thực hiện thao tác này');
            return;
        }
        try {
            await userAddressService.setDefault(id);
            toast.success('Đã đặt làm mặc định');
            fetchAddresses();
        } catch (error) {
            console.error('Set default address error:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi đặt mặc định');
        }
    };

    const onSubmit = async (data) => {
        // Enriched Data construction
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

        if (!isAuthenticated || !token) {
            toast.error('Vui lòng đăng nhập để thực hiện thao tác này');
            return;
        }

        try {
            if (editingId) {
                await userAddressService.updateMyAddress(editingId, payload);
                toast.success('Cập nhật địa chỉ thành công');
            } else {
                await userAddressService.createMyAddress(payload);
                toast.success('Thêm địa chỉ mới thành công');
            }
            // Reset and refresh
            setEditingId(null);
            setIsAdding(false);
            reset({ isDefault: false });
            fetchAddresses();
        } catch (error) {
            console.error('Save address error:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng kiểm tra lại.');
        }
    };

    const onCancel = () => {
        setEditingId(null);
        setIsAdding(false);
        reset({ isDefault: false });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className={cn("text-xl font-bold", isDark ? "text-white" : "text-gray-900")}>
                    Sổ địa chỉ
                </h2>
                {!isAdding && !editingId && (
                    <button
                        onClick={() => { setIsAdding(true); reset({ isDefault: false }); }}
                        className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
                    >
                        <HiPlus className="h-5 w-5" /> Thêm địa chỉ mới
                    </button>
                )}
            </div>

            {(isAdding || editingId) && (
                <form onSubmit={handleSubmit(onSubmit)} className={cn("rounded-xl border p-6", isDark ? "border-slate-700 bg-slate-800/50" : "border-gray-200 bg-gray-50")}>
                    <h3 className={cn("mb-4 text-lg font-medium", isDark ? "text-white" : "text-gray-800")}>
                        {editingId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className={cn("label block text-sm font-medium mb-1", isDark ? "text-gray-300" : "text-gray-700")}>Họ tên người nhận</label>
                            <input
                                {...register('receiverName', { required: "Vui lòng nhập họ tên" })}
                                className={cn("w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-amber-500/20", isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-gray-300")}
                                placeholder="Nguyễn Văn A"
                            />
                            {errors.receiverName && <span className="text-xs text-red-500">{errors.receiverName.message}</span>}
                        </div>
                        <div>
                            <label className={cn("label block text-sm font-medium mb-1", isDark ? "text-gray-300" : "text-gray-700")}>Số điện thoại</label>
                            <input
                                {...register('receiverPhone', { required: "Vui lòng nhập SĐT", pattern: { value: /^[0-9]{10,11}$/, message: "SĐT không hợp lệ" } })}
                                className={cn("w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-amber-500/20", isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-gray-300")}
                                placeholder="0901234567"
                            />
                            {errors.receiverPhone && <span className="text-xs text-red-500">{errors.receiverPhone.message}</span>}
                        </div>

                        {/* Location Selectors */}
                        <div>
                            <label className={cn("label block text-sm font-medium mb-1", isDark ? "text-gray-300" : "text-gray-700")}>Tỉnh / Thành phố</label>
                            <select
                                {...register('provinceId', { required: "Chọn Tỉnh/Thành" })}
                                className={cn("w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-amber-500/20", isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-gray-300")}
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
                                className={cn("w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50", isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-gray-300")}
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
                                className={cn("w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50", isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-gray-300")}
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
                                className={cn("w-full rounded-lg border p-2.5 outline-none focus:ring-2 focus:ring-amber-500/20", isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-gray-300")}
                                placeholder="Số 123, đường ABC..."
                            />
                            {errors.addressLine && <span className="text-xs text-red-500">{errors.addressLine.message}</span>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" {...register('isDefault')} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                                <span className={cn("text-sm", isDark ? "text-slate-300" : "text-gray-700")}>Đặt làm địa chỉ mặc định</span>
                            </label>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700">Hủy</button>
                        <button type="submit" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">Lưu địa chỉ</button>
                    </div>
                </form>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                {addresses.map((addr) => (
                    <div key={addr.id} className={cn("relative rounded-xl border p-4 transition-all hover:shadow-md",
                        isDark ? "border-slate-700 bg-slate-900/40" : "border-stone-200 bg-white",
                        addr.isDefault && (isDark ? "border-amber-500/50 ring-1 ring-amber-500/20" : "border-amber-500 ring-1 ring-amber-500/20")
                    )}>
                        {addr.isDefault && (
                            <span className="absolute -top-2 -right-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
                                Mặc định
                            </span>
                        )}
                        <div className="mb-2 flex items-start justify-between">
                            <h4 className={cn("font-semibold", isDark ? "text-slate-200" : "text-gray-900")}>{addr.receiverName}</h4>
                            <div className="flex gap-2">
                                <button onClick={() => onEdit(addr)} className="p-1 text-gray-400 hover:text-amber-500 transition-colors">
                                    <HiOutlinePencil className="h-5 w-5" />
                                </button>
                                <button onClick={() => onDelete(addr.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                    <HiOutlineTrash className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <div className={cn("space-y-1 text-sm", isDark ? "text-slate-400" : "text-gray-600")}>
                            <p>{addr.receiverPhone}</p>
                            <p>{addr.addressLine}</p>
                            <p>{addr.ward}, {addr.district}, {addr.city}</p>
                        </div>
                        {!addr.isDefault && (
                            <button
                                onClick={() => onSetDefault(addr.id)}
                                className="mt-3 text-xs font-medium text-amber-600 hover:underline dark:text-amber-400"
                            >
                                Đặt làm mặc định
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {loading && (
                <div className="text-center py-10">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
                    <p className={cn("mt-4 text-sm", isDark ? "text-slate-400" : "text-stone-600")}>
                        Đang tải địa chỉ...
                    </p>
                </div>
            )}
            {!loading && addresses.length === 0 && !isAdding && (
                <div className="text-center py-10">
                    <p className={cn("text-gray-500", isDark ? "text-slate-400" : "")}>Chưa có địa chỉ nào. Hãy thêm địa chỉ mới để nhận hàng.</p>
                </div>
            )}
        </div>
    );
}
