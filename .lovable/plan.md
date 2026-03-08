

# Fiesta-style AI Workspace — Full Build Plan

## What Already Exists
- Auth (signup/login/logout) with profiles table
- Basic sidebar with projects and chats
- TopBar with model selector badges
- Simple prompt input with send/enhance buttons
- ModelResponseCard with loading/success/error states
- Edge function `multi-model-chat` calling Lovable AI gateway
- Database tables: projects, chats, messages, model_responses, synthesis_results, project_files, profiles, user_roles
- Private `project-files` storage bucket

## What Needs to Be Built

### 1. Dashboard Page (`/dashboard`)
- New route with project grid cards (name, description, last activity)
- Search bar + sort dropdown (name, date, recent)
- "New Project" button
- Recent chats section below projects
- Empty state when no projects exist
- Redirect `/` to `/dashboard` when no project is selected

### 2. Project Detail / Settings
- Edit/delete project functionality (currently only create exists)
- Project settings fields: name, description, custom instruction, preferred models
- File upload section within project settings
- NewProjectDialog upgraded to support editing with all fields

### 3. Prompt Composer Upgrade
- Replace simple `PromptInput` with full `PromptComposer` component
- Three buttons: "Enhance Prompt", "Attach File Context", "Send to Models"
- Selected models displayed as removable chips
- Selected files displayed as removable chips
- Toggle for "Use Project Instruction"
- Disabled send when prompt empty, warning toast if no models selected

### 4. Prompt Enhancer Modal
- Two-panel modal: original prompt (left) vs enhanced prompt (right)
- New edge function `enhance-prompt` that sends the draft to AI with enhancement instructions
- Buttons: "Keep Original", "Use Enhanced Prompt", "Edit Enhanced Prompt", "Cancel"
- Enhanced prompt is editable before accepting

### 5. File Upload System
- Drag-and-drop upload zone in project settings and as a modal from chat
- Accept PDF, DOCX, TXT files
- Upload to `project-files` bucket via Supabase Storage
- New edge function `extract-file-text` to extract text from uploaded files
- Save metadata + extracted text to `project_files` table
- `FileContextModal` to select which files to attach to a prompt
- File chips in prompt composer

### 6. Response Cards Upgrade
- Add latency tracking (measure time from send to response)
- Add "Retry" button per card (re-invoke edge function for that model)
- Rename include/exclude toggle label to "Include in Final Answer"
- Grid view (side-by-side) vs stacked view toggle in TopBar
- Add `react-markdown` for rendering markdown in responses

### 7. Synthesis Panel
- New `SynthesisPanel` component below response cards
- "Synthesize Best Answer" button
- New edge function `synthesize` that merges selected model outputs
- Display merged answer in a highlighted card
- Buttons: "Copy Final", "Export Final", "Regenerate"
- Save result to `synthesis_results` table

### 8. Export System
- `ExportMenu` dropdown in TopBar
- Export full conversation as markdown or plain text (download file)
- Copy individual model responses (already exists)
- Copy final synthesized answer

### 9. Settings Page
- New `/settings` route
- Display name, avatar management
- Default model preferences
- Theme toggle (dark/light)

### 10. Layout & Navigation Updates
- Add routes: `/dashboard`, `/project/:id`, `/chat/:id`, `/settings`
- Update sidebar to use routes instead of state-based navigation
- TopBar: add layout toggle (grid/stacked), export menu
- Empty states for no projects, no chats, no files

## Database Changes
- Add `prompts` table to store original, enhanced, and final prompt versions per message (or add columns to `messages`: `enhanced_content`, `final_content`, `file_context_ids`)
- Add `latency_ms` column to `model_responses` table

## Edge Functions to Create
1. `enhance-prompt` — takes a draft prompt, returns an improved version
2. `synthesize` — takes multiple model responses, returns a merged best answer
3. `extract-file-text` — extracts text from uploaded PDF/DOCX/TXT files

## New Components
- `AppShell` — layout wrapper with sidebar + topbar + content
- `ProjectCard` — dashboard project grid card
- `PromptComposer` — full prompt input with file/model chips
- `PromptEnhancerModal` — two-panel enhance dialog
- `FileContextModal` — file selector dialog
- `ResponseGrid` — grid/stacked layout wrapper for response cards
- `SynthesisPanel` — merged answer display
- `ExportMenu` — dropdown with export options
- `EmptyState` — reusable empty state component
- `SkeletonLoader` — reusable loading skeleton

## Implementation Order
1. Database migration (add columns to messages, latency to model_responses)
2. New edge functions (enhance-prompt, synthesize, extract-file-text)
3. Routing setup (dashboard, project, chat, settings routes)
4. Dashboard page with project cards
5. Project edit/delete + settings with file upload
6. PromptComposer with file/model chips
7. PromptEnhancerModal
8. FileContextModal + upload zone
9. ResponseCard upgrades (latency, retry, markdown, layout toggle)
10. SynthesisPanel
11. ExportMenu
12. Settings page
13. Empty states and polish

