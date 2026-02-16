'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Company {
  id: string
  name: string
  position: string
  status: 'pending' | 'in-progress' | 'completed'
  matchScore?: number
  createdAt: string
}

export default function CompaniesPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'in-progress' | 'completed'>('pending')
  const [allCompanies, setAllCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      const data = await response.json()
      setAllCompanies(data)
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const companies = allCompanies.filter(c => c.status === activeTab)

  const statusConfig = {
    pending: { label: 'Pending', color: 'blue', count: allCompanies.filter(c => c.status === 'pending').length },
    'in-progress': { label: 'In Progress', color: 'yellow', count: allCompanies.filter(c => c.status === 'in-progress').length },
    completed: { label: 'Completed', color: 'green', count: allCompanies.filter(c => c.status === 'completed').length }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
            <p className="text-gray-600 mt-2">Manage your interview pipeline</p>
          </div>
          <Link
            href="/companies/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            + Add Position
          </Link>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((status) => {
            const config = statusConfig[status]
            const isActive = activeTab === status
            return (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`px-6 py-3 font-medium transition relative ${
                  isActive
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {config.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {config.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Companies Grid */}
        {companies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 text-lg">No positions in this stage</p>
            <Link
              href="/companies/new"
              className="text-blue-600 hover:underline mt-2 inline-block"
            >
              Add your first position →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{company.name}</h3>
                  {company.matchScore && (
                    <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                      {company.matchScore}% Match
                    </span>
                  )}
                </div>
                <p className="text-gray-700 mb-4">{company.position}</p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{company.createdAt}</span>
                  <span className="text-blue-600">View Details →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
