# Krishkar Pharma MR Reporting

## Current State
- MRWorkingDetails has 4 tabs: Doctor Activity (3 sub-cards: Visit/Detailing, Sample, Gift), Chemist Order, Expenses, Gift Demand
- Doctor selection uses a dropdown with no search
- 'Working With Someone' dropdown is disabled while staffNames loads, causing MRs to be unable to select
- Chemists.tsx has no bulk upload option
- AdminReports.tsx has no Chemist Orders/Call Report
- No 'Add New Doctor' button in MR portal

## Requested Changes (Diff)

### Add
- Bulk Excel upload for Chemist list in Chemists.tsx (columns: Name, Area, Address, Contact)
- Chemist Call Report (orders) export card in AdminReports.tsx
- Doctor search/filter input in MRWorkingDetails doctor selection
- 'Add New Doctor' button in MRWorkingDetails that opens an add-doctor dialog (calls actor.addDoctor)

### Modify
- MRWorkingDetails: Merge Doctor Visit, Product Detailing, Sample Distribution, Gift Distribution, and Chemist Order into one unified 'Daily Activity' card/form
- Fix 'Working With Others' dropdown: remove `disabled={staffNamesLoading}`, show loading text in placeholder only

### Remove
- Separate tabs for Doctor Activity / Chemist Order (merged into one unified daily entry)

## Implementation Plan
1. Rewrite MRWorkingDetails.tsx:
   - Unified daily entry card: area selector, doctor selector with search input, products detailing checkboxes, sample row (product+qty), gift row (article+qty), chemist order row (chemist+product+qty+scheme) - all in one form
   - Fix Working With dropdown: remove disabled, placeholder shows loading state
   - Add 'Add New Doctor' dialog using actor.addDoctor
2. Update Chemists.tsx: add bulk Excel upload button + dialog (uses xlsxLoader, area name lookup, batch addChemist calls)
3. Update AdminReports.tsx: add Chemist Orders report card using getChemistOrders() and getAllChemists()
