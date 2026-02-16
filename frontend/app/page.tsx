import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">InterviewAce</h1>
          <p className="text-2xl text-gray-600">Your AI-Powered Interview Companion</p>
          <p className="text-gray-500 mt-4">Organize, prepare, and track your entire job search journey</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <Link
            href="/companies"
            className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">📋 Job Applications</h2>
            <p className="text-gray-600">Manage your interview pipeline and applications</p>
          </Link>

          <div className="bg-white p-8 rounded-lg shadow-lg opacity-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 Skill Tree</h2>
            <p className="text-gray-600">Visualize your skill growth (Coming soon)</p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg opacity-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">📝 Resume</h2>
            <p className="text-gray-600">Upload and manage your resume (Coming soon)</p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg opacity-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">⚙️ Settings</h2>
            <p className="text-gray-600">Configure AI API and preferences (Coming soon)</p>
          </div>
        </div>
      </div>
    </main>
  )
}
