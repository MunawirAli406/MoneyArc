import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Calendar, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { usePersistence } from '../../../services/persistence/PersistenceContext';
import { VoucherService, type Voucher, type VoucherRow } from '../../../services/accounting/VoucherService';
import type { Ledger } from '../../../services/accounting/ReportService';
import { useNavigate } from 'react-router-dom';

type VoucherType = 'Payment' | 'Receipt' | 'Journal' | 'Contra' | 'Sales' | 'Purchase';

export default function VoucherEntry() {
    const { provider } = usePersistence();
    const navigate = useNavigate();
    const [ledgers, setLedgers] = useState<Ledger[]>([]);

    const [voucherType, setVoucherType] = useState<VoucherType>('Payment');
    const [rows, setRows] = useState<VoucherRow[]>([
        { id: 1, type: 'Dr', account: '', debit: 0, credit: 0 },
        { id: 2, type: 'Cr', account: '', debit: 0, credit: 0 },
    ]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [narration, setNarration] = useState('');
    const [voucherNo, setVoucherNo] = useState('1');

    // Load Ledgers for dropdown
    useEffect(() => {
        const loadLedgers = async () => {
            if (provider) {
                const data = await provider.read<Ledger[]>('ledgers.json') || [];
                setLedgers(data);
            }
        };
        loadLedgers();
    }, [provider]);

    const addRow = () => {
        setRows([...rows, {
            id: Date.now(),
            type: rows[rows.length - 1].type === 'Dr' ? 'Cr' : 'Dr',
            account: '',
            debit: 0,
            credit: 0
        }]);
    };

    const removeRow = (id: number) => {
        if (rows.length > 2) {
            setRows(rows.filter(r => r.id !== id));
        }
    };

    const updateRow = (id: number, field: keyof VoucherRow, value: string | number) => {
        setRows(rows.map(r => {
            if (r.id === id) {
                return { ...r, [field]: value };
            }
            return r;
        }));
    };

    const totalDebit = rows.reduce((acc, r) => acc + (Number(r.debit) || 0), 0);
    const totalCredit = rows.reduce((acc, r) => acc + (Number(r.credit) || 0), 0);

    const handleSave = async () => {
        if (!provider) {
            alert("Please set up data storage first!");
            return;
        }
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            alert("Debit and Credit totals must match!");
            return;
        }

        try {
            const voucher: Voucher = {
                id: Date.now().toString(),
                voucherNo,
                date,
                type: voucherType,
                narration,
                rows
            };

            await VoucherService.saveVoucher(provider, voucher);
            alert("Voucher Saved & Ledgers Updated!");
            navigate('/dashboard');

        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save voucher.");
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Voucher Entry</h1>
                    <p className="text-gray-500">Record financial transactions</p>
                </div>
                <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                    {['Payment', 'Receipt', 'Journal', 'Sales', 'Purchase'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setVoucherType(type as VoucherType)}
                            className={clsx(
                                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                                voucherType === type
                                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            )}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header Section */}
                <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Voucher No</label>
                            <input
                                type="text"
                                value={voucherNo}
                                onChange={(e) => setVoucherNo(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                />
                                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference No</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                placeholder="Optional"
                            />
                        </div>
                    </div>
                </div>

                {/* Grid Section */}
                <div className="p-6">
                    <table className="w-full mb-4">
                        <thead>
                            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                <th className="pb-3 w-16">Dr/Cr</th>
                                <th className="pb-3 px-4">Particulars (Account)</th>
                                <th className="pb-3 w-32 text-right">Debit</th>
                                <th className="pb-3 w-32 text-right">Credit</th>
                                <th className="pb-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((row) => (
                                <tr key={row.id} className="group">
                                    <td className="py-2">
                                        <select
                                            value={row.type}
                                            onChange={(e) => updateRow(row.id, 'type', e.target.value)}
                                            className="w-full bg-transparent font-medium text-gray-700 outline-none focus:text-primary-600"
                                        >
                                            <option value="Dr">Dr</option>
                                            <option value="Cr">Cr</option>
                                        </select>
                                    </td>
                                    <td className="py-2 px-4 relative">
                                        <input
                                            list={`ledgers-${row.id}`}
                                            value={row.account}
                                            onChange={(e) => updateRow(row.id, 'account', e.target.value)}
                                            className="w-full outline-none border-b border-transparent focus:border-primary-500 transition-colors bg-transparent placeholder-gray-400"
                                            placeholder="Select Account"
                                        />
                                        <datalist id={`ledgers-${row.id}`}>
                                            {ledgers.map(l => (
                                                <option key={l.id} value={l.name} />
                                            ))}
                                        </datalist>
                                        <ChevronDown className="w-4 h-4 text-gray-300 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-gray-400" />
                                    </td>
                                    <td className="py-2 text-right">
                                        <input
                                            type="number"
                                            value={row.debit || ''}
                                            onChange={(e) => updateRow(row.id, 'debit', parseFloat(e.target.value))}
                                            disabled={row.type === 'Cr'}
                                            className={clsx(
                                                "w-full text-right outline-none bg-transparent transition-colors",
                                                row.type === 'Dr' ? "border-b border-transparent focus:border-primary-500" : "text-gray-300"
                                            )}
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="py-2 text-right">
                                        <input
                                            type="number"
                                            value={row.credit || ''}
                                            onChange={(e) => updateRow(row.id, 'credit', parseFloat(e.target.value))}
                                            disabled={row.type === 'Dr'}
                                            className={clsx(
                                                "w-full text-right outline-none bg-transparent transition-colors",
                                                row.type === 'Cr' ? "border-b border-transparent focus:border-primary-500" : "text-gray-300"
                                            )}
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="py-2 text-center">
                                        <button
                                            onClick={() => removeRow(row.id)}
                                            className="p-1 text-gray-300 group-hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-gray-300 font-bold text-gray-900">
                                <td colSpan={2} className="py-3 text-right pr-4">Total</td>
                                <td className="py-3 text-right">{totalDebit.toFixed(2)}</td>
                                <td className="py-3 text-right">{totalCredit.toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>

                    <button
                        onClick={addRow}
                        className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1 mb-6"
                    >
                        <Plus className="w-4 h-4" />
                        Add Line
                    </button>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Narration</label>
                        <textarea
                            value={narration}
                            onChange={(e) => setNarration(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                            placeholder="Enter details..."
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                    <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        Clear
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        <Save className="w-5 h-5" />
                        <span>Save Voucher</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
