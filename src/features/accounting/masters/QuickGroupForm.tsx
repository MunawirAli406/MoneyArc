import { useState } from 'react';
import { X } from 'lucide-react';
import { usePersistence } from '../../../services/persistence/PersistenceContext';
import { motion } from 'framer-motion';
import { ACCT_GROUPS, AccountGroupManager } from '../../../services/accounting/ReportService';

interface QuickGroupFormProps {
    onClose: () => void;
    onSuccess: (newGroupName: string) => void;
    initialName?: string;
}

export interface CustomGroup {
    id: string;
    name: string;
    parentType: keyof typeof ACCT_GROUPS; // 'ASSETS' | 'LIABILITIES' | 'INCOME' | 'EXPENSES'
}

export default function QuickGroupForm({ onClose, onSuccess, initialName = '' }: QuickGroupFormProps) {
    const { provider, activeCompany } = usePersistence();
    const [name, setName] = useState(initialName);
    const [parentType, setParentType] = useState<keyof typeof ACCT_GROUPS>('EXPENSES');

    const handleSave = async () => {
        if (!provider || !activeCompany || !name) return;

        try {
            const customGroups = await provider.read<CustomGroup[]>('custom_groups.json', activeCompany.path) || [];

            // Check formatted system groups
            const allGroups = [
                ...AccountGroupManager.getGroups('ASSETS'),
                ...AccountGroupManager.getGroups('LIABILITIES'),
                ...AccountGroupManager.getGroups('INCOME'),
                ...AccountGroupManager.getGroups('EXPENSES')
            ];

            if (allGroups.includes(name) || customGroups.find(g => g.name.toLowerCase() === name.toLowerCase())) {
                alert('Group already exists!');
                return;
            }

            const newGroup: CustomGroup = {
                id: Date.now().toString(),
                name,
                parentType
            };

            await provider.write('custom_groups.json', [...customGroups, newGroup], activeCompany.path);

            // Also update runtime manager
            AccountGroupManager.registerGroup(name, parentType);

            onSuccess(name);
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to save group');
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
                    <h3 className="font-bold text-lg uppercase tracking-tight">Quick Create Group</h3>
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
                            placeholder="Group Name"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nature of Group</label>
                        <select
                            value={parentType}
                            onChange={e => setParentType(e.target.value as keyof typeof ACCT_GROUPS)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg font-bold"
                        >
                            <option value="ASSETS">Assets</option>
                            <option value="LIABILITIES">Liabilities</option>
                            <option value="INCOME">Income</option>
                            <option value="EXPENSES">Expenses</option>
                        </select>
                        <p className="text-[10px] text-muted-foreground mt-1">This determines where the group appears in reports.</p>
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
