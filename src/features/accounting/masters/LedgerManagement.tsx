import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, FileText } from 'lucide-react';
import LedgerList from './LedgerList';
import LedgerReport from '../../reports/LedgerReport';
import clsx from 'clsx';
import { useSearchParams } from 'react-router-dom';

export default function LedgerManagement() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'list' | 'vouchers'>(
        (searchParams.get('tab') as 'list' | 'vouchers') || 'list'
    );
    const [selectedLedgerId, setSelectedLedgerId] = useState<string>(
        searchParams.get('ledgerId') || ''
    );

    // Sync state with URL params
    useEffect(() => {
        const tab = searchParams.get('tab');
        const ledgerId = searchParams.get('ledgerId');

        if (tab && (tab === 'list' || tab === 'vouchers') && tab !== activeTab) {
            setActiveTab(tab as 'list' | 'vouchers');
        }
        if (ledgerId && ledgerId !== selectedLedgerId) {
            setSelectedLedgerId(ledgerId);
        }
    }, [searchParams, activeTab, selectedLedgerId]);

    const handleViewTransactions = (ledgerId: string) => {
        setSelectedLedgerId(ledgerId);
        setActiveTab('vouchers');
        setSearchParams({ tab: 'vouchers', ledgerId });
    };

    const handleTabChange = (tab: 'list' | 'vouchers') => {
        setActiveTab(tab);
        const params: Record<string, string> = { tab };
        if (selectedLedgerId) params.ledgerId = selectedLedgerId;
        setSearchParams(params);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="p-1 gap-1 flex items-center bg-card/80 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-2xl shadow-xl w-fit">
                <button
                    onClick={() => handleTabChange('list')}
                    className={clsx(
                        "relative flex items-center gap-3 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-500 rounded-xl overflow-hidden group",
                        activeTab === 'list' ? "text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                >
                    {activeTab === 'list' && (
                        <motion.div
                            layoutId="activeTabGlow"
                            className="absolute inset-0 bg-primary/20 backdrop-blur-xl"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        />
                    )}
                    {activeTab === 'list' && (
                        <motion.div
                            layoutId="activeTabBase"
                            className="absolute inset-0 primary-gradient"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <List className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Ledger Registry</span>
                </button>
                <button
                    onClick={() => handleTabChange('vouchers')}
                    className={clsx(
                        "relative flex items-center gap-3 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-500 rounded-xl overflow-hidden group",
                        activeTab === 'vouchers' ? "text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                >
                    {activeTab === 'vouchers' && (
                        <motion.div
                            layoutId="activeTabGlow"
                            className="absolute inset-0 bg-primary/20 backdrop-blur-xl"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        />
                    )}
                    {activeTab === 'vouchers' && (
                        <motion.div
                            layoutId="activeTabBase"
                            className="absolute inset-0 primary-gradient"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <FileText className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Executive Ledger Report</span>
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
                            <LedgerList onViewTransactions={handleViewTransactions} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="vouchers"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <LedgerReport
                                externalSelectedLedgerId={selectedLedgerId}
                                onLedgerChange={setSelectedLedgerId}
                                isEmbedded={true}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
