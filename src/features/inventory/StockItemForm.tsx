import { useState, useEffect } from 'react';
import { Save, Info, Target, Calculator, Plus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import type { StockItem, UnitOfMeasure, StockGroup } from '../../services/inventory/types';
import Select from '../../components/ui/Select';
import QuickStockGroupForm from './QuickStockGroupForm';
import QuickUnitForm from './QuickUnitForm';

export default function StockItemForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { provider, activeCompany } = usePersistence();

    const [units, setUnits] = useState<UnitOfMeasure[]>([]);
    const [groups, setGroups] = useState<StockGroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Quick Create Modals
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showUnitModal, setShowUnitModal] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        groupId: '',
        unitId: '',
        sku: '',
        description: '',
        openingStock: 0,
        openingRate: 0,
        openingValue: 0,
        reorderLevel: 0,
        isBatchEnabled: false,
        isExpiryEnabled: false,
        hsnCode: '',
        gstRate: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!provider || !activeCompany) return;
            setIsLoading(true);
            try {
                const [itemData, unitData, groupData] = await Promise.all([
                    id ? provider.read<StockItem[]>('stock_items.json', activeCompany.path) : Promise.resolve(null),
                    provider.read<UnitOfMeasure[]>('units.json', activeCompany.path),
                    provider.read<StockGroup[]>('stock_groups.json', activeCompany.path)
                ]);

                setUnits(unitData || []);
                setGroups(groupData || []);

                if (id && itemData) {
                    const item = itemData.find(i => i.id === id);
                    if (item) {
                        setFormData({
                            name: item.name,
                            groupId: item.groupId,
                            unitId: item.unitId,
                            sku: item.sku || '',
                            description: item.description || '',
                            openingStock: item.openingStock,
                            openingRate: item.openingRate,
                            openingValue: item.openingValue,
                            reorderLevel: item.reorderLevel || 0,
                            isBatchEnabled: item.isBatchEnabled,
                            isExpiryEnabled: item.isExpiryEnabled,
                            hsnCode: item.hsnCode || '',
                            gstRate: item.gstRate || 0
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to load stock data", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, provider, activeCompany]);

    // Auto-calculate total value
    useEffect(() => {
        const value = formData.openingStock * formData.openingRate;
        if (value !== formData.openingValue) {
            setFormData(prev => ({ ...prev, openingValue: value }));
        }
    }, [formData.openingStock, formData.openingRate, formData.openingValue]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!provider || !activeCompany) return;

        try {
            const items = (await provider.read<StockItem[]>('stock_items.json', activeCompany.path)) || [];
            const newItem: StockItem = {
                id: id || Date.now().toString(),
                ...formData
            };

            let updated;
            if (id) {
                updated = items.map(i => i.id === id ? newItem : i);
            } else {
                updated = [...items, newItem];
            }

            await provider.write('stock_items.json', updated, activeCompany.path);
            navigate('/inventory/items');
        } catch (error) {
            console.error('Failed to save stock item:', error);
            alert('Failed to save stock item.');
        }
    };

    if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading Stock Item...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">
                        {id ? 'Alter Item' : 'Establish Item'}
                    </h1>
                    <p className="text-muted-foreground font-medium">Add or modify products in your inventory catalog.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/inventory/items')}
                        className="px-6 py-3 border border-border rounded-xl font-bold uppercase tracking-widest text-xs text-muted-foreground hover:bg-muted/50 transition-all font-mono"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-xs hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                    >
                        <Save className="w-5 h-5" />
                        <span>{id ? 'Update Item' : 'Save Item'}</span>
                    </button>
                </div>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Basic Info */}
                    <div className="bg-card rounded-3xl p-8 border border-border shadow-sm space-y-6">
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Info className="w-4 h-4" />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Basic Identity</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Stock Item Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-5 py-4 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-xl"
                                    placeholder="e.g. MacBook Pro M3"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">SKU / Part Number</label>
                                    <input
                                        type="text"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-mono font-bold"
                                        placeholder="MBP-M3-2024"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">HSN Code</label>
                                    <input
                                        type="text"
                                        value={formData.hsnCode}
                                        onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-mono font-bold"
                                        placeholder="8471"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Classification */}
                    <div className="bg-card rounded-3xl p-8 border border-border shadow-sm space-y-6">
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Target className="w-4 h-4" />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Classification & Units</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Under Group</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowGroupModal(true)}
                                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> New (Alt+C)
                                    </button>
                                </div>
                                <Select
                                    value={formData.groupId}
                                    onChange={(val) => {
                                        if (val === 'CREATE_NEW') setShowGroupModal(true);
                                        else setFormData({ ...formData, groupId: val });
                                    }}
                                    options={[
                                        { value: '', label: 'Primary' },
                                        { value: 'CREATE_NEW', label: '+ Create New Group', icon: Plus },
                                        ...groups.map(g => ({ value: g.id, label: g.name }))
                                    ]}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Base Unit</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowUnitModal(true)}
                                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> New (Alt+U)
                                    </button>
                                </div>
                                <Select
                                    value={formData.unitId}
                                    onChange={(val) => {
                                        if (val === 'CREATE_NEW') setShowUnitModal(true);
                                        else setFormData({ ...formData, unitId: val });
                                    }}
                                    options={[
                                        { value: '', label: 'Select Unit' },
                                        { value: 'CREATE_NEW', label: '+ Create New Unit', icon: Plus },
                                        ...units.map(u => ({ value: u.id, label: u.name, description: u.formalName }))
                                    ]}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Opening Balance */}
                    <div className="bg-card rounded-3xl p-8 border border-border shadow-sm space-y-6">
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Calculator className="w-4 h-4" />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Opening Balance</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Quantity</label>
                                <input
                                    type="number"
                                    value={formData.openingStock}
                                    onChange={(e) => setFormData({ ...formData, openingStock: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-5 py-4 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-mono font-bold text-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Rate per Unit</label>
                                <input
                                    type="number"
                                    value={formData.openingRate}
                                    onChange={(e) => setFormData({ ...formData, openingRate: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-5 py-4 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-mono font-bold text-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Total Value</label>
                                <div className="w-full px-5 py-4 bg-primary/5 border border-primary/20 rounded-2xl font-mono font-black text-primary text-xl">
                                    {formData.openingValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* GST & Extra */}
                    <div className="bg-card rounded-3xl p-8 border border-border shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Statutory & Tracking</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">GST Rate (%)</label>
                                <Select
                                    value={formData.gstRate.toString()}
                                    onChange={(val) => setFormData({ ...formData, gstRate: parseFloat(val) || 0 })}
                                    options={[
                                        { value: '0', label: '0% (Exempt)' },
                                        { value: '5', label: '5%' },
                                        { value: '12', label: '12%' },
                                        { value: '18', label: '18%' },
                                        { value: '28', label: '28%' },
                                    ]}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Re-order Level</label>
                                <input
                                    type="number"
                                    value={formData.reorderLevel}
                                    onChange={(e) => setFormData({ ...formData, reorderLevel: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-mono font-bold"
                                />
                            </div>
                            <div className="pt-4 space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-10 h-6 rounded-full transition-all relative ${formData.isBatchEnabled ? 'bg-primary' : 'bg-muted'}`}>
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isBatchEnabled ? 'translate-x-4' : ''}`} />
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={formData.isBatchEnabled}
                                        onChange={(e) => setFormData({ ...formData, isBatchEnabled: e.target.checked })}
                                    />
                                    <span className="text-xs font-bold text-foreground">Maintain Batches</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-10 h-6 rounded-full transition-all relative ${formData.isExpiryEnabled ? 'bg-primary' : 'bg-muted'}`}>
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isExpiryEnabled ? 'translate-x-4' : ''}`} />
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={formData.isExpiryEnabled}
                                        onChange={(e) => setFormData({ ...formData, isExpiryEnabled: e.target.checked })}
                                    />
                                    <span className="text-xs font-bold text-foreground">Track Expiry</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {showGroupModal && (
                <QuickStockGroupForm
                    onClose={() => setShowGroupModal(false)}
                    onSuccess={(newGroup) => {
                        setGroups(prev => [...prev, newGroup]);
                        setFormData(prev => ({ ...prev, groupId: newGroup.id }));
                    }}
                />
            )}

            {showUnitModal && (
                <QuickUnitForm
                    onClose={() => setShowUnitModal(false)}
                    onSuccess={(newUnit) => {
                        setUnits(prev => [...prev, newUnit]);
                        setFormData(prev => ({ ...prev, unitId: newUnit.id }));
                    }}
                />
            )}
        </div>
    );
}
