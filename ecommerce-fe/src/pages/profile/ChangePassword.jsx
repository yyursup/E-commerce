import React from 'react';
import { cn } from '../../lib/cn';

export default function ChangePassword({ isDark }) {
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
                <div className="space-y-6">
                    <div className="flex items-center">
                        <label className={cn("w-36 text-right pr-4 text-sm font-medium", isDark ? "text-slate-400" : "text-stone-500")}>
                            Mật Khẩu Hiện Tại
                        </label>
                        <input
                            type="password"
                            className={cn(
                                "flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500",
                                isDark ? "border-slate-700 bg-slate-800 text-white" : "border-stone-300 bg-white text-stone-900"
                            )}
                        />
                    </div>
                    <div className="flex items-center">
                        <label className={cn("w-36 text-right pr-4 text-sm font-medium", isDark ? "text-slate-400" : "text-stone-500")}>
                            Mật Khẩu Mới
                        </label>
                        <input
                            type="password"
                            className={cn(
                                "flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500",
                                isDark ? "border-slate-700 bg-slate-800 text-white" : "border-stone-300 bg-white text-stone-900"
                            )}
                        />
                    </div>
                    <div className="flex items-center">
                        <label className={cn("w-36 text-right pr-4 text-sm font-medium", isDark ? "text-slate-400" : "text-stone-500")}>
                            Xác Nhận Mật Khẩu
                        </label>
                        <input
                            type="password"
                            className={cn(
                                "flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500",
                                isDark ? "border-slate-700 bg-slate-800 text-white" : "border-stone-300 bg-white text-stone-900"
                            )}
                        />
                    </div>

                    <div className="flex items-center pt-4">
                        <div className="w-36 pr-4"></div>
                        <button className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-sm text-sm font-medium transition-colors">
                            Xác Nhận
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
