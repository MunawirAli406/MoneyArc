import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePersistence } from '../../../services/persistence/PersistenceContext';

interface Ledger {
    id: string;
    name: string;
    group: string;
    balance: number;
    type: 'Dr' | 'Cr';
}

export default function LedgerList() {
    const { provider } = usePersistence();
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLedgers = async () => {
            if (provider) {
                try {
                    const data = await provider.read<Ledger[]>('ledgers.json');
                    if (data) {
                        setLedgers(data);
                    } else {
                        // Initialize with some default data if empty, or just empty array
                        setLedgers([]);
                    }
                } catch (error) {
                    console.error('Failed to load ledgers:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        fetchLedgers();
    }, [provider]);

    if (loading) return <div className="p-6">Loading ledgers...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Ledgers</h1>
                    <p className="text-gray-500">Manage your accounts and groups</p>
                </div>
                <Link
                    to="/ledgers/new"
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create Ledger</span>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search ledgers..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200">
                        <Filter className="w-4 h-4" />
                        <span>Filter</span>
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {ledgers.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No ledgers found. Create one to get started.
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Under Group</th>
                                    <th className="px-6 py-3 text-right">Current Balance</th>
                                    <th className="px-6 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {ledgers.map((ledger) => (
                                    <tr key={ledger.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-3 font-medium text-gray-900">{ledger.name}</td>
                                        <td className="px-6 py-3 text-gray-500">{ledger.group}</td>
                                        <td className="px-6 py-3 text-right font-mono">
                                            <span className={ledger.type === 'Cr' ? 'text-red-600' : 'text-green-600'}>
                                                {ledger.balance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} {ledger.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1 text-gray-400 hover:text-primary-600 rounded">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button className="p-1 text-gray-400 hover:text-red-600 rounded">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
