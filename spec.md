# PDF Toolkit Pro

## Current State
The app is a mobile-friendly web PDF Toolkit with 6 tools:
- Image to PDF, PDF to Images, Merge PDFs, Split PDF, Compress PDF, View PDF
- Clean home screen grid with tool cards
- All processing is client-side (no server uploads)
- No dark mode, no favorites, no search, no additional tools

## Requested Changes (Diff)

### Add
- **Watermark tool**: Add text watermark to all pages of a PDF (position, opacity, font size controls)
- **Password tool**: Lock PDF with password / unlock password-protected PDF using pdf-lib
- **Rotate tool**: Rotate individual or all PDF pages by 90/180/270 degrees
- **Rename & Organize tool**: Rename uploaded PDF files and reorder a list of files before downloading
- **Favorites system**: Mark any file (by name) as favorite, persist via localStorage, show favorites section on home screen
- **Search**: Search bar on home screen to filter tools by name
- **Dark/Light mode toggle**: System-aware default, manual toggle button in header, persisted in localStorage
- App renamed to "PDF Toolkit Pro" throughout UI

### Modify
- Home screen header: update title to "PDF Toolkit Pro", add dark mode toggle button, add search bar
- Home screen tools grid: add 4 new tool cards (Watermark, Password, Rotate, Organize)
- App.tsx Tool type union: extend with new tool IDs
- Footer: update branding text

### Remove
- Nothing removed

## Implementation Plan
1. Extend `Tool` type and `TOOLS` array in App.tsx with new entries
2. Add dark mode toggle (useEffect + localStorage + `dark` class on `<html>`)
3. Add search state to filter TOOLS on home screen
4. Add favorites state (localStorage) with star button on each tool card and a Favorites section
5. Create `WatermarkPdf.tsx` tool component
6. Create `PasswordPdf.tsx` tool component (lock/unlock)
7. Create `RotatePdf.tsx` tool component
8. Create `OrganizePdf.tsx` tool component (rename + reorder files)
9. Wire all new tools in App.tsx render
10. Update app title to PDF Toolkit Pro
