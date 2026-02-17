'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import ConfirmDialog from '@/components/ConfirmDialog'
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

interface Company {
  id: string
  name: string
  position: string
  status: 'pending' | 'in-progress' | 'completed'
  matchScore?: number
  createdAt: string
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      const data = await response.json()
      const sorted = data.sort((a: Company, b: Company) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setCompanies(sorted)
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

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
      const response = await fetch(`/api/companies/${companyToDelete}`, {
        method: 'DELETE'
      })

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

  const cancelDelete = () => {
    setDeleteDialogOpen(false)
    setCompanyToDelete(null)
  }

  const handleStatusChange = async (id: string, newStatus: Company['status'], e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setCompanies(companies.map(c =>
          c.id === id ? { ...c, status: newStatus } : c
        ))
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const pendingCompanies = companies.filter(c => c.status === 'pending')
  const inProgressCompanies = companies.filter(c => c.status === 'in-progress')
  const completedCompanies = companies.filter(c => c.status === 'completed')

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeCompany = companies.find(c => c.id === active.id)
    if (!activeCompany) return

    // Determine new status based on drop zone
    let newStatus: Company['status'] | null = null
    const overId = over.id as string

    if (overId === 'pending-droppable' || pendingCompanies.some(c => c.id === overId)) {
      newStatus = 'pending'
    } else if (overId === 'in-progress-droppable' || inProgressCompanies.some(c => c.id === overId)) {
      newStatus = 'in-progress'
    } else if (overId === 'completed-droppable' || completedCompanies.some(c => c.id === overId)) {
      newStatus = 'completed'
    }

    if (newStatus && newStatus !== activeCompany.status) {
      // Optimistically update UI
      setCompanies(companies.map(c =>
        c.id === activeCompany.id ? { ...c, status: newStatus } : c
      ))
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active } = event
    setActiveId(null)

    const activeCompany = companies.find(c => c.id === active.id)
    if (!activeCompany) return

    // Persist to backend
    try {
      await fetch(`/api/companies/${activeCompany.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: activeCompany.status })
      })
    } catch (error) {
      console.error('Error updating status:', error)
      // Revert on error
      fetchCompanies()
    }
  }

  const DroppableColumn = ({
    id,
    children,
    title,
    count,
    color
  }: {
    id: string
    children: React.ReactNode
    title: string
    count: number
    color: 'blue' | 'yellow' | 'green'
  }) => {
    const { setNodeRef, isOver } = useDroppable({ id })

    const colorClasses = {
      blue: {
        header: 'bg-blue-50 border-blue-500',
        badge: 'bg-blue-100 text-blue-800',
        dot: 'bg-blue-500',
        highlight: 'ring-2 ring-blue-400'
      },
      yellow: {
        header: 'bg-yellow-50 border-yellow-500',
        badge: 'bg-yellow-100 text-yellow-800',
        dot: 'bg-yellow-500',
        highlight: 'ring-2 ring-yellow-400'
      },
      green: {
        header: 'bg-green-50 border-green-500',
        badge: 'bg-green-100 text-green-800',
        dot: 'bg-green-500',
        highlight: 'ring-2 ring-green-400'
      }
    }

    const colors = colorClasses[color]

    return (
      <div className="flex flex-col">
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

  const DraggableCompanyCard = ({ company }: { company: Company }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: company.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 relative group mb-4 cursor-move"
      >
        <Link href={`/companies/${company.id}`} className="block" onClick={(e) => e.preventDefault()}>
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{company.name}</h3>
            {company.matchScore && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {company.matchScore}% Match
              </span>
            )}
          </div>
          <p className="text-gray-700 text-sm mb-3">{company.position}</p>
          <div className="text-xs text-gray-500">{company.createdAt}</div>
        </Link>

        {/* Status Dropdown */}
        <div className="mt-3" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          <FormControl fullWidth size="small">
            <Select
              value={company.status}
              onChange={(e) => handleStatusChange(company.id, e.target.value as Company['status'], e as any)}
              onClick={(e) => e.stopPropagation()}
              sx={{
                fontSize: '0.875rem',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e5e7eb'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3b82f6'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3b82f6'
                }
              }}
            >
              <MenuItem value="pending">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Pending
                </div>
              </MenuItem>
              <MenuItem value="in-progress">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  In Progress
                </div>
              </MenuItem>
              <MenuItem value="completed">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Completed
                </div>
              </MenuItem>
            </Select>
          </FormControl>
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(company.id, e); }}
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

  if (loading) {
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
          {/* Header */}
          <div className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
              <p className="text-gray-600 mt-2">{companies.length} total positions</p>
            </div>
            <Link
              href="/companies/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              + Add Position
            </Link>
          </div>

          {/* Kanban Board - 3 Columns */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
              {/* Pending Column */}
              <DroppableColumn
                id="pending-droppable"
                title="Pending"
                count={pendingCompanies.length}
                color="blue"
              >
                <SortableContext items={pendingCompanies.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  {pendingCompanies.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">No pending positions</p>
                  ) : (
                    pendingCompanies.map(company => <DraggableCompanyCard key={company.id} company={company} />)
                  )}
                </SortableContext>
              </DroppableColumn>

              {/* In Progress Column */}
              <DroppableColumn
                id="in-progress-droppable"
                title="In Progress"
                count={inProgressCompanies.length}
                color="yellow"
              >
                <SortableContext items={inProgressCompanies.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  {inProgressCompanies.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">No positions in progress</p>
                  ) : (
                    inProgressCompanies.map(company => <DraggableCompanyCard key={company.id} company={company} />)
                  )}
                </SortableContext>
              </DroppableColumn>

              {/* Completed Column */}
              <DroppableColumn
                id="completed-droppable"
                title="Completed"
                count={completedCompanies.length}
                color="green"
              >
                <SortableContext items={completedCompanies.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  {completedCompanies.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">No completed positions</p>
                  ) : (
                    completedCompanies.map(company => <DraggableCompanyCard key={company.id} company={company} />)
                  )}
                </SortableContext>
              </DroppableColumn>
            </div>
          </DndContext>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Position"
        message="Are you sure you want to delete this position? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deletingId !== null}
      />
    </div>
  )
}
