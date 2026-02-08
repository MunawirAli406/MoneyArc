import { useState, useEffect } from 'react';
import { X, Ruler } from 'lucide-react';
import { usePersistence } from '../../../services/persistence/PersistenceContext';
import { motion } from 'framer-motion';
import Select from '../../../components/ui/Select';
import type { StockItem, UnitOfMeasure } from '../../../services/inventory/types';

interface QuickStockItemFormProps {
    onClose: () => void;
    onSuccess: (itemName: string, itemId: string) => void;
    initialName?: string;
}

export default function QuickStockItemForm({ onClose, onSuccess, initialName = '' }: QuickStockItemFormProps) {
    const { provider, activeCompany } = usePersistence();
    const [name, setName] = useState(initialName);
    const [unitId, setUnitId] = useState('');
    const [units, setUnits] = useState<UnitOfMeasure[]>([]);

    useEffect(() => {
        if (provider && activeCompany) {
            provider.read<UnitOfMeasure[]>('units.json', activeCompany.path).then(u => setUnits(u || []));
        }
    }, [provider, activeCompany]);

    const handleSave = async () => {
        if (!provider || !activeCompany || !name || !unitId) return;

        try {
            const items = await provider.read<StockItem[]>('stock_items.json', activeCompany.path) || [];

            if (items.find(i => i.name.toLowerCase() === name.toLowerCase())) {
                alert('Item already exists!');
                return;
            }

            const newItem: StockItem = {
                id: Date.now().toString(),
                name,
                groupId: '', // Default to Primary/No Group for quick creation
                unitId,
                openingStock: 0,
                openingRate: 0,
                openingValue: 0,
                isBatchEnabled: false,
                isExpiryEnabled: false,
                gstRate: 0, // Default
                hsnCode: ''
            };

            await provider.write('stock_items.json', [...items, newItem], activeCompany.path);
            onSuccess(name, newItem.id);
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to save item');
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
                    <h3 className="font-bold text-lg uppercase tracking-tight">Quick Create Item</h3>
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
                            placeholder="Item Name"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unit</label>
                        <Select
                            value={unitId}
                            onChange={setUnitId}
                            placeholder="Select Unit..."
                            options={units.map(u => ({
                                value: u.id,
                                label: u.name,
                                description: u.formalName,
                                icon: Ruler
                            }))}
                            className="w-full"
                        />
                        {units.length === 0 && <p className="text-[10px] text-rose-500">No units found. Create units in Masters first.</p>}
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
