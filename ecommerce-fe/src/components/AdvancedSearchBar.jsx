import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineSearch, HiX, HiOutlineClock, HiFire } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/cn';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { useDebounce } from '../hooks/useDebounce';
import productService from '../services/product';

export default function AdvancedSearchBar() {
    const isDark = useThemeStore((s) => s.theme) === 'dark';
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const navigate = useNavigate();
    const containerRef = useRef(null);

    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    
    // Live Search
    const debouncedQuery = useDebounce(query, 300);
    const [liveResults, setLiveResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Recommended (Hot) Products
    const [hotProducts, setHotProducts] = useState([]);
    const [isLoadingHot, setIsLoadingHot] = useState(false);

    const { searchHistory, addSearchTerm, removeSearchTerm, clearHistory } = useSearchHistory();

    // Fetch Recommendations (Hot products) when component mounts or when focused with empty query
    useEffect(() => {
        const fetchHotProducts = async () => {
            if (isFocused && !query && hotProducts.length === 0) {
                setIsLoadingHot(true);
                try {
                    // Get personalized recommendations from backend
                    const data = await productService.getRecommendations(5);
                    setHotProducts(data || []);
                } catch (error) {
                    console.error('Failed to fetch recommendations', error);
                } finally {
                    setIsLoadingHot(false);
                }
            }
        };
        fetchHotProducts();
    }, [isFocused, query, hotProducts.length]);

    // Live search when debounced query changes
    useEffect(() => {
        const fetchLiveSearch = async () => {
            if (debouncedQuery.trim().length > 0) {
                setIsSearching(true);
                try {
                    const data = await productService.getProducts({
                        search: debouncedQuery.trim(),
                        size: 5
                    });
                    setLiveResults(data?.content || []);
                } catch (error) {
                    console.error('Failed to fetch live search', error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setLiveResults([]);
            }
        };

        fetchLiveSearch();
    }, [debouncedQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            addSearchTerm(query);
            setIsFocused(false);
            navigate(`/products?search=${encodeURIComponent(query.trim())}`);
        }
    };

    const handleHistoryClick = (term) => {
        setQuery(term);
        addSearchTerm(term);
        setIsFocused(false);
        navigate(`/products?search=${encodeURIComponent(term)}`);
    };

    const handleProductClick = (productId, productName) => {
        // If they click a suggested product, it's a good idea to add its name to history
        addSearchTerm(productName);
        setIsFocused(false);
        navigate(`/products/${productId}`);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    return (
        <div ref={containerRef} className="flex-1 max-w-2xl mx-6 hidden lg:flex flex-col relative z-50">
            <form onSubmit={handleSubmit} className="relative w-full">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    placeholder="Tìm kiếm sản phẩm, danh mục, shop..."
                    className={cn(
                        'w-full rounded-full pl-11 pr-4 py-2.5 text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500',
                        isDark
                            ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-400 focus:bg-slate-800 focus:border-amber-500/50'
                            : 'bg-stone-100/90 border-stone-200 text-stone-900 placeholder-stone-400 focus:bg-white focus:border-amber-500'
                    )}
                />
                <HiOutlineSearch className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5",
                    isDark ? "text-slate-400" : "text-stone-400"
                )} />
                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            setLiveResults([]);
                            document.querySelector('input[placeholder="Tìm kiếm sản phẩm, danh mục, shop..."]')?.focus();
                        }}
                        className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors",
                            isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-stone-400 hover:bg-stone-200 hover:text-stone-600"
                        )}
                    >
                        <HiX className="h-4 w-4" />
                    </button>
                )}
                <button type="submit" className="hidden">Search</button>
            </form>

            <AnimatePresence>
                {isFocused && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                            'absolute top-[110%] left-0 w-full rounded-2xl border shadow-xl overflow-hidden flex flex-col',
                            isDark ? 'bg-slate-900 border-slate-700/80' : 'bg-white border-stone-200'
                        )}
                    >
                        {/* TRẠNG THÁI 1: CHƯA GÕ (Hiển thị Lịch sử & Sản phẩm Hot) */}
                        {!query.trim() && (
                            <div className="flex flex-col max-h-[70vh] overflow-y-auto custom-scrollbar">
                                {/* Search History */}
                                {searchHistory.length > 0 && (
                                    <div className={cn("p-4 border-b", isDark ? "border-slate-800" : "border-stone-100")}>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-slate-400" : "text-stone-500")}>
                                                Lịch sử tìm kiếm
                                            </h3>
                                            <button 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    clearHistory();
                                                }}
                                                className={cn("text-xs hover:underline", isDark ? "text-slate-500 hover:text-slate-300" : "text-stone-400 hover:text-stone-600")}
                                            >
                                                Xóa tất cả
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {searchHistory.map((term, index) => (
                                                <div 
                                                    key={index} 
                                                    className={cn(
                                                        "group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm cursor-pointer transition-colors border",
                                                        isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white" : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                                                    )}
                                                    onClick={() => handleHistoryClick(term)}
                                                >
                                                    <HiOutlineClock className={cn("h-3.5 w-3.5", isDark ? "text-slate-500" : "text-stone-400")} />
                                                    <span>{term}</span>
                                                    <button 
                                                        className={cn("ml-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-0.5", isDark ? "hover:bg-slate-600" : "hover:bg-stone-200")}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeSearchTerm(term);
                                                        }}
                                                    >
                                                        <HiX className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recommended / Hot Products */}
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <HiFire className="h-5 w-5 text-amber-500" />
                                        <h3 className={cn("text-sm font-semibold", isDark ? "text-slate-300" : "text-stone-700")}>
                                            Sản phẩm Gợi ý cho bạn
                                        </h3>
                                    </div>
                                    
                                    {isLoadingHot ? (
                                        <div className="space-y-3">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="flex items-center gap-3 animate-pulse">
                                                    <div className={cn("w-10 h-10 rounded-md", isDark ? "bg-slate-800" : "bg-stone-200")} />
                                                    <div className="flex-1 space-y-2">
                                                        <div className={cn("h-3 w-3/4 rounded", isDark ? "bg-slate-800" : "bg-stone-200")} />
                                                        <div className={cn("h-3 w-1/3 rounded", isDark ? "bg-slate-800" : "bg-stone-200")} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : hotProducts.length > 0 ? (
                                        <div className="flex flex-col">
                                            {hotProducts.map(product => (
                                                <div
                                                    key={product.id}
                                                    onClick={() => handleProductClick(product.id, product.name)}
                                                    className={cn(
                                                        "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors",
                                                        isDark ? "hover:bg-slate-800/80" : "hover:bg-stone-50"
                                                    )}
                                                >
                                                    <img 
                                                        src={product.imageUrls?.[0] || 'https://placehold.co/100'} 
                                                        alt={product.name}
                                                        className="w-10 h-10 object-cover rounded-md border dark:border-slate-700"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn("text-sm font-medium truncate", isDark ? "text-slate-200" : "text-stone-800")}>
                                                            {product.name}
                                                        </p>
                                                        <p className="text-xs text-amber-600 font-medium">
                                                            {formatPrice(product.basePrice)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={cn("text-sm italic text-center py-4", isDark ? "text-slate-500" : "text-stone-400")}>
                                            Chưa có gợi ý nào cho bạn lúc này.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TRẠNG THÁI 2: ĐANG GÕ (Live Search) */}
                        {query.trim() && (
                            <div className="flex flex-col max-h-[70vh] overflow-y-auto custom-scrollbar p-2">
                                {/* Search keyword action */}
                                <div 
                                    onClick={handleSubmit}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-2 transition-colors",
                                        isDark ? "hover:bg-slate-800 text-amber-400" : "hover:bg-stone-50 text-amber-600"
                                    )}
                                >
                                    <HiOutlineSearch className="h-5 w-5" />
                                    <span className="text-sm font-medium">Tìm kiếm "{query}"</span>
                                </div>

                                {isSearching ? (
                                    <div className="flex justify-center items-center py-6">
                                        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : liveResults.length > 0 ? (
                                    <>
                                        <div className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                                            Sản phẩm liên quan
                                        </div>
                                        {liveResults.map(product => (
                                            <div
                                                key={product.id}
                                                onClick={() => handleProductClick(product.id, product.name)}
                                                className={cn(
                                                    "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors",
                                                    isDark ? "hover:bg-slate-800/80" : "hover:bg-stone-50"
                                                )}
                                            >
                                                <img 
                                                    src={product.imageUrls?.[0] || 'https://placehold.co/100'} 
                                                    alt={product.name}
                                                    className="w-12 h-12 object-cover rounded-lg border dark:border-slate-700"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn("text-sm font-medium line-clamp-1", isDark ? "text-slate-200" : "text-stone-800")}>
                                                        {product.name}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-0.5">
                                                        <p className="text-sm font-semibold text-amber-600 dark:text-amber-500">
                                                            {formatPrice(product.basePrice)}
                                                        </p>
                                                        {product.shop && (
                                                            <p className={cn("text-xs truncate max-w-[120px]", isDark ? "text-slate-500" : "text-stone-400")}>
                                                                {product.shop.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div className="py-8 text-center">
                                        <p className={cn("text-sm", isDark ? "text-slate-400" : "text-stone-500")}>
                                            Không tìm thấy sản phẩm nào khớp với "{query}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
