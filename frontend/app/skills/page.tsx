'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import ConfirmDialog from '@/components/ConfirmDialog'

type Skill = {
  id: string
  name: string
  category?: string
  level?: string
  notes?: string
  createdAt: string
}

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
const LEVEL_COLORS: Record<string, string> = {
  Beginner: 'bg-gray-100 text-gray-700',
  Intermediate: 'bg-blue-100 text-blue-700',
  Advanced: 'bg-purple-100 text-purple-700',
  Expert: 'bg-orange-100 text-orange-700',
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({ name: '', category: '', level: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/skills')
      const data = await res.json()
      setSkills(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load skills')
    } finally {
      setLoading(false)
    }
  }

  const grouped = useMemo(() => {
    const map: Record<string, Skill[]> = {}
    for (const s of skills) {
      const cat = s.category || 'Uncategorized'
      if (!map[cat]) map[cat] = []
      map[cat].push(s)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [skills])

  const categories = useMemo(() => {
    const cats = new Set(skills.map(s => s.category).filter(Boolean) as string[])
    return Array.from(cats).sort()
  }, [skills])

  const openAdd = () => {
    setEditingSkill(null)
    setForm({ name: '', category: '', level: '', notes: '' })
    setShowForm(true)
  }

  const openEdit = (skill: Skill) => {
    setEditingSkill(skill)
    setForm({ name: skill.name, category: skill.category || '', level: skill.level || '', notes: skill.notes || '' })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    setError('')
    try {
      const url = editingSkill ? `/api/skills/${editingSkill.id}` : '/api/skills'
      const method = editingSkill ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save')
      setShowForm(false)
      fetchSkills()
    } catch {
      setError('Failed to save skill')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fetch(`/api/skills/${deleteTarget.id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      fetchSkills()
    } catch {
      setError('Failed to delete skill')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/companies" className="text-blue-600 hover:underline text-sm">
              ← Back to Job Applications
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Skill Tree</h1>
            <p className="text-sm text-gray-500 mt-1">
              Skills extracted from job descriptions and your experience.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            + Add Skill
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : skills.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No skills tracked yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Skills are automatically added when you extract job descriptions, or you can add them manually.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([category, catSkills]) => (
              <div key={category} className="bg-white rounded-lg shadow">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-700">{category}</h2>
                  <span className="text-xs text-gray-400">{catSkills.length} skill{catSkills.length > 1 ? 's' : ''}</span>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {catSkills.map(skill => (
                    <div
                      key={skill.id}
                      className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => openEdit(skill)}
                    >
                      <span className="text-sm text-gray-800">{skill.name}</span>
                      {skill.level && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${LEVEL_COLORS[skill.level] || 'bg-gray-100 text-gray-600'}`}>
                          {skill.level}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(skill) }}
                        className="hidden group-hover:inline text-gray-400 hover:text-red-500 text-xs ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-semibold">{editingSkill ? 'Edit Skill' : 'Add Skill'}</h2>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. React, TypeScript, AWS"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Category</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  list="skill-categories"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Frontend, Backend, DevOps"
                />
                <datalist id="skill-categories">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Level</label>
                <select
                  value={form.level}
                  onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Not set</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Skill"
          message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
          confirmText="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      </div>
    </div>
  )
}