# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# KPSS Design & Typography Guidelines (STRICT RULE - DO NOT BREAK)

- **Typography:** Strictly use `Plus Jakarta Sans` (`var(--kpss-font, 'Plus Jakarta Sans', sans-serif)`).
- **Color Palette & Buttons:**
  - Primary buttons and active progress bar fills MUST use the project's signature solid `#111111` (black/dark slate) with `#FFFFFF` text.
  - Secondary/subtle buttons use `var(--kpss-subtle-bg, #F1F5F9)` with `1px solid var(--kpss-border, #E2E8F0)` and `var(--kpss-text, #0F172A)`.
  - Icon boxes MUST use `var(--kpss-subtle-bg, #F1F5F9)` with monochrome/theme stroke `var(--kpss-text, #0F172A)`.
  - NEVER introduce multi-colored rainbow icon backgrounds (e.g. purple, green, red, amber boxes) or bright orange/purple solid buttons.
  - Badges must be clean and subtle (`#F1F5F9` background, `#E2E8F0` border, `#64748B` text).
  - All elements must support both light mode and dark mode via CSS variables (`var(--kpss-card-bg)`, `var(--kpss-subtle-bg)`, `var(--kpss-border)`, `var(--kpss-text)`).
