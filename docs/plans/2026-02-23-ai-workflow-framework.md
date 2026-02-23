# AI Workflow Framework Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 6 workflow tools to SwissJob AI chat, transforming it from a CRUD assistant into a closed-loop interview lifecycle engine.

**Architecture:** Extend existing OpenAI function-calling infrastructure. New tools call `lib/notion.ts` helpers + OpenAI for analysis. No new API routes — everything runs server-side inside the existing SSE streaming endpoint.

**Tech Stack:** Next.js 14, TypeScript, OpenAI SDK (function calling), Notion API

**Design Doc:** `docs/plans/2026-02-23-ai-workflow-framework-design.md`

---

## Task 1: Extend Company type with matchScore + skills

**Files:**
- Modify: `frontend/lib/notion.ts:9-17` (Company type)
- Modify: `frontend/lib/notion.ts:167-195` (property helpers)
- Modify: `frontend/lib/notion.ts:205-215` (pageToCompany)
- Modify: `frontend/lib/notion.ts:260-266` (createCompany properties)
- Modify: `frontend/lib/notion.ts:291-299` (updateCompany properties)

**Step 1: Add `getPropNumber` helper**

In `frontend/lib/notion.ts`, after `getPropDate` (line 190), add:

```typescript
function getPropNumber(props: Record<string, unknown>, key: string): number | null {
  const p = props[key] as { number?: number | null } | undefined
  return p?.number ?? null
}
```

**Step 2: Extend Company type**

Change the Company type (lines 9-17) to:

```typescript
export type Company = {
  id: string
  name: string
  website?: string
  description?: string
  jobDescription?: string
  status: 'pending' | 'in-progress' | 'completed'
  matchScore?: number | null
  skills?: string | null  // JSON string: ["skill1", "skill2"]
  createdAt: string
}
```

**Step 3: Update pageToCompany**

Add to `pageToCompany` (line 205):

```typescript
matchScore: getPropNumber(props, 'MatchScore') ?? undefined,
skills: getPropRichText(props, 'Skills') || undefined,
```

**Step 4: Update createCompany properties**

After the Status property (line 266), add:

```typescript
if ((data as any).matchScore != null)
  properties['MatchScore'] = { number: (data as any).matchScore }
if ((data as any).skills)
  properties['Skills'] = { rich_text: [{ text: { content: (data as any).skills } }] }
```

**Step 5: Update updateCompany properties**

After the Status property (line 299), add:

```typescript
if ((data as any).matchScore !== undefined)
  properties['MatchScore'] = { number: (data as any).matchScore }
if ((data as any).skills !== undefined)
  properties['Skills'] = (data as any).skills
    ? { rich_text: [{ text: { content: (data as any).skills } }] }
    : { rich_text: [] }
```

**Step 6: Verify**

Run: `cd frontend && npx tsc --noEmit`
Expected: No new errors

**Step 7: Commit**

```bash
git add frontend/lib/notion.ts
git commit -m "feat: extend Company type with matchScore + skills properties"
```

---

## Task 2: Extend Skill type with frequency + source + upsertSkill

**Files:**
- Modify: `frontend/lib/notion.ts:31-38` (Skill type)
- Modify: `frontend/lib/notion.ts:474-484` (pageToSkill)
- Modify: `frontend/lib/notion.ts:506-512` (createSkill properties)
- Add new function after `deleteSkill` (line 545)

**Step 1: Extend Skill type**

```typescript
export type Skill = {
  id: string
  name: string
  category?: string
  level?: string
  notes?: string
  frequency?: number   // how many JDs mention this skill
  source?: string      // "manual" | "jd-extracted"
  createdAt: string
}
```

**Step 2: Update pageToSkill**

Add to `pageToSkill`:

```typescript
frequency: getPropNumber(props, 'Frequency') ?? undefined,
source: getPropSelect(props, 'Source') || undefined,
```

**Step 3: Update createSkill properties**

After Notes property, add:

```typescript
if (data.frequency != null) properties['Frequency'] = { number: data.frequency }
if (data.source) properties['Source'] = { select: { name: data.source } }
```

**Step 4: Add upsertSkill function**

After `deleteSkill`, add:

```typescript
export async function upsertSkill(
  name: string,
  category?: string,
  source: string = 'manual'
): Promise<Skill> {
  const skills = await getSkills()
  const existing = skills.find(
    s => s.name.toLowerCase() === name.toLowerCase()
  )

  if (existing) {
    // Increment frequency
    const newFreq = (existing.frequency || 0) + 1
    return updateSkill(existing.id, { frequency: newFreq })
  }

  // Create new skill
  return createSkill({
    name,
    category,
    source,
    frequency: 1,
  })
}
```

