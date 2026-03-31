# Krishkar Pharma MR Reporting

## Current State
- ASM/RSM have "My Leaves" menu item wired to `Leaves.tsx` component (leave application already available)
- `Leaves.tsx` does NOT capture GPS when submitting -- `applyLeave` backend call has no GPS params
- `LeaveEntry` type in backend has no GPS fields
- GPS background tracking (every 3 min) is active for MR, ASM, RSM via `useGPSUpdater` in their respective layouts
- Admin portal has "Staff GPS Tracking" page using `getAllUserLatestLocations` (admin-only)
- RSM portal has NO GPS tracking view
- Working/expense reports already export GPS columns
- `getAllUserLatestLocations` is restricted to admins only in backend

## Requested Changes (Diff)

### Add
- GPS capture + mandatory GPS requirement on leave submission in `Leaves.tsx` (capture on submit, warn if unavailable, include coords in submission)
- GPS fields (`latitude`, `longitude`) to `LeaveEntry` type in backend and `applyLeave` function signature
- Staff GPS Tracking page for RSM portal (shows all staff latest locations with View on Map link)
- RSM can call `getAllUserLatestLocations` (update backend authorization)
- GPS location details in exported leave reports

### Modify
- Backend `applyLeave`: add optional `lat: ?Float` and `lng: ?Float` parameters
- Backend `LeaveEntry` type: add `latitude: ?Float` and `longitude: ?Float` fields
- Backend `getAllUserLatestLocations`: allow RSM role in addition to admin
- `backend.did.js`, `backend.did.d.ts`, `backend.d.ts`, `backend.ts`: update LeaveEntry and applyLeave signatures
- `Leaves.tsx`: capture GPS on submit, pass to backend, show GPS captured indicator
- RSM layout: add "Staff GPS Tracking" menu item pointing to new RSMGPSTracking component

### Remove
- Nothing

## Implementation Plan
1. Update `main.mo`: add GPS fields to LeaveEntry, update applyLeave, allow RSM in getAllUserLatestLocations
2. Update candid bindings (did.js, did.d.ts, backend.d.ts, backend.ts) for new signatures
3. Update `Leaves.tsx` to capture GPS before submit
4. Create `RSMGPSTracking.tsx` component (mirrors StaffGPSTracking but uses role-aware query)
5. Update RSMLayout to add Staff GPS Tracking nav item
