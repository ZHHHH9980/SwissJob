# SwissJob AI Workflow Framework Design

## Problem

SwissJob is a collection of tools, not a workflow engine. Users must know which page to visit, which button to click, which form to fill. The lazy user wants: **I provide raw input, AI handles everything else.**

Three core pain points:
1. HR sends JD → user doesn't want to manually create company, extract skills, fill forms
2. Interview done → user doesn't want to self-reflect, wants AI to analyze and track
3. Interview tomorrow → user wants AI to pull JD, past weaknesses, skill gaps, generate prep

## Decision: Approach A — Smart Tools

Add 6 workflow tools to existing AI chat. Each tool does a complete multi-step workflow internally. Minimal architecture change, builds on existing function-calling infrastructure.

## The Loop

```
JD 进来 → process_jd → 创建公司 + 提取技能 + 匹配度
    ↓
安排面试 → schedule_interview (existing)
    ↓
面试准备 → prepare_interview → JD + 简历 + 历史弱点 → 准备方案
    ↓
面试完成 → analyze_interview → 分析 + 打分 + 存档 + 提取弱点
    ↓
弱点积累 → get_weakness_report → 跨面试聚合
    ↓
技能差距 → get_skill_gaps → JD要求 vs 我的水平
    ↓
下次面试 → prepare_interview (引用历史弱点和差距)
```

## Data Model Changes

### Skills table — add properties
- `frequency`: number (default 0) — how many JDs mention this skill
- `source`: select ["manual", "jd-extracted"]

### Interviews table — page content format
```
---TRANSCRIPT---
[interview transcript text]
---ANALYSIS---
{"overallScore": 72, "questions": [...], "strengths": [...], "weaknesses": [...], "suggestions": [...]}
```

### Companies table — no schema change
- `skills` field: already exists as JSON string, will be populated by process_jd
- `matchScore` field: already exists, will be calculated by process_jd

## AI Tool System

### Existing tools (keep as-is)
1. `list_companies` — list all job applications
2. `get_company` — get company details + JD
3. `add_company` — add new company
4. `update_company` — update company
5. `delete_company` — delete company
6. `schedule_interview` — schedule interview
7. `get_upcoming_interviews` — upcoming interviews
8. `list_skills` — list all skills
9. `add_skill` — add skill
10. `navigate_to` — client-side navigation

### New workflow tools

#### 11. `process_jd`
- Input: `jdText` (string, the raw JD)
- Steps:
  1. Call OpenAI to extract: companyName, position, skills[], requirements
  2. `createCompany(name, jobDescription: jdText)`
  3. For each skill: upsert in Skills table (create if new, increment frequency if exists)
  4. Write skills JSON to company.skills
  5. Load resume text from settings
  6. Call OpenAI to calculate match score (resume vs JD) → `updateCompany(matchScore)`
- Output: `{ company, skills[], matchScore, gaps[] }`
- Refresh: `companies`, `skills`

#### 12. `analyze_interview`
- Input: `companyId`, `transcript` (string), `round` (optional string like "Round 2 Technical")
- Steps:
  1. Load company JD from page content
  2. Load resume text from settings
  3. Call OpenAI to analyze: transcript vs JD vs resume
     → structured JSON: `{ overallScore, questions[], strengths[], weaknesses[], suggestions[] }`
  4. Find or create interview for this company
  5. Store transcript + analysis in interview page content
  6. Update interview status to "completed"
- Output: `{ overallScore, strengths[], weaknesses[], suggestions[] }`
- Refresh: `interviews`

#### 13. `prepare_interview`
- Input: `companyId`
- Steps:
  1. Load company JD + skills
  2. Load resume text
  3. Load all interviews for this company (with analyses from page content)
  4. Load weakness report (aggregate across all interviews)
  5. Load skill gaps (company JD skills vs Skills table)
  6. Call OpenAI to generate prep plan:
     - Predicted questions based on JD
     - Improvement areas based on past weaknesses
     - Skill gap study suggestions
