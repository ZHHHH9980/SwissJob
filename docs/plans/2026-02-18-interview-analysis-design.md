# Interview Analysis Feature Design

Date: 2026-02-18

## Overview

Add a dedicated interview analysis page that supports both audio file upload and direct text
input, with enhanced AI analysis and a follow-up chat interface.

## Goals

- Support pasting transcript text directly (in addition to audio upload)
- Enhance analysis results: each weakness includes a specific improvement suggestion
- Post-analysis chat: user can ask follow-up questions with full context

## Page Layout

New route: `/companies/[id]/interview`

```
┌─────────────────────────────────────────────┐
│  ← Back to [Company Name]                   │
│  Interview Analysis                         │
├─────────────────────────────────────────────┤
│  [Audio Upload] [Paste Text]  ← Tab switch  │
│  Input area                                 │
│  [Analyze button]                           │
├─────────────────────────────────────────────┤
│  Analysis results (shown after analysis)    │
│  Match score / Strengths / Weaknesses       │
│  Suggestions (each with improvement advice) │
│  Summary                                    │
├─────────────────────────────────────────────┤
│  AI Chat (shown after analysis)             │
│  Message list                               │
│  [Input] [Send]                             │
└─────────────────────────────────────────────┘
```

## Architecture

### New Files

- `frontend/app/companies/[id]/interview/page.tsx`
- `frontend/app/api/ai/interview-chat/route.ts`

### Modified Files

- `frontend/app/companies/[id]/page.tsx` — wire "Mock Interview" button to new page
- `frontend/app/api/ai/analyze-interview/route.ts` — enhance suggestions format

## Data Flow

```
User input (audio or text)
  ↓
[Audio] → POST /api/transcribe → transcript text
[Text]  → use directly
  ↓
POST /api/ai/analyze-interview
  body: { transcript, jd, resume }
  returns: { matchScore, strengths, weaknesses, suggestions, summary }
  ↓
Display analysis results
  ↓
User follow-up → POST /api/ai/interview-chat
  body: { message, context: { transcript, jd, analysis } }
  returns: { reply }
  ↓
Append to chat message list
```

The chat API passes the full context (JD + transcript + analysis) as system prompt so the AI
can give targeted answers to follow-up questions.

## API Changes

### `POST /api/ai/analyze-interview` (enhanced)

No change to request shape. Response `suggestions` field changes from `string[]` to:

```ts
suggestions: Array<{
  weakness: string
  advice: string
}>
```

### `POST /api/ai/interview-chat` (new)

Request:
```ts
{
  message: string
  context: {
    transcript: string
    jd: string
    analysis: InterviewAnalysis
  }
}
```

Response:
```ts
{ reply: string }
```

## Error Handling

- Audio transcription failure → show error, keep input, allow retry
- Empty text submission → frontend validation, button disabled
- AI analysis failure → show error, preserve transcript
- Chat API failure → show "Send failed, please retry" inline, keep input
- No resume → show "Please upload your resume first" (reuse existing logic)
