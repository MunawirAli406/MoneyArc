import { useState, useEffect } from 'react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { ReportService, ACCT_GROUPS, type Ledger, type GroupSummary } from '../../services/accounting/ReportService';

export default function BalanceSheet() {
    const { provider } = usePersistence();
    const [liabilities, setLiabilities] = useState<GroupSummary[]>([]);
    const [assets, setAssets] = useState<GroupSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!provider) return;

            const ledgers = await provider.read<Ledger[]>('ledgers.json') || [];

            const liabilityData = ReportService.getGroupSummary(ledgers, ACCT_GROUPS.LIABILITIES);
            const assetData = ReportService.getGroupSummary(ledgers, ACCT_GROUPS.ASSETS);

            setLiabilities(liabilityData);
            setAssets(assetData);
            setLoading(false);
        };
        loadData();
    }, [provider]);

    const totalLiabilities = ReportService.calculateTotal(liabilities);
    const totalAssets = ReportService.calculateTotal(assets);

    if (loading) return <div className="p-8">Loading Balance Sheet...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Balance Sheet</h1>
                <div className="text-sm text-gray-500">As on {new Date().toLocaleDateString()}</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-gray-200">
                    {/* Liabilities Side */}
                    <div className="p-0">
                        <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 uppercase text-sm tracking-wider text-center">
                            Liabilities
                        </div>
                        <div className="p-6 space-y-6 min-h-[400px]">
                            {liabilities.map(group => (
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
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between font-bold text-gray-900">
                            <span>Total</span>
                            <span>{totalLiabilities.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Assets Side */}
                    <div className="p-0">
                        <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 uppercase text-sm tracking-wider text-center">
                            Assets
                        </div>
                        <div className="p-6 space-y-6 min-h-[400px]">
                            {assets.map(group => (
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
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between font-bold text-gray-900">
                            <span>Total</span>
                            <span>{totalAssets.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
