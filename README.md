# 📚 AI-Flashcard-App (FlashGenie)

FlashGenie is an AI-powered study workspace built with Next.js and Google Gemini. Upload your study material, chat with it, and turn it into flashcards, quizzes, visual explanations, and storyboards — all tied to the same study conversation.

> Upload your material → talk to it → understand it → turn it into flashcards → take a quiz → see it visually → learn it through a story.

---

## ✨ Features

- **AI Study Chat** — ask questions about your uploaded material; Gemini answers using your sources as primary context.
- **File Uploads** — PDF, DOCX, TXT, and images, parsed and validated server-side.
- **Conversations** — each study session is saved and listed in the sidebar; open, rename, or continue any past conversation.
- **Flashcard Generator** — turn a conversation into a study deck.
- **Quiz Generator** — auto-generated multiple-choice/true-false questions with scoring.
- **Visual Explanations** — step-by-step visual breakdowns of a concept.
- **Storyboard Mode** — a scene-by-scene script for a topic.
- **Auth & Dashboard** — Supabase-backed login/signup, protected dashboard, and session middleware.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Auth & Database | Supabase (Postgres + Auth) |
| AI | Google Gemini |
| Forms | React Hook Form |
| UI Primitives | Radix UI (Dialog, Label, Slot) + custom components |

---

## 📁 Project Structure

```
app/
  api/
    chat/                       # POST — AI tutor chat turn
    conversations/[id]/          # GET/PATCH/DELETE — single conversation
    generate-flashcards/        # POST — flashcard deck generation
    generate-quiz/              # POST — quiz generation
    generate-storyboard/        # POST — storyboard
    generate-visual/            # POST — visual explanation generation
    upload/                     # POST — file upload + parsing
  dashboard/
    layout.tsx
    page.tsx
  login/
    actions.ts
    page.tsx
  signup/
    actions.ts
    page.tsx
  globals.css
  layout.tsx
  page.tsx

components/
  ui/                          # shared primitives: button, card, dialog, form,
                                # input, label, skeleton, spinner, textarea
  workspace/
    main-workspace.tsx         # main AI study workspace (chat + tools)
    sidebar.tsx                # conversation history sidebar
    study-tools.tsx            # flashcards / quiz / visual / storyboard triggers
    toast.tsx                  # notifications
  auth-form.tsx
  dashboard-skeleton.tsx
  loader.tsx
  logout-button.tsx
  navbar.tsx
  page-container.tsx
  site-header.tsx

hooks/
  use-auth.ts

lib/
  supabase/
    client.ts                  # browser Supabase client
    middleware.ts               # session refresh used by middleware.ts
    server.ts                   # server-side Supabase client
  file-parser.ts                # PDF/DOCX/TXT/image parsing
  utils.ts
  validations.ts                # Zod schemas for requests/AI output

types/
  index.ts

public/
  file.svg, globe.svg, next.svg, vercel.svg, window.svg

.env                            # local environment variables (not committed)
components.json                 # shadcn/ui config
next.config.ts
postcss.config.js
tailwind.config.ts
tsconfig.json
```

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 18.18+ (Node 20 LTS recommended)
- A [Supabase](https://supabase.com) project
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` (or `.env.local`) file in the project root:

```bash
# Google Gemini — server-side only, never exposed to the browser
GEMINI_API_KEY=your_gemini_api_key

# Supabase — the anon/publishable key is safe for the browser
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ Never commit real keys. `GEMINI_API_KEY` and any Supabase service-role key must only ever be read in server-side code (API routes, server actions) — never imported into a `"use client"` file.

### 4. Set up the database

Run your Supabase schema/migration (tables for conversations, messages, sources, decks/cards, quizzes/quiz_questions) in the Supabase SQL Editor, with Row Level Security enabled and owner-only policies on every table.

### 5. Run the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 🔒 Security Notes

- `GEMINI_API_KEY` is only read inside server-side API routes — never bundled into client JavaScript.
- Every API route authenticates the request and verifies that the conversation/source/deck/quiz being accessed belongs to the calling user.
- Uploaded files are validated for type and size before parsing.
- AI-generated JSON (flashcards, quiz, visual, storyboard) is validated against Zod schemas before being saved or rendered.

---

## 🧭 Roadmap

- Real video generation for storyboard mode
- AI image generation for visual scenes
- Spaced-repetition scheduling for flashcards
- Shareable/public decks
