import { Bell, Sun, Moon, Building2, ChevronDown, LogOut, Sparkles, Calculator } from 'lucide-react';
import { useTheme } from '../../features/settings/useTheme';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import GoToSearch from './GoToSearch';

interface HeaderProps {
    onToggleGemini: () => void;
    onToggleCalculator: () => void;
}

export default function Header({ onToggleGemini, onToggleCalculator }: HeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const { activeCompany, selectCompany } = usePersistence();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between transition-colors duration-300 sticky top-0 z-40">
            <div className="flex items-center gap-8 flex-1">
                {/* Company Switcher */}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-3 group px-3 py-1.5 hover:bg-muted rounded-xl transition-all"
                    >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Active Arc</p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-foreground tracking-tight max-w-[150px] truncate">
                                    {activeCompany?.name || 'Select Company'}
                                </span>
                                <ChevronDown className={clsx("w-4 h-4 text-muted-foreground transition-transform", isMenuOpen && "rotate-180")} />
                            </div>
                        </div>
                    </button>

                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                            <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 bg-muted/30 border-b border-border">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Organization</p>
                                    <p className="text-sm font-bold text-foreground truncate">{activeCompany?.name}</p>
                                    <p className="text-[10px] font-medium text-muted-foreground mt-0.5">GST: {activeCompany?.gstin || 'Not Registered'}</p>
                                </div>
                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            selectCompany(null);
                                            navigate('/select-company');
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Switch Company
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <GoToSearch />
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onToggleCalculator}
                    className="p-2.5 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 rounded-xl transition-all active:scale-90"
                    title="Calculator"
                >
                    <Calculator className="w-5 h-5" />
                </button>
                <button
                    onClick={onToggleGemini}
                    className="p-2.5 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all active:scale-90"
                    title="MoneyArc AI Assistant"
                >
                    <Sparkles className="w-5 h-5" />
                </button>
                <button
                    onClick={toggleTheme}
                    className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all active:scale-90"
                >
                    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
                <div className="w-px h-6 bg-border mx-1" />
                <button className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all active:scale-90">
                    <Bell className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
