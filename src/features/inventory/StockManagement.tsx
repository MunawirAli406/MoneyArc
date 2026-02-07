import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, FileText } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import StockItemList from './StockItemList';
import StockVoucher from './StockVoucher';
import clsx from 'clsx';

export default function StockManagement() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'list' | 'vouchers'>(
        (searchParams.get('tab') as 'list' | 'vouchers') || 'list'
    );
    const [selectedItemId, setSelectedItemId] = useState<string>(
        searchParams.get('itemId') || ''
    );

    // Sync state with URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        const itemId = searchParams.get('itemId');
        if (tab && (tab === 'list' || tab === 'vouchers')) setActiveTab(tab as 'list' | 'vouchers');
        if (itemId) setSelectedItemId(itemId);
    }, [searchParams]);

    const handleViewTransactions = (itemId: string) => {
        setSelectedItemId(itemId);
        setActiveTab('vouchers');
        setSearchParams({ tab: 'vouchers', itemId });
    };

    const handleTabChange = (tab: 'list' | 'vouchers') => {
        setActiveTab(tab);
        const params: Record<string, string> = { tab };
        if (selectedItemId) params.itemId = selectedItemId;
        setSearchParams(params);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-1 bg-card/50 p-1.5 rounded-2xl border border-border w-fit">
                <button
                    onClick={() => handleTabChange('list')}
                    className={clsx(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === 'list'
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <List className="w-4 h-4" />
                    Items List
                </button>
                <button
                    onClick={() => handleTabChange('vouchers')}
                    className={clsx(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === 'vouchers'
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <FileText className="w-4 h-4" />
                    Stock Register
                </button>
            </div>

            <div className="relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'list' ? (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <StockItemList onViewTransactions={handleViewTransactions} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="vouchers"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <StockVoucher
                                externalSelectedItemId={selectedItemId}
                                onItemChange={(id) => {
                                    setSelectedItemId(id);
                                    setSearchParams({ tab: 'vouchers', itemId: id });
                                }}
                                isEmbedded={true}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
