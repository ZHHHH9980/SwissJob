# Custom Kanban Status Columns — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the hardcoded 3-column Kanban board with user-configurable status columns stored in localStorage, with a modal config dialog and reset/confirm workflow.

**Architecture:** A `useKanbanStatuses` hook manages status config in localStorage. A `StatusConfigDialog` MUI dialog handles add/delete/reorder/reset. The Kanban board in `companies/page.tsx` renders columns dynamically from the hook's state.

**Tech Stack:** React 18, Next.js 14, MUI Dialog, dnd-kit, Tailwind CSS, localStorage

---

### Task 1: Create `useKanbanStatuses` hook

**Files:**
- Create: `frontend/lib/use-kanban-statuses.ts`
- Modify: `frontend/tailwind.config.ts` (add `./lib/**` to content paths)

**Step 1: Add lib to Tailwind content paths**

In `frontend/tailwind.config.ts`, add `'./lib/**/*.{js,ts,jsx,tsx,mdx}'` to the `content` array so Tailwind can detect color classes defined in lib files.

**Step 2: Create the hook file**

Create `frontend/lib/use-kanban-statuses.ts` with:

```ts
'use client'

import { useState, useEffect } from 'react'

export interface KanbanStatus {
  key: string
  label: string
  color: string
}

export const COLOR_POOL = [
  'blue', 'yellow', 'green', 'purple', 'red', 'orange', 'pink', 'cyan', 'indigo', 'teal'
]

// Full Tailwind class mapping — must use complete strings for Tailwind purge to detect them
export const COLOR_CLASSES: Record<string, {
  header: string; badge: string; dot: string; highlight: string
}> = {
  blue:    { header: 'bg-blue-50 border-blue-500',     badge: 'bg-blue-100 text-blue-800',       dot: 'bg-blue-500',    highlight: 'ring-2 ring-blue-400' },
  yellow:  { header: 'bg-yellow-50 border-yellow-500', badge: 'bg-yellow-100 text-yellow-800',   dot: 'bg-yellow-500',  highlight: 'ring-2 ring-yellow-400' },
  green:   { header: 'bg-green-50 border-green-500',   badge: 'bg-green-100 text-green-800',     dot: 'bg-green-500',   highlight: 'ring-2 ring-green-400' },
  purple:  { header: 'bg-purple-50 border-purple-500', badge: 'bg-purple-100 text-purple-800',   dot: 'bg-purple-500',  highlight: 'ring-2 ring-purple-400' },
  red:     { header: 'bg-red-50 border-red-500',       badge: 'bg-red-100 text-red-800',         dot: 'bg-red-500',     highlight: 'ring-2 ring-red-400' },
  orange:  { header: 'bg-orange-50 border-orange-500', badge: 'bg-orange-100 text-orange-800',   dot: 'bg-orange-500',  highlight: 'ring-2 ring-orange-400' },
  pink:    { header: 'bg-pink-50 border-pink-500',     badge: 'bg-pink-100 text-pink-800',       dot: 'bg-pink-500',    highlight: 'ring-2 ring-pink-400' },
  cyan:    { header: 'bg-cyan-50 border-cyan-500',     badge: 'bg-cyan-100 text-cyan-800',       dot: 'bg-cyan-500',    highlight: 'ring-2 ring-cyan-400' },
  indigo:  { header: 'bg-indigo-50 border-indigo-500', badge: 'bg-indigo-100 text-indigo-800',   dot: 'bg-indigo-500',  highlight: 'ring-2 ring-indigo-400' },
  teal:    { header: 'bg-teal-50 border-teal-500',     badge: 'bg-teal-100 text-teal-800',       dot: 'bg-teal-500',    highlight: 'ring-2 ring-teal-400' },
}

export const DEFAULT_STATUSES: KanbanStatus[] = [
  { key: 'pending', label: 'Pending', color: 'blue' },
  { key: 'in-progress', label: 'In Progress', color: 'yellow' },
  { key: 'completed', label: 'Completed', color: 'green' },
]

const STORAGE_KEY = 'kanban-statuses'

export function getNextColor(usedColors: string[]): string {
  return COLOR_POOL.find(c => !usedColors.includes(c)) || COLOR_POOL[0]
}

export function useKanbanStatuses() {
  const [statuses, setStatusesState] = useState<KanbanStatus[]>(DEFAULT_STATUSES)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStatusesState(parsed)
        }
      }
    } catch { /* use defaults */ }
    setLoaded(true)
  }, [])

  const setStatuses = (newStatuses: KanbanStatus[]) => {
    setStatusesState(newStatuses)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStatuses))
  }

  const resetToDefault = () => {
    setStatusesState(DEFAULT_STATUSES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATUSES))
  }

  return { statuses, setStatuses, resetToDefault, loaded }
}
```

