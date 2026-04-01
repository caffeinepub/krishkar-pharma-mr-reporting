# Krishkar Pharma MR Reporting

## Current State
Full-stack Motoko + React app with 8+ modules: Dashboard, Profile, Areas, Doctors, Chemists, Products, Expenses, Leaves, Working Plans, Admin Portal, GPS Tracking, CRM, Gift Articles. The UI was built primarily for desktop and lacks mobile-responsive layouts.

## Requested Changes (Diff)

### Add
- Mobile-friendly responsive layouts for all pages and portals (MR, ASM, RSM, Admin)
- Touch-friendly tap targets (minimum 44px)
- Collapsible/hamburger sidebar navigation for mobile
- Responsive tables (horizontal scroll or card-based stacking on small screens)
- Responsive forms with full-width inputs on mobile
- Responsive modals and dialogs sized for mobile screens
- Responsive dashboard cards and charts

### Modify
- Navigation sidebar: collapse to hamburger menu on screens < 768px
- All data tables: add horizontal scroll wrapper or convert to card layout on mobile
- All forms: inputs and buttons should be full-width on mobile
- Modals/dialogs: max-width constrained, padding adjusted for small screens
- Dashboard stat cards: stack vertically on mobile
- Charts/graphs: responsive width
- Header/topbar: compact layout on mobile
- Font sizes and spacing: appropriate for mobile readability

### Remove
- Fixed pixel widths that break on small screens
- Overflow-hidden containers that clip content on mobile

## Implementation Plan
1. Add responsive Tailwind breakpoints throughout all layout components
2. Convert sidebar to hamburger/drawer pattern on mobile
3. Wrap all tables in overflow-x-auto containers
4. Make all form inputs full-width on mobile with proper spacing
5. Fix modals to be full-screen or near-full-screen on mobile
6. Stack dashboard cards vertically on small screens
7. Ensure buttons and interactive elements have sufficient tap target size
8. Test all major pages: Login, Dashboard (all roles), Working Details, Expense, Leave, Admin Portal pages
