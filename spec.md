# Krishkar Pharma MR Reporting

## Current State
Multi-role pharma reporting platform with MR, ASM, RSM, and Admin roles. Features: daily working reports (detailing, samples, chemist orders, expenses), leave management, area/doctor/product CRUD, sample allotment and demand orders. No CRM or Gift Distribution features exist.

## Requested Changes (Diff)

### Add
- **CRM Demand** (Doctor-wise, in Rupees): ASM and RSM can raise a CRM demand specifying doctor, amount (₹), and notes. Admin approves or rejects with remarks.
- **Gift Article Catalog**: Admin manages a list of gift articles (name, description).
- **Gift Distribution Entry**: MR can log gift distribution to a doctor in the daily working report (new tab: Gift Distribution — select doctor, gift article, quantity).
- **Gift Demand Orders**: MR can raise a demand for gift articles (article, quantity, notes). Admin accepts or rejects.
- **Admin CRM Approvals page**: Lists all pending/approved/rejected CRM demands, admin can approve/reject each.
- **Admin Gift Orders page**: Lists all gift demand orders, admin can accept/reject.
- **Admin Report Downloads**: Buttons to download CRM report and Gift Distribution report as CSV/Excel files.
- **ASM Portal CRM section**: Form to raise a CRM demand (select doctor from assigned areas, enter amount and notes), plus list of own submitted demands with status.
- **RSM Portal CRM section**: Same as ASM — raise CRM demand, view own list.

### Modify
- `MRWorkingDetails.tsx`: Add a 5th tab "Gift Distribution" — select doctor, gift article, quantity, submit.
- Admin portal navigation: Add "CRM Approvals", "Gift Orders", and "Reports" menu items (Reports may already exist — extend it).
- ASM/RSM layout navbars: Add "CRM Demand" menu item.

### Remove
- Nothing removed.

## Implementation Plan
1. **Backend (main.mo)**: Add types `CrmDemand`, `CrmDemandStatus`, `GiftArticle`, `GiftDemandOrder`, `GiftDemandStatus`, `GiftDistributionEntry`. Add functions: `raiseCrmDemand`, `getMyCrmDemands`, `getAllCrmDemands`, `updateCrmDemandStatus`, `addGiftArticle`, `getAllGiftArticles`, `deleteGiftArticle`, `logGiftDistribution`, `getMyGiftDistributions`, `getAllGiftDistributions`, `raiseGiftDemandOrder`, `getMyGiftDemandOrders`, `getAllGiftDemandOrders`, `updateGiftDemandOrderStatus`.
2. **Frontend - MRWorkingDetails.tsx**: Add Tab 5 for Gift Distribution (doctor selector, gift article selector, quantity, submit via `logGiftDistribution`).
3. **Frontend - ASM/RSM CRM page**: New page `CRMDemand.tsx` for both portals with form to raise demand and list of own demands.
4. **Frontend - Admin CRM Approvals page**: `AdminCRMApprovals.tsx` listing all CRM demands with approve/reject action.
5. **Frontend - Admin Gift Orders page**: `AdminGiftOrders.tsx` listing all gift demand orders with accept/reject actions.
6. **Frontend - Admin Reports**: Extend `AdminReports.tsx` with downloadable CRM and Gift Distribution report buttons (download as CSV).
7. **Frontend - Admin Gift Articles**: `AdminGiftArticles.tsx` for managing the gift article catalog.
8. **Update navigation**: ASM layout, RSM layout, Admin layout to include new pages.
