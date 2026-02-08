import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Voucher } from "../accounting/VoucherService";
import type { Ledger } from "../accounting/ReportService";

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    async generateInsight(
        question: string,
        contextData: { vouchers: Voucher[], ledgers: Ledger[], companyName: string, symbol: string }
    ): Promise<string> {
        try {
            // Simplify data for token efficiency
            const voucherSummary = contextData.vouchers.slice(0, 50).map(v =>
                `${v.date}: ${v.type} #${v.voucherNo} - ${v.narration || 'No narrative'} (Values: ${v.rows.map(r => `${r.account} ${r.type} ${r.debit || r.credit}`).join(', ')})`
            ).join('\n');

            const ledgerSummary = contextData.ledgers.map(l =>
                `${l.name} (${l.group}): ${contextData.symbol}${l.balance} ${l.type}`
            ).join('\n');

            const prompt = `
You are MoneyArc AI, an expert financial assistant for the company "${contextData.companyName}".
analyze the following financial data and answer the user's question.

Data Context:
--- LEDGERS ---
${ledgerSummary}

--- RECENT TRANSACTIONS (Last 50) ---
${voucherSummary}
----------------

User Question: "${question}"

Guidelines:
- Be concise and professional.
- Use currency format (${contextData.symbol}).
- If data is insufficient, say so.
- Highlight key trends if asked.
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();

        } catch (error: any) {
            console.error("Gemini API Error:", error);
            // Return the actual error message for debugging
            return `I encountered an error connecting to Gemini. Details: ${error.message || error}`;
        }
    }
}
