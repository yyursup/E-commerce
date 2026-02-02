import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useThemeStore } from '../store/useThemeStore';
import { cn } from '../lib/cn';
import { HiCheckCircle, HiXCircle } from 'react-icons/hi';

export default function PaymentResult() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isDark = useThemeStore((s) => s.theme) === 'dark';

    const [status, setStatus] = useState('loading'); // loading, success, failed
    const [message, setMessage] = useState('Đang xử lý kết quả thanh toán...');

    useEffect(() => {
        const verifyPayment = async () => {
            const params = Object.fromEntries(searchParams.entries());

            // Basic client-side check first (optional, mainly wait for backend)
            // Call backend to verify signature and update status
            try {
                // We use the existing endpoint structure: GET /payment/vnpay/return?params...
                const response = await axiosClient.get('/api/v1/payment/vnpay/return', { params });

                // Inspect response status or code (assuming backend returns { ok: true } on valid signature, 
                // but we also need to check vnp_ResponseCode for actual success)
                const responseCode = params['vnp_ResponseCode'];

                if (responseCode === '00') {
                    setStatus('success');
                    setMessage('Thanh toán thành công!');
                } else {
                    setStatus('failed');
                    setMessage('Thanh toán thất bại hoặc bị hủy.');
                }
            } catch (error) {
                console.error(error);
                setStatus('failed');
                setMessage('Có lỗi xảy ra khi xác thực thanh toán.');
            }
        };

        if (searchParams.toString()) {
            verifyPayment();
        } else {
            setStatus('failed');
            setMessage('Không tìm thấy thông tin thanh toán.');
        }
    }, [searchParams]);

    return (
        <div className={cn("min-h-[80vh] flex flex-col items-center justify-center p-4 text-center", isDark ? "bg-slate-950" : "bg-stone-50")}>
            <div className={cn("max-w-md w-full p-8 rounded-3xl border shadow-xl transition-all", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-100")}>

                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <h2 className={cn("text-xl font-bold", isDark ? "text-white" : "text-stone-900")}>Đang xử lý...</h2>
                        <p className={cn("mt-2", isDark ? "text-slate-400" : "text-stone-500")}>Vui lòng không tắt trình duyệt</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <HiCheckCircle className="w-20 h-20 text-green-500 mb-6" />
                        <h2 className={cn("text-2xl font-bold text-green-500 mb-2")}>Thanh toán thành công!</h2>
                        <p className={cn("text-sm mb-8", isDark ? "text-slate-400" : "text-stone-500")}>
                            Đơn hàng của bạn đã được xác nhận và đang chờ xử lý.
                        </p>
                        <div className="flex gap-3 w-full">
                            <Link to="/my-orders" className={cn("flex-1 py-3 rounded-xl font-semibold transition text-center", isDark ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-stone-100 text-stone-900 hover:bg-stone-200")}>
                                Xem đơn hàng
                            </Link>
                            <Link to="/" className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition text-center">
                                Tiếp tục mua sắm
                            </Link>
                        </div>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <HiXCircle className="w-20 h-20 text-red-500 mb-6" />
                        <h2 className={cn("text-2xl font-bold text-red-500 mb-2")}>Thanh toán thất bại</h2>
                        <p className={cn("text-sm mb-8", isDark ? "text-slate-400" : "text-stone-500")}>
                            {message}
                        </p>
                        <div className="flex gap-3 w-full">
                            <Link to="/cart" className={cn("flex-1 py-3 rounded-xl font-semibold transition text-center", isDark ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-stone-100 text-stone-900 hover:bg-stone-200")}>
                                Về giỏ hàng
                            </Link>
                            <Link to="/checkout" className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition text-center">
                                Thử lại
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
