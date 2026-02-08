import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useReportDates } from '../../features/reports/DateContext';
import DatePicker from './DatePicker';

const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const PRESETS = [
    {
        label: 'Today', getValue: () => {
            return [formatDate(new Date()), formatDate(new Date())];
        }
    },
    {
        label: 'Yesterday', getValue: () => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            return [formatDate(yesterday), formatDate(yesterday)];
        }
    },
    {
        label: 'This Month', getValue: () => {
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            return [formatDate(firstDay), formatDate(lastDay)];
        }
    },
    {
        label: 'This FY', getValue: () => {
            const today = new Date();
            const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
            const start = `${year}-04-01`;
            const end = `${year + 1}-03-31`;
            return [start, end];
        }
    },
];

export default function PeriodSelector({ className }: { className?: string }) {
    const { startDate, endDate, selectionType, setStartDate, setEndDate, setSelectionType, setRange } = useReportDates();
    const [isOpen, setIsOpen] = useState(false);

    const handlePresetSelect = (preset: typeof PRESETS[0]) => {
        const [start, end] = preset.getValue();
        setRange(start, end);
        setIsOpen(false);
    };

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatShortDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const displayDate = selectionType === 'Date'
        ? formatDisplayDate(endDate)
        : `${formatShortDate(startDate)} - ${formatDisplayDate(endDate)}`;

    return (
        <div className={clsx("relative", className)}>
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative group cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="relative glass-panel flex items-center gap-3 px-4 py-2 rounded-2xl border border-primary/20 backdrop-blur-2xl shadow-xl transition-all hover:bg-primary/5">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/60 leading-none mb-1">
                            {selectionType}
                        </span>
                        <span className="text-xs font-black text-foreground tabular-nums tracking-tight">
                            {displayDate}
                        </span>
                    </div>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        className="text-muted-foreground/50 group-hover:text-primary transition-colors"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                </div>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-background/5 backdrop-blur-[2px]"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
                            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                            exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
                            className="fixed z-[999] bg-[#09090b] w-[320px] glass-panel rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] border border-primary/20 backdrop-blur-3xl"
                            style={{
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                marginTop: 0
                            }}
                        >
                            {/* Toggle Type */}
                            <div className="p-4 border-b border-primary/10 flex items-center justify-between bg-primary/5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">View Type</span>
                                <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50">
                                    {(['Date', 'Period'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setSelectionType(type)}
                                            className={clsx(
                                                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                                selectionType === type ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-5 space-y-6">
                                {selectionType === 'Period' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            {PRESETS.map((preset) => (
                                                <button
                                                    key={preset.label}
                                                    onClick={() => handlePresetSelect(preset)}
                                                    className="px-3 py-2 text-[10px] font-bold text-left rounded-xl bg-muted/20 hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground uppercase tracking-wider border border-border/50"
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {selectionType === 'Period' && (
                                        <div className="space-y-1.5">
                                            <DatePicker
                                                label="From"
                                                value={startDate}
                                                onChange={setStartDate}
                                            />
                                        </div>
                                    )}
                                    <div className={clsx("space-y-1.5", selectionType === 'Date' && "col-span-2")}>
                                        <DatePicker
                                            label={selectionType === 'Date' ? 'Selected Date' : 'To'}
                                            value={endDate}
                                            onChange={setEndDate}
                                        />
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-full py-3 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
                                    >
                                        Update View
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
