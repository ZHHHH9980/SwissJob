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
