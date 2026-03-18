# Krishkar Pharma MR Reporting

## Current State
Full-stack MR reporting app with MR, ASM, RSM, and Admin roles. Backend has all CRUD for profiles, doctors, areas, products, expenses, leaves, samples, chemist orders. MR portal has nav pages: Dashboard, MR Profile, Areas, Doctors, Chemists, Products, Expenses, Leaves, Samples. Admin portal has: Dashboard, Headquarters, MR Management, User Management, Leave Approvals, Products, Doctors, Areas, Sample Management. Employee code is manually entered in MR Profile page. No Excel export in admin portal.

## Requested Changes (Diff)

### Add
- `MRWorkingDetails` page: A single-page comprehensive form for MR to log their daily work — doctor visit (select doctor + area), product detailing (checkboxes), sample distribution (product + quantity), chemist order (chemist + product + quantity), and daily expense (KM + DA). All in one page with tabbed sections or accordion. Add nav item "Working Details" to MR sidebar and a prominent CTA button on Dashboard.
- Auto-generate employee code on MRProfile page: when no profile exists (first signup), auto-generate a code in format `KP-YYMM-XXXX` (e.g. KP-2603-4821) and pre-fill the Employee Code field. The field remains editable in case the MR wants to change it.
- `AdminReports` page in Admin Portal: new nav item "Reports" with export-to-Excel buttons for: MR Profiles, Leave Applications, Doctor List, Team Detailing Entries, Team Expense Entries. Each section shows a preview count and a download button. Uses xlsx (SheetJS) library.

### Modify
- `App.tsx` MR layout: add `working-details` page to nav items, page titles, and renderPage switch.
- `MRProfile.tsx`: auto-generate employee code when `profile` is null on first load.
- `AdminLayout.tsx`: add `reports` page to nav, page titles, and renderPage switch.
- `Dashboard.tsx` MR: add a prominent "Add Working Details" button that navigates to the working-details page (via a callback prop or shared state).

### Remove
- Nothing removed.

## Implementation Plan
1. Install `xlsx` (SheetJS) if not present: add to package.json dependencies.
2. Create `src/frontend/src/pages/MRWorkingDetails.tsx` — single-page with sections (Date selector at top, then 4 sections: Doctor Visit/Detailing, Sample Distribution, Chemist Order, Daily Expense). Submit each section independently with its own button.
3. Update `App.tsx` to add `working-details` nav item (icon: ClipboardList) and route, pass `setCurrentPage` to Dashboard.
4. Update `MRProfile.tsx` to auto-generate employee code when profile is null.
5. Create `src/frontend/src/pages/admin/AdminReports.tsx` — page with export cards for each report type, using xlsx to generate and trigger download.
6. Update `AdminLayout.tsx` to add `reports` nav item and render AdminReports.