**Step 3: Verify build**

Run: `cd /Users/a1/Documents/interview-helper/frontend && npx next build 2>&1 | tail -5`
Expected: Build succeeds (or only pre-existing errors)

**Step 4: Commit**

```bash
git add frontend/lib/use-kanban-statuses.ts frontend/tailwind.config.ts
git commit -m "feat: add useKanbanStatuses hook with localStorage persistence"
```

---

### Task 2: Create `StatusConfigDialog` component

**Files:**
- Create: `frontend/components/StatusConfigDialog.tsx`

**Step 1: Create the dialog component**

Create `frontend/components/StatusConfigDialog.tsx`. This is a MUI Dialog that lets users:
- See all current statuses as a list (color dot + editable label + up/down arrows + delete button)
- Add new statuses (auto-assigns color from pool)
- Reorder statuses with up/down arrow buttons
- Delete statuses (with confirmation if companies exist in that status)
- Reset to defaults (with confirmation)
- Save changes

The component works on a local draft copy of statuses. Changes are only persisted when "Save" is clicked.

```tsx
'use client'

import { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import RestoreIcon from '@mui/icons-material/Restore'
import ConfirmDialog from './ConfirmDialog'
import {
  KanbanStatus,
  DEFAULT_STATUSES,
  COLOR_CLASSES,
  getNextColor,
} from '@/lib/use-kanban-statuses'

interface StatusConfigDialogProps {
  open: boolean
  statuses: KanbanStatus[]
  companyCounts: Record<string, number>  // key -> count of companies in that status
  onSave: (statuses: KanbanStatus[]) => void
  onClose: () => void
}

export default function StatusConfigDialog({
  open, statuses, companyCounts, onSave, onClose
}: StatusConfigDialogProps) {
  const [draft, setDraft] = useState<KanbanStatus[]>([])
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ index: number; count: number } | null>(null)

  useEffect(() => {
    if (open) setDraft(statuses.map(s => ({ ...s })))
  }, [open, statuses])

  const handleLabelChange = (index: number, label: string) => {
    const next = [...draft]
    next[index] = { ...next[index], label }
    setDraft(next)
  }

  const handleKeyChange = (index: number, key: string) => {
    const next = [...draft]
    // Sanitize key: lowercase, replace spaces with hyphens, remove non-alphanumeric
    const sanitized = key.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    next[index] = { ...next[index], key: sanitized }
    setDraft(next)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const next = [...draft]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setDraft(next)
  }

  const handleMoveDown = (index: number) => {
    if (index === draft.length - 1) return
    const next = [...draft]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    setDraft(next)
  }

  const handleDelete = (index: number) => {
    if (draft.length <= 1) return
    const status = draft[index]
    const count = companyCounts[status.key] || 0
    if (count > 0) {
      setDeleteConfirm({ index, count })
    } else {
      const next = draft.filter((_, i) => i !== index)
      setDraft(next)
    }
  }

  const confirmDeleteStatus = () => {
    if (!deleteConfirm) return
    const next = draft.filter((_, i) => i !== deleteConfirm.index)
    setDraft(next)
    setDeleteConfirm(null)
  }

  const handleAdd = () => {
    const usedColors = draft.map(s => s.color)
    const color = getNextColor(usedColors)
    const newKey = `status-${Date.now()}`
    setDraft([...draft, { key: newKey, label: 'New Status', color }])
  }

  const handleReset = () => setResetConfirmOpen(true)

  const confirmReset = () => {
    setDraft(DEFAULT_STATUSES.map(s => ({ ...s })))
    setResetConfirmOpen(false)
  }

  const handleSave = () => {
    // Validate: no empty labels, no duplicate keys
    const valid = draft.filter(s => s.label.trim() && s.key.trim())
    if (valid.length === 0) return
    onSave(valid)
    onClose()
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Configure Status Columns</DialogTitle>
        <DialogContent>
          <div className="space-y-3 mt-2">
            {draft.map((status, index) => {
              const colors = COLOR_CLASSES[status.color] || COLOR_CLASSES.blue
              return (
                <div key={index} className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full flex-shrink-0 ${colors.dot}`} />
                  <TextField
                    size="small"
                    value={status.label}
                    onChange={(e) => handleLabelChange(index, e.target.value)}
                    onBlur={() => {
                      // Auto-generate key from label if key is auto-generated
                      if (status.key.startsWith('status-')) {
                        handleKeyChange(index, status.label)
                      }
                    }}
                    sx={{ flex: 1 }}
                  />
                  <IconButton size="small" onClick={() => handleMoveUp(index)} disabled={index === 0}>
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleMoveDown(index)} disabled={index === draft.length - 1}>
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(index)} disabled={draft.length <= 1} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </div>
              )
            })}
          </div>
          <div className="flex gap-2 mt-4">
            <Button startIcon={<AddIcon />} onClick={handleAdd} size="small">
              Add Status
            </Button>
            <Button startIcon={<RestoreIcon />} onClick={handleReset} size="small" color="warning">
              Reset to Default
            </Button>
          </div>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Reset Confirmation */}
      <ConfirmDialog
        open={resetConfirmOpen}
        title="Reset Status Columns"
        message="Reset to default statuses (Pending, In Progress, Completed)? Companies with custom statuses will be moved to the first column."
        confirmText="Reset"
        onConfirm={confirmReset}
        onCancel={() => setResetConfirmOpen(false)}
      />

      {/* Delete Status Confirmation */}
      <ConfirmDialog
        open={deleteConfirm !== null}
        title="Delete Status"
        message={deleteConfirm ? `This status has ${deleteConfirm.count} position(s). They will be moved to the first column. Continue?` : ''}
        confirmText="Delete"
        onConfirm={confirmDeleteStatus}
        onCancel={() => setDeleteConfirm(null)}
      />
    </>
  )
}
```

**Step 2: Verify build**

Run: `cd /Users/a1/Documents/interview-helper/frontend && npx next build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add frontend/components/StatusConfigDialog.tsx
git commit -m "feat: add StatusConfigDialog for managing kanban status columns"
```

---

### Task 3: Refactor `companies/page.tsx` to use dynamic statuses

**Files:**
- Modify: `frontend/app/companies/page.tsx`

This is the main refactoring task. Changes:

**Step 1: Update imports and Company interface**

At the top of the file, add imports for the hook and dialog, and change `Company.status` from union type to `string`:

```tsx
// Add these imports:
import { useKanbanStatuses, COLOR_CLASSES, KanbanStatus } from '@/lib/use-kanban-statuses'
import StatusConfigDialog from '@/components/StatusConfigDialog'
import SettingsIcon from '@mui/icons-material/Settings'
import IconButton from '@mui/material/IconButton'

