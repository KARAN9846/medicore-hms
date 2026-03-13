import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

/**
 * Sidebar — direct JSX conversion of the <aside class="sidebar"> block
 * from dashboard.html.
 *
 * Key changes from HTML → JSX:
 *   • class  → className
 *   • <a href> → <NavLink to> for routed pages; plain <a href="#"> for stubs
 *   • NavLink receives a className callback to apply "active" automatically
 *   • Mobile open/close wired to #sidebar-overlay in App.jsx
 */
export default function Sidebar() {
  const sidebarRef = useRef(null)
  const location   = useLocation()

  // Close sidebar on every route change (mobile UX)
  useEffect(() => {
    const overlay = document.getElementById('sidebar-overlay')
    sidebarRef.current?.classList.remove('open')
    overlay?.classList.add('d-none')
  }, [location.pathname])

  // Wire overlay click → close sidebar (once on mount)
  useEffect(() => {
    const overlay = document.getElementById('sidebar-overlay')
    function close() {
      sidebarRef.current?.classList.remove('open')
      overlay?.classList.add('d-none')
    }
    overlay?.addEventListener('click', close)
    return () => overlay?.removeEventListener('click', close)
  }, [])

  // Returns the correct className string for NavLink items
  const navCls = ({ isActive }) =>
    `sidebar-link${isActive ? ' active' : ''}`

  return (
    <aside className="sidebar" ref={sidebarRef} aria-label="Main navigation">

      {/* ── Brand ── */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <i className="bi bi-hospital"></i>
        </div>
        <div className="sidebar-brand-text">
          <strong>MediCore HMS</strong>
          <span>Hospital Management</span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">

        <div className="sidebar-section-label">Overview</div>
        <NavLink to="/" end className={navCls}>
          <i className="bi bi-grid-1x2"></i> Dashboard
        </NavLink>

        <div className="sidebar-section-label">Patients</div>
        <a href="#" className="sidebar-link">
          <i className="bi bi-person-lines-fill"></i> All Patients
        </a>
        <NavLink to="/register-patient" className={navCls}>
          <i className="bi bi-person-plus"></i> Register Patient
        </NavLink>
        <NavLink to="/add-episode" className={navCls}>
          <i className="bi bi-clipboard2-pulse"></i> Add New Episode
        </NavLink>
        <a href="#" className="sidebar-link">
          <i className="bi bi-file-medical"></i> Medical Records
          <span className="badge bg-primary">New</span>
        </a>

        <div className="sidebar-section-label">Scheduling</div>
        <a href="#" className="sidebar-link">
          <i className="bi bi-calendar-check"></i> Appointments
          <span className="badge bg-warning text-dark">12</span>
        </a>
        <a href="#" className="sidebar-link">
          <i className="bi bi-calendar3"></i> Schedule
        </a>

        <div className="sidebar-section-label">Operations</div>
        <a href="#" className="sidebar-link">
          <i className="bi bi-hospital-fill"></i> Ward &amp; Beds
        </a>
        <a href="#" className="sidebar-link">
          <i className="bi bi-flask"></i> Laboratory
          <span className="badge bg-danger">5</span>
        </a>
        <a href="#" className="sidebar-link">
          <i className="bi bi-capsule"></i> Pharmacy
        </a>
        <a href="#" className="sidebar-link">
          <i className="bi bi-receipt"></i> Billing
        </a>

        <div className="sidebar-section-label">Staff</div>
        <a href="#" className="sidebar-link">
          <i className="bi bi-people"></i> Staff Directory
        </a>
        <a href="#" className="sidebar-link">
          <i className="bi bi-gear"></i> Settings
        </a>

      </nav>

      {/* ── Footer: current user ── */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">SR</div>
          <div className="sidebar-user-info">
            <strong>Sarah Roberts</strong>
            <span>Head Receptionist</span>
          </div>
          <a href="#" className="ms-auto" title="Logout">
            <i className="bi bi-box-arrow-right text-white opacity-50"></i>
          </a>
        </div>
      </div>

    </aside>
  )
}
