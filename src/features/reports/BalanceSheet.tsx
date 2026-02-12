import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { ReportService, type Ledger, type GroupSummary } from '../../services/accounting/ReportService';
import { type StockItem } from '../../services/inventory/types';
import { FileDown, ChevronRight, ChevronDown } from 'lucide-react';
import type { Voucher } from '../../services/accounting/VoucherService';
import { useReportDates } from './DateContext';
import PeriodSelector from '../../components/ui/PeriodSelector';
import AIReportAdvisor from '../../components/ai/AIReportAdvisor';
import { useLocalization } from '../../hooks/useLocalization';


export default function BalanceSheet() {
    const { provider, activeCompany } = usePersistence();
    const { formatCurrency } = useLocalization();
    const [liabilities, setLiabilities] = useState<GroupSummary[]>([]);
    const [assets, setAssets] = useState<GroupSummary[]>([]);
    const [closingStock, setClosingStock] = useState(0);
    const [netProfit, setNetProfit] = useState(0);
    const [tbDiff, setTbDiff] = useState(0);
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const { startDate, endDate } = useReportDates();

    useEffect(() => {
        const loadData = async () => {
            if (!provider || !activeCompany) return;
            setLoading(true);

            const [ledgerData, stockItemsData, customGroupsData, vouchersData] = await Promise.all([
                provider.read<Ledger[]>('ledgers.json', activeCompany.path),
                provider.read<StockItem[]>('stock_items.json', activeCompany.path),
                provider.read<any[]>('custom_groups.json', activeCompany.path),
                provider.read<Voucher[]>('vouchers.json', activeCompany.path)
            ]);

            const ledgers = ledgerData || [];
            const stockItems = stockItemsData || [];
            const customGroups = customGroupsData || [];
            const vouchers = vouchersData || [];

            const { AccountGroupManager } = await import('../../services/accounting/ReportService');
            customGroups.forEach((c: any) => AccountGroupManager.registerGroup(c.name, c.parentType));

            const liabilityData = ReportService.getAsOnGroupSummary(ledgers as Ledger[], vouchers, endDate, 'LIABILITIES');
            const assetData = ReportService.getAsOnGroupSummary(ledgers as Ledger[], vouchers, endDate, 'ASSETS')
                .filter(g => g.groupName !== 'Stock-in-hand');

            const np = ReportService.getNetProfitPeriod(ledgers as Ledger[], vouchers, startDate, endDate, stockItems);
            const cs = ReportService.getClosingStockValue(stockItems, vouchers, endDate);
            const currentTbDiff = ReportService.getTrialBalanceDiff(ledgers as Ledger[], vouchers, endDate);

            setLiabilities(liabilityData);
            setAssets(assetData);
            setNetProfit(np);
            setClosingStock(cs);
            setTbDiff(currentTbDiff);

            setLoading(false);
        };
        loadData();
    }, [provider, activeCompany, startDate, endDate]);

    const toggleGroup = (groupName: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupName)) {
            newExpanded.delete(groupName);
        } else {
            newExpanded.add(groupName);
        }
        setExpandedGroups(newExpanded);
    };

    const totalLiabilities = ReportService.calculateTotal(liabilities) + (netProfit > 0 ? netProfit : 0) + (tbDiff > 0 ? tbDiff : 0);
    const totalAssets = ReportService.calculateTotal(assets) + closingStock + (netProfit < 0 ? Math.abs(netProfit) : 0) + (tbDiff < 0 ? Math.abs(tbDiff) : 0);

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-6xl mx-auto pb-12"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-[0.9] bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">Balance Sheet</h1>
                    <div className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] mt-4 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-google-blue animate-pulse" />
                        Snap-shot of Financial Health // {startDate} — {endDate}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <PeriodSelector />
                    <button
                        onClick={() => window.print()}
                        className="no-print flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all shadow-md shadow-primary/10"
                    >
                        <FileDown className="w-4 h-4" />
                        Print / Save PDF
                    </button>
                </div>
            </div>

            <AIReportAdvisor
                reportName="Balance Sheet"
                data={{
                    liabilities: liabilities.map(l => ({ group: l.groupName, total: l.total })),
                    assets: assets.map(a => ({ group: a.groupName, total: a.total })),
                    closingStock,
                    netProfit,
                    trialBalanceDifference: tbDiff
                }}
            />

            <div className="glass-panel rounded-[2.5rem] shadow-2xl border-white/10 overflow-hidden relative group/report">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent-500/5 opacity-50 pointer-events-none" />
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                    {/* Liabilities Side */}
                    <div className="flex flex-col">
                        <div className="p-6 bg-muted/30 border-b border-border font-black text-primary uppercase text-[10px] tracking-[0.2em] text-center">
                            Liabilities & Equity
                        </div>
                        <div className="p-8 space-y-8 flex-1">
                            {liabilities.map(group => (
                                group.total !== 0 && (
                                    <div key={group.groupName} className="space-y-3">
                                        <div
                                            onClick={() => toggleGroup(group.groupName)}
                                            className="flex justify-between items-center group cursor-pointer hover:bg-muted/30 p-2 -mx-2 rounded-xl transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                {expandedGroups.has(group.groupName) ? (
                                                    <ChevronDown className="w-4 h-4 text-primary" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                )}
                                                <span className="text-sm font-black text-foreground uppercase tracking-tight">{group.groupName}</span>
                                            </div>
                                            <span className={`font-mono font-black text-base ${group.total < 0 ? 'text-amber-500' : 'text-foreground'}`}>
                                                {formatCurrency(Math.abs(group.total))} {group.total < 0 ? '(Dr)' : ''}
                                            </span>
                                        </div>

                                        <AnimatePresence>
                                            {expandedGroups.has(group.groupName) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden space-y-1 border-l-2 border-primary/20 pl-4 ml-2"
                                                >
                                                    {group.ledgers.map(l => (
                                                        <div key={l.id} className="flex justify-between items-center text-xs font-bold text-muted-foreground/80 hover:text-foreground transition-colors py-1">
                                                            <span>{l.name}</span>
                                                            <span className="font-mono text-[10px]">{activeCompany?.symbol || '₹'}{l.balance.toLocaleString()} {l.type}</span>
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )
                            ))}
                            {netProfit > 0 && (
                                <div className="p-2 -mx-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-black text-google-green uppercase tracking-tight">Net Profit</span>
                                        <span className="font-mono font-black text-google-green text-base">{formatCurrency(netProfit)}</span>
                                    </div>
                                </div>
                            )}
                            {tbDiff > 0 && (
                                <div className="space-y-2 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 mt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-black text-amber-500 uppercase tracking-tight">Opening Diff</span>
                                        <span className="font-mono font-black text-amber-600">{formatCurrency(tbDiff)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-8 bg-muted/30 border-t border-border flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Capital & Liabilities</span>
                            <span className="text-2xl font-black text-foreground font-mono">{formatCurrency(totalLiabilities)}</span>
                        </div>
                    </div>

                    {/* Assets Side */}
                    <div className="flex flex-col">
                        <div className="p-6 bg-muted/30 border-b border-border font-black text-accent-500 uppercase text-[10px] tracking-[0.2em] text-center">
                            Assets & Resources
                        </div>
                        <div className="p-8 space-y-8 flex-1">
                            {closingStock > 0 && (
                                <div className="p-2 -mx-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-black text-foreground uppercase tracking-tight">Closing Stock</span>
                                        <span className="font-mono font-black text-foreground text-base">{formatCurrency(closingStock)}</span>
                                    </div>
                                </div>
                            )}
                            {assets.map(group => (
                                group.total !== 0 && (
                                    <div key={group.groupName} className="space-y-3">
                                        <div
                                            onClick={() => toggleGroup(group.groupName)}
                                            className="flex justify-between items-center group cursor-pointer hover:bg-muted/30 p-2 -mx-2 rounded-xl transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                {expandedGroups.has(group.groupName) ? (
                                                    <ChevronDown className="w-4 h-4 text-accent-500" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent-500 transition-colors" />
                                                )}
                                                <span className="text-sm font-black text-foreground uppercase tracking-tight">{group.groupName}</span>
                                            </div>
                                            <span className={`font-mono font-black text-base ${group.total < 0 ? 'text-amber-500' : 'text-foreground'}`}>
                                                {formatCurrency(Math.abs(group.total))} {group.total < 0 ? '(Cr)' : ''}
                                            </span>
                                        </div>

                                        <AnimatePresence>
                                            {expandedGroups.has(group.groupName) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden space-y-1 border-l-2 border-accent-500/20 pl-4 ml-2"
                                                >
                                                    {group.ledgers.map(l => (
                                                        <div key={l.id} className="flex justify-between items-center text-xs font-bold text-muted-foreground/80 hover:text-foreground transition-colors py-1">
                                                            <span>{l.name}</span>
                                                            <span className="font-mono text-[10px]">{activeCompany?.symbol || '₹'}{l.balance.toLocaleString()} {l.type}</span>
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )
                            ))}
                            {netProfit < 0 && (
                                <div className="p-2 -mx-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-black text-rose-500 uppercase tracking-tight">Net Loss</span>
                                        <span className="font-mono font-black text-rose-600 text-base">{formatCurrency(Math.abs(netProfit))}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-8 bg-muted/30 border-t border-border flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Assets & Values</span>
                            <span className="text-2xl font-black text-foreground font-mono">{formatCurrency(totalAssets)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Validation Check */}
            <div className={`p-8 rounded-[2rem] border-2 text-center font-black text-sm tracking-widest uppercase ${Math.abs(totalAssets - totalLiabilities) < 0.01 ? 'bg-google-green/5 border-google-green/20 text-google-green' : 'bg-rose-500/5 border-rose-500/20 text-rose-500'}`}>
                {Math.abs(totalAssets - totalLiabilities) < 0.01
                    ? '✓ Accounts are balanced'
                    : `⚠ System Imbalance: ${(totalAssets - totalLiabilities).toLocaleString()}`
                }
            </div>
        </motion.div >
    );
}
