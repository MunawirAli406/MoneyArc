import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { ReportService, ACCT_GROUPS, type Ledger, type GroupSummary } from '../../services/accounting/ReportService';
import { Calendar } from 'lucide-react';

export default function BalanceSheet() {
    const { provider, activeCompany } = usePersistence();
    const [liabilities, setLiabilities] = useState<GroupSummary[]>([]);
    const [assets, setAssets] = useState<GroupSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!provider || !activeCompany) return;

            const ledgers = await provider.read<Ledger[]>('ledgers.json', activeCompany.path) || [];

            const liabilityData = ReportService.getGroupSummary(ledgers, ACCT_GROUPS.LIABILITIES);
            const assetData = ReportService.getGroupSummary(ledgers, ACCT_GROUPS.ASSETS);

            setLiabilities(liabilityData);
            setAssets(assetData);
            setLoading(false);
        };
        loadData();
    }, [provider, activeCompany]);

    const totalLiabilities = ReportService.calculateTotal(liabilities);
    const totalAssets = ReportService.calculateTotal(assets);

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
                <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-xs font-bold text-muted-foreground uppercase tracking-widest border border-border">
                    <Calendar className="w-4 h-4" />
                    As on {new Date().toLocaleDateString()}
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
                                group.total > 0 && (
                                    <div key={group.groupName} className="space-y-4">
                                        <div className="flex justify-between items-baseline group cursor-pointer">
                                            <span className="text-sm font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">{group.groupName}</span>
                                            <span className="font-mono font-bold text-foreground text-base">{group.total.toLocaleString()}</span>
                                        </div>
                                        <div className="space-y-2 border-l-2 border-muted pl-4 ml-1">
                                            {group.ledgers.map(l => (
                                                <div key={l.id} className="flex justify-between items-center text-sm font-medium text-muted-foreground/80 hover:text-foreground transition-colors py-0.5">
                                                    <span>{l.name}</span>
                                                    <span className="font-mono">{l.balance.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
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
                            {assets.map(group => (
                                group.total > 0 && (
                                    <div key={group.groupName} className="space-y-4">
                                        <div className="flex justify-between items-baseline group cursor-pointer">
                                            <span className="text-sm font-black text-foreground uppercase tracking-tight group-hover:text-cyan-500 transition-colors">{group.groupName}</span>
                                            <span className="font-mono font-bold text-foreground text-base">{group.total.toLocaleString()}</span>
                                        </div>
                                        <div className="space-y-2 border-l-2 border-muted pl-4 ml-1">
                                            {group.ledgers.map(l => (
                                                <div key={l.id} className="flex justify-between items-center text-sm font-medium text-muted-foreground/80 hover:text-foreground transition-colors py-0.5">
                                                    <span>{l.name}</span>
                                                    <span className="font-mono">{l.balance.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
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
