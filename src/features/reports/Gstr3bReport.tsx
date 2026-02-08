import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { ExportService } from '../../services/reports/ExportService';
import type { Voucher } from '../../services/accounting/VoucherService';
import { useNavigate } from 'react-router-dom';
import { GstService } from '../../services/accounting/GstService';
import { useReportDates } from './DateContext';
import PeriodSelector from '../../components/ui/PeriodSelector';

export default function Gstr3bReport() {
    const { provider, activeCompany } = usePersistence();
    const navigate = useNavigate();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const { startDate, endDate } = useReportDates();

    useEffect(() => {
        const loadData = async () => {
            if (provider && activeCompany) {
                const vData = await provider.read<Voucher[]>('vouchers.json', activeCompany.path);
                setVouchers(vData || []);
                setLoading(false);
            }
        };
        loadData();
    }, [provider, activeCompany]);

    const filteredVouchers = vouchers.filter(v => v.date >= startDate && v.date <= endDate);

    const salesVouchers = filteredVouchers.filter(v => v.type === 'Sales');
    const purchaseVouchers = filteredVouchers.filter(v => v.type === 'Purchase');

    const salesSummary = GstService.aggregateSummaries(salesVouchers);
    const purchaseSummary = GstService.aggregateSummaries(purchaseVouchers);

    const outwardTaxable = salesSummary.taxableValue;
    const outwardTax = salesSummary.totalTax;
    const eligibleItc = purchaseSummary.totalTax;
    const netTaxPayable = outwardTax - eligibleItc;

    if (loading) return <div className="p-12 text-center text-muted-foreground font-black uppercase tracking-[0.3em] animate-pulse">Computing GSTR-3B Summary...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-6xl mx-auto space-y-8 pb-20"
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
                        <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">GSTR-3B Summary</h1>
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">
                            Monthly Self-Assessment Statement // {activeCompany?.name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <PeriodSelector />
                    <button
                        onClick={() => {
                            const cols = ['Description', 'Amount'];
                            const rows = [
                                ['Total Taxable Value (Sales)', outwardTaxable],
                                ['Total Outward Tax', outwardTax],
                                ['Total Eligible ITC (Purchases)', eligibleItc],
                                ['Net Tax Payable', netTaxPayable]
                            ];
                            ExportService.exportToExcel('GSTR-3B Summary', cols, rows);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
                    >
                        <Download className="w-4 h-4" />
                        Export Excel
                    </button>
                </div>
            </div>      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl">
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Total Outward Tax</p>
                    <p className="text-3xl font-black text-cyan-500">{activeCompany?.symbol || '₹'}{outwardTax.toLocaleString()}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                        Liability
                    </div>
                </div>
                <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl">
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Eligible ITC</p>
                    <p className="text-3xl font-black text-indigo-500">{activeCompany?.symbol || '₹'}{eligibleItc.toLocaleString()}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <TrendingDown className="w-3.5 h-3.5 text-indigo-500" />
                        Tax Credit
                    </div>
                </div>
                <div className={`bg-card p-8 rounded-[2.5rem] border border-border shadow-xl border-b-4 ${netTaxPayable >= 0 ? 'border-b-rose-500' : 'border-b-emerald-500'}`}>
                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Net Tax Payable</p>
                    <p className="text-3xl font-black">{activeCompany?.symbol || '₹'}{netTaxPayable.toLocaleString()}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <Calculator className="w-3.5 h-3.5 text-primary" />
                        Final Settlement
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-[3rem] border border-border overflow-hidden shadow-2xl">
                <div className="p-10 bg-muted/20 border-b border-border">
                    <h2 className="text-lg font-black uppercase tracking-tight">3.1 Details of Outward Supplies</h2>
                </div>
                <div className="p-10 space-y-8">
                    <div className="flex justify-between items-center py-6 border-b border-border/50">
                        <div>
                            <p className="font-black text-sm uppercase">Taxable outward supplies (other than zero rated, nil rated and exempted)</p>
                            <p className="text-[10px] font-bold text-muted-foreground">Total of all sales vouchers with tax</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Taxable Value</p>
                            <p className="text-xl font-black font-mono">{activeCompany?.symbol || '₹'}{outwardTaxable.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <p className="font-black text-sm uppercase text-muted-foreground">Tax breakup</p>
                        <div className="flex gap-12">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-muted-foreground uppercase">Output CGST</p>
                                <p className="text-lg font-bold font-mono">{activeCompany?.symbol || '₹'}{(outwardTax / 2).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-muted-foreground uppercase">Output SGST</p>
                                <p className="text-lg font-bold font-mono">{activeCompany?.symbol || '₹'}{(outwardTax / 2).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-[3rem] border border-border overflow-hidden shadow-2xl">
                <div className="p-10 bg-indigo-500/5 border-b border-border">
                    <h2 className="text-lg font-black uppercase tracking-tight text-indigo-600">4. Eligible ITC</h2>
                </div>
                <div className="p-10 space-y-8">
                    <div className="flex justify-between items-center py-6 border-b border-border/50">
                        <div>
                            <p className="font-black text-sm uppercase">All other ITC</p>
                            <p className="text-[10px] font-bold text-muted-foreground">Total tax paid on purchases</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">ITC Amount</p>
                            <p className="text-xl font-black font-mono text-indigo-600">{activeCompany?.symbol || '₹'}{eligibleItc.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
