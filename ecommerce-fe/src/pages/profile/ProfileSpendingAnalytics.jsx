import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    HiOutlineCurrencyDollar,
    HiOutlineShoppingBag,
    HiOutlineTag,
    HiOutlineSparkles,
    HiOutlineShieldCheck,
    HiOutlineRefresh,
    HiOutlineDeviceMobile,
    HiOutlineCube,
    HiOutlineCheckCircle,
    HiOutlineClock,
} from 'react-icons/hi';
import { cn } from '../../lib/cn';
import statisticsService from '../../services/statistics';
import toast from 'react-hot-toast';

export default function ProfileSpendingAnalytics({ isDark }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await statisticsService.getBuyerSpendingAnalytics();
            setData(res);
        } catch (err) {
            console.error('Error fetching buyer spending analytics:', err);
            setError('Không thể tải dữ liệu thống kê chi tiêu');
            toast.error('Không thể tải dữ liệu thống kê chi tiêu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
                <p className={cn("mt-4 text-sm font-medium", isDark ? "text-slate-400" : "text-stone-600")}>
                    Đang tổng hợp dữ liệu chi tiêu cá nhân...
                </p>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="py-12 text-center">
                <p className="text-sm text-red-500">{error}</p>
                <button
                    onClick={fetchAnalytics}
                    className="mt-4 rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white hover:bg-amber-600 transition"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    const categoryList = data?.categorySpending || [];
    const devicesList = data?.purchasedDevices || [];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-stone-900")}>
                            Sổ Tay Chi Tiêu & Bảo Hành Thiết Bị
                        </h2>
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-500 border border-amber-500/20">
                            Smart Tech Shopper
                        </span>
                    </div>
                    <p className={cn("mt-1 text-sm", isDark ? "text-slate-400" : "text-stone-600")}>
                        Theo dõi tài chính cá nhân, số tiền tiết kiệm và thời hạn bảo hành các thiết bị đã mua
                    </p>
                </div>

                <button
                    onClick={fetchAnalytics}
                    className={cn(
                        "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition self-start sm:self-auto",
                        isDark
                            ? "border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300"
                            : "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700"
                    )}
                >
                    <HiOutlineRefresh className="h-4 w-4" />
                    Cập nhật
                </button>
            </div>

            {/* 1. KHỐI THẺ TÀI CHÍNH CÁ NHÂN (4 STAT CARDS) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Thẻ 1: Tổng chi tiêu */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "rounded-2xl border p-5 shadow-xs",
                        isDark ? "border-slate-800 bg-slate-950/60" : "border-stone-200 bg-stone-50/70"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <span className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-slate-400" : "text-stone-500")}>
                            Tổng Tiền Đã Mua
                        </span>
                        <div className="rounded-xl bg-blue-500/10 p-2 text-blue-500">
                            <HiOutlineCurrencyDollar className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-black text-blue-500">{formatCurrency(data?.totalSpent)}</p>
                        <p className={cn("mt-1 text-xs", isDark ? "text-slate-400" : "text-stone-500")}>
                            {data?.completedOrders || 0} đơn hàng thành công
                        </p>
                    </div>
                </motion.div>

                {/* Thẻ 2: Đơn hàng & Thiết bị */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className={cn(
                        "rounded-2xl border p-5 shadow-xs",
                        isDark ? "border-slate-800 bg-slate-950/60" : "border-stone-200 bg-stone-50/70"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <span className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-slate-400" : "text-stone-500")}>
                            Tổng Đơn Đã Đặt
                        </span>
                        <div className="rounded-xl bg-purple-500/10 p-2 text-purple-500">
                            <HiOutlineShoppingBag className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-black text-purple-500">{data?.totalOrders || 0} đơn</p>
                        <p className={cn("mt-1 text-xs", isDark ? "text-slate-400" : "text-stone-500")}>
                            {data?.deliveringOrders || 0} đơn đang trên đường giao
                        </p>
                    </div>
                </motion.div>

                {/* Thẻ 3: Tiết kiệm Voucher */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                        "rounded-2xl border p-5 shadow-xs",
                        isDark ? "border-slate-800 bg-slate-950/60" : "border-stone-200 bg-stone-50/70"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <span className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-slate-400" : "text-stone-500")}>
                            Giảm Giá Từ Voucher
                        </span>
                        <div className="rounded-xl bg-rose-500/10 p-2 text-rose-500">
                            <HiOutlineTag className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-black text-rose-500">{formatCurrency(data?.totalVoucherSaved)}</p>
                        <p className={cn("mt-1 text-xs", isDark ? "text-slate-400" : "text-stone-500")}>
                            Tiết kiệm mã khuyến mãi
                        </p>
                    </div>
                </motion.div>

                {/* Thẻ 4: Tiết kiệm thông minh khi mua Like New / Cũ */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className={cn(
                        "rounded-2xl border p-5 shadow-xs relative overflow-hidden",
                        isDark ? "border-amber-500/30 bg-amber-500/5" : "border-amber-200 bg-amber-50/60"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                            Tiết Kiệm Thông Minh
                        </span>
                        <div className="rounded-xl bg-amber-500/20 p-2 text-amber-500">
                            <HiOutlineSparkles className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-black text-amber-500">{formatCurrency(data?.estimatedTechSavings)}</p>
                        <p className={cn("mt-1 text-[11px]", isDark ? "text-slate-400" : "text-stone-600")}>
                            Nhờ chọn hàng Like New & As-is so với Mới Seal
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* 2. CƠ CẤU CHI TIÊU THEO DANH MỤC CÔNG NGHỆ */}
            <div
                className={cn(
                    "rounded-2xl border p-6 shadow-xs",
                    isDark ? "border-slate-800 bg-slate-950/40" : "border-stone-200 bg-white"
                )}
            >
                <div className="border-b pb-3 mb-4">
                    <h3 className={cn("text-base font-bold", isDark ? "text-white" : "text-stone-900")}>
                        Cơ Cấu Chi Tiêu Theo Danh Mục
                    </h3>
                    <p className={cn("text-xs", isDark ? "text-slate-400" : "text-stone-500")}>
                        Phân bổ ngân sách vào các nhóm thiết bị điện tử của bạn
                    </p>
                </div>

                {categoryList.length === 0 ? (
                    <div className={cn("py-6 text-center text-xs", isDark ? "text-slate-500" : "text-stone-500")}>
                        Chưa có giao dịch phát sinh theo danh mục
                    </div>
                ) : (
                    <div className="space-y-4">
                        {categoryList.map((cat) => (
                            <div key={cat.categoryId} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className={cn("font-semibold", isDark ? "text-slate-300" : "text-stone-700")}>
                                        {cat.categoryName} ({cat.itemCount} sản phẩm)
                                    </span>
                                    <span className={cn("font-bold", isDark ? "text-amber-400" : "text-amber-600")}>
                                        {formatCurrency(cat.amountSpent)} ({cat.percentage}%)
                                    </span>
                                </div>
                                <div className={cn("h-2 w-full rounded-full overflow-hidden", isDark ? "bg-slate-800" : "bg-stone-200")}>
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-amber-500 transition-all duration-500"
                                        style={{ width: `${Math.min(cat.percentage || 0, 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. SỔ TAY THIẾT BỊ ĐÃ MUA & TÌNH TRẠNG BẢO HÀNH */}
            <div
                className={cn(
                    "rounded-2xl border p-6 shadow-xs",
                    isDark ? "border-slate-800 bg-slate-950/40" : "border-stone-200 bg-white"
                )}
            >
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <div>
                        <h3 className={cn("text-base font-bold", isDark ? "text-white" : "text-stone-900")}>
                            Thiết Bị Công Nghệ & Trạng Thái Bảo Hành
                        </h3>
                        <p className={cn("text-xs", isDark ? "text-slate-400" : "text-stone-500")}>
                            Quản lý thời hạn bảo hành của các thiết bị bạn đã sở hữu
                        </p>
                    </div>
                    <span className={cn("text-xs font-semibold", isDark ? "text-slate-400" : "text-stone-500")}>
                        {devicesList.length} thiết bị gần nhất
                    </span>
                </div>

                {devicesList.length === 0 ? (
                    <div className="py-10 text-center">
                        <HiOutlineCube className="mx-auto h-10 w-10 text-slate-500 mb-2" />
                        <p className={cn("text-xs", isDark ? "text-slate-400" : "text-stone-500")}>
                            Bạn chưa có thiết bị nào được lưu trong sổ tay bảo hành.
                        </p>
                    </div>
                ) : (
                    <div className={cn("divide-y", isDark ? "divide-slate-800/40" : "divide-stone-100")}>
                        {devicesList.map((item, idx) => {
                            let wBadgeColor = isDark
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            let wText = 'Còn bảo hành';
                            if (item.warrantyStatus === 'EXPIRED') {
                                wBadgeColor = isDark
                                    ? 'bg-slate-700/40 text-slate-400 border-slate-700'
                                    : 'bg-stone-100 text-stone-600 border-stone-200';
                                wText = 'Hết hạn BH';
                            } else if (item.warrantyStatus === 'NOT_APPLICABLE') {
                                wBadgeColor = isDark
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    : 'bg-rose-50 text-rose-700 border-rose-200';
                                wText = 'Bao test / As-is';
                            }

                            return (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3">
                                    <div className="flex items-center gap-3">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0" />
                                        ) : (
                                            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl shrink-0", isDark ? "bg-slate-800 text-slate-400" : "bg-stone-100 text-stone-500")}>
                                                <HiOutlineDeviceMobile className="h-6 w-6" />
                                            </div>
                                        )}
                                        <div>
                                            <p className={cn("font-bold text-sm", isDark ? "text-white" : "text-stone-900")}>
                                                {item.productName}
                                            </p>
                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                                <span className={cn("rounded-md px-2 py-0.5 font-semibold border text-[10px]", isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-200")}>
                                                    {item.conditionGradeLabel}
                                                </span>
                                                <span className={cn("text-[11px]", isDark ? "text-slate-400" : "text-stone-600")}>
                                                    Gói: {item.warrantyTypeLabel}
                                                </span>
                                                <span className={cn("text-[11px]", isDark ? "text-slate-500" : "text-stone-400")}>
                                                    • Đơn #{item.orderNumber ? item.orderNumber.slice(-8) : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pl-15 sm:pl-0">
                                        <span className={cn("font-extrabold text-sm", isDark ? "text-emerald-400" : "text-emerald-600")}>
                                            {formatCurrency(item.purchasePrice)}
                                        </span>
                                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", wBadgeColor)}>
                                            {wText}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
