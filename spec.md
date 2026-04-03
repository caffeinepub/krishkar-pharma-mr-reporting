# Krishkar Pharma MR Reporting

## Current State

The MR Working Details screen allows MRs to select a doctor, log product detailing, sample distribution, gift distribution, and chemist orders under one unified table. Doctor data is stored across three separate tables: `DetailingEntry` (products shown), `SampleEntry` (samples given), and `GiftDistribution` (gifts given), all keyed by `(principal, doctorId, date)`. No call history or last-visit summary is currently shown anywhere.

The backend has:
- `getDetailingEntries()` - returns all caller's detailing entries
- `getSampleEntries()` - returns all caller's sample entries
- `getMyGiftDistributions()` - returns all caller's gift distributions
- No `getDoctorCallHistory` or area-wise history function exists

## Requested Changes (Diff)

### Add

1. **Last 2 Call Details on Doctor Selection (MR Working Screen)**
   - When an MR selects a doctor from the dropdown on the Daily Working screen, immediately show the last 2 visit dates for that doctor with full call details: date, products detailed, samples (product + quantity), gifts (article + quantity)
   - Display as a collapsible info panel right below the doctor info card
   - If the doctor has never been visited before, show a friendly "No previous calls" message

2. **New backend function: `getDoctorCallHistory(doctorId: DoctorId)`**
   - Returns all detailing, sample, and gift entries for the given doctor by the caller MR
   - Grouped and sorted by date descending
   - Returns type: `Vec<DoctorCallSummary>` where each summary has date, productIds, samples (productId + qty), gifts (giftArticleName + qty)

3. **Last 5 Days Area-wise Doctor Call History (new section/page)**
   - Available in the MR portal as a new menu item or section: "Call History"
   - Shows the last 5 calendar days (relative to today)
   - Groups calls by Area → Doctor → Date
   - For each doctor on each day shows: products detailed, samples given, gifts distributed
   - Fetches data using existing queries + joins with `allDoctors` for area assignment
   - New backend function `getRecentDoctorCalls(days: Nat)` that returns all call records for the caller in the last N days

### Modify

- `MRWorkingDetails.tsx`: After doctor selection and the doctor info card, add the "Last 2 Calls" collapsible panel
- MR sidebar/navigation: Add "Call History" menu entry linking to the new page
- `App.tsx`: Add route for the new Call History page

### Remove

- Nothing removed

## Implementation Plan

1. **Backend** (`main.mo`):
   - Add `DoctorCallSummary` type: `{ date: Text; productIds: [ProductId]; samples: [{ productId: ProductId; quantity: Nat }]; gifts: [{ giftArticleName: Text; quantity: Nat }] }`
   - Add `getDoctorCallHistory(doctorId: DoctorId): async [DoctorCallSummary]` - merges detailing + sample + gift entries for that doctor, returns all dates sorted descending
   - Add `getRecentDoctorCalls(days: Nat): async [{ date: Text; doctorId: DoctorId; areaId: AreaId; productIds: [ProductId]; samples: [{ productId: ProductId; quantity: Nat }]; gifts: [{ giftArticleName: Text; quantity: Nat }] }]` - returns last N days of call data for caller MR

2. **Candid bindings** (`backend.did.js`, `backend.did.d.ts`, `backend.ts`, `backend.d.ts`):
   - Add new types and function signatures for the two new functions

3. **Frontend - Last 2 Calls panel** (`MRWorkingDetails.tsx`):
   - On doctor selection (`visitDoctorId` change), call `getDoctorCallHistory(doctorId)`
   - Display collapsible panel below doctor info card: last 2 entries with date, products, samples, gifts
   - Loading skeleton while fetching

4. **Frontend - Call History page** (new file `src/frontend/src/pages/DoctorCallHistory.tsx`):
   - Calls `getRecentDoctorCalls(5)` (last 5 days)
   - Fetches `getAllDoctors()` and `getAllAreas()` for name resolution
   - Renders accordion/grouped list: Area name → Doctor name → Date → activity detail rows
   - Shows product names (resolved from products list), sample qty, gift names and qty

5. **Navigation**: Add "Call History" to MR sidebar in `App.tsx` / MR layout
