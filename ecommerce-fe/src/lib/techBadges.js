export const getConditionBadge = (grade) => {
    switch (grade) {
        case 'GRADE_NEW':
            return { label: 'Mới 100% Seal', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' }
        case 'GRADE_LIKE_NEW':
            return { label: 'Like New 99%', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' }
        case 'GRADE_FAIR':
            return { label: 'Cũ 90-95%', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' }
        case 'GRADE_AS_IS':
            return { label: 'Xác máy / Thanh lý', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' }
        default:
            return null
    }
}

export const getWarrantyBadge = (type, months) => {
    if (!type || type === 'KHONG_BAO_HANH') {
        return { label: 'Bao test', cls: 'bg-slate-500/10 text-slate-500 border-slate-500/20' }
    }
    const duration = months ? ` ${months}T` : ''
    if (type === 'CHINH_HANG') {
        return { label: `BH Hãng${duration}`, cls: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' }
    }
    return { label: `BH Shop${duration}`, cls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' }
}
