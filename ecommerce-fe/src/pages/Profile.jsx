import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { cn } from '../lib/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate, Link } from 'react-router-dom';
import Footer from '../components/Footer';
import AddressManager from '../components/AddressManager';
import { FiEdit2, FiBell, FiUser, FiClipboard } from 'react-icons/fi';
import ProfileInfo from './profile/ProfileInfo';
import BankInfo from './profile/BankInfo';
import ChangePassword from './profile/ChangePassword';
import MyOrders from './orders/MyOrders';

export default function Profile() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const isDark = useThemeStore((state) => state.theme) === 'dark';

    // Tab states: profile | bank | address | password | privacy | personal_info | notifications | orders
    const [activeTab, setActiveTab] = useState('profile');

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileInfo isDark={isDark} user={user} />;
            case 'bank':
                return <BankInfo isDark={isDark} />;
            case 'address':
                return <AddressManager isDark={isDark} />;
            case 'password':
                return <ChangePassword isDark={isDark} />;
            case 'notifications':
                return (
                    <div className="py-12 text-center">
                        <p className={cn("text-sm", isDark ? "text-slate-400" : "text-stone-500")}>
                            Chưa có thông báo nào.
                        </p>
                    </div>
                );
            case 'orders':
                // Instead of rendering a Link routing to '/orders', we render the MyOrders component inline.
                return (
                    // Removing min-h px-8 py-8 wrapper inside MyOrders so it fits best inside Profile layout.
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
                        <div className="flex items-center gap-3 mb-6 py-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-200 flex items-center justify-center shrink-0 border border-stone-200 dark:border-slate-700">
                                <span className="text-xl font-bold text-stone-500">
                                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className={cn("font-bold text-sm", isDark ? "text-gray-200" : "text-stone-800")}>
                                    {user?.name || user?.email?.split('@')[0] || 'User'}
                                </span>
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={cn("flex items-center gap-1 text-xs mt-1", isDark ? "text-slate-400 hover:text-white" : "text-stone-500 hover:text-amber-600")}
                                >
                                    <FiEdit2 size={12} /> Sửa Hồ Sơ
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
                                        ['profile', 'bank', 'address', 'password'].includes(activeTab)
                                            ? "text-amber-500"
                                            : isDark ? "text-slate-200 hover:text-amber-500" : "text-stone-800 hover:text-amber-600"
                                    )}>
                                    <div className="w-6 flex justify-center text-blue-500">
                                        <FiUser size={20} />
                                    </div>
                                    <span>Tài Khoản Của Tôi</span>
                                </button>

                                {['profile', 'bank', 'address', 'password'].includes(activeTab) && (
                                    <div className="pl-9 flex flex-col space-y-2">
                                        <button
                                            onClick={() => setActiveTab('profile')}
                                            className={cn("text-left text-sm transition-colors", activeTab === 'profile' ? "text-amber-500 font-medium" : isDark ? "text-slate-400 hover:text-amber-500" : "text-stone-600 hover:text-amber-600")}
                                        >
                                            Hồ Sơ
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('bank')}
                                            className={cn("text-left text-sm transition-colors", activeTab === 'bank' ? "text-amber-500 font-medium" : isDark ? "text-slate-400 hover:text-amber-500" : "text-stone-600 hover:text-amber-600")}
                                        >
                                            Ngân Hàng
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
