import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import type { UnitOfMeasure } from '../../services/inventory/types';
import Select from '../../components/ui/Select';

export default function UnitForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { provider, activeCompany } = usePersistence();
    const [isLoading, setIsLoading] = useState(false);

    const [units, setUnits] = useState<UnitOfMeasure[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        formalName: '',
        decimalPlaces: 0,
        isCompound: false,
        baseUnitId: '',
        multiplier: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            if (provider && activeCompany) {
                setIsLoading(true);
                try {
                    const existingUnits = await provider.read<UnitOfMeasure[]>('units.json', activeCompany.path) || [];
                    setUnits(existingUnits);

                    if (id) {
                        const unit = existingUnits.find(u => u.id === id);
                        if (unit) {
                            setFormData({
                                name: unit.name,
                                formalName: unit.formalName,
                                decimalPlaces: unit.decimalPlaces,
                                isCompound: unit.isCompound,
                                baseUnitId: unit.baseUnitId || '',
                                multiplier: unit.multiplier || 0
                            });
                        }
                    }
                } catch (e) {
                    console.error("Failed to load unit data", e);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
    }, [id, provider, activeCompany]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!provider || !activeCompany) return;

        try {
            const newUnit: UnitOfMeasure = {
                id: id || Date.now().toString(),
                ...formData
            };

            let updated;
            if (id) {
                updated = units.map(u => u.id === id ? newUnit : u);
            } else {
                updated = [...units, newUnit];
            }

            await provider.write('units.json', updated, activeCompany.path);
            navigate('/inventory/units');
        } catch (error) {
            console.error('Failed to save unit:', error);
            alert('Failed to save unit.');
        }
    };

    if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading Unit...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">
                        {id ? 'Alter Unit' : 'Establish Unit'}
                    </h1>
                    <p className="text-muted-foreground font-medium">Define a unit of measurement for stock tracking.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="bg-card rounded-3xl p-10 border border-border shadow-sm space-y-8">
                <div className="flex items-center gap-4 p-2 bg-muted/20 rounded-2xl w-fit">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isCompound: false })}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!formData.isCompound ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground'}`}
                    >
                        Simple
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isCompound: true })}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.isCompound ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground'}`}
                    >
                        Compound
                    </button>
                </div>

                {!formData.isCompound ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Symbol</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold uppercase"
                                placeholder="e.g. PCS, KGS"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Formal Name</label>
                            <input
                                required
                                type="text"
                                value={formData.formalName}
                                onChange={(e) => setFormData({ ...formData, formalName: e.target.value })}
                                className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold"
                                placeholder="e.g. Pieces, Kilograms"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Unit Relation</label>
                                <div className="p-4 bg-muted/30 rounded-2xl font-black text-xs text-center border border-dashed border-border">
                                    1 {formData.name || 'NEW'} =
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Multiplier</label>
                                <input
                                    type="number"
                                    value={formData.multiplier}
                                    onChange={(e) => setFormData({ ...formData, multiplier: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-mono font-bold"
                                    placeholder="12"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Base Unit</label>
                                <Select
                                    value={formData.baseUnitId}
                                    onChange={(val) => setFormData({ ...formData, baseUnitId: val })}
                                    options={[
                                        { value: '', label: 'Select Base Unit' },
                                        ...units.filter(u => u.id !== id && !u.isCompound).map(u => ({
                                            value: u.id,
                                            label: u.name,
                                            description: u.formalName
                                        }))
                                    ]}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Compound Symbol</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold uppercase"
                                placeholder="e.g. BOX of 12"
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Decimal Places</label>
                    <input
                        type="number"
                        min="0"
                        max="4"
                        value={formData.decimalPlaces}
                        onChange={(e) => setFormData({ ...formData, decimalPlaces: parseInt(e.target.value) || 0 })}
                        className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-mono font-bold"
                    />
                </div>

                <div className="flex gap-4 pt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={() => navigate('/inventory/units')}
                        className="flex-1 px-8 py-4 border border-border rounded-2xl font-black uppercase tracking-widest text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-[2] bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        <span>{id ? 'Update Unit' : 'Save Unit'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
