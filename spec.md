# Krishkar Pharma MR Reporting

## Current State
`MRCallDetailsPage.tsx` displays MR-wise call details for the last 15 days in a card/accordion UI. It is rendered in ASM, RSM, and Admin portals. The page has an HQ filter (Admin only) but no export functionality.

## Requested Changes (Diff)

### Add
- Excel export button on the MR Call Details page header
- Export function that flattens the `mrCallEntries` data into rows: MR Name, Employee Code, HQ, Date, Doctor Name, Doctor Qualification, Doctor Station, Products Detailed (comma-separated)
- Button uses `xlsx` (SheetJS) — already used elsewhere in the project

### Modify
- `MRCallDetailsPage.tsx`: add an "Export to Excel" button in the header area (next to HQ filter/badge); wire it to the export function using already-computed `mrCallEntries`, `allDoctors`, and `allProducts`

### Remove
- Nothing

## Implementation Plan
1. In `MRCallDetailsPage.tsx`, add `exportToExcel` function that builds a flat array of rows from `mrCallEntries` (iterating day groups and calls) and uses `xlsx.utils.json_to_sheet` + `xlsx.writeFile`
2. Add a `<Button>` with a `Download` icon in the page header; disabled when loading or no entries
3. No backend changes needed — all data is already fetched
