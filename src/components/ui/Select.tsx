import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Option {
    value: string;
    label: string;
    icon?: any;
    description?: string;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    label?: string;
    className?: string;
    disabled?: boolean;
}

export default function Select({ value, onChange, options, placeholder = "Select an option", label, className = "", disabled = false }: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(o => o.value === value);

    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            window.addEventListener('scroll', updateCoords);
            window.addEventListener('resize', updateCoords);
        }
        return () => {
            window.removeEventListener('scroll', updateCoords);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className={`relative ${className}`}>
            {label && (
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">
                    {label}
                </label>
            )}

            <div
                ref={triggerRef}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-all cursor-pointer bg-card
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 hover:shadow-md'}
                    ${isOpen ? 'border-primary ring-4 ring-primary/10 shadow-lg' : 'border-border shadow-sm'}
                `}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {selectedOption?.icon && <selectedOption.icon className="w-4 h-4 text-primary" />}
                    <span className={`text-sm font-bold truncate ${!selectedOption ? 'text-muted-foreground/50' : 'text-foreground'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            style={{
                                position: 'absolute',
                                top: coords.top,
                                left: coords.left,
                                width: coords.width,
                                zIndex: 9999
                            }}
                            className="bg-card/90 backdrop-blur-2xl border border-border/50 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden p-1"
                        >
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                {options.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={`
                                            w-full flex flex-col items-start gap-1 p-3 rounded-xl transition-all text-left group
                                            ${value === option.value
                                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                : 'hover:bg-primary/5'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-3">
                                                {option.icon && <option.icon className={`w-4 h-4 ${value === option.value ? 'text-white' : 'text-primary group-hover:scale-110 transition-transform'}`} />}
                                                <span className="text-sm font-black tracking-tight">{option.label}</span>
                                            </div>
                                            {value === option.value && <Check className="w-4 h-4" />}
                                        </div>
                                        {option.description && (
                                            <p className={`text-[10px] font-bold uppercase tracking-wider ${value === option.value ? 'text-white/70' : 'text-muted-foreground group-hover:text-primary/70'}`}>
                                                {option.description}
                                            </p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
