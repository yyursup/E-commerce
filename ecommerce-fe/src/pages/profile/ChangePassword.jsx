import React from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn';
import authService from '../../services/auth';
import { useAuthStore } from '../../store/useAuthStore';

export default function ChangePassword({ isDark }) {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm();

    const onSubmit = async (data) => {
        try {
            await authService.changePassword({
                oldPassword: data.oldPassword,
                newPassword: data.newPassword
            });
            toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
            reset();
            // Đăng xuất và chuyển về trang đăng nhập
            logout();
            navigate('/login');
        } catch (error) {
            toast.error(error?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
        }
    };

    return (
        <div>
            <div className="border-b pb-4 mb-6 border-stone-200 dark:border-slate-700">
                <h2 className={cn("text-xl font-medium", isDark ? "text-white" : "text-stone-900")}>
                    Đổi Mật Khẩu
                </h2>
                <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-stone-500")}>
                    Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác
                </p>
            </div>

            <div className="max-w-md mx-auto py-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <div className="flex items-center">
                            <label className={cn("w-36 text-right pr-4 text-sm font-medium", isDark ? "text-slate-400" : "text-stone-500")}>
                                Mật Khẩu Hiện Tại
                            </label>
                            <input
                                type="password"
                                className={cn(
                                    "flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500",
                                    isDark ? "border-slate-700 bg-slate-800 text-white" : "border-stone-300 bg-white text-stone-900",
                                    errors.oldPassword && "border-red-500"
                                )}
                                {...register('oldPassword', {
                                    required: 'Vui lòng nhập mật khẩu hiện tại'
                                })}
                            />
                        </div>
                        {errors.oldPassword && (
                            <div className="flex">
                                <div className="w-36 pr-4"></div>
                                <p className="text-red-500 text-xs mt-1">{errors.oldPassword.message}</p>
                            </div>
                        )}
                    </div>
                    
                    <div>
                        <div className="flex items-center">
                            <label className={cn("w-36 text-right pr-4 text-sm font-medium", isDark ? "text-slate-400" : "text-stone-500")}>
                                Mật Khẩu Mới
                            </label>
                            <input
                                type="password"
                                className={cn(
                                    "flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500",
                                    isDark ? "border-slate-700 bg-slate-800 text-white" : "border-stone-300 bg-white text-stone-900",
                                    errors.newPassword && "border-red-500"
                                )}
                                {...register('newPassword', {
                                    required: 'Vui lòng nhập mật khẩu mới',
                                    minLength: {
                                        value: 6,
                                        message: 'Mật khẩu phải có ít nhất 6 ký tự'
                                    }
                                })}
                            />
                        </div>
                        {errors.newPassword && (
                            <div className="flex">
                                <div className="w-36 pr-4"></div>
                                <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center">
                            <label className={cn("w-36 text-right pr-4 text-sm font-medium", isDark ? "text-slate-400" : "text-stone-500")}>
                                Xác Nhận Mật Khẩu
                            </label>
                            <input
                                type="password"
                                className={cn(
                                    "flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500",
                                    isDark ? "border-slate-700 bg-slate-800 text-white" : "border-stone-300 bg-white text-stone-900",
                                    errors.confirmPassword && "border-red-500"
                                )}
                                {...register('confirmPassword', {
                                    required: 'Vui lòng xác nhận mật khẩu',
                                    validate: (val) => {
                                        if (watch('newPassword') != val) {
                                            return 'Mật khẩu không khớp';
                                        }
                                    }
                                })}
                            />
                        </div>
                        {errors.confirmPassword && (
                            <div className="flex">
                                <div className="w-36 pr-4"></div>
                                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center pt-4">
                        <div className="w-36 pr-4"></div>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className={cn(
                                "bg-amber-500 text-white px-6 py-2 rounded-sm text-sm font-medium transition-colors",
                                isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-amber-600"
                            )}
                        >
                            {isSubmitting ? 'Đang cập nhật...' : 'Xác Nhận'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
