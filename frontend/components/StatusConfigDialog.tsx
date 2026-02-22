'use client'

import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import {
  KanbanStatus,
  COLOR_POOL,
  COLOR_CLASSES,
  DEFAULT_STATUSES,
  getNextColor,
} from '@/lib/use-kanban-statuses'

interface Props {
  open: boolean
  onClose: () => void
  statuses: KanbanStatus[]
  onSave: (statuses: KanbanStatus[]) => void
}

export default function StatusConfigDialog({ open, onClose, statuses, onSave }: Props) {
  const [local, setLocal] = useState<KanbanStatus[]>(statuses)

  const handleOpen = () => setLocal(statuses)

  const addStatus = () => {
    const usedColors = local.map(s => s.color)
    const color = getNextColor(usedColors)
    const key = `status-${Date.now()}`
    setLocal([...local, { key, label: 'New Status', color }])
  }

  const updateLabel = (index: number, label: string) => {
    const next = [...local]
    next[index] = { ...next[index], label }
    setLocal(next)
  }

  const updateColor = (index: number, color: string) => {
    const next = [...local]
    next[index] = { ...next[index], color }
    setLocal(next)
  }

  const removeStatus = (index: number) => {
    if (local.length <= 1) return
    setLocal(local.filter((_, i) => i !== index))
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const next = [...local]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setLocal(next)
  }

  const moveDown = (index: number) => {
    if (index >= local.length - 1) return
    const next = [...local]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    setLocal(next)
  }

  const handleSave = () => {
    const cleaned = local.map(s => ({
      ...s,
      key: s.key || s.label.toLowerCase().replace(/\s+/g, '-'),
      label: s.label.trim() || 'Untitled',
    }))
    onSave(cleaned)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth TransitionProps={{ onEnter: handleOpen }}>
      <DialogTitle>Configure Kanban Columns</DialogTitle>
      <DialogContent>
        <div className="space-y-3 mt-2">
          {local.map((status, i) => (
            <div key={status.key} className="flex items-center gap-2">
              {/* Color selector */}
              <div className="relative group">
                <button className={`w-6 h-6 rounded-full ${COLOR_CLASSES[status.color]?.dot || 'bg-gray-400'}`} />
                <div className="absolute left-0 top-8 hidden group-hover:flex gap-1 bg-white shadow-lg rounded-lg p-2 z-10 flex-wrap w-32">
                  {COLOR_POOL.map(c => (
                    <button
                      key={c}
                      onClick={() => updateColor(i, c)}
                      className={`w-5 h-5 rounded-full ${COLOR_CLASSES[c]?.dot || 'bg-gray-400'} ${status.color === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                    />
                  ))}
                </div>
              </div>
              {/* Label input */}
              <input
                type="text"
                value={status.label}
                onChange={e => updateLabel(i, e.target.value)}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {/* Move buttons */}
              <button onClick={() => moveUp(i)} disabled={i === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-sm">↑</button>
              <button onClick={() => moveDown(i)} disabled={i >= local.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-sm">↓</button>
              {/* Delete */}
              <button
                onClick={() => removeStatus(i)}
                disabled={local.length <= 1}
                className="text-red-400 hover:text-red-600 disabled:opacity-30 text-sm"
              >✕</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={addStatus} className="text-sm text-blue-600 hover:text-blue-800">+ Add Column</button>
          <button onClick={() => setLocal(DEFAULT_STATUSES)} className="text-sm text-gray-500 hover:text-gray-700 ml-auto">Reset to Default</button>
        </div>
      </DialogContent>
      <DialogActions sx={{ padding: '16px 24px' }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  )
}
