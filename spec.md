# Krishkar Pharma MR Reporting

## Current State
App has a single-user flow: after Internet Identity login, everyone sees the same MR navigation (Dashboard, Profile, Areas, Doctors, Chemists, Products, Expenses, Leaves). Backend already has role-based authorization (admin/user/guest) with `isCallerAdmin()`, `getCallerUserRole()`, `assignCallerUserRole()`, `getAllMRProfiles()`, `getAllLeaveApplications()`, `updateLeaveStatus()` APIs.

## Requested Changes (Diff)

### Add
- Role detection after login: call `isCallerAdmin()` to determine if user is Admin or MR
- **Admin Portal**: Separate navigation and pages shown only to admins:
  - Admin Dashboard with overview: total MRs, pending leaves, etc.
  - MR Management page: view all registered MR profiles (from `getAllMRProfiles()`)
  - Leave Approvals page: view all leave applications from all MRs, approve/reject using `updateLeaveStatus()`
  - Products management (admins manage the product master)
  - Areas management (admins manage areas)
- **MR Portal**: Existing navigation shown to regular users (role=user)
- **New User / Guest flow**: If `getCallerUserRole()` returns guest, show a "Pending Approval" / "Access Not Granted" screen explaining they need admin to assign them the MR role
- Role badge in sidebar showing "Admin" or "MR" based on role
- Loading state while role is being fetched after login

### Modify
- `App.tsx`: After login, fetch role and conditionally render Admin layout or MR layout
- Sidebar: Show "Admin Portal" branding for admins vs "MR Portal" for MRs
- Header: Show role badge (Admin/MR)

### Remove
- Nothing removed

## Implementation Plan
1. Create `useUserRole` hook that calls `isCallerAdmin()` and `getCallerUserRole()` to determine role, with loading state
2. Update `App.tsx` to use the hook and branch to AdminLayout or MRLayout
3. Create `AdminLayout` component with its own nav (Dashboard, MR Management, Leave Approvals, Products, Areas)
4. Create `AdminDashboard` page showing summary stats
5. Create `MRManagement` page showing all MR profiles
6. Create `LeaveApprovals` page showing all leave applications with approve/reject actions
7. MR layout stays mostly the same, just adds role badge
8. Guest/new user sees an "Access Pending" screen
