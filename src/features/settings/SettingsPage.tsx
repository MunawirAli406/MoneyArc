import { Moon, Sun, Palette, Bell, Shield } from 'lucide-react';
import { useTheme } from './useTheme';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { motion } from 'framer-motion';

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { provider, activeCompany } = usePersistence();

    const fixData = async () => {
        if (!provider || !activeCompany) return;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ledgers = await provider.read<any[]>('ledgers.json', activeCompany.path) || [];
            const newLedgers = [...ledgers];
            let changed = false;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!newLedgers.find((l: any) => l.name === 'Central GST (CGST)')) {
                newLedgers.push({
                    id: 'cgst-' + Date.now(),
                    name: 'Central GST (CGST)',
                    group: 'Duties & Taxes',
                    balance: 7200,
                    type: 'Dr',
                    isGstEnabled: false
                });
                changed = true;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!newLedgers.find((l: any) => l.name === 'State GST (SGST)')) {
                newLedgers.push({
                    id: 'sgst-' + Date.now(),
                    name: 'State GST (SGST)',
                    group: 'Duties & Taxes',
                    balance: 7200,
                    type: 'Dr',
                    isGstEnabled: false
                });
                changed = true;
            }

            if (changed) {
                await provider.write('ledgers.json', newLedgers, activeCompany.path);
                alert('Fixed! GST Ledgers created. Discrepancy should be gone.');
                window.location.reload();
            } else {
                alert('GST Ledgers already exist. Please check values manually.');
            }
        } catch (e) { console.error(e); alert('Failed to fix: ' + e); }
    };

    const createBasicLedgers = async () => {
        if (!provider || !activeCompany) return;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ledgers = await provider.read<any[]>('ledgers.json', activeCompany.path) || [];
            const newLedgers = [...ledgers];
            let changed = false;

            const defaults = [
                { name: 'Cash', group: 'Cash-in-hand', balance: 0, type: 'Dr' },
                { name: 'Sales Account', group: 'Sales Accounts', balance: 0, type: 'Cr' },
                { name: 'Purchase Account', group: 'Purchase Accounts', balance: 0, type: 'Dr' },
                { name: 'Bank Account', group: 'Bank Accounts', balance: 0, type: 'Dr' },
            ];

            defaults.forEach(def => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (!newLedgers.find((l: any) => l.name.toLowerCase() === def.name.toLowerCase())) {
                    newLedgers.push({
                        id: 'auto-' + Date.now() + Math.random(),
                        name: def.name,
                        group: def.group,
                        balance: def.balance,
                        type: def.type,
                        isGstEnabled: false
                    });
                    changed = true;
                }
            });

            if (changed) {
                await provider.write('ledgers.json', newLedgers, activeCompany.path);
                alert('Success! Basic ledgers created.');
            } else {
                alert('Basic ledgers already exist.');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to create ledgers');
        }
    };

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
                        <select className="bg-background border border-input rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-primary">
                            <option>30 Minutes</option>
                            <option>1 Hour</option>
                            <option>Never</option>
                        </select>
                    )
                }
            ]
        },
        {
            title: 'Data & Troubleshooting',
            description: 'Fix data integrity issues.',
            icon: Shield,
            items: [
                {
                    label: 'Repair GST Ledgers',
                    description: 'Fix the 14,400 difference by creating missing GST ledgers.',
                    content: (
                        <button
                            onClick={fixData}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all"
                        >
                            Fix Difference
                        </button>
                    )
                },
                {
                    label: 'Auto-Create Basic Ledgers',
                    description: 'Create standard ledgers (Cash, Sales, Purchase).',
                    content: (
                        <button
                            onClick={createBasicLedgers}
                            className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all"
                        >
                            Create Defaults
                        </button>
                    )
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
            {/* Header ... */}
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
