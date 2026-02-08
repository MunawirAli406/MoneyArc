export const BASE_GRADIENT = 'fixed inset-0 -z-50 transition-all duration-1000 ease-in-out bg-cover bg-center';

// Define gradients or patterns for each business type
export const BACKGROUNDS: Record<string, string> = {
    'General': 'bg-gradient-to-br from-background via-background to-primary/5',

    // Retail & Shop - Warm, inviting, energetic
    'Retail': 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-100/20 via-background to-background dark:from-orange-900/10',

    // Manufacturing - Industrial, cool, structured
    'Manufacturing': 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-200/40 via-background to-slate-100/20 dark:from-slate-800/20',

    // Service - Clean, professional, blue/indigo
    'Service': 'bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-background to-background dark:from-indigo-900/10',

    // Hotel - Luxury, warm gold/amber
    'Hotel': 'bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-100/30 via-background to-background dark:from-amber-900/10',

    // Restaurant - Appetizing, warm red/orange
    'Restaurant': 'bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-red-100/30 via-background to-background dark:from-red-900/10',

    // Automobile - Metallic, silver/blue
    'Automobile': 'bg-[linear-gradient(to_bottom_right,_var(--tw-gradient-stops))] from-zinc-200/40 via-background to-blue-100/20 dark:from-zinc-800/20 dark:to-blue-900/10',

    // Textiles - Soft, woven feel, purple/pink
    'Textiles': 'bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-fuchsia-100/30 via-background to-background dark:from-fuchsia-900/10',

    // School - Bright, intellectual blue/yellow
    'School': 'bg-[conic-gradient(at_bottom_right,_var(--tw-gradient-stops))] from-yellow-100/40 via-background to-sky-100/40 dark:from-yellow-900/10 dark:to-sky-900/10',

    // Hospital - Sterile, clean, green/teal
    'Hospital': 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-100/40 via-background to-teal-50/30 dark:from-emerald-900/10',

    // Real Estate - Structured, solid, blue-gray
    'RealEstate': 'bg-[linear-gradient(135deg,_var(--tw-gradient-stops))] from-cyan-100/30 via-background to-blue-50/20 dark:from-cyan-900/10',

    // Technology - Modern, digital, violet/cyan
    'Technology': 'bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-violet-100/30 via-background to-cyan-50/20 dark:from-violet-900/20 dark:to-cyan-900/10',

    // Logistics - Dynamic, motion, orange/blue
    'Logistics': 'bg-[linear-gradient(to_right,_var(--tw-gradient-stops))] from-orange-50/30 via-background to-blue-50/30 dark:from-orange-900/10 dark:to-blue-900/10',

    // Agriculture - Natural, earthy green/brown
    'Agriculture': 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-lime-100/40 via-background to-green-50/30 dark:from-lime-900/10',
};
