import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import GeminiAssistant from '../../features/ai/GeminiAssistant';
import Calculator from '../../features/utilities/Calculator';
import CommandCenter from '../ui/CommandCenter';
import ShortcutHelp from '../ui/ShortcutHelp';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
    const [showGemini, setShowGemini] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);
    const location = useLocation();

    return (
        <div className="min-h-screen mesh-gradient flex transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header
                    onToggleGemini={() => setShowGemini(prev => !prev)}
                    onToggleCalculator={() => setShowCalculator(prev => !prev)}
                />
                <main className="flex-1 overflow-auto px-8 pt-8 pb-24 relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="h-full"
                        >
                            <Outlet context={{ showGemini, showCalculator }} />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
            <GeminiAssistant isOpen={showGemini} onClose={() => setShowGemini(false)} />
            <Calculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
            <CommandCenter />
            <ShortcutHelp />
        </div>
    );
}
