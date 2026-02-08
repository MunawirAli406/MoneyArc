import { motion } from 'framer-motion';

interface LogoProps {
    className?: string;
    size?: number;
    showText?: boolean;
}

export default function Logo({ className = "", size = 42, showText = true }: LogoProps) {
    const nodeRadius = 5;
    const bridgeStroke = 3;

    return (
        <div className={`flex items-center gap-4 ${className}`}>
            <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
                {/* Background Ambient Glow */}
                <motion.div
                    className="absolute inset-[-10%] bg-primary/15 blur-2xl rounded-full"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                <motion.div
                    className="relative w-full h-full flex items-center justify-center"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{
                        scale: [1, 1.02, 1],
                        opacity: 1
                    }}
                    whileHover={{ scale: 1.08 }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20
                    }}
                >
                    <svg
                        viewBox="0 0 100 100"
                        className="w-full h-full relative z-10"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* The Nexus Arc (The Bridge) */}
                        <motion.path
                            d="M 20 70 C 20 30 80 30 80 70"
                            stroke="currentColor"
                            className="text-primary/40"
                            strokeWidth={bridgeStroke}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                        />

                        {/* Interconnected Nodes with Pulse Effect */}
                        {[
                            { cx: 20, cy: 70, delay: 0 },
                            { cx: 50, cy: 35, delay: 0.3 },
                            { cx: 80, cy: 70, delay: 0.6 }
                        ].map((node, i) => (
                            <g key={i}>
                                {/* Node Glow */}
                                <motion.circle
                                    cx={node.cx} cy={node.cy} r={nodeRadius * 2.5}
                                    fill="currentColor"
                                    className="text-primary/20"
                                    animate={{
                                        scale: [1, 1.4, 1],
                                        opacity: [0.3, 0.6, 0.3]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: node.delay,
                                        ease: "easeInOut"
                                    }}
                                />
                                {/* Solid Node Core */}
                                <motion.circle
                                    cx={node.cx} cy={node.cy} r={nodeRadius}
                                    fill="white"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: node.delay, type: "spring", stiffness: 300 }}
                                />
                                {/* Teal Accent ring around core */}
                                <circle
                                    cx={node.cx} cy={node.cy} r={nodeRadius + 1}
                                    stroke="currentColor"
                                    className="text-primary"
                                    strokeWidth="1.5"
                                />
                            </g>
                        ))}

                        {/* Connection Lines (Inner Core Bridge) */}
                        <motion.path
                            d="M 20 70 L 50 35 L 80 70"
                            stroke="white"
                            strokeOpacity="0.15"
                            strokeWidth="1.5"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, delay: 0.8 }}
                        />
                    </svg>
                </motion.div>
            </div>

            {showText && (
                <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col justify-center items-center text-center select-none"
                >
                    <div className="text-2xl font-black tracking-tight text-foreground leading-none flex items-baseline justify-center">
                        <span>Money</span>
                        <span className="text-primary ml-0.5">Arc</span>
                    </div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground/50 leading-none mt-2"
                    >
                        Intelligent Wealth
                    </motion.p>
                </motion.div>
            )}
        </div>
    );
}
