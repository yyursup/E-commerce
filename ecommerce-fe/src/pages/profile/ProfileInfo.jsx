import React, { useState, useRef } from 'react';
import { cn } from '../../lib/cn';
import { useAuthStore } from '../../store/useAuthStore';
import authService from '../../services/auth';
import { FiCamera, FiCheck, FiAlertCircle, FiLoader } from 'react-icons/fi';

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

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setSuccess(false);
        setError('');
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 1024 * 1024) {
            setError('Ảnh đại diện không được vượt quá 1 MB.');
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('Chỉ hỗ trợ định dạng JPEG, PNG, WEBP.');
            return;
        }

        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        setError('');
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
                name: data.fullName,   // keep 'name' alias in sync
                avatarUrl: data.avatarUrl,
                phoneNumber: data.phoneNumber,
                gender: data.gender,
                dateOfBirth: data.dateOfBirth,
            });

            setAvatarFile(null); // reset pending file
            if (data.avatarUrl) setAvatarPreview(data.avatarUrl);
            setSuccess(true);
        } catch (err) {
            setError(err?.message || 'Cập nhật thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = cn(
        'flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors',
        isDark
            ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500'
            : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400'
    );

    const labelClass = cn(
        'w-36 text-right pr-4 text-sm font-medium shrink-0',
        isDark ? 'text-slate-400' : 'text-stone-500'
    );

    return (
        <div>
            {/* Header */}
            <div className="border-b pb-4 mb-6 border-stone-200 dark:border-slate-700">
                <h2 className={cn('text-xl font-medium', isDark ? 'text-white' : 'text-stone-900')}>
                    Hồ Sơ Của Tôi
                </h2>
                <p className={cn('text-sm mt-1', isDark ? 'text-slate-400' : 'text-stone-500')}>
                    Quản lý thông tin hồ sơ để bảo mật tài khoản
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="flex flex-col md:flex-row gap-8">
                    {/* ── Left: Form fields ── */}
                    <div className="flex-1 space-y-5">
                        {/* Username (read-only) */}
                        <div className="flex items-center">
                            <label className={labelClass}>Tên đăng nhập</label>
                            <div className={cn('text-sm', isDark ? 'text-slate-300' : 'text-stone-700')}>
                                {user?.username || user?.email?.split('@')[0] || 'user'}
                            </div>
                        </div>

                        {/* Full name */}
                        <div className="flex items-center">
                            <label className={labelClass} htmlFor="fullName">Họ và tên</label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                value={form.fullName}
                                onChange={handleChange}
                                placeholder="Nhập họ và tên"
                                maxLength={100}
                                className={inputClass}
                            />
                        </div>

                        {/* Email (read-only) */}
                        <div className="flex items-center">
                            <label className={labelClass}>Email</label>
                            <div className={cn('text-sm', isDark ? 'text-slate-300' : 'text-stone-700')}>
                                {user?.email}
                            </div>
                        </div>

                        {/* Phone number */}
                        <div className="flex items-center">
                            <label className={labelClass} htmlFor="phoneNumber">Số điện thoại</label>
                            <input
                                id="phoneNumber"
                                name="phoneNumber"
                                type="tel"
                                value={form.phoneNumber}
                                onChange={handleChange}
                                placeholder="0912345678"
                                className={inputClass}
                            />
                        </div>

                        {/* Gender */}
                        <div className="flex items-center">
                            <label className={labelClass}>Giới tính</label>
                            <div className="flex items-center gap-5">
                                {[
                                    { value: 'MALE', label: 'Nam' },
                                    { value: 'FEMALE', label: 'Nữ' },
                                    { value: 'OTHER', label: 'Khác' },
                                ].map(({ value, label }) => (
                                    <label key={value} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="gender"
                                            value={value}
                                            checked={form.gender === value}
                                            onChange={handleChange}
                                            className="accent-amber-500"
                                        />
                                        <span className={cn('text-sm', isDark ? 'text-white' : 'text-stone-900')}>
                                            {label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Date of birth */}
                        <div className="flex items-center">
                            <label className={labelClass} htmlFor="dateOfBirth">Ngày sinh</label>
                            <input
                                id="dateOfBirth"
                                name="dateOfBirth"
                                type="date"
                                value={form.dateOfBirth}
                                onChange={handleChange}
                                max={new Date().toISOString().split('T')[0]}
                                className={cn(inputClass, 'max-w-[200px]')}
                            />
                        </div>

                        {/* Feedback messages */}
                        {error && (
                            <div className="flex items-center gap-2 pl-36 text-red-500 text-sm">
                                <FiAlertCircle size={14} />
                                <span>{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center gap-2 pl-36 text-green-500 text-sm">
                                <FiCheck size={14} />
                                <span>Cập nhật thông tin thành công!</span>
                            </div>
                        )}

                        {/* Submit */}
                        <div className="flex items-center pt-2">
                            <div className="w-36 pr-4" />
                            <button
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    'flex items-center gap-2 px-6 py-2 rounded-sm text-sm font-medium transition-colors',
                                    loading
                                        ? 'bg-amber-400 cursor-not-allowed text-white'
                                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                                )}
                            >
                                {loading ? (
                                    <>
                                        <FiLoader size={14} className="animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : 'Lưu'}
                            </button>
                        </div>
                    </div>

                    {/* ── Right: Avatar ── */}
                    <div className="md:w-56 flex flex-col items-center justify-start border-l border-stone-200 dark:border-slate-700 pl-8 pt-2">
                        {/* Avatar preview */}
                        <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 bg-stone-200 dark:bg-slate-700 flex items-center justify-center">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-3xl font-bold text-stone-400 dark:text-slate-500">
                                    {user?.fullName?.charAt(0) || user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                </span>
                            )}

                            {/* Overlay camera icon */}
                            <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity rounded-full"
                                title="Đổi ảnh đại diện"
                            >
                                <FiCamera size={22} className="text-white" />
                            </button>
                        </div>

                        {/* Hidden file input */}
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />

                        <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            className={cn(
                                'px-4 py-2 border rounded-sm text-sm transition-colors mb-3',
                                isDark
                                    ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                                    : 'border-stone-300 text-stone-700 hover:bg-stone-50'
                            )}
                        >
                            Chọn Ảnh
                        </button>

                        <div className={cn('text-xs text-center space-y-1', isDark ? 'text-slate-500' : 'text-stone-400')}>
                            <p>Dung lượng tối đa 1 MB</p>
                            <p>Định dạng: JPEG, PNG, WEBP</p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
