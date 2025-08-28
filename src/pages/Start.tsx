import { useNavigate } from 'react-router-dom'
import { useSession } from '@/contexts/SessionContext'
import { getWarmWelcome } from '@/utils/greetings'
import { useState, useEffect } from 'react'

export default function Start() {
  const navigate = useNavigate()
  const { logout } = useSession()
  const [welcome, setWelcome] = useState('')

  useEffect(() => {
    setWelcome(getWarmWelcome())
  }, [])

  const handleBegin = () => {
    navigate('/reflection')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/access')
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">BeAligned Lite</h1>
          <nav className="flex gap-4">
            <button
              onClick={() => navigate('/knowledge')}
              className="text-gray-600 hover:text-gray-900"
            >
              Knowledge
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="text-gray-600 hover:text-gray-900"
            >
              Admin
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="text-gray-600 hover:text-gray-900"
            >
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="card">
          <div className="mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-xl">🤝</span>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              {welcome}
            </p>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Your Journey to Clarity
          </h2>
          
          <p className="text-gray-600 mb-6">
            Together, we'll work through a gentle process that helps you move from reaction to reflection, 
            from conflict to collaboration. Each step is designed to bring you closer to a solution that works 
            for everyone - especially your child.
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">The Seven Steps:</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Let's Name It - Identify the situation clearly</li>
              <li>What's Beneath That? - Explore your feelings</li>
              <li>Your Why - Understand your deeper values</li>
              <li>Step Into Your Co-Parent's Shoes - Practice perspective-taking</li>
              <li>See Through Your Child's Eyes - Center your child's needs</li>
              <li>Explore Aligned Options - Generate possibilities</li>
              <li>Choose + Communicate - Craft your message</li>
            </ol>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> BeAligned is a reflection and communication support tool, 
              not legal or therapeutic advice. For complex situations, please seek appropriate professional support.
            </p>
          </div>

          <button
            onClick={handleBegin}
            className="w-full btn btn-primary py-3 px-6 text-base"
          >
            Begin Your Reflection
          </button>
        </div>
      </main>
    </div>
  )
}