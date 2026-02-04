import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Calendar, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { usePersistence } from '../../../services/persistence/PersistenceContext';
import { VoucherService, type Voucher, type VoucherRow } from '../../../services/accounting/VoucherService';
import type { Ledger } from '../../../services/accounting/ReportService';
import { useNavigate } from 'react-router-dom';

type VoucherType = 'Payment' | 'Receipt' | 'Journal' | 'Contra' | 'Sales' | 'Purchase';

export default function VoucherEntry() {
    const { provider, activeCompany } = usePersistence();
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
            if (provider && activeCompany) {
                const data = await provider.read<Ledger[]>('ledgers.json', activeCompany.path) || [];
                setLedgers(data);
            }
        };
        loadLedgers();
    }, [provider, activeCompany]);

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
        if (!provider || !activeCompany) {
            alert("Please set up data storage and select a company first!");
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

            await VoucherService.saveVoucher(provider, voucher, activeCompany.path);
            alert("Voucher Saved & Ledgers Updated!");
            navigate('/dashboard');

        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save voucher.");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto space-y-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Voucher Entry</h1>
                    <p className="text-muted-foreground font-medium">Record financial transactions for {activeCompany?.name}</p>
                </div>
                <div className="flex bg-muted rounded-xl p-1 gap-1">
                    {['Payment', 'Receipt', 'Journal', 'Sales', 'Purchase'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setVoucherType(type as VoucherType)}
                            className={clsx(
                                'px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all',
                                voucherType === type
                                    ? 'bg-card text-primary shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                            )}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                {/* Header Section */}
                <div className="p-8 border-b border-border bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Voucher No</label>
                            <input
                                type="text"
                                value={voucherNo}
                                onChange={(e) => setVoucherNo(e.target.value)}
                                className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                                <Calendar className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Reference No</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                placeholder="Ref #"
                            />
                        </div>
                    </div>
                </div>

                {/* Grid Section */}
                <div className="p-8">
                    <table className="w-full mb-6">
                        <thead>
                            <tr className="text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border">
                                <th className="pb-4 w-20">Dr/Cr</th>
                                <th className="pb-4 px-4">Particulars (Account)</th>
                                <th className="pb-4 w-36 text-right">Debit</th>
                                <th className="pb-4 w-36 text-right">Credit</th>
                                <th className="pb-4 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {rows.map((row) => (
                                <tr key={row.id} className="group transition-colors hover:bg-muted/10">
                                    <td className="py-3">
                                        <select
                                            value={row.type}
                                            onChange={(e) => updateRow(row.id, 'type', e.target.value)}
                                            className="w-full bg-transparent font-bold text-primary outline-none focus:ring-0 cursor-pointer"
                                        >
                                            <option value="Dr">Dr</option>
                                            <option value="Cr">Cr</option>
                                        </select>
                                    </td>
                                    <td className="py-3 px-4 relative">
                                        <input
                                            list={`ledgers-${row.id}`}
                                            value={row.account}
                                            onChange={(e) => updateRow(row.id, 'account', e.target.value)}
                                            className="w-full outline-none border-b-2 border-transparent focus:border-primary transition-all font-bold bg-transparent placeholder-muted-foreground/30 py-1"
                                            placeholder="Specify Ledger..."
                                        />
                                        <datalist id={`ledgers-${row.id}`}>
                                            {ledgers.map(l => (
                                                <option key={l.id} value={l.name} />
                                            ))}
                                        </datalist>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground/30 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-primary transition-colors" />
                                    </td>
                                    <td className="py-3 text-right">
                                        <input
                                            type="number"
                                            value={row.debit || ''}
                                            onChange={(e) => updateRow(row.id, 'debit', parseFloat(e.target.value))}
                                            disabled={row.type === 'Cr'}
                                            className={clsx(
                                                "w-full text-right outline-none bg-transparent transition-all font-mono font-bold",
                                                row.type === 'Dr' ? "text-foreground focus:text-primary" : "text-muted-foreground/20"
                                            )}
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="py-3 text-right">
                                        <input
                                            type="number"
                                            value={row.credit || ''}
                                            onChange={(e) => updateRow(row.id, 'credit', parseFloat(e.target.value))}
                                            disabled={row.type === 'Dr'}
                                            className={clsx(
                                                "w-full text-right outline-none bg-transparent transition-all font-mono font-bold",
                                                row.type === 'Cr' ? "text-foreground focus:text-primary" : "text-muted-foreground/20"
                                            )}
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="py-3 text-center">
                                        <button
                                            onClick={() => removeRow(row.id)}
                                            className="p-1.5 text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-border font-black text-foreground bg-muted/10">
                                <td colSpan={2} className="py-4 text-right pr-6 text-xs uppercase tracking-widest text-muted-foreground">Total Balance</td>
                                <td className="py-4 text-right px-2 font-mono text-cyan-500">{totalDebit.toFixed(2)}</td>
                                <td className="py-4 text-right px-2 font-mono text-cyan-500">{totalCredit.toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>

                    <button
                        onClick={addRow}
                        className="text-xs text-primary font-black uppercase tracking-widest hover:bg-primary/10 px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Add Line Item
                    </button>

                    <div className="mt-8 space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Narration / Remark</label>
                        <textarea
                            value={narration}
                            onChange={(e) => setNarration(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-muted/20 border border-input rounded-2xl focus:ring-2 focus:ring-primary outline-none resize-none font-medium transition-all"
                            placeholder="Enter transaction details..."
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-muted/30 border-t border-border flex items-center justify-end gap-3">
                    <button className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all">
                        Discard
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 shadow-md shadow-primary/10"
                    >
                        <Save className="w-5 h-5" />
                        <span className="font-black uppercase tracking-widest text-xs">Authorize & Save</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
