export const BASE_GRADIENT = 'fixed inset-0 -z-50 transition-all duration-1000 ease-in-out overflow-hidden';

// Define ultra-premium CSS backgrounds for each business type
export const BACKGROUNDS: Record<string, string> = {
    // General - Sleek brand teal pulse
    'General': 'bg-slate-950 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.05)_0%,transparent_70%)]',

    // Retail & Shop - Warm beams of opportunity
    'Retail': 'bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.1)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(234,179,8,0.05)_0%,transparent_50%)]',

    // Manufacturing - Industrial cool slate & chrome
    'Manufacturing': 'bg-slate-950 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] bg-[radial-gradient(circle_at_center,rgba(71,85,105,0.15)_0%,transparent_100%)]',

    // Service & Consulting - Deep professional indigo depth
    'Service': 'bg-slate-950 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(99,102,241,0.08)_0deg,transparent_60deg,rgba(99,102,241,0.08)_120deg,transparent_180deg)]',

    // Hotel & Hospitality - Luxury amber glow
    'Hotel': 'bg-slate-950 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.12)_0%,transparent_60%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.05)_0%,transparent_40%)]',

    // Restaurant & Cafe - Appetizing warm bokeh
    'Restaurant': 'bg-slate-950 bg-[radial-gradient(circle_at_20%_20%,rgba(239,68,68,0.08)_0%,transparent_40%),radial-gradient(circle_at_80%_80%,rgba(249,115,22,0.08)_0%,transparent_40%)]',

    // Automobile & Garage - Metallic mesh & blue-zinc racing soul
    'Automobile': 'bg-slate-950 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)] after:absolute after:inset-0 after:bg-[url("https://www.transparenttextures.com/patterns/carbon-fibre.png")] after:opacity-[0.03] after:pointer-events-none',

    // Textiles & Garments - Soft woven purple texture
    'Textiles': 'bg-slate-950 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.1)_0%,transparent_50%)] before:absolute before:inset-0 before:bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.01)_0px,rgba(255,255,255,0.01)_1px,transparent_1px,transparent_10px)]',

    // School & Education - Intellectual intellectual intellectual intellectual intellectual intellectual intellectual intellectual blue/yellow
    'School': 'bg-slate-950 bg-[radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12)_0%,transparent_60%),radial-gradient(circle_at_top_left,rgba(234,179,8,0.04)_0%,transparent_40%)]',

    // Hospital & Healthcare - Sterile emerald-teal grid
    'Hospital': 'bg-slate-950 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100px_100px] bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.12)_0%,transparent_100%)]',

    // Real Estate & Construction - Steel blue blueprints
    'RealEstate': 'bg-slate-950 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:200px_200px] after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08)_0%,transparent_60%)]',

    // Technology & IT - Futuristic violet network pulse
    'Technology': 'bg-slate-950 bg-[radial-gradient(circle_at_bottom,rgba(139,92,246,0.15)_0%,transparent_70%),radial-gradient(circle_at_top,rgba(6,182,212,0.05)_0%,transparent_50%)] after:absolute after:inset-0 after:bg-[url("https://www.transparenttextures.com/patterns/microchip.png")] after:opacity-[0.02]',

    // Logistics & Transport - Dynamic navy & orange streaks
    'Logistics': 'bg-slate-950 bg-[linear-gradient(135deg,rgba(249,115,22,0.05)_0%,transparent_50%,rgba(30,58,138,0.1)_100%)]',

    // Agriculture & Farming - Verdant lime organic waves
    'Agriculture': 'bg-slate-950 bg-[radial-gradient(ellipse_at_top,rgba(132,204,22,0.12)_0%,transparent_60%),radial-gradient(ellipse_at_bottom,rgba(21,128,61,0.08)_0%,transparent_60%)]',
};
