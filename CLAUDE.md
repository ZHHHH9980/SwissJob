# SwissJob - AI Job Interview Management Platform

## Overview

AI-powered job interview management platform. Core goals: manage interview pipeline + improve interview performance.

- **Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, Notion API, OpenAI SDK
- **Storage**: Notion (primary) via `lib/notion.ts`
- **PRD**: `tasks/prd-interview-management.md`

---

## Dev Conventions

- AI calls via `lib/app-settings.ts` → `getOpenAIClient()` (falls back to `process.env.OPENAI_API_KEY`)
- JSON parsing via `lib/parse-json.ts` → `parseJsonFromText()`
- Kanban statuses via `lib/use-kanban-statuses.ts` hook (localStorage)
- All CRUD through `lib/notion.ts` (Company, Interview, Skill, MockInterview)
- Settings stored in `/data/settings.json`

---

## Architecture Decisions

- **Notion as primary storage**: Migrated from SQLite. All API routes use `lib/notion.ts`
- **Pure Next.js**: Migrated from Python + FastAPI. Whisper transcription still optional via Python scripts
- **localStorage for Kanban config**: Custom column statuses stored client-side

---

## Known Issues

See `REVIEW.md` for details.

- next-intl internationalization not fully integrated
- Pre-existing TypeScript error in `i18n.ts` (missing `locale` property)
