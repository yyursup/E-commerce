import { useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { cn } from '../lib/cn';
import { motion } from 'framer-motion';
import AddressManager from '../components/AddressManager';
import Footer from '../components/Footer';
import { Navigate } from 'react-router-dom';

export default function Profile() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const isDark = useThemeStore((state) => state.theme) === 'dark';

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className={cn("min-h-screen", isDark ? "bg-slate-950" : "bg-stone-50")}>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-4">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                                "rounded-2xl border p-6 shadow-sm",
                                isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white"
                            )}
                        >
                            <div className="mb-6 text-center">
                                <div className={cn(
                                    "mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold",
                                    isDark ? "bg-slate-800 text-amber-500" : "bg-amber-100 text-amber-600"
                                )}>
                                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                </div>
                                <h2 className={cn("font-bold", isDark ? "text-white" : "text-stone-900")}>
                                    {user?.name || 'User'}
                                </h2>
                                <p className={cn("text-sm", isDark ? "text-slate-400" : "text-stone-500")}>
                                    {user?.email}
                                </p>
                            </div>

                            <nav className="space-y-1">
                                <button className={cn(
                                    "px-3 py-2 text-sm font-medium w-full text-left rounded-lg transition-colors bg-amber-500 text-white"
                                )}>
                                    Thông tin tài khoản
                                </button>
                                {/* Future tabs: Orders, Wishlist, etc. */}
                                <button onClick={logout} className={cn(
                                    "px-3 py-2 text-sm font-medium w-full text-left rounded-lg transition-colors hover:bg-red-50 text-red-600 dark:hover:bg-red-900/20"
                                )}>
                                    Đăng xuất
                                </button>
                            </nav>
                        </motion.div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className={cn(
                                "rounded-2xl border p-6 shadow-sm",
                                isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white"
                            )}
                        >
                            <AddressManager isDark={isDark} />
                        </motion.div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
