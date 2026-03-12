import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chart, registerables } from 'chart.js'
import { showToast } from '../utils/toast.js'

Chart.register(...registerables)

/* ── Static data (mirrors the hardcoded HTML values) ── */
const RECENT_PATIENTS = [
  { id: '#PT-00841', name: 'Ramesh Patel',  doctor: 'Dr. A. Sharma', dept: 'Cardiology',       status: 'admitted'    },
  { id: '#PT-00842', name: 'Priya Desai',   doctor: 'Dr. M. Mehta',  dept: 'Gynaecology',      status: 'pending'     },
  { id: '#PT-00843', name: 'Arjun Singh',   doctor: 'Dr. P. Gupta',  dept: 'Orthopaedics',     status: 'critical'    },
  { id: '#PT-00844', name: 'Lata Joshi',    doctor: 'Dr. S. Rao',    dept: 'Neurology',         status: 'observation' },
  { id: '#PT-00845', name: 'Vikram Nair',   doctor: 'Dr. R. Iyer',   dept: 'General Medicine',  status: 'discharged'  },
  { id: '#PT-00846', name: 'Sunita Bhat',   doctor: 'Dr. N. Verma',  dept: 'Oncology',          status: 'admitted'    },
]

const APPOINTMENTS = [
  { hour: '09:00', period: 'AM', patient: 'Meera Kulkarni',  doctor: 'Dr. A. Sharma', status: 'confirmed'   },
  { hour: '09:30', period: 'AM', patient: 'Anil Chaudhary',  doctor: 'Dr. M. Mehta',  status: 'in-progress' },
  { hour: '10:15', period: 'AM', patient: 'Deepa Menon',     doctor: 'Dr. P. Gupta',  status: 'waiting'     },
  { hour: '11:00', period: 'AM', patient: 'Kiran Jain',      doctor: 'Dr. S. Rao',    status: 'confirmed'   },
  { hour: '11:45', period: 'AM', patient: 'Rajesh Kumar',    doctor: 'Dr. R. Iyer',   status: 'cancelled'   },
  { hour: '12:30', period: 'PM', patient: 'Nandita Bose',    doctor: 'Dr. N. Verma',  status: 'confirmed'   },
]

