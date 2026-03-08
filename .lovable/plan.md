

# Premium Dark UI Redesign Plan

## Overview
Transform the entire app from a light/neutral theme to a premium dark AI-native workspace with teal/cyan accents, glassy cards, subtle glows, and bold typography. This touches the design system (CSS variables, Tailwind config), every page, and every major component.

## 1. Design System Foundation

### CSS Variables (`src/index.css`)
Replace both light and dark themes with a single premium dark palette:
- **Background**: `222 47% 5%` (near-black charcoal)
- **Card/Surface**: `220 30% 9%` (slightly lighter charcoal)
- **Primary accent**: `170 80% 50%` (teal-cyan glow)
- **Foreground**: `0 0% 95%` (white text)
- **Muted foreground**: `220 10% 50%` (cool gray)
- **Border**: `220 20% 14%` (subtle translucent)
- **Destructive**: `0 62% 50%`
- **Accent**: same as primary (teal)
- Force dark mode by default via `document.documentElement.classList.add('dark')` in `main.tsx`

### Tailwind Config (`tailwind.config.ts`)
- Add custom `glow` box-shadow utilities
- Add `glass` utility classes (backdrop-blur + semi-transparent bg)
- Add fade-in, scale-in, slide-up keyframes/animations
- Add `model-1` through `model-5` color utilities mapped to CSS vars

### Global Styles
- Premium font stack: keep Space Grotesk for headings, Inter for body
- Add subtle grid background pattern via CSS (repeating linear gradient)
- Add `.glass-card` utility class for glassy card treatment
- Add `.glow-border` for accent-glowing borders
- Remove `App.css` entirely (unused legacy styles)

## 2. Landing Page (new: `src/pages/Landing.tsx`)
Create a public landing page at `/` for unauthenticated users:
- **Hero**: Large bold headline ("Compare AI Models. Get Better Answers."), subheadline, two CTAs (Get Started / Learn More), right-side floating app mockup/illustration using CSS shapes
- **Trust strip**: "Powered by GPT-5, Gemini, Claude" text strip
- **Feature cards**: 3 cards (Compare, Enhance, Synthesize) with icons and descriptions
- **Final CTA**: Bottom section with signup call-to-action
- Dark background with subtle animated grid overlay
- Route: `/` shows Landing for unauthenticated, redirects to `/dashboard` for authenticated

## 3. Auth Page Redesign (`src/pages/Auth.tsx`)
- Full dark background with subtle grid texture
- Glassy card with border glow
- Teal accent on CTA button with hover glow effect
- Bold brand mark at top
- Premium input fields with subtle borders

## 4. Sidebar Redesign (`src/components/AppSidebar.tsx`)
- Deep dark background (`bg-[hsl(220,30%,7%)]`)
- Teal accent dot/bar for active state
- Hover states with subtle background lift
- Logo area with teal glow icon
- Clean separator lines
- Footer email in muted gray

## 5. TopBar Redesign (`src/components/TopBar.tsx`)
- Semi-transparent glass background with backdrop blur
- Subtle bottom border
- Clean typography
- Remove theme toggle (dark-only now)

## 6. Dashboard Redesign (`src/pages/Dashboard.tsx`)
- Page header with large bold typography
- Glassy "New Project" button with teal glow
- Search input with dark styling
- Project cards as glass cards with hover lift + glow border
- Recent chats with hover highlight

## 7. ProjectCard Redesign (`src/components/ProjectCard.tsx`)
- Glass card treatment
- Teal accent icon container
- Hover: subtle upward translate + border glow
- Clean metadata layout

## 8. Chat Workspace Redesign (`src/pages/ChatWorkspace.tsx`)
- User message bubble: dark glass card with teal-tinted left border
- Response area: spacious with clear hierarchy

## 9. PromptComposer Redesign (`src/components/PromptComposer.tsx`)
- Dark glass container pinned at bottom
- Textarea with teal focus ring glow
- Model chips: selected = teal filled, unselected = dark outline with hover glow
- "Send to Models" button: teal with glow effect
- "Enhance Prompt" button: ghost with sparkle icon

## 10. ModelResponseCard Redesign (`src/components/ModelResponseCard.tsx`)
- Glass card with colored top border (model color)
- Dark content area
- Hover shadow with subtle model-color glow
- Clean action buttons
- Better skeleton loading with teal pulse

## 11. SynthesisPanel Redesign (`src/components/SynthesisPanel.tsx`)
- Distinct treatment: stronger teal border/glow
- "Best Final Answer" header with sparkle icon and teal accent
- Glass card with accent background tint
- Prominent CTA button

## 12. EmptyState Redesign (`src/components/EmptyState.tsx`)
- Teal-tinted icon container with subtle glow
- Bold heading
- Muted description
- Premium CTA button

## 13. Settings Page (`src/pages/Settings.tsx`)
- Glass cards for each section
- Teal accent on toggles/radios
- Clean grouped layout
- Remove dark mode toggle (always dark now)

## 14. Project Detail Page (`src/pages/ProjectDetail.tsx`)
- Glass cards for settings, files, chats sections
- Teal accents on action buttons
- Clean file/chat list items with hover states

## 15. Admin Layout (`src/components/admin/AdminLayout.tsx`)
- Deep dark sidebar matching main app
- Teal active state indicators
- Glass-style main content area

## 16. Modals & Dialogs
- All modals: glass background, dark overlay, teal accents
- NewProjectDialog, PromptEnhancerModal, FileContextModal

## 17. Component Updates
Files to modify:
1. `src/index.css` — new dark color system + utility classes
2. `tailwind.config.ts` — new animations, shadows, utilities
3. `src/App.css` — delete (unused)
4. `src/main.tsx` — force dark mode
5. `src/App.tsx` — add Landing route
6. `src/pages/Landing.tsx` — new file
7. `src/pages/Auth.tsx` — redesign
8. `src/pages/Dashboard.tsx` — redesign
9. `src/pages/ChatWorkspace.tsx` — redesign
10. `src/pages/Settings.tsx` — redesign
11. `src/pages/ProjectDetail.tsx` — redesign
12. `src/components/AppSidebar.tsx` — redesign
13. `src/components/TopBar.tsx` — redesign
14. `src/components/PromptComposer.tsx` — redesign
15. `src/components/ModelResponseCard.tsx` — redesign
16. `src/components/SynthesisPanel.tsx` — redesign
17. `src/components/EmptyState.tsx` — redesign
18. `src/components/ProjectCard.tsx` — redesign
19. `src/components/NewProjectDialog.tsx` — style updates
20. `src/components/PromptEnhancerModal.tsx` — style updates
21. `src/components/FileContextModal.tsx` — style updates
22. `src/components/ExportMenu.tsx` — style updates
23. `src/components/ResponseGrid.tsx` — minor spacing
24. `src/components/AppLayout.tsx` — minor updates
25. `src/components/admin/AdminLayout.tsx` — redesign
26. `src/components/admin/MetricCard.tsx` — glass style
27. All admin pages — glass card treatment

## 18. Key Design Tokens
```text
Background:     hsl(222, 47%, 5%)     #0a0d14
Surface:        hsl(220, 30%, 9%)     #121826
Surface-hover:  hsl(220, 25%, 12%)    #1a2033
Border:         hsl(220, 20%, 14%)    #1e2638
Primary:        hsl(170, 80%, 50%)    #1ad6b0 (teal)
Primary-glow:   0 0 20px hsl(170 80% 50% / 0.3)
Text:           hsl(0, 0%, 95%)       #f2f2f2
Text-muted:     hsl(220, 10%, 50%)    #778096
```

