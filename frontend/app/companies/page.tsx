'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { fetchT } from '@/lib/fetch'
import ConfirmDialog from '@/components/ConfirmDialog'
import StatusConfigDialog from '@/components/StatusConfigDialog'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { useKanbanStatuses, COLOR_CLASSES } from '@/lib/use-kanban-statuses'

interface Company {
  id: string
  name: string
  position: string
  status: string
  matchScore?: number
  createdAt: string
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const { statuses, setStatuses, loaded } = useKanbanStatuses()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  useEffect(() => {
    fetchCompanies()
    const handler = (e: Event) => {
      const scope = (e as CustomEvent).detail?.scope
      if (scope === 'companies') fetchCompanies()
    }
    window.addEventListener('swissjob:refresh', handler)
    return () => window.removeEventListener('swissjob:refresh', handler)
  }, [])

  const fetchCompanies = async () => {
    setFetchError('')
    try {
      const response = await fetchT('/api/companies', 'Load companies', { timeout: 15000 })
      const data = await response.json()
      const list: Company[] = Array.isArray(data) ? data : []
      setCompanies(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Failed to load')
      console.error(error instanceof Error ? error.message : error)
    } finally {
      setLoading(false)
    }
  }

  // Group companies by status columns
  const grouped = useMemo(() => {
    const statusKeys = new Set(statuses.map(s => s.key))
    const map: Record<string, Company[]> = {}
    for (const s of statuses) map[s.key] = []
    for (const c of companies) {
      if (statusKeys.has(c.status)) {
        map[c.status].push(c)
      } else {
        // Unknown status goes to first column
        map[statuses[0]?.key]?.push(c)
      }
    }
    return map
  }, [companies, statuses])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCompanyToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!companyToDelete) return
    setDeletingId(companyToDelete)
    try {
      const response = await fetch(`/api/companies/${companyToDelete}`, { method: 'DELETE' })
      if (response.ok) {
        setCompanies(companies.filter(c => c.id !== companyToDelete))
        setDeleteDialogOpen(false)
        setCompanyToDelete(null)
      } else {
        alert('Failed to delete position')
      }
    } catch (error) {
      console.error('Error deleting company:', error)
      alert('Failed to delete position')
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok) {
        setCompanies(companies.map(c => c.id === id ? { ...c, status: newStatus } : c))
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return
    const activeCompany = companies.find(c => c.id === active.id)
    if (!activeCompany) return

    const overId = over.id as string
    let newStatus: string | null = null

    for (const status of statuses) {
      const colCompanies = grouped[status.key] || []
      if (overId === `${status.key}-droppable` || colCompanies.some(c => c.id === overId)) {
        newStatus = status.key
        break
      }
    }

    if (newStatus && newStatus !== activeCompany.status) {
      setCompanies(companies.map(c => c.id === activeCompany.id ? { ...c, status: newStatus } : c))
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active } = event
    setActiveId(null)
    const activeCompany = companies.find(c => c.id === active.id)
    if (!activeCompany) return
    try {
      await fetch(`/api/companies/${activeCompany.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: activeCompany.status })
      })
    } catch (error) {
      console.error('Error updating status:', error)
      fetchCompanies()
    }
  }

  const DroppableColumn = ({ id, children, title, count, color }: {
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
            <span className={`ml-auto ${colors.badge} text-xs px-2 py-1 rounded-full`}>{count}</span>
          </h2>
        </div>
        <div
          ref={setNodeRef}
          className={`flex-1 overflow-y-auto bg-gray-100 rounded-b-lg p-4 transition-all ${isOver ? colors.highlight : ''}`}
        >
          {children}
        </div>
      </div>
    )
  }

  const DraggableCompanyCard = ({ company }: { company: Company }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: company.id })
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}
        className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 relative group mb-4 cursor-move"
      >
        <Link href={`/companies/${company.id}`} className="block" onClick={(e) => { if (isDragging) e.preventDefault() }}>
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{company.name}</h3>
            {company.matchScore && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{company.matchScore}% Match</span>
            )}
          </div>
          <p className="text-gray-700 text-sm mb-3">{company.position}</p>
          <div className="text-xs text-gray-500">{company.createdAt}</div>
        </Link>
        <div className="mt-3" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
          <FormControl fullWidth size="small">
            <Select
              value={company.status}
              onChange={(e) => handleStatusChange(company.id, e.target.value, e as any)}
              onClick={(e) => e.stopPropagation()}
              sx={{
                fontSize: '0.875rem',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }
              }}
            >
              {statuses.map(s => (
                <MenuItem key={s.key} value={s.key}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${COLOR_CLASSES[s.color]?.dot || 'bg-gray-400'}`}></span>
                    {s.label}
                  </div>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(company.id, e) }}
          disabled={deletingId === company.id}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg disabled:opacity-50"
          title="Delete position"
        >
          {deletingId === company.id ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    )
  }

  if (loading || !loaded) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="h-full px-4 py-8">
          <div className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
              <p className="text-gray-600 mt-2">{companies.length} total positions</p>
              {fetchError && (
                <p className="text-red-500 text-sm mt-1">{fetchError} — <button onClick={() => { setLoading(true); fetchCompanies() }} className="text-blue-600 hover:underline">Retry</button></p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfigOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
                title="Configure columns"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <Link href="/companies/new" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                + Add Position
              </Link>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter}
            onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}
          >
            <div
              className="gap-6 h-[calc(100vh-200px)]"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${statuses.length}, minmax(250px, 1fr))`,
                overflowX: statuses.length > 4 ? 'auto' : 'hidden',
              }}
            >
              {statuses.map(status => {
                const colCompanies = grouped[status.key] || []
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
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Position"
        message="Are you sure you want to delete this position? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteDialogOpen(false); setCompanyToDelete(null) }}
        loading={deletingId !== null}
      />

      <StatusConfigDialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        statuses={statuses}
        onSave={setStatuses}
      />
    </div>
  )
}
