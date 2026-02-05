import { useState, useEffect } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePersistence } from '../../../services/persistence/PersistenceContext';
import type { Ledger } from '../../../services/accounting/ReportService';

const GROUPS = [
    'Bank Accounts', 'Cash-in-hand', 'Sundry Debtors', 'Sundry Creditors',
    'Sales Accounts', 'Purchase Accounts', 'Direct Expenses', 'Indirect Expenses',
    'Fixed Assets', 'Duties & Taxes', 'Loans (Liability)', 'Direct Incomes', 'Indirect Incomes',
    'Capital Account', 'Stock-in-hand', 'Current Assets', 'Current Liabilities',
    'Loans & Advances (Asset)', 'Reserves & Surplus'
];

export default function LedgerForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { provider, activeCompany } = usePersistence();

    const [formData, setFormData] = useState({
        name: '',
        group: '',
        category: '',
        opBalance: '',
        balanceType: 'Dr',
        mailingName: '',
        address: '',
        state: activeCompany?.state || '',
        gstin: '',
        isGstEnabled: false
    });

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadLedger = async () => {
            if (id && provider && activeCompany) {
                setIsLoading(true);
                try {
                    const ledgers = await provider.read<Ledger[]>('ledgers.json', activeCompany.path);
                    const ledger = ledgers?.find(l => l.id === id);
                    if (ledger) {
                        setFormData({
                            name: ledger.name,
                            group: ledger.group,
                            category: ledger.category || '',
                            opBalance: Math.abs(ledger.balance).toString(),
                            balanceType: ledger.type,
                            mailingName: ledger.name,
                            address: ledger.address || '',
                            state: ledger.state || '',
                            gstin: ledger.gstin || '',
                            isGstEnabled: ledger.isGstEnabled || false
                        });
                    }
                } catch (e) {
                    console.error("Failed to load ledger", e);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadLedger();
    }, [id, provider, activeCompany]);

    const handleSave = async () => {
        if (!provider || !activeCompany) {
            alert("Storage not initialized or company not selected!");
            return;
        }

        try {
            const existingLedgers = (await provider.read<Ledger[]>('ledgers.json', activeCompany.path)) || [];

            const ledgerData: Ledger = {
                id: id || Date.now().toString(),
                name: formData.name,
                group: formData.group,
                category: formData.category,
                balance: parseFloat(formData.opBalance) || 0,
                type: formData.balanceType as 'Dr' | 'Cr',
                gstin: formData.gstin,
                address: formData.address,
                state: formData.state,
                isGstEnabled: formData.isGstEnabled
            };

            let updatedLedgers;
            if (id) {
                updatedLedgers = existingLedgers.map(l => l.id === id ? ledgerData : l);
            } else {
                updatedLedgers = [...existingLedgers, ledgerData];
            }

            await provider.write('ledgers.json', updatedLedgers, activeCompany.path);
            navigate('/ledgers');
        } catch (error) {
            console.error('Failed to save ledger:', error);
            alert('Failed to save ledger.');
        }
    };

    if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading Ledger...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">
                        {id ? 'Alter Ledger' : 'Establish Ledger'}
                    </h1>
                    <p className="text-muted-foreground font-medium">
                        {id ? `Modifying ${formData.name}` : 'Add a new financial account to your workspace.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/ledgers')}
                        className="px-6 py-3 border border-border rounded-xl font-bold uppercase tracking-widest text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-xs hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                    >
                        <Save className="w-5 h-5" />
                        <span>{id ? 'Update Ledger' : 'Save Ledger'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Basic Details */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-card rounded-3xl p-8 border border-border shadow-sm space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Ledger Name</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-lg"
                                placeholder="e.g. Gotham City Bank"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Under Group</label>
                                <select
                                    value={formData.group}
                                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold appearance-none"
                                >
                                    <option value="">Select Group</option>
                                    {GROUPS.sort().map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Category (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold"
                                    placeholder="e.g. Operating, Assets"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Opening Balance</label>
                            <div className="flex gap-4">
                                <input
                                    type="number"
                                    value={formData.opBalance}
                                    onChange={(e) => setFormData({ ...formData, opBalance: e.target.value })}
                                    className="flex-1 px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold"
                                    placeholder="0.00"
                                />
                                <select
                                    value={formData.balanceType}
                                    onChange={(e) => setFormData({ ...formData, balanceType: e.target.value })}
                                    className="w-32 px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-black text-center"
                                >
                                    <option value="Dr">Debit</option>
                                    <option value="Cr">Credit</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-3xl p-8 border border-border shadow-sm space-y-6 text-muted-foreground">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Compliance Details</h3>
                            <button
                                onClick={() => setFormData({ ...formData, isGstEnabled: !formData.isGstEnabled })}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${formData.isGstEnabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}
                            >
                                <CheckCircle2 className={`w-4 h-4 ${formData.isGstEnabled ? 'opacity-100' : 'opacity-30'}`} />
                                GST / VAT Enabled
                            </button>
                        </div>

                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300 ${formData.isGstEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">GSTIN Number</label>
                                <input
                                    type="text"
                                    value={formData.gstin}
                                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold uppercase"
                                    placeholder="27AAACR1224A1Z1"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Registration State</label>
                                <input
                                    type="text"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold"
                                    placeholder="State Name"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mailing Details */}
                <div className="space-y-8">
                    <div className="bg-card rounded-3xl p-8 border border-border shadow-sm space-y-6 h-full">
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Mailing Address</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Mailing Name</label>
                                <input
                                    type="text"
                                    value={formData.mailingName}
                                    onChange={(e) => setFormData({ ...formData, mailingName: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold"
                                    placeholder="Print name..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Permanent Address</label>
                                <textarea
                                    rows={6}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold resize-none"
                                    placeholder="Full street address..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
