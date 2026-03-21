# Krishkar Pharma MR Reporting

## Current State
- ASM portal has: Dashboard, Leave Approvals, Team Reports, CRM Demand
- RSM portal has: Dashboard, Leave Approvals, Team Reports, CRM Demand
- Neither ASM nor RSM can log daily working details or submit TA/DA expense demands
- MR has a dedicated Working Details page and Expenses page
- Backend `addExpense` already works for all roles (ASM/RSM TA rates are handled)

## Requested Changes (Diff)

### Add
- `ASMWorkingDetails.tsx` — page for ASM to log daily working details (number of doctors visited) and demand TA/DA (km, DA type HQ/Out Station, auto-calculated TA, DA amount). History table below.
- `RSMWorkingDetails.tsx` — same page for RSM role
- "Working Details" nav item in ASMLayout.tsx linking to ASMWorkingDetails
- "Working Details" nav item in RSMLayout.tsx linking to RSMWorkingDetails

### Modify
- `ASMLayout.tsx` — add `working-details` page type, import, nav item, render case
- `RSMLayout.tsx` — same changes for RSM

### Remove
- Nothing removed

## Implementation Plan
1. Create `ASMWorkingDetails.tsx` with combined daily working + TA/DA demand form using `addExpense` backend call; doctors visited count stored in notes field
2. Create `RSMWorkingDetails.tsx` as a clone adapted for RSM context
3. Update `ASMLayout.tsx` to add nav item and render new page
4. Update `RSMLayout.tsx` to add nav item and render new page
