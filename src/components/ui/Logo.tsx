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
                    className="absolute inset-[-10%] bg-google-blue/10 blur-2xl rounded-full"
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.4, 0.2],
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
                    whileHover={{ scale: 1.05 }}
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
                        {/* The Nexus Arc - Google Blue */}
                        <motion.path
                            d="M 20 70 C 20 30 80 30 80 70"
                            stroke="#4285F4"
                            strokeWidth={bridgeStroke}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                        />

                        {/* Interconnected Nodes - Authentic Google Palette */}
                        {[
                            { cx: 20, cy: 70, color: '#EA4335', delay: 0 },   // Red
                            { cx: 50, cy: 35, color: '#FBBC05', delay: 0.3 }, // Yellow
                            { cx: 80, cy: 70, color: '#34A853', delay: 0.6 }  // Green
                        ].map((node, i) => (
                            <g key={i}>
                                <motion.circle
                                    cx={node.cx} cy={node.cy} r={nodeRadius * 2}
                                    fill={node.color}
                                    className="opacity-20"
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        opacity: [0.2, 0.5, 0.2]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: node.delay,
                                        ease: "easeInOut"
                                    }}
                                />
                                <motion.circle
                                    cx={node.cx} cy={node.cy} r={nodeRadius}
                                    fill={node.color}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: node.delay, type: "spring", stiffness: 300 }}
                                />
                                <circle
                                    cx={node.cx} cy={node.cy} r={nodeRadius + 1}
                                    stroke="white"
                                    strokeWidth="1.5"
                                />
                            </g>
                        ))}

                        <motion.path
                            d="M 20 70 L 50 35 L 80 70"
                            stroke="white"
                            strokeOpacity="0.3"
                            strokeWidth="1"
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
                    <div className="text-2xl font-black tracking-tight leading-none text-[#4285F4] flex items-baseline justify-center">
                        <span>M</span>
                        <span>o</span>
                        <span>n</span>
                        <span>e</span>
                        <span>y</span>
                        <span>A</span>
                        <span>r</span>
                        <span>c</span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
