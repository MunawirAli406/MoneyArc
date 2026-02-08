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
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();

    return (
        <div className="min-h-screen mesh-gradient flex transition-colors duration-300">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-screen sticky top-0">
                <Sidebar />
            </div>

            {/* Mobile Sidebar Drawer */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="fixed inset-y-0 left-0 z-50 md:hidden w-64 shadow-2xl"
                        >
                            <Sidebar onClose={() => setIsMobileOpen(false)} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <Header
                    onToggleGemini={() => setShowGemini(prev => !prev)}
                    onToggleCalculator={() => setShowCalculator(prev => !prev)}
                    onMenuToggle={() => setIsMobileOpen(true)}
                />
                <main className="flex-1 overflow-auto px-4 md:px-8 pt-6 pb-24 relative">
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
