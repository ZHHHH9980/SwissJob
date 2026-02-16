'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function CompanyDetailPage() {
  const params = useParams()

  // Mock data
  const [company] = useState({
    id: params.id,
    name: 'Google',
    position: 'Senior Software Engineer',
    jd: 'We are looking for an experienced software engineer...',
    skills: ['React', 'TypeScript', 'Node.js', 'System Design'],
    matchScore: 85,
    status: 'active',
    createdAt: '2026-02-10'
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/companies" className="text-blue-600 hover:underline mb-4 inline-block">
            ← 返回职位列表
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-xl text-gray-700 mt-2">{company.position}</p>
            </div>
            <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
              {company.matchScore}% 匹配
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">职位描述</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{company.jd}</p>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">操作</h2>
              <div className="grid grid-cols-2 gap-4">
                <button className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  安排面试
                </button>
                <button className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                  模拟面试
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">技能要求</h2>
              <div className="flex flex-wrap gap-2">
                {company.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">信息</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">状态：</span>
                  <span className="text-gray-900 ml-2">进行中</span>
                </div>
                <div>
                  <span className="text-gray-600">添加时间：</span>
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
