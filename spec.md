# Krishkar Pharma MR Reporting

## Current State
Team Detailing Reports (exported from ASM, RSM, and Admin portals) only include MR Name, Date, Doctor, and Products Detailed columns. GPS coordinates are not captured when MRs submit detailing entries via `logDetailing`, so exports have no location data.

Expense reports already include GPS columns (Latitude, Longitude, Google Maps link) correctly.

## Requested Changes (Diff)

### Add
- GPS Latitude, GPS Longitude, GPS Location (Google Maps link) columns to Team Detailing Report Excel exports in ASM, RSM, and Admin portals
- GPS capture (via browser geolocation) when MR submits a detailing entry on the daily working screen

### Modify
- `DetailingEntry` backend type: add optional `latitude` and `longitude` Float fields
- `logDetailing` Motoko function: accept optional `latitude` and `longitude` parameters
- Candid JS bindings: update `DetailingEntry` record and `logDetailing` signature
- `backend.d.ts`: update `DetailingEntry` interface and `logDetailing` method signature
- `backend.ts`: update `logDetailing` wrapper to pass GPS as Candid opt
- `MRWorkingDetails.tsx`: capture browser GPS at detailing submission time
- `ASMTeamReports.tsx` `exportDetailing`: include GPS columns
- `RSMTeamReports.tsx` `exportMrDetailing`: include GPS columns
- `AdminReports.tsx` `detailingRows`: include GPS columns

### Remove
- Nothing removed

## Implementation Plan
1. Update `DetailingEntry` type in `main.mo` to add `latitude: ?Float` and `longitude: ?Float`
2. Update `logDetailing` in `main.mo` to accept and store GPS params
3. Update Candid JS bindings (`backend.did.js`) for `DetailingEntry` and `logDetailing`
4. Update `backend.d.ts` and `backend.ts` for the new signature
5. Update `MRWorkingDetails.tsx` to get current GPS position before calling `logDetailing`
6. Update detailing export functions in ASM, RSM, and Admin reports to emit GPS columns
