'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Company {
  id: string
  name: string
  position: string
  jd: string
  skills: string | null
  matchScore: number | null
  status: 'pending' | 'in-progress' | 'completed'
  createdAt: string
}

export default function CompanyDetailPage() {
  const params = useParams()
  const [isJdExpanded, setIsJdExpanded] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompany()
  }, [])

  const fetchCompany = async () => {
    try {
      const response = await fetch(`/api/companies/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCompany(data)
      }
    } catch (error) {
      console.error('Error fetching company:', error)
    } finally {
      setLoading(false)
    }
  }

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
          <p className="text-gray-600 mb-4">Company not found</p>
          <Link href="/companies" className="text-blue-600 hover:underline">
            ← Back to Positions
          </Link>
        </div>
      </div>
    )
  }

  const skills = company.skills ? JSON.parse(company.skills) : []

  const statusColors = {
    pending: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/companies" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Positions
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-xl text-gray-700 mt-2">{company.position}</p>
            </div>
            <div className="flex gap-3">
              <span className={`px-4 py-2 rounded-full font-medium ${statusColors[company.status]}`}>
                {company.status === 'in-progress' ? 'In Progress' : company.status.charAt(0).toUpperCase() + company.status.slice(1)}
              </span>
              {company.matchScore && (
                <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
                  {company.matchScore}% Match
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Job Description</h2>
                <button
                  onClick={() => setIsJdExpanded(!isJdExpanded)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {isJdExpanded ? 'Show Less' : 'Show More'}
                </button>
              </div>
              <div className={`text-gray-700 whitespace-pre-wrap ${isJdExpanded ? '' : 'max-h-48 overflow-hidden relative'}`}>
                {company.jd}
                {!isJdExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent"></div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <button className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  Schedule Interview
                </button>
                <button className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                  Mock Interview
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((skill: string) => (
                    <span key={skill} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No skills extracted</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Information</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="text-gray-900 ml-2 capitalize">{company.status.replace('-', ' ')}</span>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
