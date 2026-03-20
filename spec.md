# Krishkar Pharma MR Reporting

## Current State
- `ExpenseEntry` has: date, kmTraveled, taAmount, daAmount, notes
- `addExpense` accepts: date, kmTraveled, daAmount, notes, taAmountOpt
- Role detection uses 2 sequential backend calls: `getCallerUserRole` then `getManagerProfile`
- DA is a single numeric field with no type distinction

## Requested Changes (Diff)

### Add
- `workingArea` field (Text) to `ExpenseEntry` — the area where MR worked on that day
- `daType` field (Text: "HQ" or "OutStation") to `ExpenseEntry` — indicates if DA is for Headquarter or Out Station travel
- New backend query `getCallerRoleInfo` that returns base role + manager profile in a single call to eliminate double round-trip on login

### Modify
- `addExpense` to accept two new parameters: `workingArea: Text` and `daType: Text`
- `useUserRole` hook to use the new `getCallerRoleInfo` single-call API (reduces 2 IC calls to 1, fixing the timeout)
- Expense form UI: add a dropdown for working area (MR's allotted areas) and radio/select for DA Type (HQ / Out Station)

### Remove
- Nothing removed

## Implementation Plan
1. Add `workingArea` and `daType` to `ExpenseEntry` type in Motoko
2. Update `addExpense` signature and implementation
3. Add `getCallerRoleInfo` query that returns `{baseRole: Text; managerRole: ?Text}` in one call
4. Regenerate backend bindings
5. Update `useUserRole.ts` to call `getCallerRoleInfo` instead of 2 separate calls
6. Update the Expense form (Add Expense dialog/page) to include:
   - Working Area dropdown (loads MR's allotted areas)
   - DA Type selector: "Head Quarter" or "Out Station"
7. Update expense display tables to show working area and DA type columns
