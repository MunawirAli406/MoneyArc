import { useRef } from 'react';
import { Printer, X } from 'lucide-react';
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

    const taxableValue = voucher.rows.find((r: any) => r.type === 'Cr' && !r.account.includes('GST'))?.credit || 0;
    const cgst = voucher.rows.find((r: any) => r.account.includes('Central GST'))?.credit || 0;
    const sgst = voucher.rows.find((r: any) => r.account.includes('State GST'))?.credit || 0;
    const igst = voucher.rows.find((r: any) => r.account.includes('Integrated GST'))?.credit || 0;
    const totalAmount = taxableValue + cgst + sgst + igst;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white text-slate-900 w-full max-w-4xl h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col no-print-modal">
                {/* Modal Toolbar */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-black uppercase tracking-tight">Tax Invoice Preview</h2>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase">{voucher.voucherNo}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                        >
                            <Printer className="w-4 h-4" />
                            Print Invoice
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-slate-100 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Printable Content */}
                <div ref={printRef} className="p-12 print:p-8 flex-1 bg-white printable-area">
                    <style>{`
                        @media print {
                            body * { visibility: hidden; }
                            .printable-area, .printable-area * { visibility: visible; }
                            .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
                            .no-print-modal { box-shadow: none !important; border: none !important; }
                        }
                    `}</style>

                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-900">{company.name}</h1>
                            <p className="text-sm font-bold text-slate-500 mt-2 max-w-xs">{company.address}</p>
                            <div className="mt-4 inline-block px-3 py-1 bg-slate-100 rounded-lg">
                                <p className="text-[10px] font-black uppercase tracking-widest">GSTIN: <span className="text-slate-900">{company.gstin}</span></p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-6xl font-black text-slate-100 uppercase tracking-tighter mb-2 leading-none">INVOICE</h2>
                            <p className="text-sm font-black text-slate-900 mt-4 uppercase tracking-widest"># {voucher.voucherNo}</p>
                            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Date: {voucher.date}</p>
                        </div>
                    </div>

                    {/* Parties */}
                    <div className="grid grid-cols-2 gap-12 mb-12">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Bill To</p>
                            <h3 className="text-xl font-black text-slate-900 uppercase">{customer.name}</h3>
                            <p className="text-sm font-bold text-slate-500 mt-2 whitespace-pre-line">{customer.address || "Address not provided"}</p>
                            <p className="text-xs font-black text-slate-900 mt-3 uppercase tracking-widest">GSTIN: {customer.gstin || "URD"}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Ship From</p>
                            <h3 className="text-xl font-black text-slate-900 uppercase">{company.name}</h3>
                            <p className="text-sm font-bold text-slate-500 mt-2">{company.address}</p>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-b-2 border-slate-900 text-left">
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Qty</th>
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Rate</th>
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* In a real app we'd map inventory items here. 
                                For now we show the main taxable ledger amount as a generic 'Sales' item if items aren't available */}
                            {voucher.rows.find((r: any) => r.inventoryAllocations)?.inventoryAllocations?.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="py-6 font-black text-slate-900 uppercase">
                                        {/* Needs a way to resolve item names from IDs */}
                                        Item {item.itemId}
                                        <div className="text-[9px] text-slate-400 font-bold mt-1">BATCH: {item.batchNo || '-'} // EXP: {item.expiryDate || '-'}</div>
                                    </td>
                                    <td className="py-6 text-right font-bold text-slate-900">{item.quantity}</td>
                                    <td className="py-6 text-right font-bold text-slate-900">₹{item.rate.toLocaleString()}</td>
                                    <td className="py-6 text-right font-black text-slate-900">₹{item.amount.toLocaleString()}</td>
                                </tr>
                            )) || (
                                    <tr>
                                        <td className="py-6 font-black text-slate-900 uppercase">Sales / Outward Supplies</td>
                                        <td className="py-6 text-right font-bold text-slate-900">1.00</td>
                                        <td className="py-6 text-right font-bold text-slate-900">₹{taxableValue.toLocaleString()}</td>
                                        <td className="py-6 text-right font-black text-slate-900">₹{taxableValue.toLocaleString()}</td>
                                    </tr>
                                )}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-full max-w-xs space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="font-bold text-slate-500 uppercase tracking-widest">Taxable Total</span>
                                <span className="font-black text-slate-900">₹{taxableValue.toLocaleString()}</span>
                            </div>
                            {cgst > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">CGST (Cent. Tax)</span>
                                    <span className="font-black text-slate-900">₹{cgst.toLocaleString()}</span>
                                </div>
                            )}
                            {sgst > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">SGST (State Tax)</span>
                                    <span className="font-black text-slate-900">₹{sgst.toLocaleString()}</span>
                                </div>
                            )}
                            {igst > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">IGST (Integ. Tax)</span>
                                    <span className="font-black text-slate-900">₹{igst.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-4 border-t-2 border-slate-900">
                                <span className="text-sm font-black uppercase tracking-widest">Total Payable</span>
                                <span className="text-2xl font-black text-slate-900 tracking-tighter">₹{totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Notes */}
                    <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Terms & Conditions</p>
                            <ul className="text-[9px] font-bold text-slate-500 space-y-1">
                                <li>1. Goods once sold will not be taken back.</li>
                                <li>2. Payment should be made within 15 days.</li>
                                <li>3. Interest @ 18% will be charged for delayed payments.</li>
                            </ul>
                        </div>
                        <div className="text-right">
                            <div className="w-48 h-20 border-b border-slate-900 mb-2"></div>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Authorized Signatory</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
