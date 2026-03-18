# Krishkar Pharma MR Reporting

## Current State
Full-stack MR reporting app. Supports MR, ASM, RSM, and Admin roles. Features: daily reporting, doctor visit/detailing, sample logging, chemist orders, expenses, leaves with approval chain, Admin Portal with full CRUD. Backend now includes `SampleAllotment`, `bulkAddDoctors`, and `getMySampleBalance` from previous iteration (not yet deployed).

## Requested Changes (Diff)

### Add
- **Sample Demand Order (backend):** MR can raise a demand order requesting a product and quantity from admin. New type `SampleDemandOrder` with id, mrPrincipal, productId, requestedQty, date, notes, status (Pending/Approved/Rejected).
- `raiseSampleDemandOrder(productId, qty, date, notes)` - MR creates demand order
- `getMySampleDemandOrders()` - MR views their own demand orders
- `getAllSampleDemandOrders()` - Admin views all demand orders
- `updateSampleDemandOrderStatus(orderId, newStatus)` - Admin approves or rejects
- **Admin Portal: Sample Management page** - allot samples, view allotments, view/act on demand orders
- **MR Portal: Samples page** - view sample balance (allotted vs distributed), raise demand orders, view demand order history
- **Admin Portal: Bulk Doctor Upload** - Excel/CSV upload in AdminDoctors page using SheetJS

### Modify
- Admin Portal sidebar: add "Sample Management" nav item
- MR Portal sidebar: add "Samples" nav item

### Remove
- Nothing

## Implementation Plan
1. Add `SampleDemandOrder` type and backend functions to main.mo
2. Frontend: Admin Sample Management - allot + view allotments + approve/reject demand orders
3. Frontend: MR Samples page - balance view + raise demand order form + demand order history
4. Frontend: AdminDoctors - bulk upload from Excel using SheetJS
