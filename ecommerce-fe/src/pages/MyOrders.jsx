import { useEffect, useState } from 'react';
import { useThemeStore } from '../store/useThemeStore';
import orderService from '../services/order';
import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';
import toast from 'react-hot-toast';
import { HiShoppingBag } from 'react-icons/hi';

export default function MyOrders() {
    const isDark = useThemeStore((s) => s.theme) === 'dark';
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await orderService.getMyOrders({ page: 0, size: 20 });
            // Assuming data.content or data is the list. Backend usually returns PageImpl
            setOrders(data.content || data || []);
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải lịch sử đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    // Status badges helper
    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING_PAYMENT': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500';
            case 'CONFIRMED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500';
            case 'SHIPPING': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-500';
            case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500';
            case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    // Translate status
    const getStatusText = (status) => {
        switch (status) {
            case 'PENDING_PAYMENT': return 'Chờ thanh toán';
            case 'CONFIRMED': return 'Đã xác nhận';
            case 'SHIPPING': return 'Đang giao hàng';
            case 'COMPLETED': return 'Hoàn thành';
            case 'CANCELLED': return 'Đã hủy';
            default: return status;
        }
    };

    const handlePayNow = async (orderId) => {
        try {
            const res = await orderService.createPayment(orderId);
            if (res.paymentUrl) {
                window.location.href = res.paymentUrl;
            } else {
                toast.error("Không lấy được link thanh toán");
            }
        } catch (error) {
            toast.error(error.message || "Lỗi tạo thanh toán");
        }
    };

    return (
        <div className={cn("min-h-screen py-8 px-4", isDark ? "bg-slate-950" : "bg-stone-50")}>
            <div className="mx-auto max-w-5xl">
                <h1 className={cn("text-2xl font-bold mb-8", isDark ? "text-white" : "text-stone-900")}>
                    Đơn hàng của tôi
                </h1>

                {loading ? (
                    <div className="text-center py-10">Đang tải...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-16 opacity-60">
                        <HiShoppingBag className="mx-auto h-16 w-16 mb-4" />
                        <p>Bạn chưa có đơn hàng nào.</p>
                        <Link to="/" className="text-amber-500 hover:underline mt-2 inline-block">Mua sắm ngay</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order.id} className={cn("rounded-2xl border p-6 transition shadow-sm", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-200")}>
                                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className={cn("font-bold text-lg", isDark ? "text-white" : "text-stone-900")}>
                                                {order.orderNumber}
                                            </span>
                                            <span className={cn("px-3 py-1 rounded-full text-xs font-medium", getStatusColor(order.status))}>
                                                {getStatusText(order.status)}
                                            </span>
                                        </div>
                                        <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-stone-500")}>
                                            {new Date(order.createdAt).toLocaleString('vi-VN')} | {order.shopName || 'Shop'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className={cn("font-bold text-lg text-amber-500")}>
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4 mt-4 border-dashed border-stone-200 dark:border-slate-800">
                                    {/* Product preview (Assuming items list is included in My Orders response, often it is) */}
                                    {order.items && order.items.map(item => (
                                        <div key={item.id} className="flex gap-4 mb-3 last:mb-0">
                                            <img src={item.productImageUrl || 'https://via.placeholder.com/50'} alt="" className="w-12 h-12 rounded bg-stone-100 object-cover" />
                                            <div className="flex-1">
                                                <p className={cn("text-sm font-medium line-clamp-1", isDark ? "text-slate-300" : "text-stone-700")}>{item.productName}</p>
                                                <p className={cn("text-xs", isDark ? "text-slate-500" : "text-stone-500")}>x{item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {!order.items && <p className="text-sm italic opacity-50">Xem chi tiết để thấy sản phẩm</p>}
                                </div>

                                <div className="flex gap-3 justify-end mt-4">
                                    {/* Only show Pay button if Pending Payment */}
                                    {order.status === 'PENDING_PAYMENT' && (
                                        <button
                                            onClick={() => handlePayNow(order.id)}
                                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition"
                                        >
                                            Thanh toán ngay
                                        </button>
                                    )}
                                    <button className={cn("px-4 py-2 border rounded-lg text-sm font-medium transition", isDark ? "border-slate-700 hover:bg-slate-800" : "border-stone-200 hover:bg-stone-50")}>
                                        Xem chi tiết
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
