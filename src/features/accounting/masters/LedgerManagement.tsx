import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, FileText } from 'lucide-react';
import LedgerList from './LedgerList';
import LedgerReport from '../../reports/LedgerReport';
import clsx from 'clsx';

export default function LedgerManagement() {
    const [activeTab, setActiveTab] = useState<'list' | 'vouchers'>('list');
    const [selectedLedgerId, setSelectedLedgerId] = useState<string>('');

    const handleViewTransactions = (ledgerId: string) => {
        setSelectedLedgerId(ledgerId);
        setActiveTab('vouchers');
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-1 bg-card/50 p-1.5 rounded-2xl border border-border w-fit">
                <button
                    onClick={() => setActiveTab('list')}
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
                    onClick={() => setActiveTab('vouchers')}
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
