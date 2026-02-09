import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Delete, Eraser, Calculator as CalcIcon } from 'lucide-react';

interface CalculatorProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Calculator({ isOpen, onClose }: CalculatorProps) {
    const [display, setDisplay] = useState('0');
    const [equation, setEquation] = useState('');
    const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

    const handleNumberCp = (num: string) => {
        if (display === '0' || shouldResetDisplay) {
            setDisplay(num);
            setShouldResetDisplay(false);
        } else {
            setDisplay(display + num);
        }
    };

    const handleOperator = (op: string) => {
        setShouldResetDisplay(true);
        setEquation(display + ' ' + op + ' ');
    };

    const handleEqual = () => {
        try {
            // eslint-disable-next-line no-eval
            const result = eval(equation + display);
            setDisplay(String(result));
            setEquation('');
            setShouldResetDisplay(true);
        } catch (error) {
            setDisplay('Error');
            setShouldResetDisplay(true);
            setEquation('');
        }
    };

    const handleClear = () => {
        setDisplay('0');
        setEquation('');
        setShouldResetDisplay(false);
    };

    const handleBackspace = () => {
        if (display.length === 1) {
            setDisplay('0');
        } else {
            setDisplay(display.slice(0, -1));
        }
    };

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key >= '0' && e.key <= '9') handleNumberCp(e.key);
            if (['+', '-', '*', '/'].includes(e.key)) handleOperator(e.key);
            if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); handleEqual(); }
            if (e.key === 'Escape') onClose();
            if (e.key === 'Backspace') handleBackspace();
            if (e.key === 'c' || e.key === 'C') handleClear();
            if (e.key === '.') handleNumberCp('.');
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, display, equation]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="fixed bottom-24 right-20 z-50 w-72 bg-card border border-border shadow-2xl rounded-3xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-muted/50 p-3 flex items-center justify-between border-b border-border">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-[#4285F4]/10 rounded-lg text-[#4285F4]">
                                <CalcIcon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">Calculator</span>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-muted-foreground/10 rounded-full transition-colors">
                            <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Display */}
                    <div className="p-4 bg-background/50">
                        <div className="h-6 text-xs text-right text-muted-foreground font-mono mb-1">{equation}</div>
                        <div className="text-3xl font-bold text-right tracking-tight truncate">{display}</div>
                    </div>

                    {/* Keypad */}
                    <div className="p-3 grid grid-cols-4 gap-2 bg-muted/20">
                        {[
                            { label: 'C', act: handleClear, style: 'text-[#EA4335] bg-[#EA4335]/10' },
                            { label: <Eraser className="w-4 h-4" />, act: handleClear, style: 'text-[#4285F4] bg-[#4285F4]/10' }, // Just using logic for UI balance
                            { label: <Delete className="w-4 h-4" />, act: handleBackspace, style: 'text-[#4285F4] bg-[#4285F4]/10' },
                            { label: '÷', act: () => handleOperator('/'), style: 'bg-[#4285F4] text-white' },

                            { label: '7', act: () => handleNumberCp('7') },
                            { label: '8', act: () => handleNumberCp('8') },
                            { label: '9', act: () => handleNumberCp('9') },
                            { label: '×', act: () => handleOperator('*'), style: 'bg-[#4285F4] text-white' },

                            { label: '4', act: () => handleNumberCp('4') },
                            { label: '5', act: () => handleNumberCp('5') },
                            { label: '6', act: () => handleNumberCp('6') },
                            { label: '-', act: () => handleOperator('-'), style: 'bg-[#4285F4] text-white' },

                            { label: '1', act: () => handleNumberCp('1') },
                            { label: '2', act: () => handleNumberCp('2') },
                            { label: '3', act: () => handleNumberCp('3') },
                            { label: '+', act: () => handleOperator('+'), style: 'bg-[#4285F4] text-white' },

                            { label: '0', act: () => handleNumberCp('0'), span: 'col-span-2' },
                            { label: '.', act: () => handleNumberCp('.') },
                            { label: '=', act: handleEqual, style: 'bg-[#4285F4] text-white' },
                        ].map((btn: any, i) => (
                            <button
                                key={i}
                                onClick={btn.act}
                                className={`
                                    h-12 rounded-xl font-bold text-lg flex items-center justify-center transition-all active:scale-95
                                    ${btn.style || 'bg-card hover:bg-muted border border-border/50'}
                                    ${btn.span || ''}
                                `}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
