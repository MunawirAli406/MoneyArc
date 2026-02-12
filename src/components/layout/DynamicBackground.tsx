import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { BASE_GRADIENT, BACKGROUNDS } from './backgrounds';

export default function DynamicBackground() {
    const { activeCompany } = usePersistence();
    const type = activeCompany?.businessType || 'General';
    const bgClass = BACKGROUNDS[type] || BACKGROUNDS['General'];

    // Stable particle generation
    const particles = useMemo(() => {
        return [...Array(20)].map(() => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            tx: Math.random() * 100,
            ty: Math.random() * 100,
            duration: 15 + Math.random() * 20,
            opacity: 0.1 + Math.random() * 0.3
        }));
    }, []); // Empty deps ensure this only runs once per mount

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

            {/* Living Data Particles for high-end feel */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                {particles.map((p, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
                        style={{ left: `${p.x}%`, top: `${p.y}%` }}
                        animate={{
                            x: [0, (p.tx - p.x) * 10],
                            y: [0, (p.ty - p.y) * 10],
                            opacity: [p.opacity, p.opacity * 2, p.opacity]
                        }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                ))}
            </div>

            {/* Grain Overlay for high-end texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/p6.png')] blur-[0.5px]" />

            {/* Dark Mode subtle darkening overlay */}
            <div className="absolute inset-0 bg-slate-950/20 pointer-events-none text-google-blue" />
        </div>
    );
}
