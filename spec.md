# Krishkar Pharma MR Reporting

## Current State
- ASM and RSM portals have Leave Approvals but no way to apply for their own leaves.
- MR Working Details has chemist order entry but no inline add-chemist option.

## Requested Changes (Diff)

### Add
- "My Leaves" page for ASM and RSM portals using existing Leaves component.
- Nav items for "My Leaves" in ASMLayout and RSMLayout.
- "Add New Chemist" dialog in MRWorkingDetails next to chemist selector.

### Modify
- ASMLayout: add my-leaves page type, nav item, route.
- RSMLayout: add my-leaves page type, nav item, route.
- MRWorkingDetails: add inline Add Chemist dialog.

### Remove
- Nothing.

## Implementation Plan
1. Add my-leaves to ASMLayout with nav item and Leaves component render.
2. Add my-leaves to RSMLayout with nav item and Leaves component render.
3. Add Add Chemist dialog in MRWorkingDetails near chemist selector.
