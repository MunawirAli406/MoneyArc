import { Moon, Sun, Palette, Bell, Shield, Info, Clock } from 'lucide-react';
import { useTheme } from './useTheme';
import { motion } from 'framer-motion';
import Select from '../../components/ui/Select';
import { useState } from 'react';

export default function SettingsPage() {
    const { setTheme, theme } = useTheme();
    const [sessionTimeout, setSessionTimeout] = useState('30m');

    const sections = [
        {
            title: 'Appearance',
            description: 'Customize how MoneyArc looks on your screen.',
            icon: Palette,
            items: [
                {
                    label: 'Theme Mode',
                    description: 'Switch between light and dark themes.',
                    content: (
                        <div className="flex p-1 bg-muted rounded-xl gap-1">
                            {[
                                { id: 'light', icon: Sun, label: 'Light' },
                                { id: 'dark', icon: Moon, label: 'Dark' },
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setTheme(mode.id as 'light' | 'dark')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${theme === mode.id
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <mode.icon className="w-4 h-4" />
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    )
                }
            ]
        },
        {
            title: 'Notifications',
            description: 'Manage your alerts and updates.',
            icon: Bell,
            items: [
                {
                    label: 'Desktop Notifications',
                    description: 'Receive alerts even when the app is in background.',
                    content: (
                        <div className="w-12 h-6 bg-primary/20 rounded-full relative cursor-not-allowed">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-primary rounded-full" />
                        </div>
                    )
                }
            ]
        },
        {
            title: 'Security',
            description: 'Protect your accounting data.',
            icon: Shield,
            items: [
                {
                    label: 'Session Timeout',
                    description: 'Automatically log out after inactivity.',
                    content: (
                        <Select
                            value={sessionTimeout}
                            onChange={setSessionTimeout}
                            options={[
                                { value: '30m', label: '30 Minutes', icon: Clock, description: 'Standard security' },
                                { value: '1h', label: '1 Hour', icon: Clock, description: 'Flexible focus' },
                                { value: 'never', label: 'Never', icon: Shield, description: 'High risk' },
                            ]}
                            className="w-48"
                        />
                    )
                }
            ]
        },
        {
            title: 'About',
            description: 'Application details.',
            icon: Info,
            items: [
                {
                    label: 'Developer',
                    description: 'Created by',
                    content: <span className="font-medium">Munawir Ali V K</span>
                },
                {
                    label: 'Version',
                    description: 'Current build',
                    content: <span className="font-mono text-sm bg-muted px-2 py-1 rounded">0.0.01</span>
                }
            ]
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8 pb-12"
        >
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your application preferences and account settings.</p>
            </div>

            <div className="space-y-6">
                {sections.map((section, idx) => (
                    <div key={idx} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-border bg-muted/30 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <section.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">{section.title}</h2>
                                <p className="text-sm text-muted-foreground">{section.description}</p>
                            </div>
                        </div>
                        <div className="p-6 divide-y divide-border">
                            {section.items.map((item, itemIdx) => (
                                <div key={itemIdx} className="py-6 first:pt-0 last:pb-0 flex items-center justify-between gap-8">
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{item.label}</h3>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {item.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
