import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Interview Helper</h1>
          <p className="text-2xl text-gray-600">面试助手</p>
          <p className="text-gray-500 mt-4">AI 驱动的面试管理和分析工具</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <Link
            href="/companies"
            className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">📋 职位管理</h2>
            <p className="text-gray-600">管理你的求职申请和面试安排</p>
          </Link>

          <div className="bg-white p-8 rounded-lg shadow-lg opacity-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 技能树</h2>
            <p className="text-gray-600">查看你的技能成长轨迹（开发中）</p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg opacity-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">📝 简历管理</h2>
            <p className="text-gray-600">上传和管理你的简历（开发中）</p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg opacity-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">⚙️ 设置</h2>
            <p className="text-gray-600">配置 AI API 和偏好设置（开发中）</p>
          </div>
        </div>
      </div>
    </main>
  )
}
