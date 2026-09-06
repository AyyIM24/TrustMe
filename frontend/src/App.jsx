import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'

// Smooth Page Transition
import PageTransition from './components/common/PageTransition'

// Public Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import About from './pages/About'

// Protected Pages & Layout
import ProtectedRoute from './components/auth/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Predict from './pages/Predict'
import Analyze from './pages/Analyze'
import ResultPage from './pages/ResultPage'
import FactCheck from './pages/FactCheck'
import LiveNews from './pages/LiveNews'
import TrendingTopics from './pages/TrendingTopics'
import Explainability from './pages/Explainability'
import Profile from './pages/Profile'

function App() {
  const { initAuth } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <div className="min-h-screen bg-[#FFE6EE] text-slate-900 font-sans transition-colors duration-300">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#D6EBFC',
            color: '#0F172A',
            border: '1px solid #F472B6',
            borderRadius: '14px',
            fontSize: '13px',
            boxShadow: '0 8px 24px rgba(244, 63, 94, 0.18)',
          },
          success: {
            iconTheme: {
              primary: '#0D9488',
              secondary: '#D6EBFC',
            },
          },
          error: {
            iconTheme: {
              primary: '#E11D48',
              secondary: '#D6EBFC',
            },
          },
        }}
      />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
          <Route path="/about" element={<PageTransition><About /></PageTransition>} />

          {/* Protected Feature Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <PageTransition><Dashboard /></PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/predict"
            element={
              <ProtectedRoute>
                <PageTransition><Predict /></PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analyze"
            element={
              <ProtectedRoute>
                <PageTransition><Analyze /></PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analyze/:id"
            element={
              <ProtectedRoute>
                <PageTransition><ResultPage /></PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/factcheck"
            element={
              <ProtectedRoute>
                <PageTransition><FactCheck /></PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/news"
            element={
              <ProtectedRoute>
                <PageTransition><LiveNews /></PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trending"
            element={
              <ProtectedRoute>
                <PageTransition><TrendingTopics /></PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/explainability"
            element={
              <ProtectedRoute>
                <PageTransition><Explainability /></PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <PageTransition><Profile /></PageTransition>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default App