const ACTIVITY = [
  { icon: 'bi-person-plus-fill', color: 'icon-bg-success', text: <><strong>Ramesh Patel</strong> was registered as a new patient (General Medicine)</>,     time: '2 minutes ago'  },
  { icon: 'bi-calendar2-check',  color: 'icon-bg-info',    text: <>Appointment booked for <strong>Priya Desai</strong> with Dr. M. Mehta at 09:30 AM</>,    time: '8 minutes ago'  },
  { icon: 'bi-heart-pulse',      color: 'icon-bg-warning', text: <>Vitals updated for <strong>Arjun Singh</strong> — BP: 140/90, HR: 98 bpm</>,             time: '14 minutes ago' },
  { icon: 'bi-hospital',         color: 'icon-bg-danger',  text: <><strong>Arjun Singh</strong> admitted to ICU — Ward C, Bed 12</>,                        time: '22 minutes ago' },
  { icon: 'bi-flask',            color: 'icon-bg-purple',  text: <>Lab report ready for <strong>Lata Joshi</strong> — CBC &amp; Lipid Panel</>,             time: '35 minutes ago' },
  { icon: 'bi-receipt',          color: 'icon-bg-primary', text: <>Bill #INV-2947 generated for <strong>Vikram Nair</strong> — ₹18,400</>,                 time: '50 minutes ago' },
]

const ALERTS = [
  { level: 'danger',  icon: 'bi-exclamation-octagon-fill',  title: 'ICU Beds Running Low',         desc: 'Only 3 ICU beds remaining. Consider patient transfers or early discharge planning.',         time: '5 minutes ago'  },
  { level: 'danger',  icon: 'bi-lightning-charge-fill',     title: 'Emergency Admission — Trauma', desc: 'Patient Arjun Singh (Pt #843) requires immediate surgical assessment — Dr. Gupta alerted.', time: '22 minutes ago' },
  { level: 'warning', icon: 'bi-file-earmark-medical-fill', title: '5 Pending Lab Reports',        desc: 'Lab reports pending review for patients in Oncology and Cardiology wards.',                  time: '1 hour ago'     },
  { level: 'warning', icon: 'bi-capsule-pill',              title: 'Medication Stock — Low',       desc: 'Amoxicillin 500mg and Metformin stock below threshold. Reorder required.',                   time: '2 hours ago'    },
  { level: 'info',    icon: 'bi-info-circle-fill',          title: 'System Maintenance Tonight',   desc: 'Scheduled maintenance from 02:00–04:00 AM. HMS will be in read-only mode.',                  time: '3 hours ago'    },
]

const METRICS = [
  { icon: 'bi-people-fill',       color: 'icon-bg-primary', value: '1,284', label: 'Total Patients',       trend: 'up',   trendText: '+12 this week'  },
  { icon: 'bi-person-check-fill', color: 'icon-bg-success', value: '47',    label: "Today's Patients",     trend: 'up',   trendText: '+5 vs yesterday' },
  { icon: 'bi-calendar-event',    color: 'icon-bg-info',    value: '83',    label: 'Appointments Today',   trend: 'up',   trendText: '62 confirmed'   },
  { icon: 'bi-hospital-fill',     color: 'icon-bg-warning', value: '24',    label: 'Available Beds',       trend: 'down', trendText: '68 occupied'    },
  { icon: 'bi-person-badge-fill', color: 'icon-bg-purple',  value: '18',    label: 'Doctors On Duty',      trend: 'up',   trendText: '4 on call'      },
  { icon: 'bi-flask-fill',        color: 'icon-bg-danger',  value: '11',    label: 'Pending Lab Reports',  trend: 'down', trendText: '3 urgent'       },
]

const QUICK_ACTIONS = [
  { icon: 'bi-person-plus-fill',       color: 'icon-bg-primary', title: 'Register Patient', route: '/register-patient' },
  { icon: 'bi-calendar2-plus',         color: 'icon-bg-success', title: 'Book Appointment', route: null },
  { icon: 'bi-hospital',               color: 'icon-bg-warning', title: 'Admit Patient',    route: null },
  { icon: 'bi-heart-pulse-fill',       color: 'icon-bg-danger',  title: 'Add Vitals',       route: null },
  { icon: 'bi-receipt-cutoff',         color: 'icon-bg-info',    title: 'Create Bill',      route: null },
  { icon: 'bi-file-earmark-medical',   color: 'icon-bg-purple',  title: 'Lab Reports',      route: null },
]

/* ────────────────────────────────────────────────────────── */

export default function Dashboard() {
  const navigate = useNavigate()

  /* Live clock state — mirrors updateClock() in dashboard.js */
  const [liveTime, setLiveTime] = useState('')
  const [liveDate, setLiveDate] = useState('')

  useEffect(() => {
    function tick() {
      const now = new Date()
      setLiveTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setLiveDate(now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  /* Chart canvas refs */
  const diagnosisRef    = useRef(null)
  const bedOccupancyRef = useRef(null)
  const diagnosisChart    = useRef(null)
  const bedOccupancyChart = useRef(null)

  /* Initialise Chart.js charts — mirrors initDiagnosisChart / initBedOccupancyChart */
  useEffect(() => {
    if (!diagnosisRef.current) return

    // Destroy previous instance on hot-reload
    diagnosisChart.current?.destroy()

    diagnosisChart.current = new Chart(diagnosisRef.current, {
      type: 'bar',
      data: {
        labels: ['Hypertension', 'Diabetes', 'Pneumonia', 'Fractures', 'Cardiac', 'Appendicitis', 'Fever'],
        datasets: [{
          label: 'Cases',
          data: [42, 38, 25, 19, 31, 14, 47],
          backgroundColor: [
            'rgba(26,111,186,.8)', 'rgba(25,135,84,.8)', 'rgba(253,126,20,.8)',
            'rgba(111,66,193,.8)', 'rgba(220,53,69,.8)', 'rgba(13,202,240,.8)',
            'rgba(26,111,186,.5)',
          ],
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} cases` } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#64748b' } },
          y: { beginAtZero: true, grid: { color: '#f0f4f8' }, ticks: { font: { size: 11 }, color: '#64748b', stepSize: 10 } },
        },
      },
    })

    return () => diagnosisChart.current?.destroy()
  }, [])

  useEffect(() => {
    if (!bedOccupancyRef.current) return

    bedOccupancyChart.current?.destroy()

    bedOccupancyChart.current = new Chart(bedOccupancyRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Occupied', 'Available', 'Under Maintenance'],
        datasets: [{
          data: [68, 24, 8],
          backgroundColor: ['rgba(220,53,69,.85)', 'rgba(25,135,84,.85)', 'rgba(253,126,20,.85)'],
          borderColor:     ['#dc3545', '#198754', '#fd7e14'],
          borderWidth: 2,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 12 }, padding: 16, color: '#64748b', usePointStyle: true },
          },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} beds` } },
        },
      },
    })

    return () => bedOccupancyChart.current?.destroy()
  }, [])

  /* Quick action click handler */
  function handleQuickAction(action) {
    if (action.route) {
      navigate(action.route)
    } else {
      showToast(`${action.title} — opening form...`, 'info')
    }
  }

  return (
    <>
      {/* ════════ WELCOME PANEL ════════ */}
      <section className="welcome-panel" aria-label="Welcome overview">
        <div className="row align-items-center">
          <div className="col-lg-5 mb-3 mb-lg-0">
            <p className="welcome-greeting">Good Morning, Sarah 👋</p>
            <p className="welcome-role">
              <i className="bi bi-patch-check-fill me-1"></i> Head Receptionist — General Wing
            </p>
            <p className="welcome-date">{liveDate}</p>
            <div className="welcome-shift">
              <i className="bi bi-clock"></i>
              Morning Shift &nbsp;·&nbsp; {liveTime} &nbsp;·&nbsp; 07:00 – 15:00
            </div>
          </div>
          <div className="col-lg-7">
            <div className="welcome-stats">
              <div className="welcome-stat-item">
                <div className="welcome-stat-value">47</div>
                <div className="welcome-stat-label">Registered Today</div>
              </div>
              <div className="welcome-stat-item">
                <div className="welcome-stat-value">83</div>
                <div className="welcome-stat-label">Appointments</div>
              </div>
              <div className="welcome-stat-item">
                <div className="welcome-stat-value">24</div>
                <div className="welcome-stat-label">Available Beds</div>
              </div>
              <div className="welcome-stat-item">
                <div className="welcome-stat-value">18</div>
                <div className="welcome-stat-label">Doctors On Duty</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ QUICK ACTIONS ════════ */}
      <section aria-label="Quick actions">
        <div className="section-header">
          <div>
            <h2 className="section-title">Quick Actions</h2>
            <p className="section-subtitle">Common operations — one click away</p>
          </div>
        </div>
        <div className="row g-3 mb-4">
          {QUICK_ACTIONS.map(action => (
            <div className="col-6 col-sm-4 col-md-2" key={action.title}>
              <div
                className="quick-action-card"
                role="button"
                tabIndex={0}
                aria-label={action.title}
                onClick={() => handleQuickAction(action)}
                onKeyDown={e => e.key === 'Enter' && handleQuickAction(action)}
              >
                <div className={`quick-action-icon ${action.color} mx-auto`}>
                  <i className={`bi ${action.icon}`}></i>
                </div>
                <div className="quick-action-title">{action.title}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ KEY METRICS ════════ */}
      <section aria-label="Key metrics">
        <div className="section-header">
          <div>
            <h2 className="section-title">Key Metrics</h2>
            <p className="section-subtitle">Today's hospital statistics at a glance</p>
          </div>
          <button className="link-btn">View all reports →</button>
        </div>
        <div className="row g-3 mb-4">
          {METRICS.map(m => (
            <div className="col-6 col-md-4 col-xl-2" key={m.label}>
              <div className="metric-card">
                <div className={`metric-icon ${m.color}`}>
                  <i className={`bi ${m.icon}`}></i>
                </div>
                <div className="metric-body">
                  <div className="metric-value">{m.value}</div>
                  <div className="metric-label">{m.label}</div>
                  <div className={`metric-trend ${m.trend}`}>
                    <i className={`bi bi-arrow-${m.trend === 'up' ? 'up' : 'down'}-short`}></i>
                    {m.trendText}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ WORK MANAGEMENT ════════ */}
      <section aria-label="Work management">
        <div className="row g-3 mb-4">

          {/* Recent Patients table */}
          <div className="col-lg-8">
            <div className="dash-card">
              <div className="dash-card-header">
                <div>
                  <div className="dash-card-title">
                    <i className="bi bi-table me-1 text-primary"></i> Recent Patients
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '0.68rem' }}>47 today</span>
                  <button className="link-btn">View all</button>
                </div>
              </div>
              <div className="dash-card-body p-0">
                <div className="table-responsive scrollable">
                  <table className="table table-patients mb-0">
                    <thead>
                      <tr>
                        <th>Patient ID</th>
                        <th>Name</th>
                        <th>Doctor</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RECENT_PATIENTS.map(p => (
                        <tr key={p.id}>
                          <td><span className="patient-id">{p.id}</span></td>
                          <td><span className="patient-name">{p.name}</span></td>
                          <td>{p.doctor}</td>
                          <td>{p.dept}</td>
                          <td>
                            <span className={`status-badge status-${p.status}`}>
                              {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                            </span>
                          </td>
                          <td className="d-flex gap-1">
                            <button className="table-action-btn"><i className="bi bi-eye"></i> View</button>
                            <button className="table-action-btn"><i className="bi bi-pencil"></i> Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="col-lg-4">
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-title">
                  <i className="bi bi-calendar3 me-1 text-success"></i> Upcoming Appointments
                </div>
                <button className="link-btn">View all</button>
              </div>
              <div className="dash-card-body scrollable">
                <ul className="appt-list">
                  {APPOINTMENTS.map((a, i) => (
                    <li className="appt-item" key={i}>
                      <div className="appt-time">
                        <div className="appt-time-hour">{a.hour}</div>
                        <div className="appt-time-min">{a.period}</div>
                      </div>
                      <div className="appt-body">
                        <div className="appt-patient">{a.patient}</div>
                        <div className="appt-doctor">
                          <i className="bi bi-person-fill me-1"></i>{a.doctor}
                        </div>
                      </div>
                      <span className={`appt-status ${a.status}`}>
                        {a.status.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ════════ ACTIVITY & ALERTS ════════ */}
      <section aria-label="Activity and alerts">
        <div className="row g-3 mb-4">

          {/* Activity feed */}
          <div className="col-md-6">
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-title">
                  <i className="bi bi-activity me-1 text-primary"></i> Activity Feed
                </div>
                <span className="badge text-bg-secondary" style={{ fontSize: '0.68rem' }}>Live</span>
              </div>
              <div className="dash-card-body scrollable">
                <ul className="activity-feed">
                  {ACTIVITY.map((a, i) => (
                    <li className="activity-item" key={i}>
                      <div className={`activity-icon ${a.color}`}>
                        <i className={`bi ${a.icon}`}></i>
                      </div>
                      <div>
                        <div className="activity-text">{a.text}</div>
                        <div className="activity-time">
                          <i className="bi bi-clock me-1"></i>{a.time}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Alerts panel */}
          <div className="col-md-6">
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-title">
                  <i className="bi bi-bell-fill me-1 text-danger"></i> Critical Alerts
                </div>
                <span className="badge bg-danger">2 urgent</span>
              </div>
              <div className="dash-card-body">
                {ALERTS.map((al, i) => (
                  <div className={`alert-item alert-${al.level}`} key={i}>
                    <i className={`bi ${al.icon} alert-item-icon`}></i>
                    <div>
                      <div className="alert-item-title">{al.title}</div>
                      <div className="alert-item-desc">{al.desc}</div>
                      <div className="alert-item-time">
                        <i className="bi bi-clock me-1"></i>{al.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ════════ ANALYTICS CHARTS ════════ */}
      <section aria-label="Analytics">
        <div className="section-header">
          <div>
            <h2 className="section-title">Analytics</h2>
            <p className="section-subtitle">Patient &amp; operational insights</p>
          </div>
          <button className="link-btn">Full analytics →</button>
        </div>
        <div className="row g-3">

          {/* Bar chart */}
          <div className="col-lg-7">
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-title">
                  <i className="bi bi-bar-chart-fill me-1 text-primary"></i> Top Diagnoses This Month
                </div>
                <span className="badge text-bg-light border" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Last 30 days</span>
              </div>
              <div className="dash-card-body">
                <div className="chart-container">
                  <canvas ref={diagnosisRef} id="diagnosisChart" height="200"></canvas>
                </div>
              </div>
            </div>
          </div>

          {/* Doughnut chart */}
          <div className="col-lg-5">
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-title">
                  <i className="bi bi-pie-chart-fill me-1 text-warning"></i> Bed Occupancy
                </div>
                <span className="badge text-bg-light border" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>100 total beds</span>
              </div>
              <div className="dash-card-body d-flex align-items-center justify-content-center">
                <div className="chart-container" style={{ maxWidth: '320px' }}>
                  <canvas ref={bedOccupancyRef} id="bedOccupancyChart" height="220"></canvas>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  )
}
