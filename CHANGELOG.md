# Changelog

All notable changes to the **MoneyArc** project will be documented in this file.

## [v1.1.0] - 2026-02-08

### 🚀 Added
- **Premium Teal & Charcoal Palette**: A sophisticated new color scheme for a professional "financial suite" aesthetic.
- **Theme-Aware Dashboard Charts**: Financial Trends and Expense Distribution charts now dynamically adapt to Light and Dark modes.
- **Glassmorphism Refinement**: Refactored `.glass-panel` and `.glass-card` utilities for better contrast and theme scaling.

### 🚀 Added
- **Mobile Responsiveness**: Implemented a collapsible sidebar drawer and mobile header menu for smaller screens.
- **Offline Mobile Support**: Added a virtual file system fallback (IndexedDB) for mobile devices where the File System Access API is unavailable.
- **Improved Navigation**: Navigation sidebar now automatically closes on selection in mobile view.

### 🛠️ Changed
- **Branding Refresh**: Updated the Logo and user profile gradients to use the refined Teal (`hsl(174 100% 33%)`).
- **Sidebar Persistence**: Added `flex-shrink-0` to the navigation sidebar to ensure layout stability across different viewport sizes.
- **Period Selector Overhaul**: Enhanced the `PeriodSelector` with high-contrast shadows and theme-aware styling.

### 🐛 Fixed
- **Dashboard Contrast**: Resolved issues where chart grid lines and tooltips were barely visible in certain themes.
- **Background Clipping**: Fixed margins and padding overlaps in the main dashboard layout.
- **Default Business Theme**: Standardized the `General` theme to align with the new branding.

---

## [v1.0.0] - 2026-02-04
- Initial release of MoneyArc.
- Core accounting (Vouchers, Ledgers).
- Inventory management.
- Dynamic reporting system.
