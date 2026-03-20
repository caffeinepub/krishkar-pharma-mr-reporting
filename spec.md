# Krishkar Pharma MR Reporting

## Current State
- Previous build completed 4 changes: HQ removed from MRProfile signup, Products read-only for MR, Doctor Activity merged tab in Working Details, Areas/Doctors filtered by assigned areas.
- In MRManagement.tsx and UserManagement.tsx, the Pending Users section shows only truncated Principal IDs.
- The Role Assignment form requires manual Principal ID entry.
- Manager profiles table shows names, but Pending Users list does not.

## Requested Changes (Diff)

### Add
- Fetch `getAllUserProfiles()` in both MRManagement.tsx and UserManagement.tsx to build a name lookup map (Principal -> name).

### Modify
- **MRManagement.tsx Pending Users list**: Instead of showing truncated Principal ID, show the user's name (from `getAllUserProfiles()` map) as the primary label. Show truncated Principal ID in smaller text below. If no profile name found, show "Unnamed User" + truncated Principal ID.
- **UserManagement.tsx Pending Users / Role Assignment**: Same as above for any pending users display.
- **MRManagement.tsx MR Profiles table**: Add a "Name" column derived from `getAllUserProfiles()` or use existing profile name (MRProfile doesn't have name, but UserProfile does from `getAllUserProfiles()`). Cross-reference by Principal to show name in the table.
- **UserManagement.tsx Manager Profiles table**: Already shows profile.name — keep as is.
- **UserManagement.tsx "Assign Role" form**: When the principal input field has a value that matches a known user profile, show their name as a helper text below the input (e.g., "User: John Doe").

### Remove
- Nothing removed.

## Implementation Plan
1. In MRManagement.tsx: add `getAllUserProfiles()` query. Build a map: `Map<string, string>` (principalStr -> name). Use it in Pending Users list to show name.
2. In UserManagement.tsx: add `getAllUserProfiles()` query. Build name lookup map. Show name in pending users section. Also show name hint in the role assignment form when principalInput matches a known user.
3. Ensure MR profiles table in UserManagement shows MR name (from UserProfile, not MRProfile which has employeeCode/headQuarter/assignedAreas but no name).
