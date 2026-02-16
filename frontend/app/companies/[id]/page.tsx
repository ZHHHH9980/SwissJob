'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function CompanyDetailPage() {
  const params = useParams()
  const [isJdExpanded, setIsJdExpanded] = useState(false)

  const [company] = useState({
    id: params.id,
    name: 'Google',
    position: 'Senior Software Engineer',
    jd: 'We are looking for an experienced software engineer to join our Cloud Platform team. This is a full-time position based in Mountain View, CA.\n\nResponsibilities:\n- Design and implement scalable distributed systems\n- Collaborate with cross-functional teams to deliver high-quality software\n- Mentor junior engineers and contribute to technical direction\n- Participate in code reviews and architectural discussions\n\nRequirements:\n- 5+ years of experience in software engineering\n- Strong proficiency in React, TypeScript, and Node.js\n- Experience with system design and distributed systems\n- Excellent communication and collaboration skills\n- Bachelor\'s degree in Computer Science or related field\n\nNice to have:\n- Experience with cloud platforms (GCP, AWS, Azure)\n- Knowledge of containerization and orchestration (Docker, Kubernetes)\n- Open source contributions',
    skills: ['React', 'TypeScript', 'Node.js', 'System Design'],
    matchScore: 85,
    status: 'pending' as const,
    createdAt: '2026-02-10'
  })

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
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
                {company.matchScore}% Match
              </span>
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
                {company.skills.map((skill) => (
                  <span key={skill} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
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
                  <span className="text-gray-900 ml-2">{company.createdAt}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
