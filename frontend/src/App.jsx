import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import Dashboard from './pages/Dashboard.jsx'
import RegisterPatient from './pages/RegisterPatient.jsx'
import AddEpisode from './pages/AddEpisode.jsx'
import './styles/dashboard.css'

/**
 * App — root layout.
 *
 * Mirrors the original HTML skeleton exactly:
 *
 *   <aside class="sidebar">…</aside>
 *   <div id="sidebar-overlay">…</div>
 *   <div class="main-wrapper">
 *     <header class="topbar">…</header>
 *     <main class="main-content">
 *       <Routes> … </Routes>
 *     </main>
 *   </div>
 *   <div id="toast-container">…</div>
 */
export default function App() {
  return (
    <BrowserRouter>
      {/* Mobile sidebar overlay — click closes sidebar */}
      <div
        id="sidebar-overlay"
        className="d-none"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1039,
        }}
      />

      {/* Fixed left sidebar */}
      <Sidebar />

      {/* Main content area, offset right by sidebar width via .main-wrapper */}
      <div className="main-wrapper">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/"                   element={<Dashboard />} />
            <Route path="/register-patient"   element={<RegisterPatient />} />
            <Route path="/add-episode"        element={<AddEpisode />} />
          </Routes>
        </main>
      </div>

      {/* Global toast container — matches original dashboard.js createToastContainer() */}
      <div
        id="toast-container"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      />
    </BrowserRouter>
  )
}
