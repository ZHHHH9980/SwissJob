'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

type Interview = {
  id: string
  companyId: string
  position: string
  date?: string
  status: string
  notes?: string
  createdAt: string
}

type Company = {
  id: string
  name: string
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  completed: 'bg-green-500',
  passed: 'bg-emerald-500',
  rejected: 'bg-red-500',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export default function CalendarPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    Promise.all([
      fetch('/api/interviews').then(r => r.json()),
      fetch('/api/companies').then(r => r.json()),
    ]).then(([intData, compData]) => {
      setInterviews(Array.isArray(intData) ? intData : [])
      setCompanies(Array.isArray(compData) ? compData : [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const companyMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const c of companies) map[c.id] = c.name
    return map
  }, [companies])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const interviewsByDay = useMemo(() => {
    const map: Record<number, Interview[]> = {}
    for (const iv of interviews) {
      const d = iv.date ? new Date(iv.date) : null
      if (d && d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(iv)
      }
    }
    return map
  }, [interviews, year, month])

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToday = () => setCurrentDate(new Date())

  const today = new Date()
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <Link href="/companies" className="text-blue-600 hover:underline text-sm">← Back to Job Applications</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Interview Calendar</h1>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="bg-white rounded-lg shadow">
            {/* Month navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <button onClick={prevMonth} className="text-gray-500 hover:text-gray-700 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">{MONTHS[month]} {year}</h2>
                <button onClick={goToday} className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200">Today</button>
              </div>
              <button onClick={nextMonth} className="text-gray-500 hover:text-gray-700 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {/* Empty cells for padding */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`pad-${i}`} className="min-h-[100px] border-b border-r border-gray-100 bg-gray-50" />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayInterviews = interviewsByDay[day] || []
                return (
                  <div key={day} className={`min-h-[100px] border-b border-r border-gray-100 p-1 ${isToday(day) ? 'bg-blue-50' : ''}`}>
                    <div className={`text-xs font-medium mb-1 ${isToday(day) ? 'text-blue-600' : 'text-gray-500'}`}>{day}</div>
                    <div className="space-y-1">
                      {dayInterviews.map(iv => (
                        <Link
                          key={iv.id}
                          href={`/companies/${iv.companyId}`}
                          className="block text-xs px-1.5 py-0.5 rounded truncate hover:opacity-80 transition"
                          style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                        >
                          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${STATUS_COLORS[iv.status] || 'bg-gray-400'}`} />
                          <span className="text-gray-700">{companyMap[iv.companyId] || iv.position}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {interviews.length === 0 && !loading && (
          <div className="text-center text-gray-500 text-sm mt-4">
            No interviews scheduled yet. Schedule interviews from company detail pages.
          </div>
        )}
      </div>
    </div>
  )
}
