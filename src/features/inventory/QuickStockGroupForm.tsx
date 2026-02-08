import { useState, useEffect } from 'react';
import { Save, X, Layers } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { motion } from 'framer-motion';
import type { StockGroup } from '../../services/inventory/types';
import Select from '../../components/ui/Select';

interface QuickStockGroupFormProps {
    onClose: () => void;
    onSuccess: (newGroup: StockGroup) => void;
    initialName?: string;
}

export default function QuickStockGroupForm({ onClose, onSuccess, initialName = '' }: QuickStockGroupFormProps) {
    const { provider, activeCompany } = usePersistence();
    const [name, setName] = useState(initialName);
    const [parentGroupId, setParentGroupId] = useState('');
    const [groups, setGroups] = useState<StockGroup[]>([]);

    useEffect(() => {
        if (provider && activeCompany) {
            provider.read<StockGroup[]>('stock_groups.json', activeCompany.path)
                .then(data => setGroups(data || []));
        }
    }, [provider, activeCompany]);

    const handleSave = async () => {
        if (!provider || !activeCompany || !name) return;

        try {
            if (groups.find(g => g.name.toLowerCase() === name.toLowerCase())) {
                alert('Group name already exists!');
                return;
            }

            const newGroup: StockGroup = {
                id: Date.now().toString(),
                name,
                parentGroupId: parentGroupId || undefined
            };

            await provider.write('stock_groups.json', [...groups, newGroup], activeCompany.path);

            onSuccess(newGroup);
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
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        <h3 className="font-bold text-lg uppercase tracking-tight">Quick Create Stock Group</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-rose-500/10 hover:text-rose-500 rounded"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Name</label>
                        <input
                            autoFocus
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg font-bold uppercase"
                            placeholder="GROUP NAME"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Parent Group</label>
                        <Select
                            value={parentGroupId}
                            onChange={setParentGroupId}
                            options={[
                                { value: '', label: 'Primary' },
                                ...groups.map(g => ({ value: g.id, label: g.name }))
                            ]}
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="p-4 bg-muted/20 border-t border-border flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase tracking-widest">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2">
                        <Save className="w-4 h-4" /> Create
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
