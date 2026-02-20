# Design: Notion Integration as Primary Storage

Date: 2026-02-20

## Overview

Replace SQLite + Prisma with Notion as the primary database for SwissJob. The app uses `@notionhq/client` for all CRUD operations. Claude Code uses Notion MCP for AI-driven writes (batch analysis, reports). App settings (API keys, Notion credentials) remain in a local `data/settings.json` file.

## Architecture

```
┌─────────────────────────────────────────────┐
│              Next.js App                     │
│                                              │
│  Pages/Components                            │
│       ↓                                      │
│  API Routes (/api/*)                         │
│       ↓                                      │
│  lib/notion.ts  ← replaces Prisma calls      │
│       ↓                                      │
│  @notionhq/client → Notion API               │
└─────────────────────────────────────────────┘

Claude Code (AI assistant)
       ↓
  Notion MCP → direct Notion writes (AI analysis, reports)
```

**Removed**: `prisma/`, `@prisma/client`, SQLite file, `lib/prisma.ts`
**Added**: `lib/notion.ts`, `@notionhq/client`
**Unchanged**: `AppSettings` and `User` → local `data/settings.json`

## Data Model Mapping

| Prisma Model | Notion Database | Notes |
|---|---|---|
| `Company` | Job Applications | |
| `Interview` | Interviews | |
| `Skill` | Skills | |
| `MockInterview` | Mock Interviews | |
| `AppSettings` | ❌ Not migrated | → `data/settings.json` |
| `User` | ❌ Not migrated | → `data/settings.json` |

### Notion Database Schemas

**Job Applications** (Company)
- `Name` (title) — company name
- `Position` (rich_text)
- `Status` (select): `active` | `interviewing` | `offered` | `rejected`
- `Match Score` (number)
- `Skills` (multi_select)
- Page content: JD full text (paragraph blocks)

**Interviews**
- `Company` (relation → Job Applications)
- `Round` (number)
- `Scheduled At` (date)
- `Status` (select): `scheduled` | `completed` | `passed` | `rejected`
- Page content: Transcript + AI Analysis (paragraph blocks)

**Skills**
- `Name` (title)
- `Category` (select)
- `Frequency` (number)
- `First Seen` (date)
- `Last Seen` (date)

**Mock Interviews**
- `Company` (relation → Job Applications)
- `Created At` (date)
- Page content: Questions JSON (paragraph blocks)

### Long Text Handling

Notion property fields have a 2000-character limit. Fields like `jd`, `transcript`, and `aiAnalysis` must be stored as page content (blocks):

- **Write**: `notion.blocks.children.append()` with paragraph blocks (chunked at 2000 chars each)
- **Read**: `notion.blocks.children.list()` then concatenate all block plain_text values

## Notion Template

Users duplicate a pre-built Notion template containing all 4 databases with correct properties and relations. After duplicating, they copy each database ID into the app settings.

Template databases must be created manually once and published as a Notion template page.

## Configuration

Settings stored in `data/settings.json` (gitignored):

```json
{
  "aiBaseUrl": "https://api.openai.com/v1",
  "aiApiKey": "sk-...",
  "aiModel": "gpt-4o-mini",
  "whisperMode": "none",
  "whisperApiUrl": "http://localhost:9000",
  "whisperModel": "whisper-1",
  "notionApiToken": "secret_...",
  "notionDBs": {
    "companies": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "interviews": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "skills": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "mockInterviews": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

Settings page gains new Notion configuration section.

## `lib/notion.ts` Service Layer

Provides the same CRUD interface that API routes currently expect from Prisma:

```typescript
// Client factory
export function getNotionClient(): Client
export function getDBIds(): NotionDBIds

// Company
export async function getCompanies(): Promise<Company[]>
export async function getCompany(pageId: string): Promise<Company>
export async function createCompany(data: CreateCompanyInput): Promise<Company>
export async function updateCompany(pageId: string, data: Partial<Company>): Promise<Company>
export async function deleteCompany(pageId: string): Promise<void>

// Interview
export async function getInterviews(companyId: string): Promise<Interview[]>
export async function createInterview(data: CreateInterviewInput): Promise<Interview>
export async function updateInterview(pageId: string, data: Partial<Interview>): Promise<Interview>

// Skill
export async function getSkills(): Promise<Skill[]>
export async function upsertSkill(name: string, category: string): Promise<void>

// MockInterview
export async function getMockInterviews(companyId: string): Promise<MockInterview[]>
export async function createMockInterview(companyId: string, questions: string): Promise<void>

// Long text helpers (internal)
async function readPageContent(pageId: string): Promise<string>
async function writePageContent(pageId: string, text: string): Promise<void>
```

**Rate limit handling**: Simple retry with 1s delay, max 3 retries, on 429 responses.

## Notion MCP Integration

Notion MCP is a tool for Claude Code (the AI assistant), not for the Next.js app directly.

**App side**: AI analysis results written via `@notionhq/client` in `/api/ai/analyze-interview`.

**Claude Code side**: Uses Notion MCP for:
- Cross-interview comparison and summary generation
- Bulk skill frequency updates
- Writing structured interview review reports to Notion

## Migration Strategy

No data migration needed — existing data is all mock/test data. Hard switch: remove Prisma, add Notion client, update all API routes.

## Implementation Phases

1. **Settings layer** — migrate `AppSettings` to `data/settings.json`, update settings API and page to include Notion fields
2. **Notion service layer** — implement `lib/notion.ts` with all CRUD functions
3. **API routes** — replace Prisma calls with `lib/notion.ts` calls in all `/api/*` routes
4. **Remove Prisma** — delete schema, migrations, `lib/prisma.ts`, uninstall packages
5. **Settings UI** — add Notion configuration section to settings page
6. **Notion template** — document the template structure for users

## Open Questions

- Should the Notion template be a public Notion page users can duplicate, or documented as manual setup steps?
- How to handle the case where Notion API token is not yet configured (first-run experience)?
