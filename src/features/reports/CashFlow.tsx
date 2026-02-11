import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Landmark, FileDown, Wallet } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import PeriodSelector from '../../components/ui/PeriodSelector';
import { useReportDates } from './DateContext';
import { useLocalization } from '../../hooks/useLocalization';

import type { Voucher } from '../../services/accounting/VoucherService';

export default function CashFlow() {
    const { provider, activeCompany } = usePersistence();
    const { formatCurrency } = useLocalization();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const { startDate, endDate } = useReportDates();

    useEffect(() => {
        const loadData = async () => {
            if (provider && activeCompany) {
                const data = await provider.read<Voucher[]>('vouchers.json', activeCompany.path) || [];
                setVouchers(data);
                setLoading(false);
            }
        };
        loadData();
    }, [provider, activeCompany]);

    // Filter by Period
    const filteredVouchers = vouchers.filter(v =>
        v.date >= startDate && v.date <= endDate
    );

    // Simple Cash Flow Logic:
    // Operating: Sales, Purchase, Expenses
    // Investing: Fixed Assets
    // Financing: Loans, Capital

    let operating = 0;
    let investing = 0;
    let financing = 0;

    filteredVouchers.forEach(v => {
        v.rows.forEach(r => {
            const acc = r.account.toLowerCase();
            const amount = r.debit - r.credit; // Positive for inflow (Dr), Negative for outflow (Cr)

            if (acc.includes('cash') || acc.includes('bank')) {
                // We track the counterpart of cash/bank to categorize
                return;
            }

            // Categorization based on simplified keywords
            if (acc.includes('sales') || acc.includes('purchase') || acc.includes('expense')) {
                operating -= amount; // Inverse of the counterpart
            } else if (acc.includes('asset') || acc.includes('machine') || acc.includes('furniture')) {
                investing -= amount;
            } else if (acc.includes('capital') || acc.includes('loan') || acc.includes('drawing')) {
                financing -= amount;
            } else {
                operating -= amount; // Default to operating for simplicity
            }
        });
    });

    if (loading) return <div className="p-8">Loading Cash Flow Data...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto space-y-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase leading-none">Cash Flow</h1>
                    <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px] mt-2">Analysis for {activeCompany?.name}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 no-print">
                    <PeriodSelector />
                    <button
                        onClick={() => window.print()}
                        className="no-print flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all shadow-md shadow-primary/10"
                    >
                        <FileDown className="w-4 h-4" />
                        Print / Save PDF
                    </button>
                    <div className="bg-card px-6 py-3 rounded-2xl border border-border shadow-sm">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Net Change in Cash</p>
                        <p className="text-xl font-black text-primary tracking-tight">{formatCurrency(operating + investing + financing)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Operating Activities', value: operating, icon: TrendingUp },
                    { label: 'Investing Activities', value: investing, icon: Landmark },
                    { label: 'Financing Activities', value: financing, icon: Wallet },
                ].map((act, i) => (
                    <div key={i} className="bg-card p-8 rounded-[2rem] border border-border group hover:border-primary/50 transition-all shadow-sm">
                        <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                            <act.icon className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">{act.label}</p>
                        <p className="text-3xl font-black text-foreground mb-4">{formatCurrency(act.value)}</p>
                        <div className="flex items-center gap-2 text-xs font-bold">
                            {act.value >= 0 ? (
                                <span className="text-emerald-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Net Inflow</span>
                            ) : (
                                <span className="text-rose-500 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Net Outflow</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
                <div className="p-8 border-b border-border bg-muted/20">
                    <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Cash Flow Statement</h2>
                </div>
                <div className="p-10 space-y-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-border pb-2">
                            <h3 className="font-black text-xs uppercase tracking-widest text-primary">A. Operating Activities</h3>
                            <span className="font-mono font-bold text-foreground">{formatCurrency(operating)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground italic">Summarizes cash generated from core business operations including sales, inventory, and operational expenses.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-border pb-2">
                            <h3 className="font-black text-xs uppercase tracking-widest text-primary">B. Investing Activities</h3>
                            <span className="font-mono font-bold text-foreground">{formatCurrency(investing)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground italic">Tracks cash flows related to purchasing or selling long-term assets like equipment, furniture, and investments.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-border pb-2">
                            <h3 className="font-black text-xs uppercase tracking-widest text-primary">C. Financing Activities</h3>
                            <span className="font-mono font-bold text-foreground">{formatCurrency(financing)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground italic">Reports cash movement between the business and its owners or creditors, such as capital infusions or loan repayments.</p>
                    </div>

                    <div className="mt-12 p-8 bg-muted/40 rounded-3xl border border-border">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-lg font-black text-foreground uppercase tracking-tight">Net Increase in Cash</h4>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">(A + B + C)</p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-black text-primary">{formatCurrency(operating + investing + financing)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
