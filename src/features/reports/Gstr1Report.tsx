import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, User, ArrowLeft, Hash } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import type { Voucher } from '../../services/accounting/VoucherService';
import type { Ledger } from '../../services/accounting/ReportService';
import type { StockItem } from '../../services/inventory/types';
import { useNavigate } from 'react-router-dom';
import { TaxService } from '../../services/accounting/TaxService';
import { useReportDates } from './DateContext';
import PeriodSelector from '../../components/ui/PeriodSelector';
import { useLocalization } from '../../hooks/useLocalization';

export default function Gstr1Report() {
    const { provider, activeCompany } = usePersistence();
    const { formatCurrency, tax } = useLocalization();
    const navigate = useNavigate();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { startDate, endDate } = useReportDates();

    useEffect(() => {
        const loadData = async () => {
            if (provider && activeCompany) {
                const [vData, lData, sData] = await Promise.all([
                    provider.read<Voucher[]>('vouchers.json', activeCompany.path),
                    provider.read<Ledger[]>('ledgers.json', activeCompany.path),
                    provider.read<StockItem[]>('stock_items.json', activeCompany.path)
                ]);
                setVouchers(vData || []);
                setLedgers(lData || []);
                setStockItems(sData || []);
                setLoading(false);
            }
        };
        loadData();
    }, [provider, activeCompany]);

    const filteredVouchers = vouchers.filter(v => v.date >= startDate && v.date <= endDate);

    const salesVouchers = filteredVouchers.filter(v => v.type === 'Sales');

    // B2B: Sales to registered ledgers (having GSTIN)
    const b2bInvoices = salesVouchers.filter(v => {
        const partyRow = v.rows.find(r => r.type === 'Dr');
        const ledger = ledgers.find(l => l.name === partyRow?.account);
        return ledger && ledger.gstin && ledger.gstin.trim() !== '';
    });

    // B2C: Sales to unregistered ledgers
    const b2cInvoices = salesVouchers.filter(v => {
        const partyRow = v.rows.find(r => r.type === 'Dr');
        const ledger = ledgers.find(l => l.name === partyRow?.account);
        return !(ledger && ledger.gstin && ledger.gstin.trim() !== '');
    });

    const calculateTotal = (invoices: Voucher[]) => {
        return TaxService.aggregateSummaries(invoices).taxableValue;
    };

    const calculateTax = (invoices: Voucher[]) => {
        return TaxService.aggregateSummaries(invoices).totalTax;
    };

    // HSN Summary logic
    const hsnSummaryMap = new Map<string, { hsn: string, description: string, qty: number, taxableValue: number, taxAmount: number }>();

    salesVouchers.forEach(v => {
        v.rows.forEach(r => {
            if (r.inventoryAllocations) {
                r.inventoryAllocations.forEach(alloc => {
                    const item = stockItems.find(si => si.id === alloc.itemId);
                    const hsn = item?.hsnCode || 'N/A';
                    const current = hsnSummaryMap.get(hsn) || { hsn, description: item?.name || 'Unknown', qty: 0, taxableValue: 0, taxAmount: 0 };

                    const itemTax = item?.gstRate ? (alloc.amount * item.gstRate) / 100 : 0;

                    hsnSummaryMap.set(hsn, {
                        ...current,
                        qty: current.qty + alloc.quantity,
                        taxableValue: current.taxableValue + alloc.amount,
                        taxAmount: current.taxAmount + itemTax
                    });
                });
            }
        });
    });

    const hsnSummaryRows = Array.from(hsnSummaryMap.values());

    if (loading) return <div className="p-12 text-center text-muted-foreground font-black uppercase tracking-[0.3em] animate-pulse">Analyzing Statutory Data...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-7xl mx-auto space-y-8 pb-20"
        >
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/reports/gst')}
                        className="p-3 hover:bg-muted rounded-2xl transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">{tax.taxName} Details</h1>
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">
                            Outward Supplies Statement // {activeCompany?.name}
                        </p>
                    </div>
                </div>
                <PeriodSelector />
                <div className="flex gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <Users className="w-5 h-5" />
                    </div>
                    <h2 className="text-xs font-black uppercase tracking-widest hidden md:block mt-3">B2B Invoices</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* B2B Section */}
                <div className="bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-xl border-t-4 border-t-primary">
                    <div className="p-8 border-b border-border bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <Users className="w-5 h-5" />
                            </div>
                            <h2 className="text-xs font-black uppercase tracking-widest">{tax.taxName} Register Invoices</h2>
                        </div>
                        <span className="text-xl font-black font-mono">{b2bInvoices.length}</span>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-end border-b border-border pb-4">
                            <p className="text-[10px] font-black text-muted-foreground uppercase">{tax.labels.taxable}</p>
                            <p className="text-2xl font-black font-mono text-primary">{formatCurrency(calculateTotal(b2bInvoices))}</p>
                        </div>
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black text-muted-foreground uppercase">{tax.labels.total}</p>
                            <p className="text-xl font-black font-mono text-foreground/70">{formatCurrency(calculateTax(b2bInvoices))}</p>
                        </div>
                    </div>
                </div>

                {/* B2C Section */}
                <div className="bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-xl border-t-4 border-t-orange-500">
                    <div className="p-8 border-b border-border bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-600">
                                <User className="w-5 h-5" />
                            </div>
                            <h2 className="text-xs font-black uppercase tracking-widest">Consumer Sales</h2>
                        </div>
                        <span className="text-xl font-black font-mono">{b2cInvoices.length}</span>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-end border-b border-border pb-4">
                            <p className="text-[10px] font-black text-muted-foreground uppercase">{tax.labels.taxable}</p>
                            <p className="text-2xl font-black font-mono text-orange-600">{formatCurrency(calculateTotal(b2cInvoices))}</p>
                        </div>
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black text-muted-foreground uppercase">{tax.labels.total}</p>
                            <p className="text-xl font-black font-mono text-foreground/70">{formatCurrency(calculateTax(b2cInvoices))}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* HSN Summary */}
            <div className="bg-card rounded-[3rem] border border-border shadow-md overflow-hidden">
                <div className="p-8 bg-muted/10 border-b border-border flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{tax.itemCodeLabel} Summary</h3>
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Hash className="w-4 h-4" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[9px] font-black text-muted-foreground uppercase tracking-widest border-b border-border bg-muted/5">
                                <th className="px-10 py-5">{tax.itemCodeLabel}</th>
                                <th className="px-4 py-5">Item Description</th>
                                <th className="px-4 py-5 text-right">Total Quantity</th>
                                <th className="px-4 py-5 text-right">Total Taxable Value</th>
                                <th className="px-10 py-5 text-right">Total Tax Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50 font-bold">
                            {hsnSummaryRows.map((hsn, i) => (
                                <tr key={i} className="hover:bg-muted/5 transition-all">
                                    <td className="px-10 py-5 font-mono text-xs text-primary">{hsn.hsn}</td>
                                    <td className="px-4 py-5 uppercase text-xs">{hsn.description}</td>
                                    <td className="px-4 py-5 text-right font-mono">{hsn.qty.toFixed(2)}</td>
                                    <td className="px-4 py-5 text-right font-mono">{formatCurrency(hsn.taxableValue)}</td>
                                    <td className="px-10 py-5 text-right font-mono text-primary font-black">{formatCurrency(hsn.taxAmount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-card rounded-[3rem] border border-border shadow-md overflow-hidden">
                <div className="p-8 bg-muted/10 border-b border-border">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Invoice Wise Detail</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[9px] font-black text-muted-foreground uppercase tracking-widest border-b border-border bg-muted/5">
                                <th className="px-10 py-5">Date</th>
                                <th className="px-4 py-5">Particulars</th>
                                <th className="px-4 py-5">{tax.idLabel}</th>
                                <th className="px-4 py-5 text-right">Taxable Value</th>
                                <th className="px-4 py-5 text-right">{tax.taxName} Amount</th>
                                <th className="px-10 py-5 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {salesVouchers.map(v => {
                                const partyRow = v.rows.find(r => r.type === 'Dr');
                                const ledger = ledgers.find(l => l.name === partyRow?.account);
                                const vSummary = TaxService.calculateVoucherSummary(v);
                                const taxableValue = vSummary.taxableValue;
                                const taxAmount = vSummary.totalTax;
                                const invoiceValue = vSummary.invoiceValue;

                                return (
                                    <tr key={v.id} className="hover:bg-muted/5 transition-all">
                                        <td className="px-10 py-5 font-mono text-xs font-bold">{v.date}</td>
                                        <td className="px-4 py-5">
                                            <div className="font-bold text-sm uppercase">{partyRow?.account}</div>
                                            <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">{v.voucherNo}</div>
                                        </td>
                                        <td className="px-4 py-5 font-mono text-xs text-primary font-black">{ledger?.gstin || '-'}</td>
                                        <td className="px-4 py-5 text-right font-mono text-sm">{formatCurrency(taxableValue)}</td>
                                        <td className="px-4 py-5 text-right font-mono text-sm text-primary">{formatCurrency(taxAmount)}</td>
                                        <td className="px-10 py-5 text-right font-mono font-black text-base">{formatCurrency(invoiceValue)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}
