import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ecommerce_search_history';
const MAX_HISTORY_LENGTH = 10;

export function useSearchHistory() {
    const [searchHistory, setSearchHistory] = useState([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setSearchHistory(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading search history', error);
        }
    }, []);

    const addSearchTerm = (term) => {
        if (!term || !term.trim()) return;
        const cleanTerm = term.trim();
        
        setSearchHistory((prev) => {
            // Remove if exists to put it at the top
            const filtered = prev.filter((item) => item.toLowerCase() !== cleanTerm.toLowerCase());
            const updated = [cleanTerm, ...filtered].slice(0, MAX_HISTORY_LENGTH);
            
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (error) {
                console.error('Error saving search history', error);
            }
            
            return updated;
        });
    };

    const removeSearchTerm = (term) => {
        setSearchHistory((prev) => {
            const updated = prev.filter((item) => item !== term);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    return {
        searchHistory,
        addSearchTerm,
        removeSearchTerm,
        clearHistory
    };
}
