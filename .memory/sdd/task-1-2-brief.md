# Task 1-2: Install sidebar-07 and Remove Unused Files

## Objective

Install the sidebar-07 shadcn block and clean up files that are replaced by it.

## Steps

1. Run `npx shadcn@latest add sidebar-07` in the project root
2. After install, delete these files:
   - `app/dashboard/page.tsx` (demo page)
   - `components/team-switcher.tsx` (not needed)
   - `components/nav-projects.tsx` (not needed)
3. Verify the deletions worked
4. Commit with message: `chore: install sidebar-07 and remove unused files`

## Status: DONE

- Commit: `3c4bb02 chore: install sidebar-07 and remove unused files`
- Note: `app/dashboard/page.tsx` did not exist prior to install and was not created by the installer (only `layout.tsx` was present). The other two files were successfully deleted.
