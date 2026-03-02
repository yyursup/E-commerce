import React from 'react';
import { cn } from '../../lib/cn';

export default function PersonalInfo({ isDark }) {
    return (
        <div>
            <div className="border-b pb-4 mb-6 border-stone-200 dark:border-slate-700">
                <h2 className={cn("text-xl font-medium", isDark ? "text-white" : "text-stone-900")}>
                    Thông Tin Cá Nhân
                </h2>
                <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-stone-500")}>
                    Quản lý thông tin cá nhân của bạn
                </p>
            </div>

            <div className="py-12 text-center">
                <p className={cn("text-sm", isDark ? "text-slate-400" : "text-stone-500")}>
                    Thông tin cá nhân (Đang phát triển)
                </p>
            </div>
        </div>
    );
}
