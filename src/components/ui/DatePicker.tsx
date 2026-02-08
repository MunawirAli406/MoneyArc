import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import clsx from 'clsx';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    label?: string;
    className?: string; // Allow external styling
}

export default function DatePicker({ value, onChange, label, className }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial date setup: parse value or use today
    const getInitialDate = () => {
        if (!value) return new Date();
        const [y, m, d] = value.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const [viewDate, setViewDate] = useState(getInitialDate); // Date for month/year navigation

    // Sync viewDate when value changes externally
    useEffect(() => {
        if (value) {
            const [y, m, d] = value.split('-').map(Number);
            setViewDate(new Date(y, m - 1, d));
        }
    }, [value]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handleDateSelect = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const y = newDate.getFullYear();
        const m = String(newDate.getMonth() + 1).padStart(2, '0');
        const d = String(newDate.getDate()).padStart(2, '0');
        onChange(`${y}-${m}-${d}`);
        setIsOpen(false);
    };

    const changeMonth = (offset: number) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    };

    const changeYear = (offset: number) => {
        setViewDate(new Date(viewDate.getFullYear() + offset, viewDate.getMonth(), 1));
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const days = daysInMonth(year, month);
        const firstDay = firstDayOfMonth(year, month);
        const blanks = Array(firstDay).fill(null);
        const dayArray = Array.from({ length: days }, (_, i) => i + 1);

        const currentDateObj = getInitialDate();

        return (
            <div className="p-4 w-[280px]">
                {/* Header: Month/Year Navigation */}
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-muted rounded-full transition-colors" title="Previous Month">
                        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="font-bold text-sm text-foreground">{monthNames[month]}</span>
                        {/* Year Navigation (Small buttons next to year) */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <button onClick={() => changeYear(-1)} className="hover:text-primary transition-colors">{'<'}</button>
                            <span>{year}</span>
                            <button onClick={() => changeYear(1)} className="hover:text-primary transition-colors">{'>'}</button>
                        </div>
                    </div>
                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-muted rounded-full transition-colors" title="Next Month">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Day Names */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase">{d}</div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                    {dayArray.map(day => {
                        const isSelected = value &&
                            currentDateObj.getDate() === day &&
                            currentDateObj.getMonth() === month &&
                            currentDateObj.getFullYear() === year;

                        const isToday = new Date().getDate() === day &&
                            new Date().getMonth() === month &&
                            new Date().getFullYear() === year;

                        return (
                            <button
                                key={day}
                                onClick={() => handleDateSelect(day)}
                                className={clsx(
                                    "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all relative",
                                    isSelected
                                        ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 scale-105"
                                        : "hover:bg-muted text-foreground hover:scale-105",
                                    !isSelected && isToday && "bg-primary/5 text-primary font-bold border border-primary/20"
                                )}
                            >
                                {day}
                                {/* Dot for today if not selected */}
                                {!isSelected && isToday && (
                                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-primary" />
                                )}
                            </button>
                        );
                    })}
                </div>
                {/* Footer: Today Button */}
                <div className="mt-3 pt-3 border-t border-border/50 flex justify-center">
                    <button
                        onClick={() => {
                            const today = new Date();
                            const y = today.getFullYear();
                            const m = String(today.getMonth() + 1).padStart(2, '0');
                            const d = String(today.getDate()).padStart(2, '0');
                            onChange(`${y}-${m}-${d}`);
                            setIsOpen(false);
                        }}
                        className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                    >
                        Today
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className={clsx("relative", className)} ref={containerRef}>
            {label && <label className="text-[8px] uppercase font-black tracking-widest text-muted-foreground ml-1 mb-1.5 block">{label}</label>}
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer group w-full">
                <div className={clsx(
                    "flex items-center gap-2 bg-background/50 border border-primary/10 rounded-xl px-3 py-2 transition-all w-full",
                    isOpen ? "ring-2 ring-primary/20 bg-background" : "hover:bg-primary/5 hover:border-primary/20"
                )}>
                    <Calendar className={clsx("w-4 h-4 transition-colors", isOpen ? "text-primary" : "text-primary/60 group-hover:text-primary")} />
                    <span className="text-[10px] font-black text-foreground tabular-nums flex-1">
                        {value ? new Date(getInitialDate()).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select Date'}
                    </span>
                    <ChevronLeft className={clsx("w-3 h-3 text-muted-foreground transition-transform rotate-[-90deg]", isOpen && "rotate-[90deg]")} />
                </div>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute z-[9999] mt-2 top-full left-0 glass-panel bg-[#09090b] border border-primary/20 rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        {renderCalendar()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
