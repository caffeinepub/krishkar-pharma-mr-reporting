# Krishkar Pharma MR Reporting

## Current State

- MR Working Details has a "Today's Working Mode" card with Working Mode (Alone/With Someone), Station Type, and Working With dropdown
- The "Working With" dropdown currently shows ALL registered staff names (MRs + all managers) from `getAllUserProfiles` + `getAllManagerProfiles`
- Call History page (DoctorCallHistoryPage) shows last 5 days of doctor call activity using `getRecentDoctorCalls(BigInt(5))`
- Working Details shows last 2 calls when a doctor is selected, fetched via `getDoctorCallHistory(doctorId)`, already shows products, samples, and gifts
- Admin Reports exports: detailing rows are missing GPS latitude/longitude columns; ASM Team Reports detailing export also missing GPS columns
- Chemist bulk upload from Excel already exists in the Chemists page (Admin portal)

## Requested Changes (Diff)

### Add
- In "Working With Someone" dropdown: fetch manager profiles AND their area assignments; filter to show only ASM and RSM whose assigned areas include the currently selected working area (visitAreaId or any assigned MR area); keep "Other (type manually)" option
- GPS columns (Latitude, Longitude, Maps Link) to the detailing rows export in Admin Reports
- GPS columns to the detailing export in ASM Team Reports
- GPS columns to the detailing export in RSM Team Reports (if applicable)

### Modify
- Call History page: change from 5 days to 15 days (`getRecentDoctorCalls(BigInt(15))`, update `getLast5DaysRange` to `getLast15DaysRange`, update heading and labels)
- Working With dropdown in MRWorkingDetails: instead of all staff names, only show ASM/RSM names whose area assignments overlap with the MR's working area(s). If no area selected, show all ASMs and RSMs. Keep "Other (type manually)" option and manual text input.
- Working Details last 2 calls panel: already shows products/samples/gifts; ensure it auto-expands when a doctor is selected (remove need to manually click to expand)

### Remove
- Nothing removed

## Implementation Plan

1. **MRWorkingDetails.tsx** - `Working With` dropdown:
   - Fetch `getAllManagerProfiles()` + for each manager principal, call `getManagerAreas(principal)` to get their area assignments
   - Filter to only managers with `managerRole` of ASM or RSM whose `areaIds` includes the currently selected `visitAreaId` (if set) or any of the MR's `assignedAreaIds`
   - Expose their names in the dropdown with a labeled section "ASM / RSM of Your Area"
   - Still include "Other (type manually)" option
   - Also add manual text input when "Other" is selected (already exists)
   - Do this with a single `useQuery` that also calls `getManagerAreas` for each manager (batch via Promise.all)

2. **DoctorCallHistoryPage.tsx**:
   - Change `getLast5DaysRange` → `getLast15DaysRange` (sets `start = today - 14 days`)
   - Change `actor.getRecentDoctorCalls(BigInt(5))` → `actor.getRecentDoctorCalls(BigInt(15))`
   - Update heading text from "Last 5 Days" to "Last 15 Days"
   - Update description text

3. **MRWorkingDetails.tsx** - Last 2 calls panel:
   - Set `lastCallsExpanded` to default `true` so it auto-opens when a doctor is selected
   - Or auto-set to true when `visitDoctorId` changes

4. **AdminReports.tsx** - GPS columns in detailing export:
   - Add GPS Latitude, GPS Longitude, GPS Location columns to `detailingRows` map
   - Check if `DoctorVisitEntry` / team detailing entries have latitude/longitude fields
   - If the backend type includes location fields, add them; otherwise note the field path

5. **ASMTeamReports.tsx** - GPS in detailing export:
   - Add GPS columns to the `exportDetailing` function data mapping

6. **RSMTeamReports.tsx** - GPS in detailing export:
   - Same as ASM

7. **Chemist upload**: Already exists - no changes needed unless broken
