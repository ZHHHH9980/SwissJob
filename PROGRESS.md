# SwissJob - Progress

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
