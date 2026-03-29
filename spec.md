# Krishkar Pharma MR Reporting

## Current State
The app has dashboards for MR, ASM, RSM, and Admin roles. Admin can manage various entities. There is no holiday management feature.

## Requested Changes (Diff)

### Add
- `Holiday` type in backend: `{ id: HolidayId; name: Text; date: Text; description: Text; createdBy: Principal }`
- Backend functions: `adminAddHoliday`, `adminUpdateHoliday`, `adminDeleteHoliday`, `getAllHolidays`
- `AdminHolidays.tsx` page in admin portal for CRUD on holidays
- Holiday calendar widget on Dashboard (MR portal), ASM Dashboard, RSM Dashboard, Admin Dashboard showing upcoming/current-year holidays
- "Holidays" nav item in AdminLayout

### Modify
- `backend.d.ts` and `backend.did.js` / `backend.did.d.ts` to include holiday types and functions
- `AdminLayout.tsx` to include `AdminHolidays` page and nav item
- `Dashboard.tsx` (MR), `AdminDashboard.tsx`, ASM and RSM dashboards to show holiday list

### Remove
- Nothing

## Implementation Plan
1. Add Holiday stable storage and CRUD functions to `main.mo`
2. Update Candid binding files (`backend.did.js`, `backend.did.d.ts`, `backend.ts`/`backend.d.ts`)
3. Create `AdminHolidays.tsx` with add/edit/delete dialog
4. Add holiday section widget (reusable) shown on MR Dashboard, ASM Dashboard, RSM Dashboard, Admin Dashboard
5. Wire `AdminHolidays` into `AdminLayout.tsx` nav and routing
