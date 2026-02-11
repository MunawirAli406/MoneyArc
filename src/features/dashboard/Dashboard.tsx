import { TrendingUp, TrendingDown, Activity, Wallet, Shield, Target, ArrowRight, Clock, Loader2, Globe, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Voucher } from '../../services/accounting/VoucherService';
import { ACCT_GROUPS, type Ledger } from '../../services/accounting/ReportService';
import { GeminiService } from '../../services/ai/GeminiService';
import { useAuth } from '../auth/AuthContext.provider';
import { useLocalization } from '../../hooks/useLocalization';

export default function Dashboard() {
    const { provider, activeCompany } = usePersistence();
    const { formatCurrency } = useLocalization();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Data States
    const [stats, setStats] = useState([
        { label: 'Revenue', value: '0', change: '+0%', icon: TrendingUp, color: 'hsl(var(--google-blue))', bg: 'bg-google-blue/10', sparkData: [] as any[], path: '/reports/profit-loss' },
        { label: 'Expenses', value: '0', change: '-0%', icon: TrendingDown, color: 'hsl(var(--google-red))', bg: 'bg-google-red/10', sparkData: [] as any[], path: '/reports/profit-loss' },
        { label: 'Net Profit', value: '0', change: '+0%', icon: Activity, color: 'hsl(var(--google-green))', bg: 'bg-google-green/10', sparkData: [] as any[], path: '/reports/profit-loss' },
        { label: 'Vouchers', value: '0', change: '0', icon: Wallet, color: 'hsl(var(--google-yellow))', bg: 'bg-google-yellow/10', sparkData: [] as any[], path: '/reports/daybook' },
    ]);

    const [recentVouchers, setRecentVouchers] = useState<Voucher[]>([]);
    const [stockWatch, setStockWatch] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [vitals, setVitals] = useState({ liquidRatio: 0, netMargin: 0, status: 'Healthy' });
    const [aiSummary, setAiSummary] = useState<string>('');
    const [aiLoading, setAiLoading] = useState(false);

    interface ChartData { name: string; sales: number; purchases: number; }

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    }, []);

    const fetchAiHeartbeat = async (rev: number, exp: number, vit: any, vList: Voucher[], lList: Ledger[]) => {
        const apiKey = localStorage.getItem('moneyarc_gemini_key') || '';
        if (!apiKey) return;
        setAiLoading(true);
        try {
            const service = new GeminiService(apiKey);
            const prompt = `Provide a one-sentence high-end "Executive Heartbeat" for this dashboard. Stats: Rev ${activeCompany?.symbol}${rev}, Exp ${activeCompany?.symbol}${exp}, Margin ${vit.netMargin}%. One emoji only. Be professional.`;
            const summary = await service.generateInsight(prompt, { vouchers: vList, ledgers: lList, companyName: activeCompany?.name || '', symbol: activeCompany?.symbol || '₹' });
            setAiSummary(summary);
        } catch (e) {
            console.error("Heartbeat fetch failed", e);
            setAiSummary("AI Advisor is currently unavailable.");
        } finally { setAiLoading(false); }
    };

    useEffect(() => {
        const load = async () => {
            if (!provider || !activeCompany) return;
            const vouchers = await provider.read<Voucher[]>('vouchers.json', activeCompany.path) || [];
            const ledgers = await provider.read<Ledger[]>('ledgers.json', activeCompany.path) || [];
            const stockItems = await provider.read<any[]>('stock_items.json', activeCompany.path) || [];

            setRecentVouchers([...vouchers].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4));
            setStockWatch([...stockItems].sort((a, b) => ((b.currentBalance || b.openingStock) * (b.currentRate || b.openingRate)) - ((a.currentBalance || a.openingStock) * (a.currentRate || a.openingRate))).slice(0, 4));

            const ledgerMap = new Map(ledgers.map(l => [l.name, l.group]));
            let revenue = 0, expenses = 0;
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthlyData = months.reduce((acc, m) => ({ ...acc, [m]: { name: m, sales: 0, purchases: 0 } }), {} as Record<string, ChartData>);

            const today = new Date();
            const last7 = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(today); d.setDate(d.getDate() - (6 - i));
                return d.toISOString().split('T')[0];
            });
            const sparkMap = last7.reduce((acc, d) => ({ ...acc, [d]: { rev: 0, exp: 0, count: 0 } }), {} as Record<string, any>);

            vouchers.forEach(v => {
                const vDate = v.date.split('T')[0];
                const m = months[new Date(v.date).getMonth()];
                if (sparkMap[vDate]) sparkMap[vDate].count++;
                v.rows.forEach(r => {
                    const g = ledgerMap.get(r.account);
                    if (g && ACCT_GROUPS.INCOME.includes(g) && r.type === 'Cr') {
                        revenue += r.credit;
                        if (sparkMap[vDate]) sparkMap[vDate].rev += r.credit;
                        if (g === 'Sales Accounts') monthlyData[m].sales += r.credit;
                    }
                    if (g && ACCT_GROUPS.EXPENSES.includes(g) && r.type === 'Dr') {
                        expenses += r.debit;
                        if (sparkMap[vDate]) sparkMap[vDate].exp += r.debit;
                        if (g === 'Purchase Accounts') monthlyData[m].purchases += r.debit;
                    }
                });
            });

            const closingVal = stockItems.reduce((s, i) => s + ((i.currentBalance ?? i.openingStock) * (i.currentRate ?? i.openingRate)), 0);
            const openingVal = stockItems.reduce((s, i) => s + (i.openingStock * i.openingRate), 0);
            const profit = revenue + closingVal - (expenses + openingVal);

            setStats([
                { label: 'Revenue', value: revenue.toString(), change: '+12%', icon: TrendingUp, color: 'hsl(var(--google-blue))', bg: 'bg-google-blue/10', sparkData: last7.map(d => ({ v: sparkMap[d].rev })), path: '/reports/profit-loss' },
                { label: 'Expenses', value: expenses.toString(), change: '-5%', icon: TrendingDown, color: 'hsl(var(--google-red))', bg: 'bg-google-red/10', sparkData: last7.map(d => ({ v: sparkMap[d].exp })), path: '/reports/profit-loss' },
                { label: 'Net Profit', value: profit.toString(), change: '+8%', icon: Activity, color: 'hsl(var(--google-green))', bg: 'bg-google-green/10', sparkData: last7.map(d => ({ v: sparkMap[d].rev - sparkMap[d].exp })), path: '/reports/profit-loss' },
                { label: 'Vouchers', value: vouchers.length.toString(), change: `+${vouchers.length}`, icon: Wallet, color: 'hsl(var(--google-yellow))', bg: 'bg-google-yellow/10', sparkData: last7.map(d => ({ v: sparkMap[d].count })), path: '/reports/daybook' },
            ]);

            const curM = new Date().getMonth();
            const l6 = []; for (let i = 5; i >= 0; i--) l6.push(monthlyData[months[(curM - i + 12) % 12]]);
            setChartData(l6);

            const liqA = ledgers.filter(l => ['Bank Accounts', 'Cash-in-hand', 'Sundry Debtors'].includes(l.group)).reduce((s, l) => s + l.balance, 0);
            const curL = ledgers.filter(l => ['Sundry Creditors', 'Duties & Taxes', 'Current Liabilities'].includes(l.group)).reduce((s, l) => s + l.balance, 0);
            const ratio = curL === 0 ? 1 : liqA / curL;
            const margin = revenue === 0 ? 0 : (profit / revenue) * 100;
            const vitResult = { liquidRatio: Number(ratio.toFixed(2)), netMargin: Number(margin.toFixed(1)), status: ratio >= 1.2 ? 'Healthy' : 'Warning' };
            setVitals(vitResult);
            fetchAiHeartbeat(revenue, expenses, vitResult, vouchers, ledgers);
        };
        load();
    }, [provider, activeCompany]);

    useEffect(() => {
        const handleKeyUpdate = () => {
            const revenue = stats[0].value.replace(/[^0-9.-]/g, '');
            const expenses = stats[1].value.replace(/[^0-9.-]/g, '');
            fetchAiHeartbeat(Number(revenue), Number(expenses), vitals, recentVouchers, []);
        };
        window.addEventListener('moneyarc_key_updated', handleKeyUpdate);
        return () => window.removeEventListener('moneyarc_key_updated', handleKeyUpdate);
    }, [stats, vitals, recentVouchers]);

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-[1600px] mx-auto px-6 lg:px-12 pb-24 pt-4">

            {/* Executive Top Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4">
                <motion.div variants={item}>
                    <h1 className="text-4xl font-black tracking-tighter flex items-baseline gap-3">
                        {greeting}, <span className="text-primary">{user?.name?.split(' ')[0] || 'Executive'}</span>
                        <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-google-green animate-pulse" />
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium mt-1 flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5" />
                        Analyzing <span className="font-bold text-foreground">{activeCompany?.name}</span> financial landscape
                    </p>
                </motion.div>

                <motion.div variants={item} className="glass-panel px-6 py-4 rounded-3xl border-primary/20 flex items-center gap-4 max-w-xl shadow-lg ring-1 ring-white/5 backdrop-blur-2xl">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    </div>
                    <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 block mb-0.5">AI Advisor Feed</span>
                        <p className="text-xs font-bold truncate">
                            {aiLoading ? (
                                <span className="flex items-center gap-2 text-muted-foreground italic">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Synthesizing financial metrics...
                                </span>
                            ) : aiSummary || "Syncing with real-time voucher data for executive summary."}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Premium Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 grid-rows-none">

                {/* Main Insight Hub (Center Top) */}
                <motion.div variants={item} className="lg:col-span-8 glass-panel rounded-[2.5rem] p-8 border-primary/10 shadow-2xl relative overflow-hidden group min-h-[480px]">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32" />

                    <div className="flex justify-between items-start relative z-10 mb-8">
                        <div>
                            <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">Growth Trajectory Details</h1>
                            <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground opacity-50">6-Month Fiscal Cycle</p>
                        </div>
                        <div className="flex bg-muted/20 p-1.5 rounded-2xl border border-border/50">
                            {['Sales', 'Purchases'].map((l, i) => (
                                <div key={l} className="flex items-center gap-2 px-3 py-1.5 transition-all">
                                    <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-google-blue' : 'bg-google-red'}`} />
                                    <span className="text-[10px] font-black uppercase tracking-wider">{l}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-[340px] relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradientSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--google-blue))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--google-blue))" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradientPurchases" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--google-red))" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="hsl(var(--google-red))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: 'currentColor', opacity: 0.5 }} />
                                <YAxis hide />
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '20px', border: '1px solid hsl(var(--border))', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} />
                                <Area type="monotone" dataKey="sales" stroke="hsl(var(--google-blue))" strokeWidth={4} fillOpacity={1} fill="url(#gradientSales)" />
                                <Area type="monotone" dataKey="purchases" stroke="hsl(var(--google-red))" strokeWidth={4} fillOpacity={1} fill="url(#gradientPurchases)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Quick Stats Column */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {stats.slice(2, 4).map((stat) => (
                        <motion.div
                            key={stat.label}
                            variants={item}
                            whileHover={{ y: -5 }}
                            onClick={() => navigate(stat.path)}
                            className="glass-card flex-1 p-6 rounded-[2rem] border-primary/10 relative overflow-hidden group cursor-pointer"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} shadow-inner`}>
                                    <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</h3>
                                    <p className="text-2xl font-black tabular-nums tracking-tighter">
                                        {stat.label === 'Vouchers' ? stat.value : formatCurrency(Number(stat.value))}
                                    </p>
                                </div>
                                <div className="ml-auto text-right">
                                    <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-google-green/10 text-google-green border border-google-green/20">
                                        {stat.change}
                                    </span>
                                </div>
                            </div>
                            <div className="h-10 w-full opacity-50 group-hover:opacity-100 transition-opacity">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stat.sparkData}>
                                        <Area type="monotone" dataKey="v" stroke={stat.color} strokeWidth={2} fill="transparent" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Efficiency Gauge (Left Middle) */}
                <motion.div variants={item} className="lg:col-span-3 glass-panel rounded-[2.5rem] p-8 border-primary/10 flex flex-col items-center justify-center text-center relative max-h-[300px]">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">Efficiency Vitals</h3>
                    <div className="relative w-40 h-20 mb-4 overflow-hidden">
                        <div className="absolute top-0 left-0 w-40 h-40 border-[12px] border-muted/30 rounded-full" />
                        <motion.div
                            initial={{ rotate: -90 }}
                            animate={{ rotate: -90 + (vitals.netMargin * 1.8) }}
                            className="absolute top-0 left-0 w-40 h-40 border-[12px] border-google-green rounded-full border-b-transparent border-l-transparent transition-all duration-1000"
                        />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xl font-black">{vitals.netMargin}%</div>
                    </div>
                    <p className="text-[9px] font-black uppercase text-google-green tracking-widest px-4 py-2 bg-google-green/10 rounded-full">
                        Net Margin Score: {vitals.status}
                    </p>
                </motion.div>

                {/* Activity Bento (Right Middle) */}
                <motion.div variants={item} className="lg:col-span-6 glass-panel rounded-[2.5rem] p-8 border-primary/10 relative">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Clock className="w-4 h-4 text-violet-500" />
                            Live Activity Feed
                        </h3>
                        <motion.button whileHover={{ scale: 1.05 }} className="text-[9px] font-black text-primary uppercase border-b border-primary/30">View All</motion.button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentVouchers.map((v, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-muted/10 border border-border/50 hover:bg-muted/20 transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[9px] font-black uppercase text-primary tracking-tighter">{v.type} #{v.voucherNo}</span>
                                    <span className="text-[10px] font-black">{formatCurrency(v.rows[0]?.type === 'Dr' ? v.rows[0]?.debit : v.rows[0]?.credit)}</span>
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground truncate group-hover:text-foreground transition-colors">{v.rows[0]?.account}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Inventory Watch (Bottom Right) */}
                <motion.div variants={item} className="lg:col-span-3 glass-panel rounded-[2.5rem] p-8 border-primary/10 relative overflow-hidden">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-6">
                        <Target className="w-4 h-4 text-google-blue" />
                        Inventory Watch
                    </h3>
                    <div className="space-y-4">
                        {stockWatch.length > 0 ? stockWatch.map((itemVal, i) => (
                            <div key={i} className="flex justify-between items-center group/item hover:bg-white/5 p-2 rounded-xl transition-colors">
                                <span className="text-[10px] font-bold uppercase tracking-tight text-foreground/70 truncate max-w-[120px]">{itemVal.name}</span>
                                <span className="text-[10px] font-black tabular-nums text-primary">{formatCurrency((itemVal.currentBalance || itemVal.openingStock) * (itemVal.currentRate || itemVal.openingRate))}</span>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-8 opacity-40">
                                <span className="text-[10px] font-black uppercase tracking-widest italic">No active stock items</span>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Command Center (Bottom Left) */}
                <motion.div variants={item} className="lg:col-span-3 glass-panel rounded-[2.5rem] p-8 border-primary/10 flex flex-col gap-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: Wallet, path: '/vouchers/new', color: 'text-google-blue' },
                            { icon: Shield, path: '/security', color: 'text-amber-500' },
                            { icon: Target, path: '/reports/ratios', color: 'text-google-green' },
                            { icon: Activity, path: '/reports/daybook', color: 'text-violet-500' }
                        ].map((btn, i) => (
                            <motion.button
                                key={i}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate(btn.path)}
                                className="h-16 rounded-3xl bg-muted/20 border border-border/50 flex items-center justify-center hover:bg-primary/10 transition-colors"
                            >
                                <btn.icon className={`w-6 h-6 ${btn.color}`} />
                            </motion.button>
                        ))}
                    </div>
                    <button onClick={() => navigate('/data-portability')} className="mt-2 w-full py-3 rounded-2xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2">
                        Export Data <ArrowRight className="w-3 h-3" />
                    </button>
                </motion.div>

            </div>
        </motion.div>
    );
}
