import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { VoucherService, type Voucher } from '../../services/accounting/VoucherService';
import { FileText, Clock, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LedgerQuickViewProps {
    ledgerName: string;
    children: React.ReactNode;
}

export default function LedgerQuickView({ ledgerName, children }: LedgerQuickViewProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(false);
    const { provider, activeCompany } = usePersistence();
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && history.length === 0) {
            const fetchHistory = async () => {
                setLoading(true);
                try {
                    const data = await VoucherService.getLedgerHistory(provider!, ledgerName, activeCompany!.path);
                    setHistory(data);
                } catch (e) {
                    console.error("QuickView failed", e);
                } finally {
                    setLoading(false);
                }
            };
            fetchHistory();
        }
    }, [isOpen, ledgerName, provider, activeCompany, history.length]);

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <span className="cursor-help transition-colors hover:text-primary">
                {children}
            </span>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute z-[100] left-0 mt-2 w-80 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-4 pointer-events-auto"
                    >
                        <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recent Activity</span>
                            </div>
                            <button
                                onClick={() => navigate(`/reports/ledger?name=${encodeURIComponent(ledgerName)}`)}
                                className="p-1 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                                title="Open Full Ledger"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex flex-col gap-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-10 bg-muted/40 animate-pulse rounded-xl" />
                                ))}
                            </div>
                        ) : history.length > 0 ? (
                            <div className="space-y-2">
                                {history.map(v => {
                                    const row = v.rows.find(r => r.account === ledgerName);
                                    const amt = row ? (row.debit || row.credit) : 0;
                                    const type = row?.type;

                                    return (
                                        <div key={v.id} className="flex items-center justify-between group/row p-2 hover:bg-primary/5 rounded-xl transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-foreground/80">{v.date}</span>
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase">{v.type} #{v.voucherNo}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-xs font-black ${type === 'Dr' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {type === 'Dr' ? '+' : '-'} {activeCompany?.symbol || '₹'}{amt.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 text-center flex flex-col items-center gap-2">
                                <FileText className="w-8 h-8 text-muted-foreground/30" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">No entries found</span>
                            </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-border/30 flex justify-center">
                            <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Hover to explore {ledgerName}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
