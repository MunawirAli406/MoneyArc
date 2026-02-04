import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Company } from '../persistence/types';

export class ExportService {
    static exportToPDF(title: string, columns: string[], rows: (string | number)[][], company: Company | null) {
        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString();

        // Add Header
        doc.setFontSize(22);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text("MoneyArc", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text("Professional Accounting Suite", 14, 26);

        // Company Details
        if (company) {
            doc.setFontSize(12);
            doc.setTextColor(15, 23, 42);
            doc.text(company.name, 14, 40);
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(`${company.address || 'Address not set'} | GST: ${company.gstin || 'No GSTIN'}`, 14, 45);
        }

        // Report Title
        doc.setFontSize(16);
        doc.setTextColor(14, 165, 233); // cyan-500
        doc.text(title.toUpperCase(), 14, 60);

        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated on: ${timestamp}`, 14, 65);

        // Table
        autoTable(doc, {
            startY: 75,
            head: [columns],
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3 },
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
            doc.text("MoneyArc - Accurate. Secure. Professional.", 14, doc.internal.pageSize.getHeight() - 10);
        }

        doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
    }
}
