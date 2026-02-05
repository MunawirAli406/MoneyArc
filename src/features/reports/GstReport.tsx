import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowUpRight, ArrowDownRight, IndianRupee, FileDown, Calculator } from 'lucide-react';
import { usePersistence } from '../../services/persistence/PersistenceContext';
import { ExportService } from '../../services/reports/ExportService';
import type { Voucher } from '../../services/accounting/VoucherService';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export default function GstReport() {
    const navigate = useNavigate();
    const { provider, activeCompany } = usePersistence();
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (provider && activeCompany) {
                const data = await provider.read<Voucher[]>('vouchers.json', activeCompany.path) || [];
                setVouchers(data);
                setLoading(false);
            }
        };
        loadData();
    }, [provider, activeCompany]);

    // Simple GST Logic:
    // Output GST: From Sales (Cr side of GST Ledger)
    // Input GST: From Purchases (Dr side of GST Ledger)

    let totalOutput = 0;
    let totalInput = 0;

    vouchers.forEach(v => {
        v.rows.forEach(r => {
            const acc = r.account.toLowerCase();
            if (acc.includes('sales') || acc.includes('output gst')) {
                if (r.type === 'Cr') totalOutput += r.credit;
            }
            if (acc.includes('purchase') || acc.includes('input gst')) {
                if (r.type === 'Dr') totalInput += r.debit;
            }
        });
    });

    if (loading) return <div className="p-8">Loading GST Data...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto space-y-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">GST Overview</h1>
                    <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px] mt-1">GSTR-3B Summary for {activeCompany?.name}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            const rows = [
                                ['Total Output Tax', `INR ${totalOutput.toLocaleString()}`],
                                ['Eligible ITC', `INR ${totalInput.toLocaleString()}`],
                                ['Net Tax Payable', `INR ${Math.max(0, totalOutput - totalInput).toLocaleString()}`],
                                ['CGST (Central)', `INR ${(totalOutput * 0.5).toLocaleString()}`],
                                ['SGST (State)', `INR ${(totalOutput * 0.5).toLocaleString()}`],
                            ];
                            ExportService.exportToPDF('GST Overview', ['Component', 'Value'], rows, activeCompany);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-xl text-xs font-black uppercase tracking-widest hover:bg-muted transition-all"
                    >
                        <FileDown className="w-4 h-4" />
                        Export PDF
                    </button>
                    <button
                        onClick={() => {
                            const columns = ['Tax Head', 'Output Tax', 'Input Credit (ITC)', 'Net Payable'];
                            const rows = [
                                ['CGST (Central Tax)', totalOutput * 0.5, totalInput * 0.5, (totalOutput * 0.5) - (totalInput * 0.5)],
                                ['SGST (State Tax)', totalOutput * 0.5, totalInput * 0.5, (totalOutput * 0.5) - (totalInput * 0.5)],
                                ['IGST (Integrated Tax)', 0, 0, 0],
                                ['GRAND TOTAL', totalOutput, totalInput, totalOutput - totalInput]
                            ];
                            ExportService.exportToExcel('GST Report Summary', columns, rows);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-xl text-xs font-black uppercase tracking-widest hover:bg-muted transition-all"
                    >
                        <IndianRupee className="w-4 h-4 text-emerald-500" />
                        Export Excel
                    </button>
                    <button
                        onClick={() => navigate('/reports/gst/r1')}
                        className="flex items-center gap-2 px-6 py-2.5 bg-card border border-border rounded-xl text-xs font-black uppercase tracking-widest hover:bg-muted transition-all"
                    >
                        <FileText className="w-4 h-4" />
                        GSTR-1 Details
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all shadow-md shadow-primary/10">
                        <FileText className="w-4 h-4" />
                        File Return
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Output Tax', value: totalOutput, icon: ArrowUpRight, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                    { label: 'Eligible ITC', value: totalInput, icon: ArrowDownRight, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                    { label: 'Net Tax Payable', value: Math.max(0, totalOutput - totalInput), icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="bg-card p-6 rounded-3xl border border-border flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-foreground tracking-tight">₹{stat.value.toLocaleString()}</p>
                        </div>
                        <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => navigate('/reports/gst/r1')}
                    className="flex-1 p-8 bg-card rounded-[2.5rem] border border-border hover:border-primary transition-all text-left group shadow-sm hover:shadow-xl"
                >
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest mb-1">GSTR-1 Details</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Outward Supplies Detail</p>
                </button>
                <button
                    onClick={() => navigate('/reports/gst/r3b')}
                    className="flex-1 p-8 bg-card rounded-[2.5rem] border border-border hover:border-indigo-500 transition-all text-left group shadow-sm hover:shadow-xl"
                >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                        <Calculator className="w-6 h-6" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest mb-1">GSTR-3B Summary</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Self-Assessment Summary</p>
                </button>
            </div>

            <div className="bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
                <div className="p-8 border-b border-border bg-muted/20 flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Tax Component Breakup</h2>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-cyan-500/10 text-cyan-500 text-[10px] font-bold rounded-full uppercase tracking-widest">ITC Verified</span>
                    </div>
                </div>
                <div className="p-8">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-4">
                                <th className="pb-4">Tax Head</th>
                                <th className="pb-4">Output Tax</th>
                                <th className="pb-4">Input Credit (ITC)</th>
                                <th className="pb-4 text-right">Net Payable</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {[
                                { head: 'CGST (Central Tax)', out: totalOutput * 0.5, in: totalInput * 0.5 },
                                { head: 'SGST (State Tax)', out: totalOutput * 0.5, in: totalInput * 0.5 },
                                { head: 'IGST (Integrated Tax)', out: 0, in: 0 },
                            ].map((row, i) => (
                                <tr key={i} className="group hover:bg-muted/10 transition-colors">
                                    <td className="py-5 font-bold text-foreground">{row.head}</td>
                                    <td className="py-5 font-mono text-sm text-rose-500">₹{row.out.toLocaleString()}</td>
                                    <td className="py-5 font-mono text-sm text-cyan-500">₹{row.in.toLocaleString()}</td>
                                    <td className="py-5 font-black text-foreground text-right">₹{(row.out - row.in).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-muted/40 font-black">
                                <td className="py-6 px-1 text-sm uppercase tracking-widest">Grand Total</td>
                                <td className="py-6 font-mono text-rose-500 text-lg">₹{totalOutput.toLocaleString()}</td>
                                <td className="py-6 font-mono text-cyan-500 text-lg">₹{totalInput.toLocaleString()}</td>
                                <td className="py-6 text-right text-lg">₹{(totalOutput - totalInput).toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}
