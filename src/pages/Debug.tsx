export default function Debug() {
  const handleTest = async () => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    console.log('Environment variables:')
    console.log('VITE_SUPABASE_URL:', url)
    console.log('VITE_SUPABASE_ANON_KEY:', key ? `${key.substring(0, 20)}...` : 'NOT SET')
    
    if (!url || !key) {
      alert('Environment variables not loaded! Restart the dev server.')
      return
    }
    
    const fullUrl = `${url}/functions/v1/mvp-password-gate`
    console.log('Calling:', fullUrl)
    
    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({ password: 'test' }),
      })
      
      const data = await response.json()
      console.log('Response:', response.status, data)
      alert(`Response: ${response.status}\n${JSON.stringify(data, null, 2)}`)
    } catch (error: any) {
      console.error('Fetch error:', error)
      alert(`Error: ${error.message}`)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Debug Edge Function Connection</h1>
        
        <div className="space-y-2 mb-4 font-mono text-sm">
          <div>
            <strong>VITE_SUPABASE_URL:</strong><br />
            {import.meta.env.VITE_SUPABASE_URL || 'NOT SET'}
          </div>
          <div>
            <strong>VITE_SUPABASE_ANON_KEY:</strong><br />
            {import.meta.env.VITE_SUPABASE_ANON_KEY ? 
              `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 30)}...` : 
              'NOT SET'}
          </div>
        </div>
        
        <button 
          onClick={handleTest}
          className="btn btn-primary py-2 px-4"
        >
          Test Edge Function
        </button>
        
        <p className="mt-4 text-sm text-gray-600">
          Check the browser console for detailed logs.
        </p>
      </div>
    </div>
  )
}