**Step 5: Update updateSkill to handle frequency/source**

In `updateSkill`, after Notes property handling, add:

```typescript
if (data.frequency !== undefined)
  properties['Frequency'] = { number: data.frequency }
if (data.source !== undefined)
  properties['Source'] = data.source ? { select: { name: data.source } } : { select: null }
```

**Step 6: Verify**

Run: `cd frontend && npx tsc --noEmit`

**Step 7: Commit**

```bash
git add frontend/lib/notion.ts
git commit -m "feat: extend Skill type with frequency/source + add upsertSkill"
```

---

## Task 3: Add interview content helpers

**Files:**
- Modify: `frontend/lib/notion.ts` — add `getAllInterviewAnalyses` and `setInterviewContent`

**Step 1: Add getAllInterviewAnalyses**

After `deleteInterview` (line 468), add:

```typescript
export async function getAllInterviewAnalyses(
  companyId?: string
): Promise<Array<{ interviewId: string; companyId: string; position: string; analysis: Record<string, unknown> }>> {
  const interviews = await getInterviews(companyId)
  const notion = await getNotionClientFromSettings()
  const results: Array<{ interviewId: string; companyId: string; position: string; analysis: Record<string, unknown> }> = []

  for (const interview of interviews) {
    try {
      const content = await getPageContent(notion, interview.id)
      const { aiAnalysis } = splitPageContent(content)
      if (aiAnalysis) {
        const parsed = JSON.parse(aiAnalysis)
        results.push({
          interviewId: interview.id,
          companyId: interview.companyId,
          position: interview.position,
          analysis: parsed,
        })
      }
    } catch {
      // Skip interviews with unparseable content
    }
  }
  return results
}
```

**Step 2: Add setInterviewContent**

```typescript
export async function setInterviewContent(
  id: string,
  transcript: string,
  analysisJson: Record<string, unknown>
): Promise<void> {
  const notion = await getNotionClientFromSettings()
  const combined = buildTranscriptContent(transcript, JSON.stringify(analysisJson))
  await setPageContent(notion, id, combined)
  invalidateCache('interviews')
}
```

**Step 3: Verify + Commit**

```bash
cd frontend && npx tsc --noEmit
git add frontend/lib/notion.ts
git commit -m "feat: add getAllInterviewAnalyses + setInterviewContent helpers"
```

---

## Task 4: Add `process_jd` workflow tool

**Files:**
- Modify: `frontend/lib/ai-tools.ts` — add tool definition + executor
- Reference: `frontend/lib/notion.ts` (createCompany, updateCompany, upsertSkill)
- Reference: `frontend/lib/app-settings.ts` (getOpenAIClient, readSettings)

**Step 1: Add import for new notion functions**

In `frontend/lib/ai-tools.ts`, update the import (line 2-6):

```typescript
import {
  getCompanies, getCompany, createCompany, updateCompany, deleteCompany,
  getInterviews, createInterview, getInterview,
  getSkills, createSkill, upsertSkill, updateSkill,
  getAllInterviewAnalyses, setInterviewContent,
} from './notion'
import { getOpenAIClient } from './app-settings'
import { readSettings } from './settings'
```

**Step 2: Add process_jd tool definition**

After `navigate_to` definition (line 148), add:

```typescript
{
  type: 'function',
  function: {
    name: 'process_jd',
    description: 'Process a job description: extract company name, skills, create company entry, calculate match score against resume. Use when user pastes a JD or says "add this job".',
    parameters: {
      type: 'object',
      properties: {
        jdText: { type: 'string', description: 'The full job description text' },
      },
      required: ['jdText'],
    },
  },
},
```

**Step 3: Add process_jd executor**

After `navigate_to` executor (line 231), add:

