export const BASE_GRADIENT = 'fixed inset-0 -z-50 transition-all duration-1000 ease-in-out overflow-hidden';

// Define ultra-premium mesh gradients for each business type
// These use multiple radial gradients at various positions and sizes to create a "mesh" effect.
export const BACKGROUNDS: Record<string, string> = {
    // General - Sleek Deep Blue/Purple
    'General': 'bg-slate-950 [background:radial-gradient(at_0%_0%,rgba(15,118,110,0.15)_0,transparent_50%),radial-gradient(at_50%_0%,rgba(67,56,202,0.15)_0,transparent_50%),radial-gradient(at_100%_0%,rgba(190,24,93,0.1)_0,transparent_50%)]',

    // Retail & Shop - Vibrant Amber/Gold
    'Retail': 'bg-slate-950 [background:radial-gradient(at_0%_30%,rgba(217,119,6,0.15)_0,transparent_50%),radial-gradient(at_80%_0%,rgba(180,83,9,0.12)_0,transparent_50%)]',

    // Manufacturing - Industrial Cool Steel/Cyan
    'Manufacturing': 'bg-slate-950 [background:radial-gradient(at_20%_0%,rgba(8,145,178,0.15)_0,transparent_55%),radial-gradient(at_80%_20%,rgba(15,118,110,0.2)_0,transparent_45%)]',

    // Service & Consulting - Professional Emerald/Indigo
    'Service': 'bg-slate-950 [background:radial-gradient(at_0%_0%,rgba(2,132,199,0.18)_0,transparent_50%),radial-gradient(at_100%_100%,rgba(5,150,105,0.15)_0,transparent_50%)]',

    // Hotel & Hospitality - Warm Sunset/Rose
    'Hotel': 'bg-slate-950 [background:radial-gradient(at_0%_0%,rgba(190,24,93,0.15)_0,transparent_50%),radial-gradient(at_50%_0%,rgba(124,58,237,0.1)_0,transparent_50%)]',

    // Restaurant & Cafe - Spicy Orange/Red
    'Restaurant': 'bg-slate-950 [background:radial-gradient(at_0%_0%,rgba(234,88,12,0.15)_0,transparent_50%),radial-gradient(at_100%_0%,rgba(220,38,38,0.1)_0,transparent_50%)]',

    // Automobile & Garage - Dark Graphite/Silver
    'Automobile': 'bg-slate-950 [background:radial-gradient(at_0%_0%,rgba(71,85,105,0.2)_0,transparent_50%),radial-gradient(at_100%_100%,rgba(30,41,59,0.2)_0,transparent_50%)]',

    // Textiles & Garments - Rich Violet/Magenta
    'Textiles': 'bg-slate-950 [background:radial-gradient(at_50%_0%,rgba(124,58,237,0.15)_0,transparent_60%),radial-gradient(at_0%_100%,rgba(190,24,93,0.1)_0,transparent_50%)]',

    // School & Education - Bright Sky/Book Blue
    'School': 'bg-slate-950 [background:radial-gradient(at_0%_0%,rgba(3,105,161,0.2)_0,transparent_50%),radial-gradient(at_70%_0%,rgba(2,132,199,0.15)_0,transparent_50%)]',

    // Hospital & Healthcare - Sterile Mint/Cyan
    'Hospital': 'bg-slate-950 [background:radial-gradient(at_0%_0%,rgba(13,148,136,0.18)_0,transparent_55%),radial-gradient(at_90%_0%,rgba(8,145,178,0.15)_0,transparent_45%)]',

    // Real Estate & Construction - Earthy Sand/Slate
    'RealEstate': 'bg-slate-950 [background:radial-gradient(at_0%_0%,rgba(14,165,233,0.15)_0,transparent_50%),radial-gradient(at_80%_0%,rgba(120,113,108,0.1)_0,transparent_50%)]',

    // Technology \& IT - Neon Cyan/Indigo
    'Technology': 'bg-slate-950 [background:radial-gradient(at_50%_0%,rgba(79,70,229,0.15)_0,transparent_65%),radial-gradient(at_0%_0%,rgba(6,182,212,0.18)_0,transparent_50%)]',

    // Logistics & Transport - Deep Sea/Navy
    'Logistics': 'bg-slate-950 [background:radial-gradient(at_0%_0%,rgba(29,78,216,0.15)_0,transparent_50%),radial-gradient(at_100%_0%,rgba(30,64,175,0.12)_0,transparent_50%)]',

    // Agriculture & Farming - Lush Forest/Olive
    'Agriculture': 'bg-slate-950 [background:radial-gradient(at_0%_0%,rgba(22,101,52,0.2)_0,transparent_60%),radial-gradient(at_90%_0%,rgba(101,163,13,0.1)_0,transparent_50%)]',
};
