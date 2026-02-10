import { motion } from 'framer-motion';

interface GeminiLogoProps {
    size?: number;
    className?: string;
    animate?: boolean;
}

export default function GeminiLogo({ size = 24, className = "", animate = true }: GeminiLogoProps) {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            animate={animate ? {
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
            } : {}}
            transition={animate ? {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
            } : {}}
        >
            <path
                d="M12 2C12 2 12 10 4 12C12 14 12 22 12 22C12 22 12 14 20 12C12 10 12 2 12 2Z"
                fill="url(#gemini-gradient-main)"
            />
            <path
                d="M17 3.5C17 3.5 17 5 15.5 5.5C17 6 17 7.5 17 7.5C17 7.5 17 6 18.5 5.5C17 5 17 3.5 17 3.5Z"
                fill="url(#gemini-gradient-small)"
            />
            <defs>
                <linearGradient id="gemini-gradient-main" x1="4" y1="12" x2="20" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4285F4" />
                    <stop offset="0.5" stopColor="#9B72CB" />
                    <stop offset="1" stopColor="#D96570" />
                </linearGradient>
                <linearGradient id="gemini-gradient-small" x1="15.5" y1="5.5" x2="18.5" y2="5.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4285F4" />
                    <stop offset="1" stopColor="#D96570" />
                </linearGradient>
            </defs>
        </motion.svg>
    );
}
