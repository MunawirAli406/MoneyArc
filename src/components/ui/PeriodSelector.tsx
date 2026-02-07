import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface PeriodSelectorProps {
    startDate: string;
    endDate: string;
    onChange: (start: string, end: string) => void;
    className?: string;
}

const PRESETS = [
    {
        label: 'Today', getValue: () => {
            const today = new Date().toISOString().split('T')[0];
            return [today, today];
        }
    },
    {
        label: 'Yesterday', getValue: () => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const yStr = yesterday.toISOString().split('T')[0];
            return [yStr, yStr];
        }
    },
    {
        label: 'This Month', getValue: () => {
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
            return [firstDay, lastDay];
        }
    },
    {
        label: 'Last Month', getValue: () => {
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
            const lastDay = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
            return [firstDay, lastDay];
        }
    },
    {
        label: 'This Financial Year', getValue: () => {
            const today = new Date();
            const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
            const start = `${year}-04-01`;
            const end = `${year + 1}-03-31`;
            return [start, end];
        }
    },
];

export default function PeriodSelector({ startDate, endDate, onChange, className }: PeriodSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handlePresetSelect = (preset: typeof PRESETS[0]) => {
        const [start, end] = preset.getValue();
        onChange(start, end);
        setIsOpen(false);
    };

    return (
        <div className={clsx("relative", className)}>
            <div
                className="glass-panel flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors border border-border/50 shadow-sm"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                    <Calendar className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Period</span>
                    <span className="text-sm font-bold text-foreground">
                        {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                    </span>
                </div>
                <ChevronDown className={clsx("w-4 h-4 text-muted-foreground transition-transform ml-2", isOpen && "rotate-180")} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute z-50 top-full mt-2 right-0 w-[320px] glass-card rounded-2xl shadow-xl overflow-hidden border border-white/10 bg-card/95 backdrop-blur-xl"
                        >
                            <div className="p-4 grid grid-cols-2 gap-2 border-b border-border/50">
                                {PRESETS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => handlePresetSelect(preset)}
                                        className="px-3 py-2 text-[11px] font-bold text-left rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground uppercase tracking-wide border border-transparent hover:border-primary/20"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                            <div className="p-4 space-y-4 bg-muted/20">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground ml-1">From</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => onChange(e.target.value, endDate)}
                                            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] uppercase font-black tracking-widest text-muted-foreground ml-1">To</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => onChange(startDate, e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-full py-2 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
                                >
                                    Apply Range
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
