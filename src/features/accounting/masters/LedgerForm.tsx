import { useState } from 'react';
import { Save, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePersistence } from '../../../services/persistence/PersistenceContext';

const GROUPS = [
    'Bank Accounts', 'Cash-in-hand', 'Sundry Debtors', 'Sundry Creditors',
    'Sales Accounts', 'Purchase Accounts', 'Direct Expenses', 'Indirect Expenses'
];

interface Ledger {
    id: string;
    name: string;
    group: string;
    balance: number;
    type: 'Dr' | 'Cr';
}

export default function LedgerForm() {
    const navigate = useNavigate();
    const { provider } = usePersistence();

    const [formData, setFormData] = useState({
        name: '',
        group: '',
        opBalance: '',
        balanceType: 'Dr',
        mailingName: '',
        address: ''
    });

    const handleSave = async () => {
        if (!provider) {
            alert("Storage not initialized! Please select a data source first.");
            return;
        }

        try {
            // 1. Read existing ledgers
            const existingLedgers = (await provider.read<Ledger[]>('ledgers.json')) || [];

            // 2. Create new ledger object
            const newLedger: Ledger = {
                id: Date.now().toString(),
                name: formData.name,
                group: formData.group,
                balance: parseFloat(formData.opBalance) || 0,
                type: formData.balanceType as 'Dr' | 'Cr'
            };

            // 3. Append and write back
            const updatedLedgers = [...existingLedgers, newLedger];
            await provider.write('ledgers.json', updatedLedgers);

            navigate('/ledgers');
        } catch (error) {
            console.error('Failed to save ledger:', error);
            alert('Failed to save ledger. Check console for details.');
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create New Ledger</h1>
                    <p className="text-gray-500">Add a new account to your chart of accounts</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/ledgers')}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Save className="w-5 h-5" />
                        <span>Save Ledger</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Ledger Name</label>
                            <input
                                type="text"
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                placeholder="e.g. Gotham City Bank"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="group" className="block text-sm font-medium text-gray-700">Under Group</label>
                            <div className="relative">
                                <select
                                    id="group"
                                    value={formData.group}
                                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all appearance-none bg-white"
                                >
                                    <option value="">Select Group</option>
                                    {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="opBalance" className="block text-sm font-medium text-gray-700">Opening Balance</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    id="opBalance"
                                    value={formData.opBalance}
                                    onChange={(e) => setFormData({ ...formData, opBalance: e.target.value })}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                    placeholder="0.00"
                                />
                                <select
                                    value={formData.balanceType}
                                    onChange={(e) => setFormData({ ...formData, balanceType: e.target.value })}
                                    className="width-24 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                >
                                    <option value="Dr">Dr</option>
                                    <option value="Cr">Cr</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="mailingName" className="block text-sm font-medium text-gray-700">Mailing Name</label>
                            <input
                                type="text"
                                id="mailingName"
                                value={formData.mailingName}
                                onChange={(e) => setFormData({ ...formData, mailingName: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                placeholder="Same as Ledger Name"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Mailing Details & Address</h3>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                                <textarea
                                    id="address"
                                    rows={3}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
                                    placeholder="Street address, City, etc."
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
