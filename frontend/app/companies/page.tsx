'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Company {
  id: string
  name: string
  position: string
  status: string
  matchScore?: number
  createdAt: string
}

export default function CompaniesPage() {
  // Mock data for now
  const [companies] = useState<Company[]>([
    {
      id: '1',
      name: 'Google',
      position: 'Senior Software Engineer',
      status: 'active',
      matchScore: 85,
      createdAt: '2026-02-10'
    },
    {
      id: '2',
      name: 'Microsoft',
      position: 'Frontend Developer',
      status: 'active',
      matchScore: 92,
      createdAt: '2026-02-12'
    }
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">职位管理</h1>
            <p className="text-gray-600 mt-2">管理你的求职申请和面试</p>
          </div>
          <Link
            href="/companies/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            + 添加职位
          </Link>
        </div>

        {/* Companies Grid */}
        {companies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">还没有添加职位</p>
            <Link
              href="/companies/new"
              className="text-blue-600 hover:underline mt-2 inline-block"
            >
              添加第一个职位 →
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
                      {company.matchScore}% 匹配
                    </span>
                  )}
                </div>
                <p className="text-gray-700 mb-4">{company.position}</p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{company.createdAt}</span>
                  <span className="text-blue-600">查看详情 →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
