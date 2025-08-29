import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SessionProvider } from './contexts/SessionContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import AccessGate from './pages/AccessGate'
import Start from './pages/Start'
import StepNew from './pages/StepNew'
import Reflection from './pages/Reflection'
import Complete from './pages/Complete'
import Knowledge from './pages/Knowledge'
import Settings from './pages/Settings'
import Debug from './pages/Debug'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/access" element={<AccessGate />} />
            <Route path="/debug" element={<Debug />} />
            <Route
              path="/start"
              element={
                <ProtectedRoute>
                  <Start />
                </ProtectedRoute>
              }
            />
            <Route
              path="/step/:stepId"
              element={
                <ProtectedRoute>
                  <StepNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reflection"
              element={
                <ProtectedRoute>
                  <Reflection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/complete"
              element={
                <ProtectedRoute>
                  <Complete />
                </ProtectedRoute>
              }
            />
            <Route
              path="/knowledge"
              element={
                <ProtectedRoute>
                  <Knowledge />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/reflection" replace />} />
          </Routes>
        </div>
      </SessionProvider>
    </BrowserRouter>
  )
}