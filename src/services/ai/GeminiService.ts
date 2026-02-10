import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Voucher } from "../accounting/VoucherService";
import type { Ledger } from "../accounting/ReportService";

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        // Using 2.0-flash with v1beta version as it is the most stable for this model in early 2026
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" }, { apiVersion: "v1beta" });
    }

    async generateInsight(
        question: string,
        contextData: { vouchers: Voucher[], ledgers: Ledger[], companyName: string, symbol: string }
    ): Promise<string> {
        try {
            // Simplify data for token efficiency
            const voucherSummary = contextData.vouchers.slice(0, 50).map(v =>
                `${v.date}: ${v.type} #${v.voucherNo} - ${v.narration || 'No narrative'} (${v.rows.map(r => `${r.account} ${r.type} ${r.debit || r.credit}`).join(', ')})`
            ).join('\n');

            const ledgerSummary = contextData.ledgers.map(l =>
                `${l.name} (${l.group}): ${contextData.symbol}${l.balance} ${l.type}`
            ).join('\n');

            const prompt = `
You are MoneyArc AI, an expert financial assistant for the company "${contextData.companyName}".
Analyze the following financial data and answer the user's question with actionable insights.

Data Context:
--- LEDGERS & BALANCES ---
${ledgerSummary}

--- RECENT TRANSACTIONS ---
${voucherSummary}
----------------

User Question: "${question}"

Specialized Knowledge:
- Calculate Liquid Ratio (Bank+Cash+Debtors / Creditors+Taxes).
- Analyze Net Margin (Net Profit / Total Sales).
- Identify unusual spending patterns or cash flow crunches.

Guidelines:
- Be concise, professional, and data-driven.
- Use currency format (${contextData.symbol}).
- If data is insufficient for a specific request, suggest what needs to be recorded.
- Highlight key trends and provide advice for financial health.
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();

        } catch (error: any) {
            console.error("Gemini API Error Detail:", error);
            let userMessage = error.message || "AI Advisor is temporarily unavailable.";

            if (error.message?.includes("API key") || error.message?.includes("leaked") || error.message?.includes("400")) {
                userMessage = "API Key is leaked, blocked, or invalid. Please generate a fresh key in Settings.";
            } else if (error.message?.includes("model not found") || error.message?.includes("404")) {
                userMessage = "Model not found. Try switching to a newer model or check regional availability.";
            } else if (error.message?.includes("safety")) {
                userMessage = "Insight blocked by safety filters.";
            } else if (error.message?.includes("quota")) {
                userMessage = "API Quota exceeded. Please try again later.";
            }

            return `[AI Error] ${userMessage}`;
        }
    }
}
