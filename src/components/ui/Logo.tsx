import { motion } from 'framer-motion';

interface LogoProps {
    className?: string;
    size?: number;
    showText?: boolean;
}

export default function Logo({ className = "", size = 40, showText = true }: LogoProps) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <motion.div
                className="relative flex items-center justify-center"
                initial={{ rotate: -10, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                style={{ width: size, height: size }}
            >
                <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Minimalist Arc Path */}
                    <motion.path
                        d="M 25 75 A 35 35 0 1 1 75 75"
                        stroke="hsl(174 100% 33%)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                    />

                    {/* Accenting Dot for "Focus" */}
                    <motion.circle
                        cx="75"
                        cy="75"
                        r="5"
                        fill="hsl(174 100% 33%)"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.4 }}
                    />
                </svg>

                {/* Glow Effect */}
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10 animate-pulse" />
            </motion.div>

            {showText && (
                <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <span className="text-xl font-black tracking-tighter text-foreground">
                        MONEY<span className="text-primary">ARC</span>
                    </span>
                    <p className="text-[8px] font-bold tracking-[0.3em] uppercase text-muted-foreground leading-none -mt-0.5">
                        Enterprise Suite
                    </p>
                </motion.div>
            )}
        </div>
    );
}
