import { Bell, Sun, Moon, ChevronDown, LogOut, Calculator, Settings, Building2, Menu, RefreshCcw, HardDrive } from 'lucide-react';
import { useTheme } from '../../features/settings/useTheme';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useAuth } from '../../features/auth/AuthContext.provider';
import { useNotifications } from '../../services/notifications/NotificationContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import GoToSearch from './GoToSearch';
import GeminiLogo from '../ui/GeminiLogo';

interface HeaderProps {
    onToggleGemini: () => void;
    onToggleCalculator: () => void;
    onMenuToggle: () => void;
}

export default function Header({ onToggleGemini, onToggleCalculator, onMenuToggle }: HeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const { activeCompany, selectCompany, storageType, isSyncing, sync } = usePersistence();
    const { notifications, hasUnread, markAsRead, clearAll } = useNotifications();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const navigate = useNavigate();

    const BusinessIcon = Building2;

    const handleSync = async () => {
        if (isSyncing) return;
        await sync();
    };

    return (
        <header className="h-20 bg-card/60 dark:bg-card/60 backdrop-blur-xl border-b border-border/50 dark:border-white/5 px-8 flex items-center justify-between transition-all duration-500 sticky top-0 z-40">
            {/* Google Brand Stripe */}
            <div className="absolute top-0 left-0 right-0 h-1 flex z-50">
                <div className="h-full flex-1 bg-google-blue" />
                <div className="h-full flex-1 bg-google-red" />
                <div className="h-full flex-1 bg-google-yellow" />
                <div className="h-full flex-1 bg-google-green" />
            </div>
            <div className="flex items-center gap-12 flex-1">
                <button
                    onClick={onMenuToggle}
                    className="p-2 -ml-2 mr-2 md:hidden text-muted-foreground hover:text-foreground"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Company Switcher */}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-4 group px-4 py-2 hover:bg-muted/50 dark:hover:bg-white/5 border border-transparent hover:border-border/50 dark:hover:border-white/10 rounded-[2rem] transition-all active:scale-95"
                    >
                        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/5 ring-1 ring-primary/20">
                            <BusinessIcon
                                className="w-6 h-6"
                                style={{ color: activeCompany ? 'hsl(var(--company-primary))' : 'inherit' }}
                            />
                        </div>
                        <div className="text-left hidden sm:block">
                            <div className="flex items-center gap-2">
                                <span className="text-base font-black text-foreground tracking-tight max-w-[200px] truncate leading-none">
                                    {activeCompany?.name || 'MoneyArc'}
                                </span>
                                <ChevronDown className={clsx("w-4 h-4 text-muted-foreground transition-transform duration-500", isMenuOpen && "rotate-180")} />
                            </div>
                            {activeCompany && (
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 bg-muted/40 dark:bg-white/5 px-1.5 py-0.5 rounded-md border border-border/50">
                                        FY {activeCompany.financialYear}
                                    </span>
                                    {activeCompany.gstin && (
                                        <span className="text-[8px] font-black uppercase tracking-widest text-primary/70 bg-primary/5 border border-primary/20 px-1.5 py-0.5 rounded-md">
                                            {activeCompany.gstin}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </button>

                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                            <div className="absolute top-full left-0 mt-4 w-72 bg-card/90 dark:bg-card/90 backdrop-blur-2xl border border-border dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden z-20 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="p-6 bg-primary/5 border-b border-border dark:border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Organization</p>
                                    <p className="text-lg font-black text-foreground truncate">{activeCompany?.name}</p>
                                    <p className="text-xs font-bold text-muted-foreground mt-1 opacity-60">ID: {activeCompany?.id.slice(0, 8)}</p>
                                </div>
                                <div className="p-3">
                                    <button
                                        onClick={() => {
                                            selectCompany(null);
                                            navigate('/select-company');
                                        }}
                                        className="w-full flex items-center gap-4 px-4 py-3 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/5 rounded-2xl transition-all"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Switch Workspace
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <GoToSearch />
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-muted/50 dark:bg-muted/30 p-1.5 rounded-2xl border border-border/50">
                        {storageType === 'github' && (
                            <button
                                onClick={handleSync}
                                disabled={isSyncing}
                                className={clsx(
                                    "p-2.5 rounded-xl transition-all active:scale-90",
                                    isSyncing ? "text-[#4285F4] animate-spin" : "text-muted-foreground hover:text-[#4285F4] hover:bg-[#4285F4]/10"
                                )}
                                title="Sync with GitHub"
                            >
                                <RefreshCcw className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={onToggleCalculator}
                            className="p-2.5 text-[#4285F4] hover:bg-[#4285F4]/10 rounded-xl transition-all active:scale-90"
                            title="Calculator"
                        >
                            <Calculator className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onToggleGemini}
                            className="p-2.5 text-muted-foreground hover:bg-[#4285F4]/10 rounded-xl transition-all active:scale-90"
                            title="AI Assistant"
                        >
                            <GeminiLogo size={20} />
                        </button>
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 text-muted-foreground hover:text-[#FBBC04] hover:bg-[#FBBC04]/10 rounded-xl transition-all active:scale-90"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5 text-[#FBBC04]" /> : <Sun className="w-5 h-5 text-[#FBBC04]" />}
                        </button>
                    </div>

                    <div className="w-px h-8 bg-border dark:bg-white/5 mx-2" />

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => navigate('/settings')}
                            className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/10 rounded-2xl transition-all active:scale-90"
                            title="Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/10 rounded-2xl transition-all active:scale-90 relative"
                                title="Notifications"
                            >
                                <Bell className={clsx("w-5 h-5", isSyncing && "animate-bounce text-primary")} />
                                {(hasUnread || isSyncing) && (
                                    <span className={clsx(
                                        "absolute top-3 right-3 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-card",
                                        isSyncing && "animate-pulse"
                                    )} />
                                )}
                            </button>

                            {isNotificationsOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)} />
                                    <div className="absolute top-full right-0 mt-4 w-80 bg-card/90 dark:bg-card/90 backdrop-blur-2xl border border-border dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden z-20 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="p-5 border-b border-border dark:border-white/5 flex justify-between items-center bg-primary/5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Notifications</p>
                                            {notifications.length > 0 && (
                                                <button
                                                    onClick={() => {
                                                        clearAll();
                                                        setIsNotificationsOpen(false);
                                                    }}
                                                    className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground hover:text-rose-500 transition-colors"
                                                >
                                                    Clear All
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto overflow-x-hidden thin-scrollbar">
                                            {notifications.length === 0 ? (
                                                <div className="p-10 text-center">
                                                    <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                                                        <Bell className="w-6 h-6 text-muted-foreground/40" />
                                                    </div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">No new alerts</p>
                                                </div>
                                            ) : (
                                                <div className="p-2 space-y-1">
                                                    {notifications.map((n) => (
                                                        <button
                                                            key={n.id}
                                                            onClick={() => {
                                                                markAsRead(n.id);
                                                                // Potentially navigate or open detail
                                                            }}
                                                            className={clsx(
                                                                "w-full text-left p-4 rounded-2xl transition-all group relative overflow-hidden",
                                                                !n.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                                                            )}
                                                        >
                                                            {!n.read && (
                                                                <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-primary" />
                                                            )}
                                                            <p className={clsx(
                                                                "text-[10px] font-black uppercase tracking-tight mb-1",
                                                                n.type === 'error' ? 'text-rose-500' :
                                                                    n.type === 'warning' ? 'text-amber-500' :
                                                                        n.type === 'success' ? 'text-emerald-500' : 'text-primary'
                                                            )}>
                                                                {n.title}
                                                            </p>
                                                            <p className="text-xs font-bold text-foreground leading-snug mb-2">{n.message}</p>
                                                            <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
                                                                {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="w-px h-8 bg-border dark:bg-white/5 mx-2" />

                    {/* Profile Section */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-3 p-1 pr-3 rounded-[2rem] hover:bg-muted/50 dark:hover:bg-white/5 border border-transparent hover:border-border/50 transition-all active:scale-95"
                        >
                            <div className={clsx(
                                "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500",
                                (user?.provider === 'Google' || user?.provider === 'Microsoft') ? "bg-white" : "primary-gradient text-white"
                            )}>
                                {user?.provider === 'Google' ? (
                                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                        <path fill="none" d="M0 0h48v48H0z" />
                                    </svg>
                                ) : user?.provider === 'Microsoft' ? (
                                    <svg className="w-5 h-5" viewBox="0 0 23 23">
                                        <path fill="#00a1f1" d="M12 0h11v11H12z" />
                                        <path fill="#f25022" d="M0 11h11v11H0z" />
                                        <path fill="#7fb900" d="M12 11h11v11H12z" />
                                        <path fill="#ffb900" d="M0 0h11v11H0z" />
                                    </svg>
                                ) : (
                                    user?.name?.[0] || user?.email?.[0] || 'U'
                                )}
                            </div>
                            <div className="text-left hidden lg:block">
                                <p className="text-xs font-black text-foreground truncate max-w-[100px]">{user?.name || 'User'}</p>
                                <p className="text-[9px] font-bold text-muted-foreground truncate max-w-[100px] opacity-60">Account</p>
                            </div>
                            <ChevronDown className={clsx("w-3.5 h-3.5 text-muted-foreground transition-transform duration-500", isProfileOpen && "rotate-180")} />
                        </button>

                        {isProfileOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                                <div className="absolute top-full right-0 mt-4 w-64 bg-card/90 dark:bg-card/90 backdrop-blur-2xl border border-border dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden z-20 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="p-6 bg-primary/5 border-b border-border dark:border-white/5">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className={clsx(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shadow-lg",
                                                (user?.provider === 'Google' || user?.provider === 'Microsoft') ? "bg-white" : "primary-gradient text-white"
                                            )}>
                                                {user?.provider === 'Google' ? (
                                                    <svg className="w-6 h-6" viewBox="0 0 48 48">
                                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
                                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                                        <path fill="none" d="M0 0h48v48H0z" />
                                                    </svg>
                                                ) : user?.provider === 'Microsoft' ? (
                                                    <svg className="w-6 h-6" viewBox="0 0 23 23">
                                                        <path fill="#00a1f1" d="M12 0h11v11H12z" />
                                                        <path fill="#f25022" d="M0 11h11v11H0z" />
                                                        <path fill="#7fb900" d="M12 11h11v11H12z" />
                                                        <path fill="#ffb900" d="M0 0h11v11H0z" />
                                                    </svg>
                                                ) : (
                                                    user?.name?.[0] || user?.email?.[0] || 'U'
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-foreground truncate">{user?.name || 'User'}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground truncate opacity-60">{user?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-background/50 rounded-xl border border-border/50">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Active Session</span>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <button
                                            onClick={() => {
                                                setIsProfileOpen(false);
                                                navigate('/settings');
                                            }}
                                            className="w-full flex items-center gap-4 px-4 py-3 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/5 rounded-2xl transition-all"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Security Settings
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsProfileOpen(false);
                                                navigate('/select-source');
                                            }}
                                            className="w-full flex items-center gap-4 px-4 py-3 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/5 rounded-2xl transition-all"
                                        >
                                            <HardDrive className="w-4 h-4" />
                                            Change Data Source
                                        </button>
                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsProfileOpen(false);
                                            }}
                                            className="w-full flex items-center gap-4 px-4 py-3 text-sm font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-2xl transition-all"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header >
    );
}