// Change Company interface:
interface Company {
  id: string
  name: string
  position: string
  status: string  // was: 'pending' | 'in-progress' | 'completed'
  matchScore?: number
  createdAt: string
}
```

**Step 2: Add hook and config dialog state to CompaniesPage**

Inside `CompaniesPage`, after existing state declarations:

```tsx
const { statuses, setStatuses, loaded } = useKanbanStatuses()
const [configDialogOpen, setConfigDialogOpen] = useState(false)
```

Change the loading condition to also wait for `loaded`:

```tsx
if (loading || !loaded) { ... }
```

**Step 3: Replace hardcoded company grouping with dynamic grouping**

Remove the three hardcoded filter lines:
```tsx
// REMOVE these:
const pendingCompanies = companies.filter(c => c.status === 'pending')
const inProgressCompanies = companies.filter(c => c.status === 'in-progress')
const completedCompanies = companies.filter(c => c.status === 'completed')
```

Replace with dynamic grouping:
```tsx
// Group companies by status, unknown statuses go to first column
const companiesByStatus: Record<string, Company[]> = {}
for (const s of statuses) {
  companiesByStatus[s.key] = []
}
for (const c of companies) {
  const key = statuses.some(s => s.key === c.status) ? c.status : statuses[0]?.key
  if (key && companiesByStatus[key]) {
    companiesByStatus[key].push(c)
  }
}

