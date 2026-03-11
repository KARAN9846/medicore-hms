import { useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { showToast } from '../utils/toast.js'

/** Maps routes to the page title shown in the topbar */
const PAGE_TITLES = {
  '/':                 'Staff Dashboard',
  '/register-patient': 'Register Patient',
  '/add-episode':      'Add New Episode',
}

/**
 * Header — direct JSX conversion of <header class="topbar"> from dashboard.html.
 *
 * Key changes from HTML → JSX:
 *   • class → className
 *   • onclick → onClick
 *   • Mobile hamburger calls toggleSidebar() which mirrors dashboard.js openSidebar()
 *   • Dynamic title based on current route (replaces per-page hardcoded titles)
 *   • Bootstrap dropdown on profile pill works via Bootstrap JS (loaded in index.html)
 */
export default function Header() {
  const location  = useLocation()
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'MediCore HMS'

  function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar')
    const overlay = document.getElementById('sidebar-overlay')
    if (sidebar?.classList.contains('open')) {
      sidebar.classList.remove('open')
      overlay?.classList.add('d-none')
    } else {
      sidebar?.classList.add('open')
      overlay?.classList.remove('d-none')
    }
  }

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter' && e.target.value.trim()) {
      showToast(`Searching for "${e.target.value.trim()}"…`, 'info')
    }
  }

  function handleNotifClick() {
    showToast('3 new notifications', 'warning')
  }

  return (
    <header className="topbar">

      {/* Mobile sidebar toggle */}
      <button
        className="topbar-icon-btn d-lg-none border-0"
        aria-label="Toggle sidebar"
        onClick={toggleSidebar}
      >
        <i className="bi bi-list"></i>
      </button>

      <span className="topbar-title">{pageTitle}</span>

      {/* Global search */}
      <div className="topbar-search">
        <i className="bi bi-search search-icon"></i>
        <input
          type="search"
          id="global-search"
          placeholder="Search patients, doctors, wards…"
          autoComplete="off"
          onKeyDown={handleSearchKeyDown}
        />
      </div>

      {/* Action buttons */}
      <div className="topbar-actions">

        {/* Alerts */}
        <button className="topbar-icon-btn" title="Alerts">
          <i className="bi bi-exclamation-triangle"></i>
          <span className="notif-badge">2</span>
        </button>

        {/* Notifications */}
        <button className="topbar-icon-btn" title="Notifications" onClick={handleNotifClick}>
          <i className="bi bi-bell"></i>
          <span className="notif-badge">3</span>
        </button>

        {/* Messages */}
        <button className="topbar-icon-btn d-none d-sm-flex" title="Messages">
          <i className="bi bi-chat-dots"></i>
        </button>

        {/* Profile dropdown — Bootstrap JS handles toggle via data-bs-toggle */}
        <div className="dropdown">
          <div
            className="topbar-profile"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            role="button"
          >
            <div className="topbar-profile-avatar">SR</div>
            <span className="topbar-profile-name d-none d-md-inline">Sarah R.</span>
            <i className="bi bi-chevron-down" style={{ fontSize: '.65rem', color: 'var(--text-muted)' }}></i>
          </div>
          <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
            <li>
              <span className="dropdown-item-text small text-muted">
                Signed in as <strong>Sarah Roberts</strong>
              </span>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <a className="dropdown-item small" href="#">
                <i className="bi bi-person me-2 text-primary"></i>My Profile
              </a>
            </li>
            <li>
              <a className="dropdown-item small" href="#">
                <i className="bi bi-gear me-2 text-secondary"></i>Preferences
              </a>
            </li>
            <li>
              <a className="dropdown-item small" href="#">
                <i className="bi bi-shield-check me-2 text-success"></i>Security
              </a>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <a className="dropdown-item small text-danger" href="#">
                <i className="bi bi-box-arrow-right me-2"></i>Sign Out
              </a>
            </li>
          </ul>
        </div>

      </div>
    </header>
  )
}
