import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, FileText, Wallet, TrendingUp, Layers, Hotel, Car, Shirt, Utensils, GraduationCap, HeartPulse, Building2, Activity } from 'lucide-react';
import clsx from 'clsx';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useAuth } from '../../features/auth/AuthContext.provider';
import Logo from '../ui/Logo';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Wallet, label: 'Vouchers', path: '/vouchers/new' },
    { icon: BookOpen, label: 'Ledgers', path: '/ledgers' },
    { icon: BookOpen, label: 'Trial Balance', path: '/reports/trial-balance' },
    { icon: BookOpen, label: 'Daybook', path: '/reports/daybook' },
    { icon: FileText, label: 'Balance Sheet', path: '/reports/balance-sheet' },
    { icon: TrendingUp, label: 'Profit & Loss', path: '/reports/profit-loss' },
    { icon: FileText, label: 'GST Reports', path: '/reports/gst' },
    { icon: Wallet, label: 'Cash Flow', path: '/reports/cash-flow' },
    { icon: TrendingUp, label: 'Fund Flow', path: '/reports/fund-flow' },
    { icon: Layers, label: 'Inventory Master', path: '/inventory/master' },
    { icon: TrendingUp, label: 'Stock Summary', path: '/reports/stock-summary' },
    { icon: Activity, label: 'Ratio Analysis', path: '/reports/ratios' },
    { icon: FileText, label: 'Audit Trail', path: '/security/audit' },
];

interface SidebarProps {
    onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
    const location = useLocation();
    const { activeCompany } = usePersistence();
    const { } = useAuth();

    const ICON_MAP: Record<string, any> = { Hotel, Car, Shirt, Utensils, GraduationCap, HeartPulse, Building2 };
    const BusinessIcon = activeCompany?.businessType ? (ICON_MAP[activeCompany.businessType] || Building2) : Building2;

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
                            style={{ color: 'grid-cols-1' in (activeCompany || {}) ? 'inherit' : 'hsl(var(--company-primary))' }}
                        />
                        <span className="truncate">{activeCompany.name}</span>
                    </div>
                ) : (
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">No Selection</div>
                )}
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={clsx(
                                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                                isActive
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )}
                        >
                            <item.icon className={clsx('w-5 h-5 transition-transform group-hover:scale-110', isActive ? 'text-primary-foreground' : 'text-primary')} />
                            <span className="font-semibold text-sm">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

        </div>
    );
}
