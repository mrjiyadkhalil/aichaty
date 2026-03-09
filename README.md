# AI Chaty (AI Fiesta Clone)

**Compare AI Models. Get Better Answers.**

Fiesta AI is a multi-model AI chat platform that lets you send prompts to multiple AI models simultaneously, compare their responses side by side, and synthesize the best answer — all in one workspace.

---

## Table of Contents

- [Features](#features)
- [Chat Modes](#chat-modes)
- [Supported Models](#supported-models)
- [Cost Modes](#cost-modes)
- [Admin Panel](#admin-panel)
- [Tech Stack](#tech-stack)

---

## Features

### 🔐 Authentication
- Email-based signup and login with email verification
- Protected routes — unauthenticated users are redirected to the auth page
- User profiles with display name, avatar, and activity tracking

### 💬 Chat System
- Create and manage multiple chat conversations
- Chat history stored in the database with full message threads
- Each message stores the original prompt, enhanced version, and final content
- Real-time loading states with per-model response tracking
- Retry failed model responses individually
- Share chats via secure share links with revocable tokens

### 🤖 Multi-Model AI
- Send a single prompt to **multiple AI models at once**
- Compare responses side-by-side in a grid or stacked layout
- Toggle individual models on/off per request
- Per-response latency tracking (in milliseconds)
- Include/exclude specific model responses from synthesis

### 🧪 Synthesis
- Combine the best parts of multiple model responses into one synthesized answer
- Choose which model responses to include in the synthesis
- Synthesis powered by a dedicated AI model (configurable per cost mode)

### ✨ Prompt Enhancement
- AI-powered prompt enhancer that rewrites your prompt for better results
- Preview enhanced prompt before sending
- Option to keep original or use the enhanced version

### 🎤 Voice Input
- Speech-to-text voice input for hands-free prompting
- Toggle recording on/off with visual feedback

### 📁 Projects & File Context
- Organize chats under projects with custom names and descriptions
- Set **custom instructions** per project (automatically prepended to prompts)
- Set **preferred models** per project
- Upload files to projects (up to 10 MB each)
- Automatic text extraction from uploaded files
- Attach file context to individual messages for grounded responses

### 📊 Usage Tracking
- Per-user usage event logging (model, provider, tokens, cost, latency)
- Soft cap ($5) and hard cap ($10) usage limits
- Near-cap warnings and at-cap blocking
- Rate limiting: 30 requests per 60-minute window

### ⚙️ User Preferences
- **Cost Mode** selection: Low Cost, Balanced, or Premium
- **Default Layout**: Grid or Stacked response view
- **Default Models**: Pre-select preferred models

### 🔗 Explore Section
- Discover prompt templates and suggestions on the chat landing page

---

## Chat Modes

| Mode | Description |
|------|-------------|
| **SuperFiesta** | Auto-routes your prompt to the single best model using intelligent model selection. Clean, single-response UI. |
| **Multi-Chat** | Send to multiple selected models simultaneously. Compare responses in a grid. Synthesize the best answer. |

---

## Supported Models

| Model | Provider | Short Label |
|-------|----------|-------------|
| Gemini 3 Flash (Preview) | Google | G3F |
| Gemini 2.5 Flash | Google | G2.5F |
| Gemini 2.5 Pro | Google | G2.5P |
| GPT-5 | OpenAI | GPT5 |
| GPT-5 Mini | OpenAI | GPT5m |
| GPT-5 Nano | OpenAI | GPT5n |

---

## Cost Modes

| Mode | Available Models | Max Output Tokens | Timeout |
|------|-----------------|-------------------|---------|
| **Low Cost** | Gemini 2.5 Flash, GPT-5 Nano | 2,048 | 30s |
| **Balanced** | Gemini 3 Flash, Gemini 2.5 Flash, Gemini 2.5 Pro, GPT-5 Mini, GPT-5 Nano | 4,096 | 60s |
| **Premium** | All 6 models | 8,192 | 90s |

---

## Admin Panel

The admin panel is accessible at `/admin` and restricted to users with the `admin` role. It provides full operational visibility and control over the platform.

### 📈 Dashboard (`/admin`)
- Overview metrics and KPIs at a glance
- Quick access to all admin sections

### 👥 User Management (`/admin/users`)
- View all registered users with profiles
- Drill into individual user details (`/admin/users/:id`)
- View user activity, status, and AI access settings

### 📊 Usage Analytics (`/admin/usage`)
- Platform-wide usage statistics
- Breakdown by model, provider, user, and time period
- Token consumption and estimated cost tracking

### 🤖 Model Configuration (`/admin/models`)
- Enable/disable AI models globally
- Configure per-model settings: cost tier, max tokens, timeout, retry behavior
- Mark models as premium-only

### ⚙️ System Settings (`/admin/settings`)
- Global system configuration via key-value JSON store
- Provider-level configs (timeouts, retry, enable/disable)

### 🚨 Error Logs (`/admin/errors`)
- View all system errors with severity levels
- Filter by error type, model, provider, and request type
- Mark errors as resolved

### 📋 Audit Logs (`/admin/audit`)
- Full audit trail of admin actions
- Tracks who did what, when, and to which resource

### 🚩 Feature Flags (`/admin/feature-flags`)
- Toggle features on/off across the platform
- Each flag has a key, description, and enabled state

### 📝 Templates (`/admin/templates`)
- Manage system-wide prompt templates
- Categorize, feature, sort, and activate/deactivate templates
- Templates appear in the Explore section for users

### 🔗 Share Links (`/admin/share-links`)
- Monitor all active share links across the platform
- Revoke share links when needed

### 📢 Announcements (`/admin/announcements`)
- Create and manage platform announcements
- Configure type (info, warning, etc.), placement, and scheduling
- Toggle active state

### 🏥 System Health (`/admin/health`)
- Monitor system health and provider availability

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui, Framer Motion |
| **State** | React Query, React hooks |
| **Routing** | React Router v6 |
| **Backend** | Lovable Cloud (PostgreSQL, Auth, Storage, Edge Functions) |
| **AI Gateway** | Backend functions proxying to Google & OpenAI models |

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (display name, avatar, status) |
| `projects` | User projects with instructions & preferred models |
| `project_files` | Uploaded files with extracted text |
| `chats` | Chat conversations (optionally linked to projects) |
| `messages` | User messages within chats |
| `model_responses` | Individual AI model responses per message |
| `synthesis_results` | Synthesized responses combining multiple models |
| `usage_events` | Token/cost tracking per request |
| `user_preferences` | Per-user settings (cost mode, layout, default models) |
| `user_roles` | Role-based access control (admin, user) |
| `share_links` | Shareable chat links with tokens |
| `announcements` | Platform announcements |
| `system_templates` | Prompt templates for the Explore section |
| `feature_flags` | Feature toggles |
| `model_configs` | Per-model admin configuration |
| `provider_configs` | Per-provider admin configuration |
| `error_logs` | System error tracking |
| `admin_audit_logs` | Admin action audit trail |
| `system_config` | Global key-value configuration |

---

## Backend Functions

| Function | Purpose |
|----------|---------|
| `multi-model-chat` | Routes prompts to AI models and returns responses |
| `enhance-prompt` | AI-powered prompt rewriting |
| `synthesize` | Combines multiple model responses into one |
| `extract-file-text` | Extracts text content from uploaded files |
| `admin-api` | Admin-only operations and data access |

---

## Security

- **Row-Level Security (RLS)** on all tables — users can only access their own data
- **Admin role** verified server-side via `has_role()` security-definer function
- **Share links** use cryptographically random tokens with revocation support
- **Usage caps** prevent runaway costs ($5 soft / $10 hard)
- **Rate limiting** — 30 requests per 60-minute window
