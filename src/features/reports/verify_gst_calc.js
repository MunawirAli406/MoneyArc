
// Mock Voucher Data based on VoucherService structure
const mockVouchers = [
    {
        id: 'v1',
        voucherNo: 'V-001',
        type: 'Sales',
        rows: [
            { type: 'Dr', account: 'Customer A', debit: 118, credit: 0 },
            { type: 'Cr', account: 'Sales Account', debit: 0, credit: 100 },
            { type: 'Cr', account: 'Output CGST', debit: 0, credit: 9 },
            { type: 'Cr', account: 'Output SGST', debit: 0, credit: 9 }
        ]
    },
    {
        id: 'v2',
        voucherNo: 'V-002',
        type: 'Sales',
        rows: [
            { type: 'Dr', account: 'Cash', debit: 236, credit: 0 },
            { type: 'Cr', account: 'Sales Local', debit: 0, credit: 200 },
            { type: 'Cr', account: 'Output IGST', debit: 0, credit: 36 }
        ]
    }
];

// Current Logic Extraction
let totalTaxable = 0;
let outputCGST = 0;
let outputSGST = 0;
let outputIGST = 0;

mockVouchers.forEach(v => {
    console.log(`Processing Voucher ${v.voucherNo} (${v.type})`);
    v.rows.forEach(r => {
        const acc = r.account.toLowerCase();
        const amount = r.credit || r.debit || 0;

        console.log(`  Row: ${r.type} ${r.account} = ${amount}`);

        // Identify Tax Ledgers
        if (acc.includes('gst') || acc.includes('tax') || acc.includes('duty')) {
            const isOutput = r.type === 'Cr';
            if (acc.includes('igst')) {
                if (isOutput) outputIGST += amount;
            } else if (acc.includes('cgst')) {
                if (isOutput) outputCGST += amount;
            } else if (acc.includes('sgst')) {
                if (isOutput) outputSGST += amount;
            }
            console.log(`    -> Tax Identified: ${r.account}`);
        } else {
            // Logic being tested
            if (v.type === 'Sales' && r.type === 'Cr') {
                totalTaxable += amount;
                console.log(`    -> Taxable Value Added: ${amount}`);
            } else {
                console.log(`    -> Skipped (Not Sales Credit + Not Tax)`);
            }
        }
    });
});

const totalOutputTax = outputCGST + outputSGST + outputIGST;
const totalInvoiceValue = totalTaxable + totalOutputTax;

console.log('-----------------------------------');
console.log(`Total Taxable: ${totalTaxable}`);
console.log(`Output CGST: ${outputCGST}`);
console.log(`Output SGST: ${outputSGST}`);
console.log(`Output IGST: ${outputIGST}`);
console.log(`Total Tax: ${totalOutputTax}`);
console.log(`Total Invoice Value: ${totalInvoiceValue}`);
