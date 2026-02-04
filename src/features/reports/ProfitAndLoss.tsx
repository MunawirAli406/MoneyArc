import { useState, useEffect } from 'react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { ReportService, ACCT_GROUPS, type Ledger, type GroupSummary } from '../../services/accounting/ReportService';

export default function ProfitAndLoss() {
    const { provider } = usePersistence();
    const [expenses, setExpenses] = useState<GroupSummary[]>([]);
    const [incomes, setIncomes] = useState<GroupSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!provider) return;

            const ledgers = await provider.read<Ledger[]>('ledgers.json') || [];

            const expenseData = ReportService.getGroupSummary(ledgers, ACCT_GROUPS.EXPENSES);
            const incomeData = ReportService.getGroupSummary(ledgers, ACCT_GROUPS.INCOME);

            setExpenses(expenseData);
            setIncomes(incomeData);
            setLoading(false);
        };
        loadData();
    }, [provider]);

    const totalExpenses = ReportService.calculateTotal(expenses);
    const totalIncome = ReportService.calculateTotal(incomes);
    const netProfit = totalIncome - totalExpenses;

    if (loading) return <div className="p-8">Loading Profit & Loss...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Profit & Loss A/c</h1>
                <div className="text-sm text-gray-500">For the period ending {new Date().toLocaleDateString()}</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-gray-200">
                    {/* Expenses Side */}
                    <div className="p-0">
                        <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 uppercase text-sm tracking-wider text-center">
                            Expenses
                        </div>
                        <div className="p-6 space-y-6 min-h-[400px]">
                            {expenses.map(group => (
                                group.total > 0 && (
                                    <div key={group.groupName}>
                                        <div className="flex justify-between font-medium text-gray-900 mb-2">
                                            <span>{group.groupName}</span>
                                            <span>{group.total.toLocaleString()}</span>
                                        </div>
                                        <div className="pl-4 space-y-1">
                                            {group.ledgers.map(l => (
                                                <div key={l.id} className="flex justify-between text-sm text-gray-600">
                                                    <span>{l.name}</span>
                                                    <span>{l.balance.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                            {netProfit > 0 && (
                                <div className="flex justify-between font-bold text-green-600 pt-4 border-t border-gray-100">
                                    <span>Net Profit</span>
                                    <span>{netProfit.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between font-bold text-gray-900">
                            <span>Total</span>
                            <span>{Math.max(totalExpenses + (netProfit > 0 ? netProfit : 0), totalIncome).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Income Side */}
                    <div className="p-0">
                        <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 uppercase text-sm tracking-wider text-center">
                            Income
                        </div>
                        <div className="p-6 space-y-6 min-h-[400px]">
                            {incomes.map(group => (
                                group.total > 0 && (
                                    <div key={group.groupName}>
                                        <div className="flex justify-between font-medium text-gray-900 mb-2">
                                            <span>{group.groupName}</span>
                                            <span>{group.total.toLocaleString()}</span>
                                        </div>
                                        <div className="pl-4 space-y-1">
                                            {group.ledgers.map(l => (
                                                <div key={l.id} className="flex justify-between text-sm text-gray-600">
                                                    <span>{l.name}</span>
                                                    <span>{l.balance.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                            {netProfit < 0 && (
                                <div className="flex justify-between font-bold text-red-600 pt-4 border-t border-gray-100">
                                    <span>Net Loss</span>
                                    <span>{Math.abs(netProfit).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between font-bold text-gray-900">
                            <span>Total</span>
                            <span>{Math.max(totalExpenses + (netProfit > 0 ? netProfit : 0), totalIncome).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
