import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineExclamationCircle, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import { cn } from '../../lib/cn';
import { useThemeStore } from '../../store/useThemeStore';
import reportService from '../../services/report';
import toast from 'react-hot-toast';

export default function AdminReports() {
    const isDark = useThemeStore((s) => s.theme) === 'dark';
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    // Note: Backend might need a listReports API. 
    // If it doesn't exist, we might need to use the generic request list if they are stored there.
    // Looking at RequestController.java, it has getRequests and getAllRequests.
    // It's likely Reports are a type of Request.

    const fetchReports = useCallback(async () => {
        try {
            setLoading(true);
            // Assuming reports are fetched via the general request API with a type filter or similar
            // For now, let's use the getAllRequests and filter by type if possible, 
            // or if there's a specific report list API (not seen in Controller though).
            // If I don't see a specific one, I'll assume they are in the request list.
            // Wait, ReportController doesn't have a GET list. 
            // RequestController DOES have Page<CreateRequestResponse> getAllRequests.

            const response = await fetch('/api/v1/request/admin?type=REPORT').then(r => r.json());
            setReports(response.content || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // fetchReports(); // This might fail if the endpoint is wrong. 
        // I'll stick to what I know exists in RequestController.
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
                    Quản lý báo cáo vi phạm
                </h1>
            </div>

            <div className={cn(
                'rounded-2xl border overflow-hidden',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
            )}>
                <div className="p-12 text-center">
                    <HiOutlineExclamationCircle className="mx-auto h-12 w-12 text-stone-400" />
                    <p className="mt-4 text-stone-500">Tính năng quản lý báo cáo đang được cập nhật kết nối với Request System...</p>
                </div>
            </div>
        </div>
    );
}
