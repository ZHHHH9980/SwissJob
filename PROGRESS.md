# SwissJob - Progress

## 2026-02-23

- ✅ AI Workflow Framework design doc (`docs/plans/2026-02-23-ai-workflow-framework-design.md`)
- ✅ Implementation plan: 11 tasks (`docs/plans/2026-02-23-ai-workflow-framework.md`)
- ✅ Task 1: Company type extended with `matchScore` + `skills` (`lib/notion.ts`)
- ✅ Task 2: Skill type extended with `frequency` + `source` + `upsertSkill()` (`lib/notion.ts`)
- 🔄 Task 3: Add `getAllInterviewAnalyses` + `setInterviewContent` to `lib/notion.ts`
- 🔄 Task 4-8: Add 6 workflow tools to `lib/ai-tools.ts` (process_jd, analyze_interview, prepare_interview, get_weakness_report, get_skill_gaps, update_skill_level)
- 🔄 Task 9: Upgrade AI system prompt in `app/api/ai/assistant/route.ts`
- 🔄 Task 10: Support comma-separated refresh scopes in `components/AIAssistant/useAssistantChat.ts`
- 🔄 Task 11: End-to-end verification

---

## 2026-02-22

- ✅ Set up project documentation system (`CLAUDE.md` / `PROGRESS.md` / `REVIEW.md`)
- ✅ Created claude-workflow repo with plugin auto-sync (https://github.com/ZHHHH9980/claude-workflow)
- ✅ Confirmed Notion API config: token + 4 database IDs
- ✅ Skills API routes: `app/api/skills/route.ts`, `app/api/skills/[id]/route.ts`
- ✅ Skills page: `app/skills/page.tsx` — grouped by category, add/edit/delete, level badges
- ✅ JD extraction → Skill table: `app/api/ai/extract-jd/route.ts` now writes skills to Notion, fixed OpenAI client
- ✅ StatusConfigDialog: `components/StatusConfigDialog.tsx` — add/delete/reorder/reset columns
- ✅ Kanban refactor: `app/companies/page.tsx` — dynamic columns from `useKanbanStatuses()`, gear icon config
- ✅ Fixed Company PATCH bug: `app/api/companies/[id]/route.ts` now passes `status` to `updateCompany()`
- ✅ Interviews API: `app/api/interviews/route.ts`, `app/api/interviews/[id]/route.ts`
- ✅ Calendar page: `app/calendar/page.tsx` — month grid, interview chips, navigation
- ✅ Calendar added to Sidebar
- ✅ Interview status flow: `app/companies/[id]/page.tsx` — schedule interviews, status transitions (scheduled → in_progress → completed → passed/rejected)
- ✅ Structured AI summary: `app/api/ai/analyze-interview/route.ts` — questions[], overallScore, keyTopics
- ✅ Interview analysis UI: `app/companies/[id]/interview/page.tsx` — questions breakdown with score bars
- ✅ Fixed Company detail page: removed stale `position` field from interface, use `company.name` for interview position
- ✅ Browser testing passed: Skills, Calendar, Kanban, StatusConfigDialog, Company detail, Interview scheduling (end-to-end)
- ✅ Homepage redirect: `app/page.tsx` → redirects to `/companies` (removed landing page)
- ✅ Calendar shows interview times: chips now display "HH:MM CompanyName"
- ✅ AI Assistant backend: `lib/ai-tools.ts` — 8 tools (schedule_interview, list_companies, get_company, add_company, get_upcoming_interviews, list_skills, add_skill, navigate_to)
- ✅ AI Assistant streaming API: `app/api/ai/assistant/route.ts` — SSE with OpenAI function calling loop
- ✅ AI Assistant UI: `components/AIAssistant/` — MUI Fab (bottom-right) + Drawer chat panel with streaming
- ✅ Global AI integration: `app/layout.tsx` — AIAssistantFab mounted globally, available on every page
- ✅ Changed html lang to "en"

---

## Completed Features

| Feature | Route |
|---------|-------|
| Kanban board (dynamic columns) | `/companies` |
| Custom Kanban statuses | `/companies` (gear icon) |
| AI JD extraction + skill auto-save | `/companies/new` |
| Interview analysis (structured) | `/companies/[id]/interview` |
| Interview scheduling & status flow | `/companies/[id]` |
| Skill Tree page | `/skills` |
| Interview Calendar | `/calendar` |
| Resume upload & parsing | `/resume` |
| AI settings | `/settings` |
| AI Assistant (global) | Floating button (every page) |
