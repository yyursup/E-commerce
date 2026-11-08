import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useThemeStore } from '../store/useThemeStore';
import { cn } from '../lib/cn';
import { HiCheckCircle, HiXCircle } from 'react-icons/hi';
import Footer from '../components/Footer';

export default function PaymentResult() {
    const [searchParams] = useSearchParams();
    const isDark = useThemeStore((s) => s.theme) === 'dark';

    const [status, setStatus] = useState('loading'); // loading, success, failed
    const [message, setMessage] = useState('Đang xử lý kết quả thanh toán...');
    const [transactionId, setTransactionId] = useState(null);

    useEffect(() => {
        const params = Object.fromEntries(searchParams.entries());
        const responseCode = params['vnp_ResponseCode'];
        const txnId = params['vnp_TransactionNo'];
        const transactionStatus = params['vnp_TransactionStatus'];

        if (responseCode === '00' || transactionStatus === '00') {
            setStatus('success');
            setMessage('Thanh toán thành công!');
            setTransactionId(txnId || null);
        } else if (responseCode) {
            setStatus('failed');
            setMessage('Thanh toán thất bại hoặc bị hủy.');
        } else {
            setStatus('failed');
            setMessage('Không tìm thấy thông tin thanh toán.');
        }
    }, [searchParams]);

    const ink = isDark ? 'text-white' : 'text-stone-950'
    const muted = isDark ? 'text-slate-400' : 'text-stone-600'
    const primary = cn('flex-1 rounded-md py-3.5 text-center font-bold', isDark ? 'bg-white text-stone-950 hover:bg-stone-200' : 'bg-stone-950 text-white hover:bg-stone-800')
    const secondary = cn('flex-1 rounded-md border py-3.5 text-center font-bold', isDark ? 'border-white text-white' : 'border-stone-950 text-stone-950')
    const view = {
        loading: { band: 'bg-stone-950 dark:bg-white', tag: 'VNPAY · ĐANG XÁC NHẬN', tagC: muted, title: 'Đang xử lý thanh toán…', body: 'Vui lòng không tắt trình duyệt. Chúng tôi đang chờ VNPay trả kết quả.' },
        success: { band: 'bg-emerald-700', tag: 'VNPAY · THÀNH CÔNG', tagC: 'text-emerald-700 dark:text-emerald-400', title: 'Thanh toán thành công', body: 'Tiền được giữ trong ký quỹ và chỉ chuyển cho shop khi bạn xác nhận đã nhận hàng.' },
        failed: { band: 'bg-red-700', tag: 'VNPAY · CHƯA HOÀN TẤT', tagC: 'text-red-700 dark:text-red-400', title: 'Thanh toán chưa hoàn tất', body: `${message} Không có khoản tiền nào bị trừ; bạn có thể thanh toán lại từ trang đơn hàng.` },
    }[status]

    return (
        <div className={cn('flex min-h-screen flex-col', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
            <main className="flex flex-1 items-center justify-center px-4 py-12">
                <section aria-live="polite" className={cn('w-full max-w-[560px] overflow-hidden rounded-lg border', isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white')}>
                    <div className={cn('h-2', view.band)} />
                    <div className="flex flex-col gap-4 p-8">
                        <span className={cn('flex items-center gap-2 font-mono text-xs', view.tagC)}>
                            {status === 'success' && <HiCheckCircle className="h-4 w-4" />}
                            {status === 'failed' && <HiXCircle className="h-4 w-4" />}
                            {view.tag}
                        </span>
                        <h1 className={cn('text-4xl font-bold leading-[1.05] tracking-[-0.03em]', ink)}>{view.title}</h1>
                        <p className={cn('text-[15px] leading-relaxed', muted)}>{view.body}</p>
                        {status === 'loading' && (
                            <span className={cn('block h-1.5 overflow-hidden rounded-full', isDark ? 'bg-slate-800' : 'bg-stone-100')}>
                                <span className="block h-full w-1/2 animate-pulse bg-stone-950 dark:bg-white" />
                            </span>
                        )}
                        {status === 'success' && transactionId && (
                            <dl className={cn('grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 rounded-md p-4 text-sm', isDark ? 'bg-slate-800' : 'bg-stone-50')}>
                                <dt className={muted}>Mã giao dịch</dt>
                                <dd className={cn('m-0 font-mono', ink)}>{transactionId}</dd>
                            </dl>
                        )}
                        {status === 'success' && (
                            <div className="flex flex-wrap gap-2.5">
                                <Link to="/my-orders" className={primary}>Xem đơn hàng</Link>
                                <Link to="/" className={secondary}>Tiếp tục mua sắm</Link>
                            </div>
                        )}
                        {status === 'failed' && (
                            <div className="flex flex-wrap gap-2.5">
                                <Link to="/my-orders" className={primary}>Thanh toán lại từ đơn hàng</Link>
                                <Link to="/cart" className={secondary}>Về giỏ hàng</Link>
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
