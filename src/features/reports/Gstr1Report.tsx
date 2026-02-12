import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    X, ArrowLeft
} from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import type { Voucher } from '../../services/accounting/VoucherService';
import type { Ledger } from '../../services/accounting/ReportService';
import type { StockItem } from '../../services/inventory/types';
import { TaxService } from '../../services/accounting/TaxService';
import type { Gstr1Summary } from '../../services/accounting/TaxService';
import { useReportDates } from './DateContext';
import PeriodSelector from '../../components/ui/PeriodSelector';
import { useLocalization } from '../../hooks/useLocalization';
import clsx from 'clsx';

export default function Gstr1Report() {
    const { provider, activeCompany } = usePersistence();
    const { formatCurrency } = useLocalization();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { startDate, endDate } = useReportDates();

    // Drill-down State
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [drillDownVouchers, setDrillDownVouchers] = useState<Voucher[]>([]);

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

    const filteredVouchers = vouchers.filter((v: Voucher) => v.date >= startDate && v.date <= endDate);
    const summary = TaxService.aggregateGstr1Data(filteredVouchers, ledgers, stockItems);

    const handleDrillDown = (category: string, catVouchers: Voucher[]) => {
        setSelectedCategory(category);
        setDrillDownVouchers(catVouchers);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Scanning Statutory Registry...</p>
        </div>
    );

    if (selectedCategory) {
        return (
            <div className="max-w-[1240px] mx-auto p-4 lg:p-10 space-y-6 font-sans">
                {/* Audit View Header */}
                <div className="bg-google-blue text-white p-6 flex justify-between items-center rounded-2xl shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-google-green/20 via-transparent to-google-red/10 pointer-events-none" />
                    <div className="flex items-center gap-6 relative z-10">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className="p-3 hover:bg-white/10 rounded-2xl transition-all group backdrop-blur-md"
                        >
                            <ArrowLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h2 className="text-[10px] font-black text-white/70 uppercase tracking-[0.4em] mb-1">Transaction Audit</h2>
                            <p className="text-2xl font-black text-white tracking-tighter uppercase">{selectedCategory}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="p-4 hover:bg-google-red/20 rounded-2xl transition-all group relative z-10"
                    >
                        <X className="w-6 h-6 text-white/50 group-hover:text-white" />
                    </button>
                </div>

                {/* Audit Content */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden bg-card"
                >
                    <div className="p-8 overflow-x-auto">
                        {selectedCategory === 'HSN Summary' ? (
                            <GstrHsnTable hsnData={summary.hsn} formatCurrency={formatCurrency} />
                        ) : selectedCategory === 'Document Summary' ? (
                            <GstrDocTable docs={summary.docs} />
                        ) : selectedCategory === 'B2C Small' ? (
                            <GstrB2csRateWiseTable b2csData={summary.b2csRateWise} formatCurrency={formatCurrency} />
                        ) : (
                            <GstrVoucherTable vouchers={drillDownVouchers} ledgers={ledgers} formatCurrency={formatCurrency} stockItems={stockItems} />
                        )}
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-[1240px] mx-auto p-4 lg:p-10 space-y-6 font-sans">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10 no-print">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <span className="bg-google-blue text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">GSTR-1</span>
                        <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-[0.9] bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
                            Outward Supplies
                        </h1>
                    </div>
                    <div className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] mt-4 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-google-blue animate-pulse" />
                        Comprehensive Audit Registry // {activeCompany?.name} // <span className="text-primary">{activeCompany?.gstin || "21AGHPB2764P1ZD"}</span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <PeriodSelector className="!glass-panel !px-8 !py-4 rounded-[1.5rem] border-primary/10 shadow-2xl" />
                </div>
            </div>

            {/* Total Vouchers Summary Section - Brand Palette */}
            <div className="glass-panel border border-white/10 overflow-hidden shadow-2xl rounded-b-2xl">
                <div className="bg-google-blue/5 px-6 py-3 border-b border-white/5 flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Nature of Return Summary</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Voucher Count</p>
                </div>
                <div className="divide-y divide-white/5">
                    <SummaryRow label="Total Vouchers" count={summary.counts.total} isBold />
                    <SummaryRow label="Included in Return" count={summary.counts.included} isBold indent color="text-google-green" />
                    <SummaryRow label="Included in HSN/SAC Summary" count={Object.keys(summary.hsn).length} indent={2} />
                    <SummaryRow label="Incomplete Information (Corrections needed)" count={summary.counts.uncertain} indent={2} color="text-google-red" />
                    <SummaryRow label="Not relevant in this Return" count={summary.counts.notRelevant} isBold indent color="text-slate-400" />
                    <SummaryRow label="Uncertain Transactions (Corrections needed)" count={summary.counts.uncertain} isBold indent color="text-google-yellow" />
                </div>
            </div>

            {/* Nature of Transactions Table - Google Aesthetic */}
            <div className="glass-panel border border-white/10 overflow-hidden shadow-2xl rounded-3xl">
                <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                        <tr className="bg-google-blue/10 border-b border-white/10 text-google-blue">
                            <th className="px-6 py-4 font-black uppercase tracking-widest">Nature of Transaction</th>
                            <th className="px-4 py-4 font-black uppercase tracking-widest text-center">Vch Count</th>
                            <th className="px-4 py-4 font-black uppercase tracking-widest text-right">Taxable</th>
                            <th className="px-4 py-4 font-black uppercase tracking-widest text-right border-x border-white/5">IGST</th>
                            <th className="px-4 py-4 font-black uppercase tracking-widest text-right border-x border-white/5">CGST</th>
                            <th className="px-4 py-4 font-black uppercase tracking-widest text-right border-x border-white/5">SGST</th>
                            <th className="px-4 py-4 font-black uppercase tracking-widest text-right border-x border-white/5">Cess</th>
                            <th className="px-6 py-4 font-black uppercase tracking-widest text-right">Invoice Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <TransactionRow sl="1" label="B2B Invoices - 4A, 4B, 4C, 6B, 6C" data={summary.b2b} onClick={() => handleDrillDown('B2B Invoices', summary.b2b.vouchers)} formatCurrency={formatCurrency} />
                        <TransactionRow sl="2" label="B2C(Large) Invoices - 5A, 5B" data={summary.b2cl} onClick={() => handleDrillDown('B2C Large', summary.b2cl.vouchers)} formatCurrency={formatCurrency} />
                        <TransactionRow sl="3" label="B2C(Small) Invoices - 7" data={summary.b2cs} onClick={() => handleDrillDown('B2C Small', summary.b2cs.vouchers)} formatCurrency={formatCurrency} />
                        <TransactionRow sl="4" label="Credit/Debit Notes(Registered) - 9B" data={summary.cdnr} onClick={() => handleDrillDown('Credit/Debit Notes (Reg)', summary.cdnr.vouchers)} formatCurrency={formatCurrency} />
                        <TransactionRow sl="5" label="Credit/Debit Notes(Unregistered) - 9B" data={summary.cdnur} onClick={() => handleDrillDown('Credit/Debit Notes (Unreg)', summary.cdnur.vouchers)} formatCurrency={formatCurrency} />
                        <TransactionRow sl="6" label="Exports Invoices - 6A" data={summary.exp} onClick={() => handleDrillDown('Exports', summary.exp.vouchers)} formatCurrency={formatCurrency} />
                        <TransactionRow sl="7" label="Tax Liability(Advances received) - 11A(1), 11A(2)" data={summary.advances} onClick={() => handleDrillDown('Advances', summary.advances.vouchers)} formatCurrency={formatCurrency} />
                        <TransactionRow sl="8" label="Adjustment of Advances - 11B(1), 11B(2)" data={summary.adjustments} onClick={() => handleDrillDown('Adjustments', summary.adjustments.vouchers)} formatCurrency={formatCurrency} />
                        <TransactionRow sl="9" label="Nil Rated Invoices - 8A, 8B, 8C, 8D" data={summary.nil} onClick={() => handleDrillDown('Nil Rated', summary.nil.vouchers)} formatCurrency={formatCurrency} />

                        {/* Total Footer: Vibrant Green */}
                        <tr className="bg-google-green/5 font-black text-foreground border-t-2 border-google-blue/10">
                            <td className="px-6 py-5 uppercase tracking-[0.3em] text-google-blue">Consolidated Total</td>
                            <td className="px-4 py-5 text-center tabular-nums text-google-blue">{summary.counts.included}</td>
                            <td className="px-4 py-5 text-right tabular-nums">{formatCurrency(summary.consolidated.taxable)}</td>
                            <td className="px-4 py-5 text-right tabular-nums border-x border-white/5">{formatCurrency(summary.consolidated.igst)}</td>
                            <td className="px-4 py-5 text-right tabular-nums border-x border-white/5">{formatCurrency(summary.consolidated.cgst)}</td>
                            <td className="px-4 py-5 text-right tabular-nums border-x border-white/5">{formatCurrency(summary.consolidated.sgst)}</td>
                            <td className="px-4 py-5 text-right tabular-nums border-x border-white/5">{formatCurrency(summary.consolidated.cess)}</td>
                            <td className="px-6 py-5 text-right tabular-nums text-xl tracking-tighter text-google-green drop-shadow-sm">{formatCurrency(summary.consolidated.total)}</td>
                        </tr>

                        {/* Bottom Summary Links: Interactive Primary */}
                        <tr className="border-t border-white/5 hover:bg-google-blue/5 transition-all cursor-pointer group" onClick={() => handleDrillDown('HSN Summary', [])}>
                            <td colSpan={2} className="px-6 py-4 font-bold uppercase tracking-[0.2em] text-muted-foreground group-hover:text-google-blue transition-colors">HSN/SAC Summary // Table 12</td>
                            <td colSpan={6} className="px-6 py-4 text-right tabular-nums font-black text-google-blue">{Object.keys(summary.hsn).length} Records</td>
                        </tr>
                        <tr className="hover:bg-google-blue/5 transition-all cursor-pointer group" onClick={() => handleDrillDown('Document Summary', [])}>
                            <td colSpan={2} className="px-6 py-4 font-bold uppercase tracking-[0.2em] text-muted-foreground group-hover:text-google-blue transition-colors">Document Summary // Table 13</td>
                            <td colSpan={6} className="px-6 py-4 text-right tabular-nums font-black text-google-blue">
                                {summary.docs.invoices.count + summary.docs.creditNotes.count + summary.docs.debitNotes.count} Documents
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Advance Receipts Bottom Info - Brand Elements */}
            <div className="space-y-4 px-8 no-print pt-6 border-t border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-google-yellow shadow-lg shadow-google-yellow/20" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Treasury Adjustments</h3>
                </div>
                <div className="grid grid-cols-2 gap-12">
                    <div className="flex justify-between border-b border-google-blue/10 pb-3 group">
                        <p className="text-[11px] font-medium text-muted-foreground group-hover:text-google-blue transition-colors">Unadjusted Advances</p>
                        <p className="text-[11px] font-black tabular-nums">{formatCurrency(0)}</p>
                    </div>
                    <div className="flex justify-between border-b border-google-blue/10 pb-3 group">
                        <p className="text-[11px] font-medium text-muted-foreground group-hover:text-google-blue transition-colors">Settled Advances (Prev. Periods)</p>
                        <p className="text-[11px] font-black tabular-nums">{formatCurrency(0)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SummaryRow({ label, count, isBold, indent, color = "text-foreground" }: { label: string, count: number, isBold?: boolean, indent?: number | boolean, color?: string }) {
    return (
        <div className={clsx(
            "px-6 py-2.5 flex justify-between items-center transition-colors hover:bg-google-blue/5 group",
            isBold && "font-black"
        )}>
            <div className="flex items-center gap-2">
                <span className={clsx(
                    "text-[11px]",
                    indent === true && "ml-6 underline decoration-google-blue/20 underline-offset-4",
                    indent === 2 && "ml-12 text-muted-foreground",
                    color
                )}>{label}</span>
            </div>
            <span className="text-[11px] font-black tabular-nums group-hover:text-google-blue">{count}</span>
        </div>
    );
}

function TransactionRow({ sl, label, data, onClick, formatCurrency }: { sl: string, label: string, data: any, onClick: () => void, formatCurrency: any }) {
    const hasVouchers = data.vouchers.length > 0;
    return (
        <tr className={clsx(
            "transition-all group",
            hasVouchers ? "hover:bg-google-blue/5 cursor-pointer" : "opacity-40"
        )} onClick={hasVouchers ? onClick : undefined}>
            <td className="px-6 py-4">
                <div className="flex items-start gap-4">
                    <span className="text-muted-foreground/40 font-black shrink-0">{sl}</span>
                    <span className="font-bold tracking-tight text-foreground group-hover:text-google-blue">{label}</span>
                </div>
            </td>
            <td className="px-4 py-4 text-center tabular-nums font-black text-muted-foreground group-hover:text-google-blue">{data.vouchers.length}</td>
            <td className="px-4 py-4 text-right tabular-nums font-black text-foreground">{formatCurrency(data.taxable)}</td>
            <td className="px-4 py-4 text-right tabular-nums font-black text-foreground border-x border-white/5">{formatCurrency(data.igst)}</td>
            <td className="px-4 py-4 text-right tabular-nums font-black text-foreground border-x border-white/5">{formatCurrency(data.cgst)}</td>
            <td className="px-4 py-4 text-right tabular-nums font-black text-foreground border-x border-white/5">{formatCurrency(data.sgst)}</td>
            <td className="px-4 py-4 text-right tabular-nums font-black text-foreground border-x border-white/5">{formatCurrency(data.cess)}</td>
            <td className="px-6 py-4 text-right tabular-nums font-black text-foreground group-hover:scale-105 transition-transform">{formatCurrency(data.total)}</td>
        </tr>
    );
}

function GstrVoucherTable({ vouchers, ledgers, formatCurrency, stockItems = [] }: { vouchers: Voucher[], ledgers: Ledger[], formatCurrency: any, stockItems?: StockItem[] }) {
    return (
        <table className="w-full text-left">
            <thead>
                <tr className="bg-muted/30 border-b border-white/10">
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Voucher Identification</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Party Details</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right border-x border-white/10">Taxable</th>
                    <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right border-x border-white/10">IGST</th>
                    <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right border-x border-white/10">CGST</th>
                    <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right border-x border-white/10">SGST</th>
                    <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right border-x border-white/10">Cess</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right">Inv Value</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {vouchers.map((v, i) => {
                    const partyRow = v.rows.find(r => {
                        const l = ledgers.find(led => led.name === r.account);
                        return l?.group === 'Sundry Debtors' || l?.group === 'Sundry Creditors';
                    });
                    const summary = TaxService.calculateVoucherSummary(v, ledgers, stockItems);
                    const party = ledgers.find(l => l.name === partyRow?.account);

                    return (
                        <tr key={i} className="hover:bg-primary/5 transition-colors">
                            <td className="px-10 py-6">
                                <div className="font-black text-lg text-foreground tracking-tighter">{v.voucherNo}</div>
                                <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">{v.date}</div>
                            </td>
                            <td className="px-10 py-6">
                                <div className="font-bold text-sm text-foreground">{party?.name || 'Cash Sales'}</div>
                                <div className="text-[9px] font-black text-primary uppercase tracking-widest">{party?.gstin || 'Unregistered'}</div>
                            </td>
                            <td className="px-6 py-6 text-right font-black text-foreground tabular-nums tracking-tighter border-x border-white/10">{formatCurrency(summary.taxableValue)}</td>
                            <td className="px-4 py-6 text-right font-black text-primary tabular-nums tracking-tighter border-x border-white/10">{formatCurrency(summary.igst)}</td>
                            <td className="px-4 py-6 text-right font-black text-primary tabular-nums tracking-tighter border-x border-white/10">{formatCurrency(summary.cgst)}</td>
                            <td className="px-4 py-6 text-right font-black text-primary tabular-nums tracking-tighter border-x border-white/10">{formatCurrency(summary.sgst)}</td>
                            <td className="px-4 py-6 text-right font-black text-primary tabular-nums tracking-tighter border-x border-white/10">{formatCurrency(summary.cess)}</td>
                            <td className="px-8 py-6 text-right font-black text-foreground tabular-nums tracking-tighter">{formatCurrency(summary.invoiceValue)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

function GstrHsnTable({ hsnData, formatCurrency }: { hsnData: Gstr1Summary['hsn'], formatCurrency: any }) {
    return (
        <table className="w-full text-left">
            <thead>
                <tr className="bg-muted/30 border-b border-white/10">
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">HSN/SAC</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Description</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">UOM</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">Qty</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right border-x border-white/10">Taxable Value</th>
                    <th className="px-12 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right">Tax Amount</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {Object.values(hsnData).map((data, i) => (
                    <tr key={i} className="hover:bg-primary/5 transition-colors text-[11px]">
                        <td className="px-10 py-6 font-black text-google-blue">{data.hsnCode}</td>
                        <td className="px-10 py-6 font-bold">{data.description}</td>
                        <td className="px-6 py-6 text-center text-muted-foreground">{data.uom}</td>
                        <td className="px-6 py-6 text-center tabular-nums font-bold">{data.qty}</td>
                        <td className="px-8 py-6 text-right font-black tabular-nums border-x border-white/10">{formatCurrency(data.taxable)}</td>
                        <td className="px-12 py-6 text-right font-black text-primary tabular-nums tracking-tighter">{formatCurrency(data.tax)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function GstrDocTable({ docs }: { docs: Gstr1Summary['docs'] }) {
    const rows = [
        { label: 'Invoices for outward supply', ...docs.invoices },
        { label: 'Credit Notes', ...docs.creditNotes },
        { label: 'Debit Notes', ...docs.debitNotes }
    ];

    return (
        <table className="w-full text-left">
            <thead>
                <tr className="bg-muted/30 border-b border-white/10">
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Nature of Document</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">From</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">To</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center border-x border-white/10">Total Number</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">Cancelled</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-primary/5 transition-colors text-[11px]">
                        <td className="px-10 py-6 font-bold">{row.label}</td>
                        <td className="px-10 py-6 text-center tabular-nums">{row.from || '-'}</td>
                        <td className="px-10 py-6 text-center tabular-nums">{row.to || '-'}</td>
                        <td className="px-10 py-6 text-center tabular-nums font-black border-x border-white/10">{row.count}</td>
                        <td className="px-10 py-6 text-center tabular-nums text-google-red">{row.cancelled}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
function GstrB2csRateWiseTable({ b2csData, formatCurrency }: { b2csData: Gstr1Summary['b2csRateWise'], formatCurrency: any }) {
    const sortedData = Object.values(b2csData).sort((a, b) => a.pos.localeCompare(b.pos) || a.rate - b.rate);

    return (
        <table className="w-full text-left">
            <thead>
                <tr className="bg-muted/30 border-b border-white/10">
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Place of Supply (State)</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center">Tax Rate</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right border-x border-white/10">Taxable Value</th>
                    <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right border-x border-white/10">IGST</th>
                    <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right border-x border-white/10">CGST</th>
                    <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right border-x border-white/10">SGST</th>
                    <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right border-x border-white/10">Cess</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-right">Tax Amount</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {sortedData.map((data, i) => (
                    <tr key={i} className="hover:bg-primary/5 transition-colors text-[11px]">
                        <td className="px-10 py-6 font-bold">{data.pos}</td>
                        <td className="px-6 py-6 text-center tabular-nums font-black text-google-blue">{data.rate}%</td>
                        <td className="px-8 py-6 text-right font-black tabular-nums border-x border-white/10">{formatCurrency(data.taxable)}</td>
                        <td className="px-4 py-6 text-right font-black text-primary tabular-nums tracking-tighter border-x border-white/10">{formatCurrency(data.igst)}</td>
                        <td className="px-4 py-6 text-right font-black text-primary tabular-nums tracking-tighter border-x border-white/10">{formatCurrency(data.cgst)}</td>
                        <td className="px-4 py-6 text-right font-black text-primary tabular-nums tracking-tighter border-x border-white/10">{formatCurrency(data.sgst)}</td>
                        <td className="px-4 py-6 text-right font-black text-primary tabular-nums tracking-tighter border-x border-white/10">{formatCurrency(data.cess)}</td>
                        <td className="px-8 py-6 text-right font-black text-google-green tabular-nums tracking-tighter">
                            {formatCurrency(data.igst + data.cgst + data.sgst + data.cess)}
                        </td>
                    </tr>
                ))}
            </tbody>
            {sortedData.length > 0 && (
                <tfoot>
                    <tr className="bg-google-blue/5 font-black border-t border-white/10">
                        <td colSpan={2} className="px-10 py-6 text-[10px] uppercase tracking-widest text-google-blue">Category Total</td>
                        <td className="px-8 py-6 text-right tabular-nums border-x border-white/10">{formatCurrency(sortedData.reduce((s, d) => s + d.taxable, 0))}</td>
                        <td className="px-4 py-6 text-right tabular-nums border-x border-white/10">{formatCurrency(sortedData.reduce((s, d) => s + d.igst, 0))}</td>
                        <td className="px-4 py-6 text-right tabular-nums border-x border-white/10">{formatCurrency(sortedData.reduce((s, d) => s + d.cgst, 0))}</td>
                        <td className="px-4 py-6 text-right tabular-nums border-x border-white/10">{formatCurrency(sortedData.reduce((s, d) => s + d.sgst, 0))}</td>
                        <td className="px-4 py-6 text-right tabular-nums border-x border-white/10">{formatCurrency(sortedData.reduce((s, d) => s + d.cess, 0))}</td>
                        <td className="px-8 py-6 text-right tabular-nums text-lg text-google-green">
                            {formatCurrency(sortedData.reduce((s, d) => s + (d.igst + d.cgst + d.sgst + d.cess), 0))}
                        </td>
                    </tr>
                </tfoot>
            )}
        </table>
    );
}
