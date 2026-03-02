import React from 'react';
import { cn } from '../../lib/cn';

export default function BankInfo({ isDark }) {
    return (
        <div>
            <div className="flex justify-between items-center border-b pb-4 mb-6 border-stone-200 dark:border-slate-700">
                <h2 className={cn("text-xl font-medium", isDark ? "text-white" : "text-stone-900")}>
                    Thẻ Tín Dụng/Ghi Nợ
                </h2>
                <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-sm text-sm font-medium transition-colors flex items-center gap-2">
                    <span>+</span> Thêm Thẻ Mới
                </button>
            </div>

            <div className="py-12 text-center">
                <p className={cn("text-sm", isDark ? "text-slate-400" : "text-stone-500")}>
                    Bạn chưa liên kết thẻ.
                </p>
            </div>

            <div className="flex justify-between items-center border-b pb-4 mb-6 border-stone-200 dark:border-slate-700 mt-8">
                <h2 className={cn("text-xl font-medium", isDark ? "text-white" : "text-stone-900")}>
                    Tài Khoản Ngân Hàng Của Tôi
                </h2>
                <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-sm text-sm font-medium transition-colors flex items-center gap-2">
                    <span>+</span> Thêm Ngân Hàng Liên Kết
                </button>
            </div>

            <div className="py-12 text-center">
                <p className={cn("text-sm", isDark ? "text-slate-400" : "text-stone-500")}>
                    Bạn chưa có tài khoản ngân hàng.
                </p>
            </div>
        </div>
    );
}