```typescript
async process_jd({ jdText }: { jdText: string }) {
  // Step 1: Extract structured info from JD via OpenAI
  const { client, settings: aiSettings } = await getOpenAIClient()
  const extraction = await client.chat.completions.create({
    model: aiSettings.aiModel?.trim() || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Extract structured info from this job description. Return JSON only.' },
      { role: 'user', content: `Extract from this JD:\n${jdText}\n\nReturn JSON: {"companyName":"","position":"","skills":["skill1","skill2"],"requirements":["req1","req2"]}` },
    ],
    response_format: { type: 'json_object' },
  })
  const extracted = JSON.parse(extraction.choices[0].message.content || '{}')
  const companyName = extracted.companyName || 'Unknown Company'
  const skills: string[] = extracted.skills || []

  // Step 2: Create company
  const company = await createCompany({
    name: companyName,
    jobDescription: jdText,
    status: 'pending',
  })

  // Step 3: Upsert skills
  for (const skillName of skills) {
    await upsertSkill(skillName, undefined, 'jd-extracted')
  }

  // Step 4: Write skills JSON to company
  await updateCompany(company.id, { skills: JSON.stringify(skills) } as any)

  // Step 5: Calculate match score
  const settings = await readSettings()
  const resumeText = settings.resumeText?.trim()
  let matchScore = 0
  let gaps: string[] = []

  if (resumeText) {
    const matchResult = await client.chat.completions.create({
      model: aiSettings.aiModel?.trim() || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Calculate match score between resume and JD. Return JSON only.' },
        { role: 'user', content: `Resume:\n${resumeText}\n\nJD:\n${jdText}\n\nReturn JSON: {"matchScore": 0-100, "gaps": ["missing skill 1", "missing skill 2"]}` },
      ],
      response_format: { type: 'json_object' },
    })
    const matchData = JSON.parse(matchResult.choices[0].message.content || '{}')
    matchScore = matchData.matchScore || 0
    gaps = matchData.gaps || []
    await updateCompany(company.id, { matchScore } as any)
  }

  return {
    success: true,
    company: { id: company.id, name: companyName },
    skills,
    matchScore: resumeText ? matchScore : 'No resume uploaded — upload in Settings for match scoring',
    gaps,
    _refresh: 'companies,skills',
  }
},
```

**Step 4: Verify + Commit**

```bash
cd frontend && npx tsc --noEmit
git add frontend/lib/ai-tools.ts
git commit -m "feat: add process_jd workflow tool"
```

---

## Task 5: Add `analyze_interview` workflow tool

**Files:**
- Modify: `frontend/lib/ai-tools.ts` — add tool definition + executor

**Step 1: Add tool definition**

After `process_jd` definition, add:

```typescript
{
  type: 'function',
  function: {
    name: 'analyze_interview',
    description: 'Analyze an interview transcript: score performance, identify strengths/weaknesses, store analysis. Use when user pastes interview transcript or says "analyze my interview".',
    parameters: {
      type: 'object',
      properties: {
        companyId: { type: 'string', description: 'Notion page ID of the company' },
        transcript: { type: 'string', description: 'The interview transcript text' },
        round: { type: 'string', description: 'Interview round, e.g. "Round 2 Technical"' },
      },
      required: ['companyId', 'transcript'],
    },
  },
},
```

**Step 2: Add executor**

```typescript
async analyze_interview({ companyId, transcript, round }: {
  companyId: string; transcript: string; round?: string
}) {
  // Load context
  const company = await getCompany(companyId)
  if (!company) return { error: 'Company not found' }

  const settings = await readSettings()
  const resumeText = settings.resumeText?.trim() || ''
  const jd = company.jobDescription || ''

  // Call OpenAI for analysis
  const { client, settings: aiSettings } = await getOpenAIClient()
  const result = await client.chat.completions.create({
    model: aiSettings.aiModel?.trim() || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an interview performance analyst. Analyze the transcript and return structured JSON.' },
      {
        role: 'user',
        content: `Analyze this interview.\n\n【JD】\n${jd}\n\n【Resume】\n${resumeText || 'Not provided'}\n\n【Transcript】\n${transcript}\n\nReturn JSON:\n{"overallScore": 0-100, "questions": [{"question":"","score":0-10,"feedback":""}], "strengths": ["..."], "weaknesses": ["..."], "suggestions": [{"weakness":"","advice":""}]}`,
      },
    ],
    response_format: { type: 'json_object' },
  })
  const analysis = JSON.parse(result.choices[0].message.content || '{}')

  // Find or create interview
  const interviews = await getInterviews(companyId)
  let interview = interviews.find(i => i.status === 'scheduled')
  if (!interview) {
    interview = await createInterview({
      companyId,
      position: round || company.name,
      status: 'completed',
      date: new Date().toISOString(),
    })
  }

  // Store transcript + analysis
  await setInterviewContent(interview.id, transcript, analysis)

  // Mark as completed if still scheduled
  if (interview.status === 'scheduled') {
    const { updateInterview } = await import('./notion')
    await updateInterview(interview.id, { status: 'completed' })
  }

  return {
    success: true,
    interviewId: interview.id,
    overallScore: analysis.overallScore,
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
    suggestions: analysis.suggestions,
    _refresh: 'interviews',
  }
},
```