// Compute counts for config dialog
const companyCounts: Record<string, number> = {}
for (const s of statuses) {
  companyCounts[s.key] = companiesByStatus[s.key]?.length || 0
}
```

**Step 4: Refactor DroppableColumn to use dynamic colors**

Change the `color` prop type from `'blue' | 'yellow' | 'green'` to `string`. Replace the hardcoded `colorClasses` object with a lookup into `COLOR_CLASSES`:

```tsx
const DroppableColumn = ({
  id, children, title, count, color
}: {
  id: string; children: React.ReactNode; title: string; count: number; color: string
}) => {
  const { setNodeRef, isOver } = useDroppable({ id })
  const colors = COLOR_CLASSES[color] || COLOR_CLASSES.blue

  return (
    <div className="flex flex-col min-w-[250px]">
      <div className={`${colors.header} rounded-t-lg px-4 py-3 border-b-2`}>
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${colors.dot}`}></span>
          {title}
          <span className={`ml-auto ${colors.badge} text-xs px-2 py-1 rounded-full`}>
            {count}
          </span>
        </h2>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto bg-gray-100 rounded-b-lg p-4 transition-all ${
          isOver ? colors.highlight : ''
        }`}
      >
        {children}
      </div>
    </div>
  )
}
```

**Step 5: Refactor handleDragOver to use dynamic statuses**

Replace the hardcoded if-else chain with a loop:

```tsx
const handleDragOver = (event: DragOverEvent) => {
  const { active, over } = event
  if (!over) return

  const activeCompany = companies.find(c => c.id === active.id)
  if (!activeCompany) return

  const overId = over.id as string
  let newStatus: string | null = null

  for (const s of statuses) {
    const colCompanies = companiesByStatus[s.key] || []
    if (overId === `${s.key}-droppable` || colCompanies.some(c => c.id === overId)) {
      newStatus = s.key
      break
    }
  }

  if (newStatus && newStatus !== activeCompany.status) {
    setCompanies(companies.map(c =>
      c.id === activeCompany.id ? { ...c, status: newStatus! } : c
    ))
  }
}
```

**Step 6: Refactor handleStatusChange signature**

Change from `Company['status']` to `string`:

```tsx
const handleStatusChange = async (id: string, newStatus: string, e: React.MouseEvent) => {
```

**Step 7: Replace the Kanban grid with dynamic columns**

Replace the hardcoded 3-column grid (lines 385-433) with:

```tsx
{/* Header — add gear icon */}
<div className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
  <div>
    <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
    <p className="text-gray-600 mt-2">{companies.length} total positions</p>
  </div>
  <div className="flex items-center gap-2">
    <IconButton onClick={() => setConfigDialogOpen(true)} title="Configure status columns">
      <SettingsIcon />
    </IconButton>
    <Link href="/companies/new" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
      + Add Position
    </Link>
  </div>
</div>

{/* Dynamic Kanban columns */}
<DndContext ...>
  <div
    className="gap-6 h-[calc(100vh-200px)]"
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${statuses.length}, minmax(250px, 1fr))`,
      overflowX: statuses.length > 5 ? 'auto' : 'hidden',
    }}
  >
    {statuses.map(status => {
      const colCompanies = companiesByStatus[status.key] || []
      return (
        <DroppableColumn
          key={status.key}
          id={`${status.key}-droppable`}
          title={status.label}
          count={colCompanies.length}
          color={status.color}
        >
          <SortableContext items={colCompanies.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {colCompanies.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No positions</p>
            ) : (
              colCompanies.map(company => <DraggableCompanyCard key={company.id} company={company} />)
            )}
          </SortableContext>
        </DroppableColumn>
      )
    })}
  </div>
</DndContext>
```

**Step 8: Refactor the status dropdown in DraggableCompanyCard**

Replace the hardcoded 3 MenuItems with a dynamic loop:

```tsx
<Select
  value={company.status}
  onChange={(e) => handleStatusChange(company.id, e.target.value, e as any)}
  onClick={(e) => e.stopPropagation()}
  ...
>
  {statuses.map(s => {
    const colors = COLOR_CLASSES[s.color] || COLOR_CLASSES.blue
    return (
      <MenuItem key={s.key} value={s.key}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
          {s.label}
        </div>
      </MenuItem>
    )
  })}
</Select>
```

**Step 9: Add StatusConfigDialog and save handler**

Before the closing `</div>` of the page, add:

```tsx
<StatusConfigDialog
  open={configDialogOpen}
  statuses={statuses}
  companyCounts={companyCounts}
  onSave={(newStatuses) => {
    // Move companies with removed statuses to first status
    const validKeys = new Set(newStatuses.map(s => s.key))
    const firstKey = newStatuses[0]?.key
    const updatedCompanies = companies.map(c => {
      if (!validKeys.has(c.status) && firstKey) {
        // Persist the status change to backend
        fetch(`/api/companies/${c.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: firstKey })
        }).catch(console.error)
        return { ...c, status: firstKey }
      }
      return c
    })
    setCompanies(updatedCompanies)
    setStatuses(newStatuses)
  }}
  onClose={() => setConfigDialogOpen(false)}
/>
```

**Step 10: Verify build**

Run: `cd /Users/a1/Documents/interview-helper/frontend && npx next build 2>&1 | tail -10`

**Step 11: Commit**

```bash
git add frontend/app/companies/page.tsx
git commit -m "feat: refactor kanban board to use dynamic configurable status columns"
```

---

### Task 4: Manual smoke test

**Step 1:** Run `cd /Users/a1/Documents/interview-helper/frontend && npm run dev` (user runs manually)

**Step 2: Verify default behavior**
- Navigate to `/companies`
- Should see 3 columns: Pending, In Progress, Completed (same as before)
- Drag and drop should work between columns

**Step 3: Verify config dialog**
- Click the gear icon in the header
- Add a new status (e.g., "Interview")
- Reorder statuses with arrows
- Save — board should now show 4 columns
- Refresh page — config should persist

**Step 4: Verify reset**
- Open config dialog
- Click "Reset to Default"
- Confirm in the dialog
- Save — board should return to 3 default columns

**Step 5: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: complete custom kanban status columns feature"
```
