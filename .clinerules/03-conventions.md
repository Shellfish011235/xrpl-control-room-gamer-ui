# Conventions

## Code style
- Prefer `const` and functional components. Hooks at top of component.
- Use existing store hooks; avoid new global state unless needed.
- Keep components under ~300 lines; extract panels or hooks when large.

## Imports
- Prefer absolute-ish paths from `src/` (e.g. `../store/walletStore`, `../../services/xrplService`). No path alias in tsconfig for `@/`.
- Group: React, then third-party, then local (components, store, services).

## Errors & loading
- Use local state for submit/loading (e.g. `createSubmitting`, `streaming`). Show inline error text; avoid uncaught promise rejections in UI paths.
- For async (Xaman, fetch): try/catch, set error state, clear on retry or success.

## Accessibility
- Use semantic HTML. Buttons for actions, `aria-label` on icon-only buttons. No keyboard traps in modals without escape/close.

## Files to touch with care
- `src/App.tsx` – routes and lazy imports; keep redirects and route list in sync with nav.
- `src/components/Navigation.tsx` – single source of nav items; link labels and paths must match pages.
- `src/services/xaman/xamanService.ts` – singleton; event listeners are per-callback, remember to `off()` when done.
