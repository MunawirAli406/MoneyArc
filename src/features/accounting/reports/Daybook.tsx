import { useState, useEffect } from 'react';
import { usePersistence } from '../../../services/persistence/PersistenceContext';
import type { Voucher } from '../../../services/accounting/VoucherService';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Daybook() {
    const { provider } = usePersistence();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const loadData = async () => {
            if (!provider) return;

            const allVouchers = await provider.read<Voucher[]>('vouchers.json') || [];
            // Filter by date if needed, for now show all sorted by date desc
            const sorted = allVouchers.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setVouchers(sorted);
            setLoading(false);
        };
        loadData();
    }, [provider]);

    if (loading) return <div className="p-8">Loading Daybook...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Daybook</h1>
                    <p className="text-gray-500">Chronological record of transactions</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Particulars</th>
                                <th className="px-6 py-3">Voucher Type</th>
                                <th className="px-6 py-3">Voucher No</th>
                                <th className="px-6 py-3 text-right">Debit Amount</th>
                                <th className="px-6 py-3 text-right">Credit Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {vouchers.map((v) => {
                                // Calculate total amount for display (sum of debits)
                                const amount = v.rows.reduce((sum, r) => sum + (r.type === 'Dr' ? r.debit : 0), 0);

                                return (
                                    <tr key={v.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                                        <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">{v.date}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{v.rows[0]?.account || 'Unknown'}</div>
                                            <div className="text-xs text-gray-500 italic">{v.narration}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {v.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{v.voucherNo}</td>
                                        <td className="px-6 py-4 text-right font-mono text-gray-900">{amount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right font-mono text-gray-900">{amount.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                            {vouchers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No transactions found for the selected period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}
