# 📚 FlashGenie

FlashGenie is an AI-powered study workspace built with Next.js and Google Gemini. Upload your study material, talk to it, and turn it into flashcards, quizzes, visual explanations, and video-style storyboards — all connected to the same study conversation.

> Upload your material → talk to it → understand it → turn it into flashcards → take a quiz → see it visually → learn it through a story.

---

## ✨ Features

- **AI Study Chat** — ask questions about your uploaded material; Gemini answers using your sources as the primary context, with Markdown-formatted responses (headings, lists, tables, code blocks).
- **File Uploads** — PDF, DOCX, TXT, and images (PNG/JPG/WEBP). Text is extracted server-side; images are sent directly to Gemini's multimodal understanding.
- **Conversation History** — every study session is saved, auto-titled after your first message, and searchable in the sidebar. Rename or delete anytime.
- **Flashcard Generator** — turn a conversation or its sources into a deck (5–20 cards, easy/medium/hard) with a dedicated flip-card study mode, progress tracking, and known/review marking.
- **Quiz Generator** — multiple-choice and true/false questions with instant scoring and explanations for missed answers.
- **Visual Explanation** — step-by-step breakdowns of a concept, rendered as a clean visual sequence.
- **Visual Story** — a multi-scene "learning story" that builds intuition for a topic scene by scene.
- **Video Lesson Storyboard** — an AI-generated scene-by-scene script (narration + visual description + duration) as a foundation for future video generation.
- **Dashboard** — study stats (sessions, flashcards, quizzes, time learning) and quick access to recent studies.
- **Secure by default** — Supabase Row Level Security on every table, private storage bucket, and all Gemini calls made server-side only.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Auth & Database | Supabase (Postgres + Auth + Storage) |
| AI | Google Gemini (`gemini-1.5-flash`) via `@google/generative-ai` |
| Validation | Zod (both request bodies and AI JSON output) |
| File parsing | `mammoth` (DOCX), `pdf-parse` (PDF) |
| Markdown rendering | `react-markdown` + `remark-gfm` |

---

## 📁 Project Structure

```
app/
  (workspace)/              # authenticated shell: sidebar + auth guard
    layout.tsx
    dashboard/               # stats + recent studies
    study/[id]/               # main AI study workspace for a conversation
    study/actions.ts           # server actions: create/rename/delete conversation
    decks/[deckId]/            # flashcard study mode
    quizzes/[quizId]/          # quiz player
  api/
    chat/                       # POST — AI tutor chat turn
    upload/                     # POST — file upload + text extraction
    generate-flashcards/        # POST — flashcard deck generation
    generate-quiz/              # POST — quiz generation
    generate-visual/            # POST — visual explanation generation
    generate-story/             # POST — visual story generation
    generate-video-storyboard/  # POST — video storyboard generation
  login/, register/           # existing auth pages (untouched)

components/
  sidebar.tsx                # chat history, search, rename/delete, mobile drawer
  study/                      # chat workspace: composer, message list, tool panel, result cards
  ui/                         # shared primitives (button, card, modal, menu, etc.)

lib/
  gemini/                    # Gemini client, prompts, Zod schemas, JSON-generation helper
  db/                        # typed Supabase data-access functions per table
  files/                     # upload validation + text extraction
  supabase/                  # Supabase client/server/middleware helpers (existing)
  storage.ts                  # Supabase Storage upload/download helpers

supabase/
  migrations/0001_init.sql   # full schema, RLS policies, storage bucket + policies

middleware.ts                 # refreshes the Supabase session on every request
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

Create a `.env.local` file in the project root:

```bash
# Google Gemini — server-side only, never exposed to the browser
GEMINI_API_KEY=your_gemini_api_key

# Supabase — the anon/publishable key is safe for the browser
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ Never commit real keys, and never reference `GEMINI_API_KEY` or a Supabase **service role** key from any client component — all AI calls happen through server-side API routes.

### 4. Set up the database

In the Supabase SQL Editor, run the migration:

```
supabase/migrations/0001_init.sql
```

This creates all tables (`conversations`, `messages`, `sources`, `decks`, `cards`, `quizzes`, `quiz_questions`, `profiles`), enables Row Level Security with owner-only policies, creates the private `study-materials` storage bucket with matching storage policies, and adds `conversations` to the Realtime publication (so the sidebar updates live).

If your Supabase project doesn't have the `supabase_realtime` publication yet, enable Realtime for the `conversations` table from **Database → Replication** in the dashboard.

### 5. Run the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 🗄 Database Schema (overview)

| Table | Purpose |
|---|---|
| `profiles` | One row per user, auto-created on sign-up |
| `conversations` | A study session; auto-titled after the first message |
| `messages` | Chat turns; `message_type` distinguishes plain text from flashcards/quiz/visual/story/video results |
| `sources` | Uploaded files with extracted text (or flagged as an image for Gemini vision) |
| `decks` / `cards` | Generated flashcard decks and their cards |
| `quizzes` / `quiz_questions` | Generated quizzes, questions, and recorded scores |

Every table has RLS enabled with a policy scoping access to `auth.uid() = user_id` — a user can only ever see their own data.

---

## 🔒 Security Notes

- `GEMINI_API_KEY` and any Supabase service-role key are read only inside server-side code (API routes / server actions) — they are never bundled into client JavaScript.
- All API routes call `requireUser()` first and verify the requested conversation/source/deck/quiz belongs to the authenticated user before touching it.
- Uploaded files are validated for MIME type and size (15MB max) before upload.
- AI JSON responses (flashcards, quiz, visual, story, storyboard) are validated with Zod before being saved or rendered; invalid responses trigger one retry, then a friendly error.
- Storage objects live under `{user_id}/{conversation_id}/...` and are locked down by storage policies matching the folder owner.

---

## 🧭 Roadmap / Not Yet Implemented

- Real video generation for the storyboard mode (currently a structured, playable storyboard script)
- AI image generation for visual story scenes (currently HTML/CSS-rendered cards)
- Spaced-repetition scheduling for flashcards
- Shareable/public decks

---

## 📄 License

Internal project — add your preferred license here.
