'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { fetchT } from '@/lib/fetch'

interface Company {
  id: string
  name: string
  jobDescription: string
  skills: string | null
  matchScore: number | null
  status: string
  createdAt: string
}

interface Interview {
  id: string
  position: string
  date?: string
  status: string
  notes?: string
  createdAt: string
}

const INTERVIEW_STATUSES = ['scheduled', 'in_progress', 'completed', 'passed', 'rejected'] as const
const STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  passed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function CompanyDetailPage() {
  const params = useParams()
  const [isJdExpanded, setIsJdExpanded] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({ date: '', notes: '' })
  const [scheduling, setScheduling] = useState(false)

  useEffect(() => {
    fetchData()
    const handler = (e: Event) => {
      const scope = (e as CustomEvent).detail?.scope
      if (scope === 'companies' || scope === 'interviews') fetchData()
    }
    window.addEventListener('swissjob:refresh', handler)
    return () => window.removeEventListener('swissjob:refresh', handler)
  }, [])

  const fetchData = async () => {
    setError('')
    try {
      const [compRes, intRes] = await Promise.all([
        fetchT(`/api/companies/${params.id}`, 'Load company'),
        fetchT(`/api/interviews?companyId=${params.id}`, 'Load interviews'),
      ])
      setCompany(await compRes.json())
      const intData = await intRes.json()
      setInterviews(Array.isArray(intData) ? intData : [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load')
      console.error(error instanceof Error ? error.message : error)
    } finally {
      setLoading(false)
    }
  }

  const handleSchedule = async () => {
    if (!company || !scheduleForm.date) return
    setScheduling(true)
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          position: company.name,
          date: scheduleForm.date,
          status: 'scheduled',
          notes: scheduleForm.notes,
        }),
      })
      if (res.ok) {
        setShowSchedule(false)
        setScheduleForm({ date: '', notes: '' })
        fetchData()
      }
    } catch (error) {
      console.error('Error scheduling interview:', error)
    } finally {
      setScheduling(false)
    }
  }

  const handleStatusChange = async (interviewId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setInterviews(interviews.map(iv => iv.id === interviewId ? { ...iv, status: newStatus } : iv))
      }
    } catch (error) {
      console.error('Error updating interview status:', error)
    }
  }

  const latestInterview = interviews.length > 0
    ? interviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          {error ? (
            <>
              <p className="text-red-600 mb-2">{error}</p>
              <button onClick={() => { setLoading(true); fetchData() }} className="text-blue-600 hover:underline mb-4 block mx-auto">Retry</button>
            </>
          ) : (
            <p className="text-gray-600 mb-4">Company not found</p>
          )}
          <Link href="/companies" className="text-blue-600 hover:underline">← Back to Positions</Link>
        </div>
      </div>
    )
  }

  const skills = company.skills ? (() => { try { return JSON.parse(company.skills!) } catch { return [] } })() : []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/companies" className="text-blue-600 hover:underline mb-4 inline-block">← Back to Positions</Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
            </div>
            <div className="flex gap-3 items-center">
              <span className={`px-4 py-2 rounded-full font-medium text-sm ${STATUS_BADGE[company.status] || 'bg-gray-100 text-gray-800'}`}>
                {company.status.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
              {latestInterview && (
                <span className={`px-3 py-1 rounded-full text-xs ${STATUS_BADGE[latestInterview.status] || 'bg-gray-100 text-gray-600'}`}>
                  Interview: {latestInterview.status.replace('_', ' ')}
                </span>
              )}
              {company.matchScore && (
                <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">{company.matchScore}% Match</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Job Description</h2>
                <button onClick={() => setIsJdExpanded(!isJdExpanded)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  {isJdExpanded ? 'Show Less' : 'Show More'}
                </button>
              </div>
              <div className={`text-gray-700 whitespace-pre-wrap ${isJdExpanded ? '' : 'max-h-48 overflow-hidden relative'}`}>
                {company.jobDescription}
                {!isJdExpanded && <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent"></div>}
              </div>
            </div>

            {/* Interviews Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Interviews ({interviews.length})</h2>
                <button onClick={() => setShowSchedule(!showSchedule)} className="text-sm text-blue-600 hover:text-blue-800">
                  + Schedule Interview
                </button>
              </div>

              {showSchedule && (
                <div className="border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={scheduleForm.date}
                      onChange={e => setScheduleForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Notes</label>
                    <input
                      type="text"
                      value={scheduleForm.notes}
                      onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="e.g. Round 1 - Phone Screen"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSchedule} disabled={scheduling || !scheduleForm.date}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {scheduling ? 'Scheduling...' : 'Schedule'}
                    </button>
                    <button onClick={() => setShowSchedule(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                  </div>
                </div>
              )}

              {interviews.length === 0 ? (
                <p className="text-gray-500 text-sm">No interviews scheduled yet.</p>
              ) : (
                <div className="space-y-3">
                  {interviews
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(iv => (
                    <div key={iv.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {iv.date ? new Date(iv.date).toLocaleString() : 'No date'}
                        </div>
                        {iv.notes && <div className="text-xs text-gray-500 mt-0.5">{iv.notes}</div>}
                      </div>
                      <select
                        value={iv.status}
                        onChange={e => handleStatusChange(iv.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_BADGE[iv.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {INTERVIEW_STATUSES.map(s => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowSchedule(true)} className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  Schedule Interview
                </button>
                <Link href={`/companies/${params.id}/interview`}
                  className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-center">
                  Analyze Interview
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Skills */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((skill: string) => (
                    <span key={skill} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">{skill}</span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No skills extracted</p>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Information</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="text-gray-900 ml-2 capitalize">{company.status.replace(/[-_]/g, ' ')}</span>
                </div>
                <div>
                  <span className="text-gray-600">Added:</span>
                  <span className="text-gray-900 ml-2">{new Date(company.createdAt).toLocaleDateString()}</span>
                </div>
                {company.matchScore && (
                  <div>
                    <span className="text-gray-600">Match Score:</span>
                    <span className="text-gray-900 ml-2">{company.matchScore}%</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Interviews:</span>
                  <span className="text-gray-900 ml-2">{interviews.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