**Step 3: Verify + Commit**

```bash
cd frontend && npx tsc --noEmit
git add frontend/lib/ai-tools.ts
git commit -m "feat: add analyze_interview workflow tool"
```

---

## Task 6: Add `prepare_interview` workflow tool

**Files:**
- Modify: `frontend/lib/ai-tools.ts`

**Step 1: Add tool definition**

```typescript
{
  type: 'function',
  function: {
    name: 'prepare_interview',
    description: 'Generate interview prep plan: predicted questions, weakness areas, skill gaps. Use when user says "prepare for interview" or "help me prep".',
    parameters: {
      type: 'object',
      properties: {
        companyId: { type: 'string', description: 'Notion page ID of the company' },
      },
      required: ['companyId'],
    },
  },
},
```

**Step 2: Add executor**

```typescript
async prepare_interview({ companyId }: { companyId: string }) {
  const company = await getCompany(companyId)
  if (!company) return { error: 'Company not found' }

  const settings = await readSettings()
  const resumeText = settings.resumeText?.trim() || ''
  const jd = company.jobDescription || ''
  const jdSkills: string[] = company.skills ? (() => { try { return JSON.parse(company.skills!) } catch { return [] } })() : []

  // Load past analyses
  const analyses = await getAllInterviewAnalyses(companyId)
  const pastWeaknesses = analyses.flatMap(a =>
    Array.isArray(a.analysis.weaknesses) ? a.analysis.weaknesses as string[] : []
  )

  // Load user skills for gap analysis
  const userSkills = await getSkills()
  const userSkillNames = userSkills.map(s => s.name.toLowerCase())
  const missingSkills = jdSkills.filter(s => !userSkillNames.includes(s.toLowerCase()))

  // Generate prep plan
  const { client, settings: aiSettings } = await getOpenAIClient()
  const result = await client.chat.completions.create({
    model: aiSettings.aiModel?.trim() || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an interview coach. Generate a focused prep plan. Return JSON.' },
      {
        role: 'user',
        content: `Prepare interview plan.\n\n【Company】${company.name}\n【JD】\n${jd}\n【Resume】\n${resumeText || 'Not provided'}\n【Past weaknesses from previous interviews】\n${pastWeaknesses.length ? pastWeaknesses.join('\n') : 'No previous interviews'}\n【Skill gaps】\n${missingSkills.length ? missingSkills.join(', ') : 'None identified'}\n\nReturn JSON:\n{"prepPlan": "markdown text with study plan", "predictedQuestions": [{"question":"","tip":""}], "weaknessesToAddress": ["..."], "skillGaps": ["..."]}`,
      },
    ],
    response_format: { type: 'json_object' },
  })
  const plan = JSON.parse(result.choices[0].message.content || '{}')

  return {
    company: company.name,
    prepPlan: plan.prepPlan,
    predictedQuestions: plan.predictedQuestions,
    weaknessesToAddress: plan.weaknessesToAddress || pastWeaknesses,
    skillGaps: plan.skillGaps || missingSkills,
  }
},
```

**Step 3: Verify + Commit**

```bash
cd frontend && npx tsc --noEmit
git add frontend/lib/ai-tools.ts
git commit -m "feat: add prepare_interview workflow tool"
```

---

## Task 7: Add `get_weakness_report` workflow tool

**Files:**
- Modify: `frontend/lib/ai-tools.ts`

**Step 1: Add tool definition**

```typescript
{
  type: 'function',
  function: {
    name: 'get_weakness_report',
    description: 'Aggregate weaknesses across all interviews. Shows recurring patterns. Use when user asks about weaknesses or areas to improve.',
    parameters: {
      type: 'object',
      properties: {
        companyId: { type: 'string', description: 'Optional: filter by company' },
      },
    },
  },
},
```

**Step 2: Add executor**

