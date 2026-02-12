import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, FileText, Wallet, TrendingUp, Layers, Building2, Activity, Shield, Database, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useAuth } from '../../features/auth/AuthContext.provider';
import Logo from '../ui/Logo';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', color: 'text-google-blue' },
    { icon: Wallet, label: 'Vouchers', path: '/vouchers/new', color: 'text-amber-500' },
    { icon: BookOpen, label: 'Ledgers', path: '/ledgers', color: 'text-google-green' },
    { icon: BookOpen, label: 'Trial Balance', path: '/reports/trial-balance', color: 'text-violet-500' },
    { icon: BookOpen, label: 'Daybook', path: '/reports/daybook', color: 'text-rose-500' },
    { icon: FileText, label: 'Balance Sheet', path: '/reports/balance-sheet', color: 'text-google-blue' },
    { icon: TrendingUp, label: 'Profit & Loss', path: '/reports/profit-loss', color: 'text-google-green' },
    { icon: FileText, label: 'GST Reports', path: '/reports/gst', color: 'text-rose-500' },
    { icon: Wallet, label: 'Cash Flow', path: '/reports/cash-flow', color: 'text-amber-500' },
    { icon: TrendingUp, label: 'Fund Flow', path: '/reports/fund-flow', color: 'text-violet-500' },
    { icon: Layers, label: 'Inventory Master', path: '/inventory/master', color: 'text-google-blue' },
    { icon: Activity, label: 'Stock Summary', path: '/reports/stock-summary', color: 'text-google-green' },
    { icon: Activity, label: 'Ratio Analysis', path: '/reports/ratios', color: 'text-rose-500' },
    { icon: Shield, label: 'Security Center', path: '/security', color: 'text-amber-500' },
    { icon: Database, label: 'Data Portability', path: '/utility/portability', color: 'text-google-blue' },
];

interface SidebarProps {
    onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
    const location = useLocation();
    const { activeCompany } = usePersistence();
    useAuth(); // Removed empty destructuring to fix lint

    const BusinessIcon = Building2;

    return (
        <div className="w-64 h-full bg-card border-r border-border flex flex-col transition-colors duration-300 flex-shrink-0">
            <div className="h-24 flex flex-col justify-center px-6 border-b border-border bg-muted/20">
                <div className="mb-2">
                    <Logo size={32} />
                </div>
                {activeCompany ? (
                    <div className="flex items-center gap-2 text-[9px] text-primary font-black bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full w-fit max-w-full uppercase tracking-widest shadow-sm">
                        <BusinessIcon
                            className="w-3 h-3 flex-shrink-0"
                            style={{ color: 'hsl(var(--primary))' }}
                        />
                        <span className="truncate">{activeCompany.name}</span>
                    </div>
                ) : (
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">No Selection</div>
                )}
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                {navItems.map((item, idx) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <motion.div
                            key={item.path}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                        >
                            <Link
                                to={item.path}
                                onClick={onClose}
                                className={clsx(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden',
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 bg-primary z-0"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <item.icon className={clsx('w-5 h-5 transition-transform group-hover:scale-110 relative z-10', isActive ? 'text-primary-foreground' : item.color)} />
                                <span className="font-black text-sm relative z-10 tracking-tight uppercase tracking-[0.05em]">{item.label}</span>
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="ml-auto w-1.5 h-1.5 bg-white rounded-full relative z-10 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                                    />
                                )}
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border bg-muted/10">
                <div className="flex items-center gap-3 px-4 py-3 bg-google-green/5 border border-google-green/10 rounded-2xl group cursor-help transition-all hover:bg-google-green/10">
                    <div className="relative">
                        <Shield className="w-4 h-4 text-google-green" />
                        <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-google-green rounded-full"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-google-green">Secure Node</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest truncate">System Integrity: 100%</p>
                    </div>
                    <Lock className="w-3 h-3 text-muted-foreground/30" />
                </div>
            </div>

        </div >
    );
}
