import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/contexts/SessionContext'
import { supabase } from '@/lib/supabase'

export default function Settings() {
  const navigate = useNavigate()
  const { sessionId, logout } = useSession()
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const exportSession = async () => {
    setExporting(true)
    try {
      // Fetch all session data
      const [responses, options, messages] = await Promise.all([
        supabase.from('responses').select('*').eq('session_id', sessionId),
        supabase.from('options').select('*').eq('session_id', sessionId),
        supabase.from('messages').select('*').eq('session_id', sessionId)
      ])

      const exportData = {
        sessionId,
        exportDate: new Date().toISOString(),
        responses: responses.data || [],
        options: options.data || [],
        messages: messages.data || []
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bealigned-session-${sessionId}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExporting(false)
    }
  }

  const deleteSession = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setDeleting(true)
    try {
      // Delete all session data
      await Promise.all([
        supabase.from('responses').delete().eq('session_id', sessionId),
        supabase.from('options').delete().eq('session_id', sessionId),
        supabase.from('messages').delete().eq('session_id', sessionId),
        supabase.from('sessions').delete().eq('id', sessionId)
      ])

      await logout()
      navigate('/access')
    } catch (error) {
      console.error('Delete error:', error)
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
          <button
            onClick={() => navigate('/start')}
            className="text-gray-600 hover:text-gray-900"
          >
            Back to Start
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Session Management</h2>
          
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-medium mb-2">Export Session Data</h3>
              <p className="text-sm text-gray-600 mb-3">
                Download all your reflection data as a JSON file for your records.
              </p>
              <button
                onClick={exportSession}
                disabled={exporting}
                className="btn btn-secondary py-2 px-4"
              >
                {exporting ? 'Exporting...' : 'Export Data'}
              </button>
            </div>

            <div>
              <h3 className="font-medium mb-2">Delete Session</h3>
              <p className="text-sm text-gray-600 mb-3">
                Permanently delete all your session data. This action cannot be undone.
              </p>
              {confirmDelete && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    Are you sure? This will permanently delete all your reflections, options, and messages.
                  </p>
                </div>
              )}
              <button
                onClick={deleteSession}
                disabled={deleting}
                className={confirmDelete ? 'btn bg-red-600 hover:bg-red-700 text-white py-2 px-4' : 'btn btn-secondary py-2 px-4'}
              >
                {deleting ? 'Deleting...' : confirmDelete ? 'Confirm Delete' : 'Delete Session'}
              </button>
              {confirmDelete && (
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="ml-2 btn btn-secondary py-2 px-4"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">About BeAligned Lite</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Version: 1.0 MVP</p>
            <p>Purpose: Co-parenting communication support</p>
            <p>Based on the BeH2O® curriculum</p>
          </div>
        </div>

        <div className="card bg-amber-50">
          <h3 className="font-medium mb-2">Privacy Note</h3>
          <p className="text-sm text-gray-700">
            Your session data is stored temporarily and associated with your browser session. 
            We recommend exporting your data if you want to keep a record. 
            Sessions expire after 24 hours of inactivity.
          </p>
        </div>
      </main>
    </div>
  )
}