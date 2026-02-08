import { TrendingUp, TrendingDown, DollarSign, Activity, Wallet, FileText, PieChart as PieIcon, Hotel, Car, Shirt, Utensils, GraduationCap, HeartPulse, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useTheme } from '../../features/settings/useTheme';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import type { Voucher } from '../../services/accounting/VoucherService';
import { ACCT_GROUPS, type Ledger } from '../../services/accounting/ReportService';
import { BUSINESS_THEMES } from '../settings/businessThemes';

export default function Dashboard() {
    const { provider, activeCompany } = usePersistence();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [greeting, setGreeting] = useState('');
    const [stats, setStats] = useState([
        { label: 'Total Revenue', value: `${activeCompany?.symbol || '₹'}0.00`, change: '0%', icon: DollarSign, color: 'text-accent-500', bg: 'bg-accent-500/10', sparkData: [] as any[] },
        { label: 'Total Expenses', value: `${activeCompany?.symbol || '₹'}0.00`, change: '0%', icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/10', sparkData: [] as any[] },
        { label: 'Net Profit', value: `${activeCompany?.symbol || '₹'}0.00`, change: '0%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', sparkData: [] as any[] },
        { label: 'Vouchers', value: '0', change: '0', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10', sparkData: [] as any[] },
    ]);


    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 17) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    interface ChartData {
        name: string;
        sales: number;
        purchases: number;
    }

    const [recentVouchers, setRecentVouchers] = useState<Voucher[]>([]);
    const [stockWatch, setStockWatch] = useState<any[]>([]);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [vitals, setVitals] = useState({ liquidRatio: 0, netMargin: 0, status: 'Healthy' });

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!provider || !activeCompany) return;

            const vouchers = await provider.read<Voucher[]>('vouchers.json', activeCompany.path) || [];
            const ledgers = await provider.read<Ledger[]>('ledgers.json', activeCompany.path) || [];
            const stockItems = await provider.read<any[]>('stock_items.json', activeCompany.path) || [];

            // Recent Vouchers
            const sortedVouchers = [...vouchers].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
            setRecentVouchers(sortedVouchers);

            // Stock Watch
            const sortedStock = [...stockItems].sort((a, b) => {
                const valA = (a.currentBalance || a.openingStock) * (a.currentRate || a.openingRate);
                const valB = (b.currentBalance || b.openingStock) * (b.currentRate || b.openingRate);
                return valB - valA;
            }).slice(0, 5);
            setStockWatch(sortedStock);

            const ledgerGroupMap = new Map(ledgers.map(l => [l.name, l.group]));

            // Calculate stats
            let revenue = 0;
            let expenses = 0;

            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthlyData = months.reduce((acc, month) => {
                acc[month] = { name: month, sales: 0, purchases: 0 };
                return acc;
            }, {} as Record<string, ChartData>);

            // Calculate sparkline data (last 7 days)
            const today = new Date();
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(today);
                d.setDate(d.getDate() - (6 - i));
                return d.toISOString().split('T')[0];
            });

            const sparkDataMap = last7Days.reduce((acc, date) => {
                acc[date] = { date, revenue: 0, expenses: 0, profit: 0, vouchers: 0 };
                return acc;
            }, {} as Record<string, any>);

            vouchers.forEach(v => {
                const vDate = v.date.split('T')[0];
                const date = new Date(v.date);
                const month = months[date.getMonth()];

                if (sparkDataMap[vDate]) {
                    sparkDataMap[vDate].vouchers += 1;
                }

                v.rows.forEach(r => {
                    const group = ledgerGroupMap.get(r.account);
                    if (group && ACCT_GROUPS.INCOME.includes(group)) {
                        if (r.type === 'Cr') {
                            revenue += r.credit;
                            if (sparkDataMap[vDate]) sparkDataMap[vDate].revenue += r.credit;
                            if (group === 'Sales Accounts') {
                                monthlyData[month].sales += r.credit;
                            }
                        }
                    }
                    if (group && ACCT_GROUPS.EXPENSES.includes(group)) {
                        if (r.type === 'Dr') {
                            expenses += r.debit;
                            if (sparkDataMap[vDate]) sparkDataMap[vDate].expenses += r.debit;
                            if (group === 'Purchase Accounts') {
                                monthlyData[month].purchases += r.debit;
                            }
                        }
                    }
                });
            });

            // Calculate Sparkline profit
            last7Days.forEach(d => {
                sparkDataMap[d].profit = sparkDataMap[d].revenue - sparkDataMap[d].expenses;
            });

            const sparkLines = {
                rev: last7Days.map(d => ({ value: sparkDataMap[d].revenue })),
                exp: last7Days.map(d => ({ value: sparkDataMap[d].expenses })),
                profit: last7Days.map(d => ({ value: sparkDataMap[d].profit })),
                vouchers: last7Days.map(d => ({ value: sparkDataMap[d].vouchers }))
            };

            const stockItemsList = stockItems || [];
            const closingStockValue = stockItemsList.reduce((sum, item) => {
                const balance = item.currentBalance !== undefined ? item.currentBalance : item.openingStock;
                const rate = item.currentRate !== undefined ? item.currentRate : item.openingRate;
                return sum + (balance * rate);
            }, 0);

            const openingStockValue = stockItemsList.reduce((sum, item) => {
                return sum + (item.openingStock * item.openingRate);
            }, 0);



            setStats([
                { label: bTheme.revenueLabel, value: `${activeCompany?.symbol || '₹'}${revenue.toLocaleString()}`, change: '+0%', icon: DollarSign, color: 'text-accent-500', bg: 'bg-accent-500/10', sparkData: sparkLines.rev },
                { label: bTheme.expenseLabel, value: `${activeCompany?.symbol || '₹'}${expenses.toLocaleString()}`, change: '-0%', icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/10', sparkData: sparkLines.exp },
                { label: 'Net Profit', value: `${activeCompany?.symbol || '₹'}${(revenue + closingStockValue - (expenses + openingStockValue)).toLocaleString()}`, change: '+0%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', sparkData: sparkLines.profit },
                { label: 'Vouchers', value: vouchers.length.toString(), change: `+${vouchers.length}`, icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10', sparkData: sparkLines.vouchers },
            ]);



            const currentMonth = new Date().getMonth();
            const last6Months = [];
            for (let i = 5; i >= 0; i--) {
                const mIdx = (currentMonth - i + 12) % 12;
                last6Months.push(monthlyData[months[mIdx]]);
            }

            setChartData(last6Months);

            // Calculate Vitals
            // Liquid Ratio = Liquid Assets / Current Liabilities
            // Liquid Assets ≈ Cash + Bank + Debtors
            // Current Liabilities ≈ Creditors + Duties & Taxes + Current Liabilities
            const liquidAssets = ledgers
                .filter(l => ['Bank Accounts', 'Cash-in-hand', 'Sundry Debtors'].includes(l.group))
                .reduce((sum, l) => sum + l.balance, 0);

            const currentLiabilities = ledgers
                .filter(l => ['Sundry Creditors', 'Duties & Taxes', 'Current Liabilities'].includes(l.group))
                .reduce((sum, l) => sum + l.balance, 0);

            const liquidRatio = currentLiabilities === 0 ? (liquidAssets > 0 ? 9.99 : 0) : liquidAssets / currentLiabilities;

            // Net Margin = (Net Profit / Revenue) * 100
            const netProfitValue = revenue + closingStockValue - (expenses + openingStockValue);
            const netMargin = revenue === 0 ? 0 : (netProfitValue / revenue) * 100;

            setVitals({
                liquidRatio: Number(liquidRatio.toFixed(2)),
                netMargin: Number(netMargin.toFixed(1)),
                status: liquidRatio >= 1.2 ? 'Healthy' : (liquidRatio >= 1 ? 'Action Required' : 'Critical')
            });
        };
        loadDashboardData();
    }, [provider, activeCompany]);

    const bTheme = activeCompany?.businessType ? BUSINESS_THEMES[activeCompany.businessType] : BUSINESS_THEMES.General;
    const ICON_MAP: Record<string, any> = { Hotel, Car, Shirt, Utensils, GraduationCap, HeartPulse, Building2 };
    const BusinessIcon = ICON_MAP[bTheme.icon] || Building2;

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-7xl mx-auto px-4 sm:px-8 pb-24">
            <motion.div variants={item} className="group relative glass-panel p-10 rounded-[3.5rem] border-primary/20 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full -mr-48 -mt-48 group-hover:bg-primary/30 transition-all duration-1000 animate-pulse" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 mb-4 backdrop-blur-md">
                            <BusinessIcon className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                                {greeting}
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground uppercase leading-none mb-3">
                            {activeCompany?.name || 'Dashboard'}
                        </h1>
                        <div className="flex items-center gap-4">
                            <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px] bg-muted/30 px-2 py-1 rounded-md">
                                {activeCompany?.businessType || 'General'}
                            </p>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                            <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px] bg-muted/30 px-2 py-1 rounded-md">
                                FY {activeCompany?.financialYear || '2023-24'}
                            </p>
                            {activeCompany?.gstin && (
                                <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                    <p className="text-primary font-black uppercase tracking-widest text-[10px] bg-primary/10 border border-primary/20 px-2 py-1 rounded-md">
                                        GSTIN: {activeCompany?.gstin}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>


                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnimatePresence>
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            variants={item}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="glass-card p-6 rounded-[2.5rem] shadow-xl group relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300"
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full ${stat.bg} blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />

                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} shadow-lg ring-1 ring-inset ring-white/10`}>
                                    <stat.icon className="w-7 h-7" />
                                </div>
                                <div className="text-right">
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${stat.change.startsWith('+') || index === 2 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'} border border-current/10`}>
                                        {stat.change}
                                    </span>
                                </div>
                            </div>

                            <div className="relative z-10 mb-4">
                                <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.15em] mb-1 opacity-70">{stat.label}</h3>
                                <p className="text-3xl font-black tracking-tighter tabular-nums">{stat.value}</p>
                            </div>

                            <div className="h-12 w-full mt-2 relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stat.sparkData}>
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke={index === 1 ? '#f43f5e' : (index === 0 ? '#06b6d4' : (index === 2 ? '#10b981' : '#8b5cf6'))}
                                            strokeWidth={2}
                                            fillOpacity={0.1}
                                            fill={index === 1 ? '#f43f5e' : (index === 0 ? '#06b6d4' : (index === 2 ? '#10b981' : '#8b5cf6'))}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Hover Overlay */}
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform backdrop-blur-sm flex justify-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">View detailed report</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Sales & Purchases Chart - Takes full width in bento grid */}
                <div className="lg:col-span-3 glass-panel rounded-[3.5rem] shadow-2xl p-10 relative overflow-hidden group border-primary/20">
                    <div className="flex justify-between items-center mb-10 relative z-10">
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                                <TrendingUp className="w-7 h-7 text-primary" />
                                Sales & Purchases
                            </h2>
                            <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">Transactional Cycle Analysis</p>
                        </div>
                        <div className="flex gap-4 p-1.5 bg-muted/20 rounded-2xl border border-border/50 backdrop-blur-sm">
                            {[
                                { label: 'Sales', color: 'bg-accent-500' },
                                { label: 'Purchases', color: 'bg-rose-500' }
                            ].map(l => (
                                <div key={l.label} className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors">
                                    <div className={`w-2 h-2 rounded-full ${l.color} shadow-[0_0_8px_rgba(0,0,0,0.2)]`} />
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{l.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-[400px] relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: theme === 'dark' ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                />
                                <YAxis hide />
                                <CartesianGrid vertical={false} stroke={theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} verticalFill={['rgba(0,0,0,0.01)', 'transparent']} />
                                <Tooltip
                                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                                    contentStyle={{
                                        backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                                        borderRadius: '24px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        backdropFilter: 'blur(16px)',
                                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                        padding: '16px'
                                    }}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#06b6d4" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                                <Area type="monotone" dataKey="purchases" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorPurchases)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Execution Hub - High density actions */}
                <div className="glass-panel rounded-[3rem] shadow-2xl p-8 border-primary/10">
                    <h2 className="text-xl font-black tracking-tight mb-8 uppercase text-muted-foreground/50 border-b border-border/50 pb-4">Command Center</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Voucher', icon: Wallet, color: 'text-accent-500', bg: 'bg-accent-500/10', path: '/vouchers/new', desc: 'New Entry' },
                            { label: 'Ratios', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10', path: '/reports/ratios', desc: 'Analysis' },
                            { label: 'Daybook', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10', path: '/reports/daybook', desc: 'Audit' },
                            { label: 'Stock', icon: PieIcon, color: 'text-violet-500', bg: 'bg-violet-500/10', path: '/reports/stock-summary', desc: 'Inventory' },
                        ].map((action, i) => (
                            <motion.button
                                key={i}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate(action.path)}
                                className="flex flex-col items-start gap-4 p-5 rounded-3xl bg-muted/20 border border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all group"
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${action.bg} ${action.color} shadow-lg ring-1 ring-inset ring-white/10 group-hover:rotate-12 transition-transform`}>
                                    <action.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-foreground">{action.label}</span>
                                    <span className="block text-[8px] font-bold text-muted-foreground uppercase tracking-tight">{action.desc}</span>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Financial Health - Modern progress bars */}
                <div className="glass-panel rounded-[3rem] shadow-2xl p-8 border-primary/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                    <h2 className="text-xl font-black tracking-tight mb-8 uppercase text-muted-foreground/50 border-b border-border/50 pb-4">Vitals</h2>
                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest">Liquid Ratio</span>
                                    <span className="text-2xl font-black text-accent-500">{vitals.liquidRatio}</span>
                                </div>
                                <span className={clsx(
                                    "text-[10px] font-black px-2 py-1 rounded-md",
                                    vitals.status === 'Healthy' ? "text-emerald-500 bg-emerald-500/10" :
                                        vitals.status === 'Critical' ? "text-rose-500 bg-rose-500/10" : "text-amber-500 bg-amber-500/10"
                                )}>
                                    {vitals.status}
                                </span>
                            </div>
                            <div className="w-full h-2.5 bg-muted/30 rounded-full overflow-hidden p-0.5 border border-border/50">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(vitals.liquidRatio * 40, 100)}%` }} // 2.5 is 100%
                                    className="h-full bg-gradient-to-r from-accent-600 to-accent-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest">Net Margin</span>
                                    <span className="text-2xl font-black text-emerald-500">{vitals.netMargin}%</span>
                                </div>
                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
                                    {vitals.netMargin >= 0 ? 'Profitable' : 'Loss'}
                                </span>
                            </div>
                            <div className="w-full h-2.5 bg-muted/30 rounded-full overflow-hidden p-0.5 border border-border/50">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.max(0, Math.min(vitals.netMargin * 2, 100))}%` }} // 50% is 100% bar
                                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Second Row of Bento Items */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {/* Stock Watch List */}
                    <div className="glass-panel rounded-[3rem] p-8 border-primary/10 shadow-xl">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2">
                            <PieIcon className="w-4 h-4 text-accent-500" />
                            Inventory Watch
                        </h3>
                        <div className="space-y-4">
                            {stockWatch.slice(0, 3).map((item, i) => (
                                <div key={i} className="flex justify-between items-center group/item hover:bg-white/5 p-2 rounded-xl transition-colors">
                                    <span className="text-[10px] font-black uppercase tracking-tight text-foreground/70 truncate max-w-[80px]">{item.name}</span>
                                    <span className="text-xs font-black tabular-nums text-accent-500">{activeCompany?.symbol || '₹'}{((item.currentBalance || item.openingStock) * (item.currentRate || item.openingRate)).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Feed - Minimalist */}
                    <div className="glass-panel rounded-[3rem] p-8 border-primary/10 shadow-xl overflow-hidden">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-500" />
                            Live Activity Feed
                        </h3>
                        <div className="space-y-3">
                            {recentVouchers.slice(0, 3).map((v, i) => (
                                <div key={i} className="flex flex-col border-l-2 border-primary/20 pl-3 py-1 hover:border-primary transition-colors cursor-pointer group/feed">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-foreground group-hover/feed:text-primary transition-colors truncate">{v.rows[0]?.account}</span>
                                    <span className="text-[8px] font-bold text-muted-foreground uppercase">{activeCompany?.symbol || '₹'}{v.rows[0]?.type === 'Dr' ? v.rows[0].debit.toLocaleString() : v.rows[0].credit.toLocaleString()} • {v.type}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
