import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { cn } from '../lib/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate, Link, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import AddressManager from '../components/AddressManager';
import { FiEdit2, FiBell, FiUser, FiClipboard, FiHeart } from 'react-icons/fi';
import { HiOutlineCreditCard } from 'react-icons/hi';
import ProfileInfo from './profile/ProfileInfo';
import BankInfo from './profile/BankInfo';
import ChangePassword from './profile/ChangePassword';
import ProfileWallet from './profile/ProfileWallet';
import WishlistTab from './profile/WishlistTab';
import NotificationTab from './profile/NotificationTab';
import MyOrders from './orders/MyOrders';

export default function Profile() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const isDark = useThemeStore((state) => state.theme) === 'dark';
    const location = useLocation();

    // Tab states: profile | bank | address | password | privacy | personal_info | notifications | orders | wishlist
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
            default:
                return <ProfileInfo isDark={isDark} user={user} />;
        }
    };

    return (
        <div className={cn("min-h-screen pb-12", isDark ? "bg-slate-950" : "bg-stone-100")}>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar Area */}
                    <div className="w-full lg:w-64 shrink-0">
                        {/* User Profile Mini Header */}
                        <div
                            className={cn(
                                "flex items-center gap-3.5 mb-6 p-4 rounded-2xl border transition-all shadow-xs",
                                isDark
                                    ? "bg-slate-900 border-slate-800"
                                    : "bg-white border-stone-200"
                            )}
                        >
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-stone-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border-2 border-amber-500/30">
                                {user?.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt={user?.fullName || user?.name || 'Avatar'}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                        {user?.fullName?.charAt(0) || user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className={cn("font-bold text-sm truncate", isDark ? "text-slate-100" : "text-stone-800")}>
                                    {user?.fullName || user?.name || user?.email?.split('@')[0] || 'User'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('profile')}
                                    className={cn(
                                        "flex items-center gap-1.5 text-xs mt-0.5 font-medium transition-colors cursor-pointer",
                                        isDark ? "text-slate-400 hover:text-amber-400" : "text-stone-500 hover:text-amber-600"
                                    )}
                                >
                                    <FiEdit2 size={12} className="text-amber-500" /> Sửa Hồ Sơ
                                </button>
                            </div>
                        </div>

                        {/* Navigation Menu */}
                        <nav className="space-y-4">
                            {/* Thông Báo */}
                            <div>
                                <button
                                    onClick={() => setActiveTab('notifications')}
                                    className={cn(
                                        "flex items-center gap-3 w-full text-left font-medium transition-colors mb-2",
                                        activeTab === 'notifications'
                                            ? "text-amber-500"
                                            : isDark ? "text-slate-200 hover:text-amber-500" : "text-stone-800 hover:text-amber-600"
                                    )}
                                >
                                    <div className="w-6 flex justify-center text-amber-500">
                                        <FiBell size={20} />
                                    </div>
                                    <span>Thông Báo</span>
                                </button>
                            </div>

                            {/* Tài Khoản Của Tôi */}
                            <div>
                                <button
                                    onClick={() => {
                                        if (!['profile', 'bank', 'address', 'password'].includes(activeTab)) {
                                            setActiveTab('profile'); // Open it automatically to first tab
                                        }
                                    }}
                                    className={cn(
                                        "flex items-center gap-3 w-full text-left font-medium mb-2 transition-colors",
                                        ['profile', 'address', 'password'].includes(activeTab)
                                            ? "text-amber-500"
                                            : isDark ? "text-slate-200 hover:text-amber-500" : "text-stone-800 hover:text-amber-600"
                                    )}
                                >
                                    <div className="w-6 flex justify-center text-blue-500">
                                        <FiUser size={20} />
                                    </div>
                                    <span>Tài Khoản Của Tôi</span>
                                </button>

                                {['profile', 'address', 'password'].includes(activeTab) && (
                                    <div className="pl-9 flex flex-col space-y-2">
                                        <button
                                            onClick={() => setActiveTab('profile')}
                                            className={cn("text-left text-sm transition-colors", activeTab === 'profile' ? "text-amber-500 font-medium" : isDark ? "text-slate-400 hover:text-amber-500" : "text-stone-600 hover:text-amber-600")}
                                        >
                                            Hồ Sơ
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('address')}
                                            className={cn("text-left text-sm transition-colors", activeTab === 'address' ? "text-amber-500 font-medium" : isDark ? "text-slate-400 hover:text-amber-500" : "text-stone-600 hover:text-amber-600")}
                                        >
                                            Địa Chỉ
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('password')}
                                            className={cn("text-left text-sm transition-colors", activeTab === 'password' ? "text-amber-500 font-medium" : isDark ? "text-slate-400 hover:text-amber-500" : "text-stone-600 hover:text-amber-600")}
                                        >
                                            Đổi Mật Khẩu
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Ví của tôi – ẩn với admin (admin quản lý ví sàn qua Admin Dashboard) */}
                            {user?.role !== 'ADMIN' && (
                            <div>
                                <button
                                    onClick={() => setActiveTab('wallet')}
                                    className={cn(
                                        "flex items-center gap-3 w-full text-left font-medium transition-colors mt-4",
                                        activeTab === 'wallet'
                                            ? "text-amber-500"
                                            : isDark ? "text-slate-200 hover:text-amber-500" : "text-stone-800 hover:text-amber-600"
                                    )}
                                >
                                    <div className="w-6 flex justify-center text-amber-500">
                                        <HiOutlineCreditCard size={20} />
                                    </div>
                                    <span>Ví của tôi</span>
                                </button>
                            </div>
                            )}

                            {/* Đơn Mua */}
                            <div>
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className={cn(
                                        "flex items-center gap-3 w-full text-left font-medium transition-colors mt-4",
                                        activeTab === 'orders'
                                            ? "text-amber-500"
                                            : isDark ? "text-slate-200 hover:text-amber-500" : "text-stone-800 hover:text-amber-600"
                                    )}
                                >
                                    <div className="w-6 flex justify-center text-blue-500">
                                        <FiClipboard size={20} />
                                    </div>
                                    <span>Đơn Mua</span>
                                </button>
                            </div>

                            {/* Sản phẩm yêu thích */}
                            <div>
                                <button
                                    onClick={() => setActiveTab('wishlist')}
                                    className={cn(
                                        "flex items-center gap-3 w-full text-left font-medium transition-colors mt-4",
                                        activeTab === 'wishlist'
                                            ? "text-rose-500"
                                            : isDark ? "text-slate-200 hover:text-rose-400" : "text-stone-800 hover:text-rose-600"
                                    )}
                                >
                                    <div className="w-6 flex justify-center text-rose-500">
                                        <FiHeart size={20} />
                                    </div>
                                    <span>Yêu thích</span>
                                </button>
                            </div>

                            {/* Logout */}
                            <div className="pt-8">
                                <button
                                    onClick={logout}
                                    className="text-sm font-medium w-full text-left rounded-lg transition-colors hover:bg-red-50 py-2 px-3 text-red-600 dark:hover:bg-red-900/20"
                                >
                                    Đăng xuất
                                </button>
                            </div>
                        </nav>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 w-full overflow-hidden">
                        <motion.div
                            key={activeTab} // Animate when tab changes
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                                "rounded-sm min-h-[500px]",
                                activeTab === 'orders'
                                    ? "bg-transparent p-0 shadow-none border-none"
                                    : isDark
                                        ? "bg-slate-900 border border-slate-800 p-6 lg:p-8 shadow-sm"
                                        : "bg-white border border-stone-200 p-6 lg:p-8 shadow-sm"
                            )}
                        >
                            {renderContent()}
                        </motion.div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
