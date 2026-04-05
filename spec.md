# Krishkar Pharma MR Reporting

## Current State
The app has a `DoctorCallHistoryPage.tsx` used in the MR portal showing last 15 days of area-wise doctor call activity for the logged-in MR only. ASM, RSM, and Admin portals do NOT have any MR-wise last 15 days call details view.

## Requested Changes (Diff)

### Add
- A new page `MRCallDetailsPage.tsx` (reusable component) that shows last 15 days of doctor call activity **grouped by MR**, filtered to only show MRs whose assigned HQ matches the allotted HQ of the logged-in ASM/RSM (or all HQs for Admin).
- The view displays: MR name, MR HQ, then per MR -> per date -> per doctor: products detailed, samples, gifts.
- For Admin: shows all MRs across all HQs, with an HQ filter dropdown.
- For ASM/RSM: auto-filters to their allotted HQ only (no HQ dropdown needed, but HQ label shown).
- "MR Call Details" nav item in ASM, RSM, and Admin portals.

### Modify
- `ASMLayout.tsx`: Add `mr-call-details` page type, nav item "MR Call Details" with History icon, render `MRCallDetailsPage`.
- `RSMLayout.tsx`: Add `mr-call-details` page type, nav item "MR Call Details" with History icon, render `MRCallDetailsPage`.
- `AdminLayout.tsx`: Add `mr-call-details` page type, nav item "MR Call Details" with History icon, render `MRCallDetailsPage` (admin mode).

### Remove
- Nothing removed.

## Implementation Plan
1. Create `src/frontend/src/pages/MRCallDetailsPage.tsx`:
   - Props: `role: 'ASM' | 'RSM' | 'admin'`
   - Fetch: `getTeamDetailingEntries()` (returns `[Principal, DetailingEntry[]][]`), `getAllMRProfiles()` (returns `[Principal, MRProfile][]`), `getAllUserProfiles()` (returns `[Principal, UserProfile][]`), `getAllDoctors()`, `getAllProducts()`, `getAllAreas()`, `getManagerProfile()` (for ASM/RSM to get their own HQ)
   - Filter last 15 days entries.
   - For ASM/RSM: get logged-in manager's `headQuarter` from `getManagerProfile()`. Filter MRs whose `MRProfile.headQuarter === managerHQ`.
   - For Admin: show HQ filter dropdown using all unique HQs from MR profiles.
   - Group entries: MR (principal) -> date -> doctor entries.
   - Display accordion: outer = MR card (name, HQ badge, total visits count), inner = date-grouped doctor calls with products/samples/gifts.
   - Show date range header (last 15 days: start to end).
   - Empty and loading states.
2. Wire into `ASMLayout.tsx`, `RSMLayout.tsx`, `AdminLayout.tsx` with nav item and render case.
