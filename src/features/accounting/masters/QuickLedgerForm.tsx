import { useState } from 'react';
import { X } from 'lucide-react';
import { usePersistence } from '../../../services/persistence/PersistenceContext';
import { motion } from 'framer-motion';
import type { Ledger } from '../../../services/accounting/ReportService';

const GROUPS = [
    'Bank Accounts', 'Cash-in-hand', 'Sundry Debtors', 'Sundry Creditors',
    'Sales Accounts', 'Purchase Accounts', 'Direct Expenses', 'Indirect Expenses',
    'Fixed Assets', 'Duties & Taxes', 'Loans (Liability)', 'Direct Incomes', 'Indirect Incomes',
    'Capital Account', 'Stock-in-hand', 'Current Assets', 'Current Liabilities',
    'Loans & Advances (Asset)', 'Reserves & Surplus'
];

interface QuickLedgerFormProps {
    onClose: () => void;
    onSuccess: (newLedgerName: string) => void;
    initialName?: string;
}

export default function QuickLedgerForm({ onClose, onSuccess, initialName = '' }: QuickLedgerFormProps) {
    const { provider, activeCompany } = usePersistence();
    const [name, setName] = useState(initialName);
    const [group, setGroup] = useState('');
    const [opBalance, setOpBalance] = useState('');
    const [balanceType, setBalanceType] = useState('Dr');

    const handleSave = async () => {
        if (!provider || !activeCompany || !name || !group) return;

        try {
            const ledgers = await provider.read<Ledger[]>('ledgers.json', activeCompany.path) || [];

            if (ledgers.find(l => l.name.toLowerCase() === name.toLowerCase())) {
                alert('Ledger already exists!');
                return;
            }

            const newLedger: Ledger = {
                id: Date.now().toString(),
                name,
                group,
                balance: parseFloat(opBalance) || 0,
                type: balanceType as 'Dr' | 'Cr',
                isGstEnabled: false
            };

            await provider.write('ledgers.json', [...ledgers, newLedger], activeCompany.path);
            onSuccess(name);
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to save ledger');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden"
            >
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                    <h3 className="font-bold text-lg uppercase tracking-tight">Quick Create Ledger</h3>
                    <button onClick={onClose} className="p-1 hover:bg-rose-500/10 hover:text-rose-500 rounded"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Name</label>
                        <input
                            autoFocus
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg font-bold"
                            placeholder="Ledger Name"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Under Group</label>
                        <select
                            value={group}
                            onChange={e => setGroup(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg font-bold"
                        >
                            <option value="">Select Group...</option>
                            {GROUPS.sort().map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Opening Balance</label>
                            <input
                                type="number"
                                value={opBalance}
                                onChange={e => setOpBalance(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg font-bold"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</label>
                            <select
                                value={balanceType}
                                onChange={e => setBalanceType(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg font-bold"
                            >
                                <option value="Dr">Dr</option>
                                <option value="Cr">Cr</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-muted/20 border-t border-border flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase tracking-widest">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
                        Create
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
