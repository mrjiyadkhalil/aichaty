

# Fiesta-style AI Workspace — Implementation Plan

## Overview
A multi-model AI comparison workspace where users send one prompt to multiple AI models simultaneously, compare responses side-by-side, enhance prompts, upload files for context, and synthesize a merged best answer.

---

## Phase 1: Foundation & Auth

### Supabase Cloud Setup
- Enable Lovable Cloud for database, auth, storage, and edge functions

### Authentication
- Signup/login/logout with Supabase Auth (email + password)
- Profiles table linked to auth.users
- Protected routes redirecting unauthenticated users to login

### App Shell & Layout
- **Left sidebar**: project list, chat history, collapsible
- **Top bar**: project title, model selector, settings
- **Main content area**: prompt input + response cards
- Clean, minimal, productivity-focused design with a dark/light mode toggle

---

## Phase 2: Database & Project System

### Database Tables
- **profiles** — user display info
- **user_roles** — role-based access (security best practice)
- **projects** — name, description, custom instructions, preferred models
- **project_files** — file metadata linked to projects
- **chats** — conversations within a project
- **messages** — user prompts per chat
- **model_responses** — individual AI model outputs per message
- **synthesis_results** — merged best answers

### RLS Policies
- Users can only access their own projects, chats, files, and responses

### Project CRUD
- Create, edit, delete projects from the sidebar/dashboard
- Each project has settings: name, description, custom instruction, preferred models

---

## Phase 3: Multi-Model Chat & Comparison

### Model Selection
- Checkboxes/chips to select which AI models to query (using Lovable AI gateway models: Gemini, GPT-5 variants)
- Persist preferred models per project

### Prompt Input
- Text area with send button
- Sends the prompt to all selected models in parallel via edge functions

### Edge Function: Multi-Model Chat
- Receives prompt + selected models + file context
- Calls Lovable AI gateway for each model in parallel
- Streams responses back to the client
- Handles per-model errors gracefully (one model failing doesn't break others)

### Comparison Interface
- Each model response in its own card showing: model name, loading spinner, response text, error state, copy button, include/exclude toggle for synthesis
- Toggle between **side-by-side** and **stacked** layouts

---

## Phase 4: Prompt Enhancer

### "Enhance Prompt" Button
- Sends the user's draft prompt to an AI model via edge function
- Returns an improved version shown in an editable text area
- User can accept, edit further, or discard before sending

---

## Phase 5: File Upload & Context

### Supabase Storage
- Private `project-files` bucket with RLS
- Support PDF, DOCX, TXT uploads

### File Processing Edge Function
- Extract text from uploaded files (parse on backend)
- Store extracted text in project_files table
- Attach file context to prompts when sending to models

### UI
- File upload area in project settings or chat
- List of attached files with delete option

---

## Phase 6: Synthesis

### "Synthesize Best Answer" Button
- Takes selected (included) model responses
- Sends them to an AI model via edge function with instruction to merge into one best answer
- Displays the synthesized result in a highlighted card
- Saves to synthesis_results table

---

## Phase 7: Chat History & Export

### Chat History
- Sidebar shows list of past chats per project
- Click to reload full conversation (prompts, all model responses, synthesis)
- Timestamps on all entries

### Export
- Copy any individual response to clipboard
- Export full conversation as Markdown or plain text file

---

## Phase 8: Dashboard

### Home Dashboard
- Grid of user's projects with name, description, last activity
- Quick-create new project button
- Recent chats section

---

## Design Notes
- Modern card-based UI with subtle shadows and rounded corners
- Color-coded model response cards for easy visual distinction
- Responsive desktop-first layout
- Loading skeletons for async states
- Toast notifications for errors and actions

