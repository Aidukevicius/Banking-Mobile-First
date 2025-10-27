# Finance Tracker Design Guidelines

## Design Approach

**Selected Approach:** Design System + Fintech Reference Hybrid  
**Primary References:** Revolut, Monzo, YNAB for modern fintech patterns  
**System Foundation:** Material Design principles for data-heavy mobile interfaces  

**Core Principles:**
1. Mobile-first with thumb-friendly touch targets
2. Clear financial data hierarchy with scannable layouts
3. Trust through clarity and professional aesthetics
4. Efficient data entry and quick actions
5. Progressive disclosure for complex features

---

## Typography

**Font System:**
- Primary: Inter (via Google Fonts) - modern, highly legible for numbers
- Fallback: System UI fonts for performance

**Type Scale:**
- Hero Numbers (balance displays): text-4xl to text-5xl, font-bold
- Section Headers: text-xl to text-2xl, font-semibold
- Card Titles/Labels: text-sm, font-medium, uppercase tracking-wide
- Body Text: text-base, font-normal
- Financial Values: text-lg to text-2xl, font-semibold (tabular numbers)
- Metadata/Timestamps: text-xs to text-sm, font-normal
- Button Text: text-sm to text-base, font-medium

**Number Treatment:** Use tabular-nums class for all financial figures to maintain alignment

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16  
**Common Patterns:**
- Card padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Component gaps: gap-4
- Screen padding: px-4 md:px-6 (mobile constraint)

**Container Strategy:**
- Mobile: Full-width with px-4 padding
- Tablet+: max-w-md to max-w-lg centered (finance apps work best narrow)
- Dashboard cards: Full-width stacked on mobile
- Transaction lists: Full-bleed for maximum data density

**Grid Patterns:**
- Stats grid: 2-column on mobile (grid-cols-2 gap-4)
- Category breakdown: Single column with visual bars
- Investment portfolio: 2-column cards

---

## Component Library

### Navigation
**Bottom Tab Bar (Mobile Primary):**
- Fixed bottom navigation with 5 tabs: Dashboard, Transactions, Categories, Savings/Investments, Settings
- Icon + label combination, min-height: h-16
- Large touch targets: min 48px tap area
- Active state with indicator bar or filled background

**Top Header:**
- Sticky header with page title
- Optional actions (filter, add, edit) on right
- Height: h-14 to h-16
- Month selector for dashboard with prev/next arrows

### Dashboard Components
**Balance Card:**
- Prominent hero display at top
- Current month label with navigation
- Large balance figure (text-4xl)
- Breakdown grid below: Income, Expenses, Savings, Investments in 2x2 grid
- Each cell: label, amount, small trend indicator

**Category Breakdown:**
- List of category cards showing spending
- Visual progress bars showing % of total
- Category name, amount, percentage
- Sorted by amount descending

**Quick Stats:**
- Compact stat cards in 2-column grid
- Icon + label + value pattern

### Transaction Management
**Transaction List:**
- Grouped by date with sticky date headers
- Each item: Provider name (bold), category tag, amount (right-aligned)
- Timestamp below in muted text
- Swipe actions for quick categorization
- Uncategorized items highlighted with action prompt

**Upload Interface:**
- Large drop zone with dashed border
- Icon + instructional text
- File name display after upload
- Processing status with progress indicator
- Results summary: X categorized, Y need review

**Category Assignment:**
- Modal/sheet for manual categorization
- Transaction details at top
- Category buttons in grid or list
- Quick filters: Recent, Frequent, All
- Search for categories

### Category Management
**Category List:**
- Color-coded category cards (accent only, not full background)
- Category name, icon, transaction count
- Add button (FAB or prominent top button)
- Swipe to edit/delete

**Category Form:**
- Name input with clear focus states
- Icon picker grid
- Optional budget limit field
- Save/Cancel actions

### Savings & Investments
**Editable Value Cards:**
- Current value displayed prominently
- Pencil icon or tap to edit inline
- Quick adjust buttons (+/- common amounts)
- History graph below showing trend
- Manual entry modal for precise updates

### Settings
**Setting Groups:**
- Clear section headers
- Toggle switches for theme
- Dropdown/picker for currency
- List items with chevron for sub-pages
- Logout button at bottom (danger state)

### Forms & Inputs
**Input Fields:**
- Floating labels or fixed labels above
- Clear focus ring (ring-2)
- Sufficient height for touch: h-12 minimum
- Number inputs: Large font, right-aligned for amounts
- Error states with helper text below

**Buttons:**
- Primary: Solid with rounded-lg, h-12 min height, font-medium
- Secondary: Outlined with border-2
- Text: No background, underlined on active
- Full-width on mobile for primary actions
- Icon buttons: w-10 h-10 minimum

**Selection Controls:**
- Radio/Checkbox: Larger touch targets (w-6 h-6)
- Toggles: iOS-style switches for settings
- Segmented control for month navigation

### Data Display
**Charts:**
- Category pie/donut chart on dashboard
- Line chart for savings/investment trends over time
- Bar chart for monthly comparison
- Minimal grid lines, clear labels
- Touch-friendly legend

**Tables:**
- Responsive: Cards on mobile, table on larger screens
- Sticky headers when scrolling
- Row hover/active states
- Right-aligned numbers

### Overlays
**Modals:**
- Slide up from bottom on mobile (sheet pattern)
- Rounded top corners (rounded-t-2xl)
- Handle bar at top for drag-to-dismiss
- Backdrop with opacity-50

**Toast Notifications:**
- Bottom positioning (above tab bar)
- Auto-dismiss after 3-4s
- Success, error, info variants
- Clear icon + message

---

## Interactions & Animations

**Micro-interactions (minimal use):**
- Success state after categorization (gentle check animation)
- Pull-to-refresh on transaction list
- Smooth tab transitions
- Number counting animation for balance updates

**Avoid:** Excessive page transitions, decorative animations, scroll-triggered effects

---

## Images

**No hero images needed** - this is a data-focused utility app. Visual hierarchy comes from typography, spacing, and data visualization rather than imagery.

**Icon Usage:**
- Category icons from Heroicons via CDN
- Simple, recognizable glyphs
- Consistent 24px size in lists
- 32px for dashboard cards

---

## Accessibility

- Minimum 44x44px touch targets throughout
- Clear focus indicators on all interactive elements
- Sufficient contrast for financial data (critical information)
- Form labels always present (not placeholder-only)
- Error messages descriptive and actionable
- Tab order logical for keyboard navigation
- Screen reader labels for icon-only buttons

---

## Mobile-Specific Patterns

- Large, easy-to-tap buttons filling width on mobile
- Bottom sheet modals instead of centered overlays
- Sticky headers that collapse on scroll
- Bottom navigation always accessible
- Optimized for one-handed use
- Smart keyboard types (number pad for amounts, email for login)