import { Bell, Search, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../features/settings/ThemeContext';

export default function Header() {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between transition-colors duration-300">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={toggleTheme}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                >
                    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
                <div className="w-px h-6 bg-border mx-1" />
                <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
                    <Bell className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
