import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { cn } from '../lib/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate, Link, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import AddressManager from '../components/AddressManager';
import { FiBell, FiUser, FiClipboard, FiHeart, FiStar } from 'react-icons/fi';
import { HiOutlineCreditCard, HiOutlineChartBar } from 'react-icons/hi';
import ProfileInfo from './profile/ProfileInfo';
import BankInfo from './profile/BankInfo';
import ChangePassword from './profile/ChangePassword';
import ProfileWallet from './profile/ProfileWallet';
import WishlistTab from './profile/WishlistTab';
import NotificationTab from './profile/NotificationTab';
import ProfileMyReviews from './profile/ProfileMyReviews';
import ProfileSpendingAnalytics from './profile/ProfileSpendingAnalytics';
import MyOrders from './orders/MyOrders';

export default function Profile() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const isDark = useThemeStore((state) => state.theme) === 'dark';
    const location = useLocation();

    // Tab states: profile | bank | address | password | privacy | personal_info | notifications | orders | wishlist | reviews
    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('tab') || 'profile';
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [location.search]);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileInfo isDark={isDark} user={user} />;
            case 'bank':
                return <ProfileWallet isDark={isDark} />;
            case 'address':
                return <AddressManager isDark={isDark} />;
            case 'password':
                return <ChangePassword isDark={isDark} />;
            case 'wallet':
                return <ProfileWallet isDark={isDark} />;
            case 'wishlist':
                return <WishlistTab isDark={isDark} />;
            case 'notifications':
                return <NotificationTab isDark={isDark} />;
            case 'orders':
                return (
                    <div className="-mx-4 md:-mx-8 md:-mt-8">
                        <MyOrders isEmbedded={true} />
                    </div>
                );
            case 'reviews':
                return <ProfileMyReviews isDark={isDark} />;
            case 'analytics':
                return <ProfileSpendingAnalytics isDark={isDark} />;
            default:
                return <ProfileInfo isDark={isDark} user={user} />;
        }
    };

    const ink = isDark ? 'text-white' : 'text-stone-950'
    const muted = isDark ? 'text-slate-400' : 'text-stone-600'
    const accountTabs = ['profile', 'bank', 'address', 'password']
    const navItems = [
        { id: 'notifications', label: 'Thông báo', icon: FiBell },
        { id: 'profile', label: 'Tài khoản của tôi', icon: FiUser, active: accountTabs.includes(activeTab) },
        ...(user?.role !== 'ADMIN' ? [{ id: 'wallet', label: 'Ví của tôi', icon: HiOutlineCreditCard }] : []),
        { id: 'orders', label: 'Đơn mua', icon: FiClipboard },
        { id: 'analytics', label: 'Thống kê chi tiêu', icon: HiOutlineChartBar },
        { id: 'reviews', label: 'Đánh giá của tôi', icon: FiStar },
        { id: 'wishlist', label: 'Yêu thích', icon: FiHeart },
    ]
    const subItems = [['profile', 'Hồ sơ'], ['address', 'Địa chỉ'], ['password', 'Đổi mật khẩu']]
    const score = user?.reputationScore ?? 100
    const initial = user?.fullName?.charAt(0) || user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'

    return (
        <div className={cn('min-h-screen', isDark ? 'bg-slate-950' : 'bg-stone-50')}>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-6 lg:flex-row">
                    <aside className="w-full shrink-0 lg:w-64">
                        <div className="mb-5 flex items-center gap-3">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-950 font-display text-lg font-bold uppercase text-white dark:bg-white dark:text-stone-950">
                                {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : initial}
                            </span>
                            <span className="flex min-w-0 flex-col">
                                <strong className={cn('truncate text-[15px]', ink)}>
                                    {user?.fullName || user?.name || user?.email?.split('@')[0] || 'Người dùng'}
                                </strong>
                                <span
                                    title={`Điểm uy tín người mua: ${score}/100 (${user?.violationCount || 0} gậy)`}
                                    className={cn('font-mono text-xs', score >= 70 ? muted : 'text-red-700 dark:text-red-400')}
                                >
                                    UY TÍN {score}/100
                                </span>
                            </span>
                        </div>

                        <nav aria-label="Tài khoản" className="flex flex-col gap-0.5">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const on = item.active ?? activeTab === item.id
                                return (
                                    <div key={item.id}>
                                        <button
                                            type="button"
                                            aria-current={on ? 'page' : undefined}
                                            onClick={() => setActiveTab(item.id)}
                                            className={cn(
                                                'flex w-full items-center gap-3 border-l-[3px] px-3.5 py-3 text-left text-[15px] transition-colors',
                                                on
                                                    ? cn('border-amber-500 font-bold', isDark ? 'bg-slate-900 text-white' : 'bg-white text-stone-950')
                                                    : cn('border-transparent font-medium', isDark ? 'text-slate-300 hover:bg-slate-900' : 'text-stone-700 hover:bg-white'),
                                            )}
                                        >
                                            <Icon size={18} className="shrink-0" />
                                            {item.label}
                                        </button>
                                        {item.id === 'profile' && on && (
                                            <div className="flex flex-col py-1 pl-12">
                                                {subItems.map(([id, label]) => (
                                                    <button
                                                        key={id}
                                                        type="button"
                                                        onClick={() => setActiveTab(id)}
                                                        className={cn('py-1.5 text-left text-sm', activeTab === id ? cn('font-semibold underline underline-offset-4', ink) : cn(muted, 'hover:underline'))}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                            <button type="button" onClick={logout} className="mt-6 px-3.5 py-2 text-left text-sm font-medium text-red-700 hover:underline dark:text-red-400">
                                Đăng xuất
                            </button>
                        </nav>
                    </aside>

                    <main className="w-full min-w-0 flex-1">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18 }}
                            className={cn(
                                'min-h-[500px] rounded-lg',
                                activeTab === 'orders'
                                    ? 'bg-transparent p-0'
                                    : isDark ? 'border border-slate-800 bg-slate-900 p-6 lg:p-8' : 'border border-stone-200 bg-white p-6 lg:p-8',
                            )}
                        >
                            {renderContent()}
                        </motion.div>
                    </main>
                </div>
            </div>
            <Footer />
        </div>
    );
}
