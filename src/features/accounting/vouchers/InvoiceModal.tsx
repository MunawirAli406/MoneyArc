import { useRef } from 'react';
import { Printer, X, FileText } from 'lucide-react';
import type { Voucher } from '../../../services/accounting/VoucherService';
import type { Company } from '../../../services/persistence/types';
import type { Ledger } from '../../../services/accounting/ReportService';

interface InvoiceModalProps {
    voucher: Voucher;
    company: Company;
    customer: Ledger;
    onClose: () => void;
}

export default function InvoiceModal({ voucher, company, customer, onClose }: InvoiceModalProps) {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    const taxableValue = voucher.rows.find((r) => r.type === 'Cr' && !r.account.includes('GST'))?.credit || 0;
    const cgst = voucher.rows.find((r) => r.account.includes('Central GST'))?.credit || 0;
    const sgst = voucher.rows.find((r) => r.account.includes('State GST'))?.credit || 0;
    const igst = voucher.rows.find((r) => r.account.includes('Integrated GST'))?.credit || 0;
    const totalAmount = taxableValue + cgst + sgst + igst;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-card text-foreground w-full max-w-4xl h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col no-print-modal">
                {/* Modal Toolbar */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <FileText className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-black uppercase tracking-tight">Tax Invoice Preview</h2>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-full uppercase">{voucher.voucherNo}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
                        >
                            <Printer className="w-4 h-4" />
                            Print Invoice
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-muted rounded-xl transition-all"
                        >
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* Printable Content */}
                <div ref={printRef} className="p-12 print:p-8 flex-1 bg-card printable-area">
                    <style>{`
                        @media print {
                            body * { visibility: hidden; }
                            .printable-area, .printable-area * { visibility: visible; }
                            .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
                            .no-print-modal { box-shadow: none !important; border: none !important; }
                        }
                    `}</style>
                    <div className="flex justify-between items-start border-b-2 border-foreground pb-8 mb-8">
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase text-foreground">{company.name}</h1>
                            <p className="text-sm font-bold text-muted-foreground mt-2 max-w-xs">{company.address}</p>
                            <div className="mt-4 inline-block px-3 py-1 bg-muted rounded-lg">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">GSTIN: <span className="text-foreground">{company.gstin}</span></p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-6xl font-black text-muted/10 uppercase tracking-tighter mb-2 leading-none">INVOICE</h2>
                            <p className="text-sm font-black text-foreground mt-4 uppercase tracking-widest"># {voucher.voucherNo}</p>
                            <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest">Date: {voucher.date}</p>
                        </div>
                    </div>

                    {/* Parties */}
                    <div className="grid grid-cols-2 gap-12 mb-12">
                        <div className="p-6 bg-muted/30 rounded-3xl border border-border">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Bill To</p>
                            <h3 className="text-xl font-black text-foreground uppercase">{customer.name}</h3>
                            <p className="text-sm font-bold text-muted-foreground mt-2 whitespace-pre-line">{customer.address || "Address not provided"}</p>
                            <p className="text-xs font-black text-foreground mt-3 uppercase tracking-widest">GSTIN: {customer.gstin || "URD"}</p>
                        </div>
                        <div className="p-6 bg-muted/30 rounded-3xl border border-border">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Ship From</p>
                                <h3 className="text-xl font-black text-foreground uppercase">{company.name}</h3>
                                <p className="text-sm font-bold text-muted-foreground mt-2">{company.address}</p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-b-2 border-foreground text-left">
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</th>
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Qty</th>
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Rate</th>
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {voucher.rows.find((r) => r.inventoryAllocations)?.inventoryAllocations?.map((item, idx: number) => (
                                <tr key={idx}>
                                    <td className="py-6 font-black text-foreground uppercase">
                                        Item {item.itemId}
                                        <div className="text-[9px] text-muted-foreground font-bold mt-1">BATCH: {item.batchNo || '-'} // EXP: {item.expiryDate || '-'}</div>
                                    </td>
                                    <td className="py-6 text-right font-bold text-foreground">{item.quantity}</td>
                                    <td className="py-6 text-right font-bold text-foreground">₹{item.rate.toLocaleString()}</td>
                                    <td className="py-6 text-right font-black text-foreground">₹{item.amount.toLocaleString()}</td>
                                </tr>
                            )) || (
                                    <tr>
                                        <td className="py-6 font-black text-foreground uppercase">Sales / Outward Supplies</td>
                                        <td className="py-6 text-right font-bold text-foreground">1.00</td>
                                        <td className="py-6 text-right font-bold text-foreground">₹{taxableValue.toLocaleString()}</td>
                                        <td className="py-6 text-right font-black text-foreground">₹{taxableValue.toLocaleString()}</td>
                                    </tr>
                                )}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-full max-w-xs space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="font-bold text-muted-foreground uppercase tracking-widest">Taxable Total</span>
                                <span className="font-black text-foreground">₹{taxableValue.toLocaleString()}</span>
                            </div>
                            {cgst > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">CGST (Cent. Tax)</span>
                                    <span className="font-black text-foreground">₹{cgst.toLocaleString()}</span>
                                </div>
                            )}
                            {sgst > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">SGST (State Tax)</span>
                                    <span className="font-black text-foreground">₹{sgst.toLocaleString()}</span>
                                </div>
                            )}
                            {igst > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">IGST (Integ. Tax)</span>
                                    <span className="font-black text-foreground">₹{igst.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-4 border-t-2 border-foreground">
                                <span className="text-sm font-black uppercase tracking-widest text-foreground">Total Payable</span>
                                <span className="text-2xl font-black text-foreground tracking-tighter">₹{totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Notes */}
                    <div className="mt-20 pt-8 border-t border-border flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Terms & Conditions</p>
                            <ul className="text-[9px] font-bold text-muted-foreground space-y-1">
                                <li>1. Goods once sold will not be taken back.</li>
                                <li>2. Payment should be made within 15 days.</li>
                                <li>3. Interest @ 18% will be charged for delayed payments.</li>
                            </ul>
                        </div>
                        <div className="text-right">
                            <div className="w-48 h-20 border-b border-foreground mb-2"></div>
                            <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Authorized Signatory</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
