# Krishkar Pharma MR Reporting

## Current State
The app supports MR, ASM, RSM, and Admin roles with daily working details, expense management (TA/DA), doctor visits, sample/gift distribution, CRM demand, leave management, and admin portal features. There is no working plan feature.

## Requested Changes (Diff)

### Add
- **Working Plan** module for MR, ASM, and RSM roles
  - Fields per plan entry:
    - Date of working (date picker, restricted to current month and next month only)
    - Work content/description (text area)
    - Working mode: "Alone" or "With" (dropdown/radio; if "With", allow entering name/details of who they are working with)
    - Station type: "As Per Working Plan" or "Other Station" (dropdown)
  - Each role (MR, ASM, RSM) gets a "Working Plan" menu item in their sidebar
  - Users can add, view, and delete their own working plan entries
  - Plans are stored per user (principal)
  - Display plans in a table grouped or filterable by month (current/next)
  - Admin can view all users' working plans in Admin Portal > Working Plans section

### Modify
- Backend: Add WorkingPlan type and CRUD functions
- Frontend: Add Working Plan page to MR, ASM, RSM portals and admin portal view

### Remove
- Nothing removed

## Implementation Plan
1. Add `WorkingPlan` record type to backend with fields: id, principalId, date, content, workingWith (opt text), stationType ("plan" | "other"), createdAt
2. Add stable storage for working plans (HashMap by user principal)
3. Add backend functions: `addWorkingPlan`, `getMyWorkingPlans`, `deleteWorkingPlan`, `adminGetAllWorkingPlans`
4. Add Working Plan page component used by MR, ASM, RSM portals
5. Add Working Plan menu item to MR, ASM, RSM sidebars
6. Add Admin Portal > Working Plans view
