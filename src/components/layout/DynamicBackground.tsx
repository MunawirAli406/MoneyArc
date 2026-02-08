import { motion, AnimatePresence } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { BASE_GRADIENT, BACKGROUNDS } from './backgrounds';

export default function DynamicBackground() {
    const { activeCompany } = usePersistence();
    const type = activeCompany?.businessType || 'General';
    const bgClass = BACKGROUNDS[type] || BACKGROUNDS['General'];

    return (
        <div className={BASE_GRADIENT}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={type}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className={`absolute inset-0 ${bgClass}`}
                />
            </AnimatePresence>

            {/* Grain Overlay for high-end texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/p6.png')] blur-[0.5px]" />

            {/* Dark Mode subtle darkening overlay */}
            <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
        </div>
    );
}
