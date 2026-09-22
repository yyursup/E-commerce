import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/cn';
import { useAuthStore } from '../../store/useAuthStore';
import authService from '../../services/auth';
import { FiCamera, FiCheck, FiAlertCircle, FiLoader, FiUpload, FiUser } from 'react-icons/fi';

export default function ProfileInfo({ isDark }) {
    const { user, updateUser } = useAuthStore();

    // Pre-populate form with existing user data
    const [form, setForm] = useState({
        fullName: user?.fullName || user?.name || '',
        phoneNumber: user?.phoneNumber || '',
        gender: user?.gender || '',
        dateOfBirth: user?.dateOfBirth || '',
    });

    // Avatar state
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null);
    const avatarInputRef = useRef(null);

    // Submit state
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Keep form & avatar preview synced whenever user object in store is updated
    useEffect(() => {
        if (user) {
            setForm({
                fullName: user?.fullName || user?.name || '',
                phoneNumber: user?.phoneNumber || '',
                gender: user?.gender || '',
                dateOfBirth: user?.dateOfBirth || '',
            });
            if (!avatarFile) {
                setAvatarPreview(user?.avatarUrl || null);
            }
        }
    }, [user, avatarFile]);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setSuccess(false);
        setError('');
    };

    const handleGenderChange = (val) => {
        setForm((prev) => ({ ...prev, gender: val }));
        setSuccess(false);
        setError('');
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            const msg = 'Ảnh đại diện không được vượt quá 2 MB.';
            setError(msg);
            toast.error(msg);
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
            const msg = 'Chỉ hỗ trợ định dạng JPEG, PNG, WEBP.';
            setError(msg);
            toast.error(msg);
            return;
        }

        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        setError('');
        toast.success('Đã tải ảnh lên bản xem trước!');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        setError('');

        try {
            const payload = {
                fullName: form.fullName.trim() || undefined,
                phoneNumber: form.phoneNumber.trim() || undefined,
                gender: form.gender || undefined,
                dateOfBirth: form.dateOfBirth || undefined,
                avatarFile: avatarFile || undefined,
            };

            const data = await authService.updateProfile(payload);

            // Update store so Navbar/sidebar reflect changes immediately
            updateUser({
                fullName: data.fullName,
                name: data.fullName,
                avatarUrl: data.avatarUrl,
                phoneNumber: data.phoneNumber,
                gender: data.gender,
                dateOfBirth: data.dateOfBirth,
            });

            setAvatarFile(null); // reset pending file
            if (data.avatarUrl) {
                setAvatarPreview(data.avatarUrl);
            }
            setSuccess(true);
            toast.success('Cập nhật thông tin hồ sơ thành công!');
        } catch (err) {
            console.error('Update profile error:', err);
            const msg = err?.message || err?.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.';
            setError(typeof msg === 'string' ? msg : 'Cập nhật thất bại. Vui lòng thử lại.');
            toast.error(typeof msg === 'string' ? msg : 'Cập nhật thất bại');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = cn(
        'w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50',
        isDark
            ? 'border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 focus:border-amber-500'
            : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:border-amber-500 shadow-2xs'
    );

    const labelClass = cn(
        'text-sm font-semibold sm:w-36 sm:text-right sm:pr-6 shrink-0',
        isDark ? 'text-slate-400' : 'text-stone-600'
    );

    return (
        <div
            className={cn(
                'rounded-3xl border p-5 sm:p-8 shadow-sm transition-colors',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
            )}
        >
            {/* Header */}
            <div className="border-b pb-5 mb-8 border-stone-200 dark:border-slate-800">
                <h2 className={cn('text-xl sm:text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
                    Hồ Sơ Của Tôi
                </h2>
                <p className={cn('text-xs sm:text-sm mt-1.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    Quản lý thông tin cá nhân và ảnh đại diện để bảo mật tài khoản
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-12">
                    {/* ── Left: Form fields ── */}
                    <div className="flex-1 space-y-6">
                        {/* Username (read-only) */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                            <label className={labelClass}>Tên đăng nhập</label>
                            <div className={cn('text-sm font-medium py-1 px-1', isDark ? 'text-slate-300' : 'text-stone-700')}>
                                {user?.username || user?.email?.split('@')[0] || 'user'}
                            </div>
                        </div>

                        {/* Full name */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-0">
                            <label className={labelClass} htmlFor="fullName">Họ và tên</label>
                            <div className="flex-1 max-w-lg">
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    placeholder="Nhập họ và tên của bạn"
                                    maxLength={100}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Email (read-only) */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                            <label className={labelClass}>Email</label>
                            <div className={cn('text-sm font-medium py-1 px-1 flex items-center gap-2', isDark ? 'text-slate-300' : 'text-stone-700')}>
                                <span>{user?.email}</span>
                                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                                    Đã xác thực
                                </span>
                            </div>
                        </div>

                        {/* Phone number */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-0">
                            <label className={labelClass} htmlFor="phoneNumber">Số điện thoại</label>
                            <div className="flex-1 max-w-lg">
                                <input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    type="tel"
                                    value={form.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="Ví dụ: 0912345678"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Gender */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                            <label className={labelClass}>Giới tính</label>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                {[
                                    { value: 'MALE', label: 'Nam' },
                                    { value: 'FEMALE', label: 'Nữ' },
                                    { value: 'OTHER', label: 'Khác' },
                                ].map(({ value, label }) => {
                                    const isSelected = form.gender === value;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => handleGenderChange(value)}
                                            className={cn(
                                                'px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border cursor-pointer',
                                                isSelected
                                                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500'
                                                    : isDark
                                                    ? 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                                                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                                            )}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Date of birth */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-0">
                            <label className={labelClass} htmlFor="dateOfBirth">Ngày sinh</label>
                            <div className="flex-1 max-w-xs">
                                <input
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    type="date"
                                    value={form.dateOfBirth}
                                    onChange={handleChange}
                                    max={new Date().toISOString().split('T')[0]}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Feedback messages */}
                        {error && (
                            <div className="flex items-center gap-2 text-rose-500 text-xs sm:text-sm sm:pl-36">
                                <FiAlertCircle size={15} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center gap-2 text-emerald-500 text-xs sm:text-sm sm:pl-36 font-medium">
                                <FiCheck size={15} className="shrink-0" />
                                <span>Cập nhật thông tin thành công!</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex items-center pt-3 sm:pl-36">
                            <button
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    'flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all active:scale-95 cursor-pointer',
                                    loading && 'opacity-70 cursor-not-allowed'
                                )}
                            >
                                {loading ? (
                                    <>
                                        <FiLoader size={16} className="animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    'Lưu Thay Đổi'
                                )}
                            </button>
                        </div>
                    </div>

                    {/* ── Right: Avatar Uploader ── */}
                    <div className="lg:w-72 flex flex-col items-center justify-start lg:border-l border-stone-200 dark:border-slate-800 lg:pl-10 pt-2 pb-6 lg:pb-0">
                        {/* Avatar preview */}
                        <div className="relative group w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-5 bg-stone-100 dark:bg-slate-800 border-4 border-stone-200 dark:border-slate-700 shadow-md flex items-center justify-center">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Avatar"
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                                />
                            ) : (
                                <span className="text-4xl font-bold text-stone-400 dark:text-slate-500">
                                    {user?.fullName?.charAt(0) || user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                </span>
                            )}

                            {/* Overlay camera icon on hover */}
                            <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer text-white"
                                title="Đổi ảnh đại diện"
                            >
                                <FiCamera size={24} />
                                <span className="text-[10px] font-semibold mt-1">Đổi Ảnh</span>
                            </button>
                        </div>

                        {/* Hidden file input */}
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />

                        {/* Select Image Button */}
                        <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            className={cn(
                                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all active:scale-95 cursor-pointer mb-4',
                                isDark
                                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:border-amber-500 hover:text-amber-400'
                                    : 'border-stone-300 bg-white text-stone-700 hover:border-amber-500 hover:text-amber-600 shadow-2xs'
                            )}
                        >
                            <FiUpload size={14} className="text-amber-500" />
                            <span>Chọn Ảnh Mới</span>
                        </button>

                        {/* Guidelines */}
                        <div className={cn('text-xs text-center space-y-1 max-w-[200px]', isDark ? 'text-slate-400' : 'text-stone-500')}>
                            <p>Dung lượng tối đa: <span className="font-semibold text-stone-700 dark:text-slate-300">2 MB</span></p>
                            <p>Định dạng: <span className="font-semibold text-stone-700 dark:text-slate-300">JPEG, PNG, WEBP</span></p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