```typescript
async get_weakness_report({ companyId }: { companyId?: string } = {}) {
  const analyses = await getAllInterviewAnalyses(companyId)
  if (!analyses.length) return { weaknesses: [], message: 'No interview analyses found. Analyze some interviews first.' }

  // Aggregate weaknesses by frequency
  const weaknessMap = new Map<string, { text: string; count: number; sources: string[] }>()
  for (const a of analyses) {
    const weaknesses = Array.isArray(a.analysis.weaknesses) ? a.analysis.weaknesses as string[] : []
    for (const w of weaknesses) {
      const key = w.toLowerCase()
      const existing = weaknessMap.get(key) || { text: w, count: 0, sources: [] }
      existing.count++
      existing.sources.push(a.position)
      weaknessMap.set(key, existing)
    }
  }

  const sorted = Array.from(weaknessMap.values()).sort((a, b) => b.count - a.count)
  return {
    totalInterviews: analyses.length,
    weaknesses: sorted.map(w => ({
      text: w.text,
      frequency: w.count,
      sources: w.sources,
    })),
  }
},
```

**Step 3: Verify + Commit**

```bash
cd frontend && npx tsc --noEmit
git add frontend/lib/ai-tools.ts
git commit -m "feat: add get_weakness_report workflow tool"
```

---

## Task 8: Add `get_skill_gaps` + `update_skill_level` tools

**Files:**
- Modify: `frontend/lib/ai-tools.ts`

**Step 1: Add tool definitions**

```typescript
{
  type: 'function',
  function: {
    name: 'get_skill_gaps',
    description: 'Compare JD-required skills vs user skills. Shows missing, weak, and mastered skills. Use when user asks about skill gaps.',
    parameters: {
      type: 'object',
      properties: {
        companyId: { type: 'string', description: 'Optional: filter by specific company JD' },
      },
    },
  },
},
{
  type: 'function',
  function: {
    name: 'update_skill_level',
    description: 'Update a skill level. Use when user says they improved a skill or wants to adjust their level.',
    parameters: {
      type: 'object',
      properties: {
        skillName: { type: 'string', description: 'Name of the skill' },
        newLevel: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
      },
      required: ['skillName', 'newLevel'],
    },
  },
},
```

**Step 2: Add executors**

```typescript
async get_skill_gaps({ companyId }: { companyId?: string } = {}) {
  const userSkills = await getSkills()
  const userSkillMap = new Map(userSkills.map(s => [s.name.toLowerCase(), s]))

  let jdSkills: string[] = []
  if (companyId) {
    const company = await getCompany(companyId)
    if (company?.skills) {
      try { jdSkills = JSON.parse(company.skills) } catch {}
    }
  } else {
    // Aggregate from all companies
    const companies = await getCompanies()
    for (const c of companies) {
      const full = await getCompany(c.id)
      if (full?.skills) {
        try { jdSkills.push(...JSON.parse(full.skills)) } catch {}
      }
    }
    jdSkills = [...new Set(jdSkills)]
  }

  const missing: string[] = []
  const needsImprovement: Array<{ skill: string; currentLevel: string }> = []
  const mastered: Array<{ skill: string; level: string }> = []

  for (const skill of jdSkills) {
    const userSkill = userSkillMap.get(skill.toLowerCase())
    if (!userSkill) {
      missing.push(skill)
    } else if (userSkill.level === 'Beginner' || userSkill.level === 'Intermediate') {
      needsImprovement.push({ skill: userSkill.name, currentLevel: userSkill.level })
    } else {
      mastered.push({ skill: userSkill.name, level: userSkill.level || 'Unknown' })
    }
  }

  return { missing, needsImprovement, mastered, totalJdSkills: jdSkills.length }
},

async update_skill_level({ skillName, newLevel }: { skillName: string; newLevel: string }) {
  const skills = await getSkills()
  const skill = skills.find(s => s.name.toLowerCase() === skillName.toLowerCase())
  if (!skill) return { error: `Skill "${skillName}" not found` }

  const updated = await updateSkill(skill.id, { level: newLevel })
  return { success: true, skill: { id: updated.id, name: updated.name, level: updated.level }, _refresh: 'skills' }
},
```

**Step 3: Verify + Commit**

```bash
cd frontend && npx tsc --noEmit
git add frontend/lib/ai-tools.ts
git commit -m "feat: add get_skill_gaps + update_skill_level tools"
```

---

## Task 9: Upgrade AI system prompt

**Files:**
- Modify: `frontend/app/api/ai/assistant/route.ts:8-24` (buildSystemPrompt)

**Step 1: Replace buildSystemPrompt**

Replace the entire `buildSystemPrompt` function with:

