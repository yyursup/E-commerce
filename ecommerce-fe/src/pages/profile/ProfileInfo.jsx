import React from 'react';
import { cn } from '../../lib/cn';

export default function ProfileInfo({ isDark, user }) {
    return (
        <div>
            <div className="border-b pb-4 mb-6 border-stone-200 dark:border-slate-700">
                <h2 className={cn("text-xl font-medium", isDark ? "text-white" : "text-stone-900")}>
                    Hồ Sơ Của Tôi
                </h2>
                <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-stone-500")}>
                    Quản lý thông tin hồ sơ để bảo mật tài khoản
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Form fields */}
                <div className="flex-1 space-y-6">
                    <div className="flex items-center">
                        <label className={cn("w-32 text-right pr-4 text-sm font-medium", isDark ? "text-slate-400" : "text-stone-500")}>
                            Tên đăng nhập
                        </label>
                        <div className={cn("text-sm", isDark ? "text-white" : "text-stone-900")}>
                            {user?.email?.split('@')[0] || 'user'}
                        </div>
                    </div>

                    <div className="flex items-center">
                        <label className={cn("w-32 text-right pr-4 text-sm font-medium", isDark ? "text-slate-400" : "text-stone-500")}>
                            Tên
                        </label>
                        <input
                            type="text"
                            defaultValue={user?.name || ''}
                            className={cn(
                                "flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500",
                                isDark ? "border-slate-700 bg-slate-800 text-white" : "border-stone-300 bg-white text-stone-900"
                            )}
                        />
                    </div>

                    <div className="flex items-center">
                        <label className={cn("w-32 text-right pr-4 text-sm font-medium", isDark ? "text-slate-400" : "text-stone-500")}>
                            Email
                        </label>
                        <div className="flex items-center gap-2">
                            <div className={cn("text-sm", isDark ? "text-white" : "text-stone-900")}>
                                {user?.email}
                            </div>
                            <button className="text-sm text-blue-600 hover:underline">Thay Đổi</button>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <label className={cn("w-32 text-right pr-4 text-sm font-medium", isDark ? "text-slate-400" : "text-stone-500")}>
                            Số điện thoại
                        </label>
                        <div className="flex items-center gap-2">
                            <button className="text-sm text-blue-600 hover:underline">Thêm</button>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <label className={cn("w-32 text-right pr-4 text-sm font-medium", isDark ? "text-slate-400" : "text-stone-500")}>
                            Giới tính
                        </label>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="gender" value="MALE" className="text-amber-500 focus:ring-amber-500" />
                                <span className={cn("text-sm", isDark ? "text-white" : "text-stone-900")}>Nam</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="gender" value="FEMALE" className="text-amber-500 focus:ring-amber-500" />
                                <span className={cn("text-sm", isDark ? "text-white" : "text-stone-900")}>Nữ</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="gender" value="OTHER" className="text-amber-500 focus:ring-amber-500" />
                                <span className={cn("text-sm", isDark ? "text-white" : "text-stone-900")}>Khác</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <label className={cn("w-32 text-right pr-4 text-sm font-medium", isDark ? "text-slate-400" : "text-stone-500")}>
                            Ngày sinh
                        </label>
                        <div className="flex items-center gap-2">
                            <div className={cn("text-sm", isDark ? "text-white" : "text-stone-900")}>
                                **/**/2004
                            </div>
                            <button className="text-sm text-blue-600 hover:underline">Thay Đổi</button>
                        </div>
                    </div>

                    <div className="flex items-center pt-4">
                        <div className="w-32 pr-4"></div>
                        <button className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-sm text-sm font-medium transition-colors">
                            Lưu
                        </button>
                    </div>
                </div>

                {/* Avatar upload */}
                <div className="md:w-64 flex flex-col items-center justify-start border-l border-stone-200 dark:border-slate-700 pt-4 md:pt-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-stone-200 dark:bg-slate-700 flex items-center justify-center">
                        <span className="text-3xl text-stone-400 dark:text-slate-500">
                            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </span>
                    </div>
                    <button className={cn(
                        "px-4 py-2 border rounded-sm text-sm transition-colors mb-4",
                        isDark ? "border-slate-600 text-slate-300 hover:bg-slate-800" : "border-stone-300 text-stone-700 hover:bg-stone-50"
                    )}>
                        Chọn Ảnh
                    </button>
                    <div className={cn("text-xs text-center space-y-1", isDark ? "text-slate-500" : "text-stone-500")}>
                        <p>Dụng lượng file tối đa 1 MB</p>
                        <p>Định dạng: .JPEG, .PNG</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
