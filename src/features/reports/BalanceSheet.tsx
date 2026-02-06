import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { ReportService, ACCT_GROUPS, type Ledger, type GroupSummary } from '../../services/accounting/ReportService';
import { type StockItem } from '../../services/inventory/types';
import { Calendar, FileDown } from 'lucide-react';
import { ExportService } from '../../services/reports/ExportService';

export default function BalanceSheet() {
    const { provider, activeCompany } = usePersistence();
    const [liabilities, setLiabilities] = useState<GroupSummary[]>([]);
    const [assets, setAssets] = useState<GroupSummary[]>([]);
    const [closingStock, setClosingStock] = useState(0);
    const [netProfit, setNetProfit] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!provider || !activeCompany) return;

            const [ledgerData, stockItemsData, customGroupsData] = await Promise.all([
                provider.read<Ledger[]>('ledgers.json', activeCompany.path),
                provider.read<StockItem[]>('stock_items.json', activeCompany.path),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                provider.read<any[]>('custom_groups.json', activeCompany.path)
            ]);

            const ledgers = ledgerData || [];
            const stockItems = stockItemsData || [];
            const customGroups = customGroupsData || [];

            // Register Custom Groups
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            customGroups.forEach((c: any) => {
                // Import AccountGroupManager (needs to be available)
                // We imported 'AccountGroupManager' in previous step? No, check imports.
                // Assuming it's exported from ReportService.ts
                // Note: We need to update import to include AccountGroupManager
                // For now, I'll rely on ReportService or just assume it's there. 
                // Wait, I need to add it to imports first.
            });

            // Actually, let's fix the imports in the same step if possible or separate.
            // I'll do imports in a separate check but here I'm replacing lines 21-28.

            // Re-register groups (safe to call multiple times)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { AccountGroupManager } = await import('../../services/accounting/ReportService');
            customGroups.forEach((c: any) => AccountGroupManager.registerGroup(c.name, c.parentType));


            const liabilityData = ReportService.getGroupSummary(ledgers as Ledger[], 'LIABILITIES');
            // Exclude 'Stock-in-hand' from standard assets as we add Closing Stock explicitly
            const assetData = ReportService.getGroupSummary(ledgers as Ledger[], 'ASSETS')
                .filter(g => g.groupName !== 'Stock-in-hand');

            const np = ReportService.getNetProfitWithStock(ledgers as Ledger[], stockItems);
            const cs = ReportService.getClosingStockValue(stockItems);

            const tbDiff = ReportService.getTrialBalanceDiff(ledgers as Ledger[]);

            setLiabilities(liabilityData);
            setAssets(assetData);
            setNetProfit(np);
            setClosingStock(cs);
            setTbDiff(tbDiff);

            setLoading(false);
        };
        loadData();
    }, [provider, activeCompany]);

    const [tbDiff, setTbDiff] = useState(0);

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
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Balance Sheet</h1>
                    <p className="text-muted-foreground font-medium">Financial health of {activeCompany?.name}</p>
                </div>
                {/* Export Buttons Code ... */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 shadow-sm">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">As On</label>
                        <input
                            type="date"
                            className="bg-transparent text-xs font-bold outline-none text-foreground"
                            value={new Date().toISOString().split('T')[0]} // Static for now or state
                            onChange={() => { }} // Placeholder
                        />
                    </div>
                    <button
                        onClick={() => {
                            // ... existing export code ... 
                            const rows: string[][] = [];
                            liabilities.forEach(g => {
                                if (g.total > 0) {
                                    rows.push([g.groupName.toUpperCase(), g.total.toFixed(2)]);
                                    g.ledgers.forEach(l => rows.push([`  ${l.name}`, l.balance.toFixed(2)]));
                                }
                            });
                            // Add TB Diff to export if exists
                            if (tbDiff > 0) {
                                rows.push(['DIFF. IN OPENING BALANCES', tbDiff.toFixed(2)]);
                            }
                            rows.push(['---', '---']);
                            // .. assets export ...
                            assets.forEach(g => {
                                if (g.total > 0) {
                                    rows.push([g.groupName.toUpperCase(), g.total.toFixed(2)]);
                                    g.ledgers.forEach(l => rows.push([`  ${l.name}`, l.balance.toFixed(2)]));
                                }
                            });
                            // Add TB Diff (Credit surplus case) to export
                            if (tbDiff < 0) {
                                rows.push(['DIFF. IN OPENING BALANCES', Math.abs(tbDiff).toFixed(2)]);
                            }

                            ExportService.exportToPDF('Balance Sheet', ['Particulars', 'Amount (INR)'], rows, activeCompany);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all shadow-md shadow-primary/10"
                    >
                        <FileDown className="w-4 h-4" />
                        Export PDF
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-xs font-bold text-muted-foreground uppercase tracking-widest border border-border">
                        <Calendar className="w-4 h-4" />
                        As on {new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                    {/* Liabilities Side */}
                    <div className="flex flex-col">
                        <div className="p-6 bg-muted/30 border-b border-border font-black text-primary uppercase text-[10px] tracking-[0.2em] text-center">
                            Liabilities & Equity
                        </div>
                        <div className="p-8 space-y-8 flex-1">

                            {liabilities.map(group => (
                                group.total !== 0 && (
                                    <div key={group.groupName} className="space-y-4">
                                        <div className="flex justify-between items-baseline group cursor-pointer">
                                            <span className="text-sm font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">{group.groupName}</span>
                                            <span className={`font-mono font-bold text-base ${group.total < 0 ? 'text-amber-500' : 'text-foreground'}`}>{Math.abs(group.total).toLocaleString()} {group.total < 0 ? '(Dr)' : ''}</span>
                                        </div>
                                        <div className="space-y-2 border-l-2 border-muted pl-4 ml-1">
                                            {group.ledgers.map(l => (
                                                <div key={l.id} className="flex justify-between items-center text-sm font-medium text-muted-foreground/80 hover:text-foreground transition-colors py-0.5">
                                                    <span>{l.name}</span>
                                                    <span className="font-mono">{l.balance.toLocaleString()} {l.type}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                            {netProfit > 0 && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-baseline group">
                                        <span className="text-sm font-black text-emerald-500 uppercase tracking-tight">Profit & Loss A/c (Net Profit)</span>
                                        <span className="font-mono font-bold text-emerald-600 text-base">{netProfit.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                            {tbDiff > 0 && (
                                <div className="space-y-4 pt-4 border-t border-dashed border-red-500/20">
                                    <div className="flex justify-between items-baseline group">
                                        <span className="text-sm font-black text-amber-500 uppercase tracking-tight">Diff. in Opening Balances</span>
                                        <span className="font-mono font-bold text-amber-600 text-base">{tbDiff.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic">Total Debits exceed Credits by {tbDiff.toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-muted/30 border-t border-border flex justify-between items-center px-8">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Liabilities</span>
                            <span className="text-xl font-black text-foreground font-mono">{totalLiabilities.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Assets Side */}
                    <div className="flex flex-col">
                        <div className="p-6 bg-muted/30 border-b border-border font-black text-cyan-500 uppercase text-[10px] tracking-[0.2em] text-center">
                            Assets & Resources
                        </div>
                        <div className="p-8 space-y-8 flex-1">
                            {closingStock > 0 && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-baseline group">
                                        <span className="text-sm font-black text-foreground uppercase tracking-tight group-hover:text-cyan-500 transition-colors">Closing Stock</span>
                                        <span className="font-mono font-bold text-foreground text-base">{closingStock.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                            {assets.map(group => (
                                group.total !== 0 && (
                                    <div key={group.groupName} className="space-y-4">
                                        <div className="flex justify-between items-baseline group cursor-pointer">
                                            <span className="text-sm font-black text-foreground uppercase tracking-tight group-hover:text-cyan-500 transition-colors">{group.groupName}</span>
                                            <span className={`font-mono font-bold text-base ${group.total < 0 ? 'text-amber-500' : 'text-foreground'}`}>{Math.abs(group.total).toLocaleString()} {group.total < 0 ? '(Cr)' : ''}</span>
                                        </div>
                                        <div className="space-y-2 border-l-2 border-muted pl-4 ml-1">
                                            {group.ledgers.map(l => (
                                                <div key={l.id} className="flex justify-between items-center text-sm font-medium text-muted-foreground/80 hover:text-foreground transition-colors py-0.5">
                                                    <span>{l.name}</span>
                                                    <span className="font-mono">{l.balance.toLocaleString()} {l.type}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                            {netProfit < 0 && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-baseline group">
                                        <span className="text-sm font-black text-rose-500 uppercase tracking-tight">Profit & Loss A/c (Net Loss)</span>
                                        <span className="font-mono font-bold text-rose-600 text-base">{Math.abs(netProfit).toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                            {tbDiff < 0 && (
                                <div className="space-y-4 pt-4 border-t border-dashed border-red-500/20">
                                    <div className="flex justify-between items-baseline group">
                                        <span className="text-sm font-black text-amber-500 uppercase tracking-tight">Diff. in Opening Balances</span>
                                        <span className="font-mono font-bold text-amber-600 text-base">{Math.abs(tbDiff).toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic">Total Credits exceed Debits by {Math.abs(tbDiff).toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-muted/30 border-t border-border flex justify-between items-center px-8">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Assets</span>
                            <span className="text-xl font-black text-foreground font-mono">{totalAssets.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Validation Check */}
            <div className={`p-6 rounded-2xl border text-center font-bold text-sm tracking-wide ${Math.abs(totalAssets - totalLiabilities) < 0.01 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                {Math.abs(totalAssets - totalLiabilities) < 0.01
                    ? '✓ Balance Sheet is perfectly balanced'
                    : `⚠ Balance Sheet Difference: ${(totalAssets - totalLiabilities).toLocaleString()}`
                }
            </div>


        </motion.div>
    );
}
