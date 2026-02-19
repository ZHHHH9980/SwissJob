# Custom Kanban Status Columns Design

## Summary

Replace the hardcoded 3-column Kanban board (Pending / In Progress / Completed) with a user-configurable status system. Statuses are stored in localStorage, columns auto-adapt to the number of statuses, and a modal dialog provides add/delete/reorder/reset functionality.

## Data Model

```ts
interface KanbanStatus {
  key: string    // unique ID stored in Company.status
  label: string  // display name
  color: string  // Tailwind color name
}
```

Default statuses (also the reset target):
- `pending` / Pending / blue
- `in-progress` / In Progress / yellow
- `completed` / Completed / green

Storage: `localStorage` key `kanban-statuses`, JSON array.

## Color Pool

```ts
const COLOR_POOL = ['blue', 'yellow', 'green', 'purple', 'red', 'orange', 'pink', 'cyan', 'indigo', 'teal']
```

New statuses auto-assign the first unused color.

## Hook: `useKanbanStatuses`

File: `frontend/lib/use-kanban-statuses.ts`

- `statuses`: current status list
- `setStatuses(list)`: update + persist to localStorage
- `resetToDefault()`: restore defaults
- Falls back to DEFAULT_STATUSES on first load

## Configuration Dialog

File: `frontend/components/StatusConfigDialog.tsx`

- Entry: gear icon button in Kanban header
- Each row: color dot + editable name + up/down arrows + delete button
- "+ Add Status" button at bottom (auto-assigns color)
- "Reset to Default" button with confirmation dialog
- "Save" button to persist and close
- Delete confirmation when status has companies assigned
- Minimum 1 status enforced

## Kanban Board Changes

File: `frontend/app/companies/page.tsx`

- Grid columns: `repeat(N, 1fr)` based on statuses.length
- Horizontal scroll when > 5 columns (min-width 250px per column)
- DroppableColumn color prop: string (dynamic color mapping)
- Company.status type: string (not union)
- Companies with unknown status fall into first column
- Status dropdown in cards: dynamically generated from statuses
- Drag-over logic: iterate statuses instead of hardcoded if-else