```typescript
async function buildSystemPrompt(context: { currentPage?: string }) {
  let companyCount = 0
  let upcomingCount = 0
  let hasResume = false

  try {
    const { getCompanies, getInterviews } = await import('@/lib/notion')
    const { readSettings } = await import('@/lib/settings')
    const [companies, interviews, settings] = await Promise.all([
      getCompanies().catch(() => []),
      getInterviews().catch(() => []),
      readSettings(),
    ])
    companyCount = companies.length
    upcomingCount = interviews.filter(i => i.date && new Date(i.date) >= new Date()).length
    hasResume = !!settings.resumeText?.trim()
  } catch {}

  return `You are SwissJob AI, helping users manage their entire job interview lifecycle.

Context:
- Current page: ${context.currentPage || 'unknown'}
- Date: ${new Date().toISOString().split('T')[0]}
- Resume: ${hasResume ? 'uploaded' : 'NOT uploaded — remind user to upload in Settings for match scoring and analysis'}
- Companies: ${companyCount} tracked
- Upcoming: ${upcomingCount} interviews

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
- Respond in the same language the user uses
- Show structured results with scores, lists, and actionable suggestions
- When listing companies, always include their IDs so you can reference them in follow-up actions`
}
```

**Step 2: Update the POST handler to await the async prompt**

Change line 41 from:
```typescript
const systemPrompt = buildSystemPrompt(context || {})
```
to:
```typescript
const systemPrompt = await buildSystemPrompt(context || {})
```

**Step 3: Verify + Commit**

```bash
cd frontend && npx tsc --noEmit
git add frontend/app/api/ai/assistant/route.ts
git commit -m "feat: upgrade AI system prompt with workflow context"
```

---

## Task 10: Update _refresh handler for comma-separated scopes

**Files:**
- Modify: `frontend/components/AIAssistant/useAssistantChat.ts` (or wherever refresh events are dispatched)

**Step 1: Find the refresh dispatch code**

The `_refresh` field in tool results currently dispatches a single scope. The new tools return comma-separated scopes like `'companies,skills'`. Update the handler to split and dispatch multiple events.

In the chat hook, find where `_refresh` is handled and change:

```typescript
// Before:
window.dispatchEvent(new CustomEvent('swissjob:refresh', { detail: { scope: result._refresh } }))

// After:
const scopes = result._refresh.split(',')
for (const scope of scopes) {
  window.dispatchEvent(new CustomEvent('swissjob:refresh', { detail: { scope: scope.trim() } }))
}
```

**Step 2: Verify + Commit**

```bash
cd frontend && npx tsc --noEmit
git add frontend/components/AIAssistant/
git commit -m "feat: support comma-separated refresh scopes"
```

---

## Task 11: End-to-end verification via AI chat

**Step 1: Start dev server**

User runs: `cd frontend && npm run dev`

**Step 2: Test process_jd**

In AI chat, paste a sample JD:
```
We are looking for a Senior Frontend Engineer at Linear.
Requirements: React, TypeScript, GraphQL, CSS-in-JS, performance optimization.
You'll build product features, improve developer experience, and work on design systems.
```

Expected:
- AI calls `process_jd`
- Company "Linear" created in Kanban
- Skills extracted and added to Skills page
- Match score calculated (if resume uploaded)
- Companies page refreshes

**Step 3: Test analyze_interview**

In AI chat:
```
分析我的面试：
Q: Tell me about your experience with React.
A: I've been using React for 5 years, built several large-scale applications...
Q: How do you handle state management?
A: I prefer using React Context for simple cases and Zustand for complex state...
```

Expected:
- AI asks which company (or uses context)
- Calls `analyze_interview`
- Returns scores, strengths, weaknesses
- Interview marked as completed

**Step 4: Test prepare_interview**

In AI chat: "帮我准备 Linear 的面试"

Expected:
- AI calls `prepare_interview` with Linear's companyId
- Returns prep plan with predicted questions
- References past weaknesses if any exist
- Shows skill gaps

**Step 5: Test weakness report**

In AI chat: "我的弱点有哪些"

Expected:
- AI calls `get_weakness_report`
- Aggregates across all interviews
- Shows frequency-sorted list

**Step 6: Test skill gaps**

In AI chat: "看看我的技能差距"

Expected:
- AI calls `get_skill_gaps`
- Shows missing, needs improvement, mastered

**Step 7: Commit all verified work**

```bash
git add -A
git commit -m "feat: complete AI workflow framework — 6 new tools for interview lifecycle"
```