- Output: `{ prepPlan, predictedQuestions[], weaknessesToAddress[], skillGaps[] }`
- Refresh: none (read-only)

#### 14. `get_weakness_report`
- Input: `companyId` (optional, omit for global report)
- Steps:
  1. Load all interviews (or filtered by company)
  2. Parse analysis JSON from each interview's page content
  3. Aggregate weaknesses by frequency
  4. Sort by frequency descending
- Output: `{ weaknesses: [{ text, frequency, sources[] }] }`
- Refresh: none (read-only)

#### 15. `get_skill_gaps`
- Input: `companyId` (optional, omit for global gaps)
- Steps:
  1. Load JD skills from company (or all companies)
  2. Load all skills from Skills table with levels
  3. Compare: missing skills, skills needing improvement, mastered skills
- Output: `{ missing[], needsImprovement[], mastered[] }`
- Refresh: none (read-only)

#### 16. `update_skill_level`
- Input: `skillName`, `newLevel` (Beginner/Intermediate/Advanced/Expert)
- Steps:
  1. Find skill by name in Skills table
  2. Update level
- Output: `{ skill }`
- Refresh: `skills`

## AI System Prompt

```
You are SwissJob AI, helping users manage their entire job interview lifecycle.

Context:
- Current page: {currentPage}
- Date: {today}
- Resume: {hasResume ? "uploaded" : "not uploaded — remind user to upload for better analysis"}
- Companies: {companyCount} tracked
- Upcoming: {upcomingInterviews} interviews

Core workflows:
1. When user pastes a large text block (>200 chars), determine if it's a JD or interview transcript
   - JD → call process_jd
   - Interview transcript → ask which company, then call analyze_interview
2. "准备面试" / "prepare for X" → call prepare_interview
3. "我的弱点" / "weakness report" → call get_weakness_report
4. "技能差距" / "skill gaps" → call get_skill_gaps

Rules:
- Destructive actions (delete, update) require confirmation
- Analysis actions (process_jd, analyze_interview, prepare_interview) execute immediately
- Reply in Chinese, keep technical terms in English
- Show structured results with scores, lists, and actionable suggestions
```

## Page Changes (minimal)

### /companies (Kanban)
- Format dates: ISO → "2月22日" or "Feb 22"
- Show matchScore badge on cards (e.g., "78%")

### /companies/[id] (Detail)
- Show matchScore
- Show extracted skills with levels (from company.skills JSON)
- Show interview analysis results (read from interview page content)

### /skills
- Add frequency column
- Add source badge (manual / jd-extracted)
- Add "JD要求 vs 我的水平" comparison view (optional, can be AI-driven)

### /companies/new
- Simplify: show prompt "Paste JD in AI chat for automatic processing"
- Or: connect to real AI extraction (reuse process_jd logic)

### /calendar
- No changes needed

## Notion lib changes (lib/notion.ts)

### New functions needed
- `getInterviewWithContent(id)` — get interview + parse page content for transcript/analysis
- `getAllInterviewAnalyses(companyId?)` — batch load analyses for weakness aggregation
- `upsertSkill(name, category, source)` — create or increment frequency
- `setInterviewContent(id, transcript, analysis)` — write transcript + analysis to page content

### Existing functions to modify
- `getCompany()` — already loads page content, no change needed
- `createCompany()` — no change needed
- `updateCompany()` — no change needed (matchScore is already a property)

## Success Criteria

1. User pastes JD → company created with skills + matchScore in <30s
2. User pastes transcript → analysis stored with scores in <30s
3. User says "prepare for X" → gets actionable prep plan with past weaknesses
4. Weakness report aggregates across all interviews correctly
5. Skill gaps show JD requirements vs user's current level
6. All workflows trigger page refreshes via existing CustomEvent mechanism
