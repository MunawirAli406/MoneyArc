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
        if (tab && (tab === 'list' || tab === 'vouchers')) setActiveTab(tab as 'list' | 'vouchers');
        if (ledgerId) setSelectedLedgerId(ledgerId);
    }, [searchParams]);

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
                    Accounts List
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
                    Ledger Vouchers
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
