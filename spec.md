# Krishkar Pharma MR Reporting

## Current State
- ASMWorkingDetails and RSMWorkingDetails have a daily working form with date, area, doctors visited, KM, DA type/amount, TA, notes
- MRWorkingDetails has a "Working Mode" card at the top with Working Mode dropdown (Alone / With Someone), Station Type, and when "With Someone" is selected, a staff names dropdown (fetched from getAllUserProfiles + getAllManagerProfiles) plus an "Other (type manually)" option
- ASMDashboard shows assigned areas, KPI cards (team members, total visits, total expenses), and pending leave approvals
- RSMDashboard shows same structure as ASM but for RSM
- Recharts is installed (^2.15.1)

## Requested Changes (Diff)

### Add
- Working With Someone dropdown to ASMWorkingDetails: same as MR — when working mode is "With Someone", show a dropdown of all staff names (from getAllUserProfiles + getAllManagerProfiles), plus "Other (type manually)" option. Store in combinedNotes or a workingWith field in submission
- Working With Someone dropdown to RSMWorkingDetails: same as above
- Graphical dashboard section in ASMDashboard: Bar/column charts showing MR working details per MR — doctors visited, KM traveled, TA amount, DA amount. Data from getTeamExpenseEntries (which includes notes with "Doctors Visited: N")
- Graphical dashboard section in RSMDashboard: Same MR charts as ASM. PLUS a second chart section for ASM working details — doctors visited per ASM, KM, TA/DA. The ASM expense data comes via getTeamExpenseEntries which includes both MR and ASM subordinates. RSM needs to show MR data and ASM data separately

### Modify
- ASMWorkingDetails: Add workingMode state (alone/with), workingWith state, useOtherName state; fetch staff names; add working mode fields above the form grid (or as first row)
- RSMWorkingDetails: Same as ASMWorkingDetails
- ASMDashboard: Add a new "MR Working Details - Graphical Overview" section below existing cards with recharts BarChart showing per-MR stats
- RSMDashboard: Add "MR Working Details" and "ASM Working Details" graphical overview sections

### Remove
- Nothing removed

## Implementation Plan
1. Update ASMWorkingDetails.tsx: add working mode / working with / station type fields at top of form; fetch staff names; include workingWith in notes when submitting
2. Update RSMWorkingDetails.tsx: same changes as ASM
3. Update ASMDashboard.tsx: add recharts BarChart section — per-MR: doctors visited, KM, TA+DA total. Parse teamExpenseEntries data; show each MR by name using profileMap
4. Update RSMDashboard.tsx: add recharts BarChart sections — MR chart (same as ASM) and ASM chart (filter for users with managerRole=ASM or use teamExpenseEntries data for ASM subordinates); RSM's getTeamExpenseEntries returns all subordinate expenses, so filter by role using allUserProfiles
