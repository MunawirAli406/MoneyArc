
// Mock Voucher Data (Same as before)
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
    },
    // Edge Case: Discount on Sale
    {
        id: 'v3',
        voucherNo: 'V-003',
        type: 'Sales',
        rows: [
            { type: 'Dr', account: 'Customer B', debit: 108, credit: 0 }, // Receives invoice value
            { type: 'Dr', account: 'Discount Allowed', debit: 10, credit: 0 }, // Expense
            { type: 'Cr', account: 'Sales Product', debit: 0, credit: 118 }, // Gross Sales (incl tax maybe? No usually Sales is net)
            // Wait. If Sales is 100 + 18 Tax = 118.
            // If Discount 10. Customer pays 108.
            // So Cr Sales 100. Cr Output Tax 18. Dr Discount 10. Dr Customer 108.
            // Total Cr = 118. Total Dr = 118.
            // Taxable Value should be 100 (Sales).
            // Invoice Value should be 118? Or 108? Usually Invoice Value is what Customer Pays (108).
        ]
    }
];

// Let's model V3 correctly for a standard GST invoice with discount
const mockVouchersWithDiscount = [
    {
        id: 'v3',
        voucherNo: 'V-003',
        type: 'Sales',
        rows: [
            { type: 'Dr', account: 'Customer B', debit: 106.2, credit: 0 },
            { type: 'Dr', account: 'Discount Allowed', debit: 10, credit: 0 },
            { type: 'Cr', account: 'Sales Product', debit: 0, credit: 100 },
            { type: 'Cr', account: 'Output CGST', debit: 0, credit: 8.1 }, // 9% of (100-10) = 90? Or GST on Gross?
            // Usually GST is on Net Taxable. If Discount is Trade Discount.
            // If Trade Discount: Sales is recorded as 90 directly.
            // If Cash Discount: GST is on 100.
            // Let's assume GST on 90 (Trade Discount logic implied if Sales is reduced).
            // But here Sales is 100. So Discount is an expense. GST on 100 = 18.
            { type: 'Cr', account: 'Output SGST', debit: 0, credit: 8.1 }
            // 100 - 10 = 90 Taxable. 18% of 90 = 16.2. 8.1 each.
            // Dr Customer: 90 + 16.2 = 106.2.
            // Dr Discount: 10.
            // Cr Sales: 100.
            // Cr Tax: 16.2.
            // Total Cr: 116.2. Total Dr: 116.2.
        ]
    }
];

// New Logic Test
console.log('--- Testing Robust Logic ---');

mockVouchers.concat(mockVouchersWithDiscount).forEach(v => {
    if (v.type !== 'Sales') return;

    let voucherTotalDr = 0;
    let voucherTaxCr = 0;
    let voucherSalesCr = 0;

    v.rows.forEach(r => {
        const acc = r.account.toLowerCase();
        const amount = r.credit || r.debit || 0;

        if (r.type === 'Dr') {
            // Check if it's NOT a tax ledger (Input Tax is Dr)
            if (!acc.includes('gst') && !acc.includes('tax')) {
                voucherTotalDr += amount; // Customer + Discount
            }
        } else {
            // Credit Side
            if (acc.includes('gst') || acc.includes('tax') || acc.includes('duty')) {
                voucherTaxCr += amount;
            } else {
                voucherSalesCr += amount; // Sales Income
            }
        }
    });

    // Calculated derived values
    const derivedTaxable = voucherSalesCr; // Sum of non-tax credits
    const derivedInvoiceValue = voucherTotalDr; // Sum of non-tax debits (Customer + Expense)

    console.log(`Voucher ${v.voucherNo}:`);
    console.log(`  Sales Cr (Taxable?): ${voucherSalesCr}`);
    console.log(`  Tax Cr: ${voucherTaxCr}`);
    console.log(`  Total Dr (Invoice Val?): ${voucherTotalDr}`);

    // Check against standard formula
    // Invoice Value usually means "Total Bill Value" which is what the customer owes.
    // If there is discount, the Invoice Value the customer sees is 106.2.
    // But for GST Returns, "Total Invoice Value" usually implies the Gross value? 
    // Actually GSTR-1 requires "Total Invoice Value".
    // If I have a bill for 100 + 18 tax = 118.
    // Total Invoice Value = 118.
    // Taxable Value = 100.

    // In V3 (Discount):
    // Customer pays 106.2. Discount 10.
    // Is the Invoice Value 116.2 or 106.2?
    // Legally, the Invoice Value is the Receivables + Cash received. 
    // It should exclude internal expenses like Discount Allowed (unless strictly Trade Discount reducing the Sales figure).

    // CURRENT IMPLEMENTATION: sums 'Sales' and 'Tax' to get Invoice Value.
    // V3: Sales(100) + Tax(16.2) = 116.2.
    // Customer Dr(106.2) + Discount Dr(10) = 116.2.
    // So "Taxable + Tax" = "Total Debits".
    // This seems consistent.
});
