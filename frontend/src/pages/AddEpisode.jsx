import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { MOCK_VISITS, BED_POOL, calcAgeFromDob } from '../utils/mockData.js'
import { searchPatients } from '../api/patientsApi.js'
import { createEpisode } from '../api/episodesApi.js'
import { showToast } from '../utils/toast.js'

/* ─── Page-scoped styles (mirrors the <style> block in add-episode.html) ─── */
const PAGE_STYLES = `
  .ep-card { border-top: 3px solid var(--primary); }
  .ep-card.ac-success { border-top-color: var(--success); }
  .ep-card.ac-warning { border-top-color: var(--warning); }
  .ep-card.ac-danger  { border-top-color: var(--danger);  }
  .ep-card.ac-purple  { border-top-color: var(--purple);  }
  .ep-card.ac-info    { border-top-color: #0891b2; }

  .ep-sec-icon { width:32px; height:32px; border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; font-size:.95rem; flex-shrink:0; }

  .ep-form .form-label  { font-size:.78rem; font-weight:600; color:var(--text-secondary); margin-bottom:.28rem; }
  .ep-form .form-control, .ep-form .form-select { font-size:.83rem; padding:.4rem .7rem; border-color:var(--border-color); color:var(--text-primary); }
  .ep-form .form-control:focus, .ep-form .form-select:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(26,111,186,.12); }
  .ep-form .form-control[readonly] { background:var(--bg-body); color:var(--text-secondary); }
  .ep-form .form-text   { font-size:.7rem; color:var(--text-muted); }
  .ep-form .invalid-feedback { font-size:.7rem; }
  .ep-form .form-check-label { font-size:.83rem; color:var(--text-primary); }
  .req { color:var(--danger); }

  .ep-patient-card { display:flex; align-items:center; gap:1rem; padding:.9rem 1.1rem; border:1.5px solid var(--primary); border-radius:var(--radius-md); background:var(--primary-light); animation:epFade .3s ease; }
  .ep-patient-avatar { width:46px; height:46px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:.9rem; font-weight:700; flex-shrink:0; }
  .ep-patient-name  { font-size:.92rem; font-weight:700; color:var(--text-primary); }
  .ep-patient-meta  { font-size:.75rem; color:var(--text-secondary); margin-top:.15rem; }
  .ep-patient-meta span { margin-right:.85rem; }
  .ep-patient-meta i { margin-right:.2rem; color:var(--primary); }
  .ep-patient-ehr { margin-left:auto; flex-shrink:0; font-family:monospace; font-size:.82rem; font-weight:700; color:var(--primary); background:rgba(26,111,186,.12); padding:.25rem .65rem; border-radius:50px; }

  .radio-pill-group { display:flex; gap:.5rem; flex-wrap:wrap; }
  .radio-pill input[type="radio"]    { display:none; }
  .radio-pill input[type="checkbox"] { display:none; }
  .radio-pill label { display:inline-flex; align-items:center; gap:.4rem; padding:.32rem .85rem; border:1.5px solid var(--border-color); border-radius:50px; font-size:.78rem; font-weight:500; color:var(--text-secondary); cursor:pointer; transition:all .2s; background:#fff; white-space:nowrap; }
  .radio-pill label:hover { border-color:var(--primary); color:var(--primary); }
  .radio-pill input:checked + label { border-color:var(--primary); background:var(--primary-light); color:var(--primary); font-weight:700; }

  .ep-footer { position:sticky; bottom:0; background:rgba(255,255,255,.96); backdrop-filter:blur(8px); border-top:1px solid var(--border-color); padding:.8rem 1.75rem; margin:0 -1.75rem; z-index:100; }

  .ep-reveal { animation:epFade .3s ease; }
  @keyframes epFade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  .ep-match { display:flex; align-items:center; gap:.8rem; padding:.65rem .9rem; border:1px solid var(--border-color); border-radius:var(--radius-sm); background:var(--bg-body); cursor:pointer; transition:all .2s; margin-bottom:.45rem; }
  .ep-match:hover { border-color:var(--primary); background:var(--primary-light); }
  .ep-match-av { width:34px; height:34px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:.75rem; font-weight:700; flex-shrink:0; }
  .ep-match-name { font-size:.82rem; font-weight:600; color:var(--text-primary); }
  .ep-match-meta { font-size:.71rem; color:var(--text-muted); }

  .visit-no-badge { display:inline-flex; align-items:center; gap:.35rem; padding:.2rem .6rem; background:var(--success-light); color:var(--success); border-radius:50px; font-size:.72rem; font-weight:700; font-family:monospace; }
  .ep-divider { border-top:1px dashed var(--border-color); margin:1rem 0; }
`

/* Visit counter — module-level to persist across renders in a session */
let visitCounter = 48

/* ─────────────────────────────────────────────────────────────── */

export default function AddEpisode() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const loadedPatientRef = useRef(false)

  /* ── Search state ── */
  const [searchQuery,    setSearchQuery]    = useState('')
  const [searchResults,  setSearchResults]  = useState([])
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [searchNotFound, setSearchNotFound] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)

  /* ── Visit registration readonly fields ── */
  const [visitEHR,     setVisitEHR]     = useState('')
  const [totalVisitNo, setTotalVisitNo] = useState('')
  const [visitNoStr,   setVisitNoStr]   = useState('VIS-')

  /* ── Section 3: Medical Scheme ── */
  const [medScheme,    setMedScheme]    = useState('')  // 'yes' | 'no'
  const [privateVisit, setPrivateVisit] = useState(false)

  /* ── Section 4: Accident ── */
  const [accidentYes, setAccidentYes]  = useState(false)

  /* ── Bed ward → available beds ── */
  const [bedWard,      setBedWard]      = useState('')
  const [availableBeds, setAvailableBeds] = useState([])
  const [selectedBed,  setSelectedBed]  = useState('')

  /* ── Form field values ── */
  const [form, setForm] = useState({
    arrivalType: '', fundingType: '', authCode: '',
    visitDate: '', visitTime: '',
    clinician: '', visitType: '', followupVisitNo: '', servicePoint: '', referredBy: '',
    medProvider: '', medAidNumber: '', depCode: '',
    policeStation: '', arNumber: '', accLocation: '', accDate: '', accTime: '',
    patientState: '', vehicleReg: '', licenceNo: '', vehicleMake: '', driverDetails: '',
  })

  /* ── Validation errors ── */
  const [validationErrors, setValidationErrors] = useState([])

  /* ── Success state ── */
  const [submitted, setSubmitted] = useState(false)
  const [actionFeedback, setActionFeedback] = useState('')

  /* Refs */
  const validationRef = useRef(null)
  const successRef    = useRef(null)

  /* ── Init: set today date + current time ── */
  useEffect(() => {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    setForm(prev => ({ ...prev, visitDate: dateStr, visitTime: `${hh}:${mm}` }))
  }, [])

  useEffect(() => {
    if (loadedPatientRef.current) return

    const patientId = searchParams.get('patientId')
    const patient = location.state?.patient

    if (!patientId || !patient || String(patient.id) !== String(patientId)) return

    loadedPatientRef.current = true
    selectPatient(patient)
  }, [location.state, searchParams])

  /* ── Bed pool update when ward changes ── */
  useEffect(() => {
    setAvailableBeds(bedWard && BED_POOL[bedWard] ? BED_POOL[bedWard] : [])
    setSelectedBed('')
  }, [bedWard])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  /* ─── Helpers ─── */
  function f(field) {
    return (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  function handleWardChange(e) {
    setBedWard(e.target.value)
  }

  function handleSearchChange(e) {
    setSearchQuery(e.target.value)
  }

  async function runSearch(query = searchQuery) {
    const q = query.trim()

    if (!q) {
      setSearchResults([])
      setHighlightIndex(-1)
      setSearchNotFound(false)
      return
    }

    try {
      const result = await searchPatients(q)
      const matches = Array.isArray(result?.patients)
        ? result.patients.map(patient => ({
            id: patient.id,
            ehr: patient.ehr_number,
            firstName: patient.first_name,
            lastName: patient.last_name,
            dob: patient.dob,
            phone: patient.mobile_number || '',
            gender: patient.gender,
          }))
        : []

      setSearchResults(matches)
      setHighlightIndex(matches.length > 0 ? 0 : -1)
      setSearchNotFound(matches.length === 0)
    } catch (error) {
      setSearchResults([])
      setHighlightIndex(-1)
      setSearchNotFound(false)
    }
  }

  function handleSearchKeyDown(e) {
    if (searchResults.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSearch()
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex(prev => Math.min(prev + 1, searchResults.length - 1))
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex(prev => Math.max(prev - 1, 0))
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      const patient = searchResults[highlightIndex]
      if (patient) selectPatient(patient)
    }
  }

  /* ─── SEARCH ─── */
  async function handleSearch(query = searchQuery) {
    await runSearch(query)
  }

  function selectPatient(p) {
    setSelectedPatient(p)
    setSearchResults([])
    setHighlightIndex(-1)
    setSearchNotFound(false)

    const newVisitNo = visitCounter++
    const vStr       = 'VIS-' + String(newVisitNo).padStart(5, '0')
    setVisitEHR(p.ehr)
    setTotalVisitNo(String(newVisitNo))
    setVisitNoStr(vStr)
  }

  function clearPatient() {
    setSelectedPatient(null)
    setSearchQuery('')
    setSearchResults([])
    setHighlightIndex(-1)
    setSearchNotFound(false)
    setVisitEHR('')
    setTotalVisitNo('')
    setVisitNoStr('VIS-')
  }

  /* ─── Submit ─── */
  async function handleSubmit() {
    const errors = []
    if (!selectedPatient) errors.push('Patient selection (search and select a patient)')

    const req = (val, label) => { if (!val || !String(val).trim()) errors.push(label) }
    req(form.arrivalType, 'Arrival Type')
    req(form.fundingType,  'Funding Type')
    req(form.visitDate,    'Visit Date')
    req(form.visitTime,    'Visit Time')
    req(form.clinician,    'Clinician')
    req(form.visitType,    'Visit Type')
    req(form.servicePoint, 'Service Point')

    if (!medScheme) {
      errors.push('Medical Scheme (Yes or No)')
    } else if (medScheme === 'yes') {
      req(form.medProvider,   'Medical Provider')
      req(form.medAidNumber,  'Med Aid Number')
    }

    if (accidentYes) {
      req(form.policeStation, 'Police Station')
      req(form.arNumber,      'AR Number')
      req(form.accLocation,   'Accident Location')
      req(form.accDate,       'Accident Date')
    }

    if (errors.length > 0) {
      setValidationErrors(errors)
      setTimeout(() => validationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
      return
    }

    setValidationErrors([])

    const payload = {
      patient_id: selectedPatient?.id ?? null,
      arrival_type: form.arrivalType,
      funding_type: form.fundingType,
      authorization_code: form.authCode || null,
      visit_date: form.visitDate,
      visit_time: form.visitTime,
      clinician: form.clinician,
      visit_type: form.visitType,
      service_point: form.servicePoint,
      ward_id: null,
      bed_id: null,
    }

    try {
      await createEpisode(payload)
      setSubmitted(true)
      setTimeout(() => successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } catch (error) {
      setActionFeedback('Failed to submit episode. Please try again.')
    }
  }

  function handleReset() {
    setSearchQuery(''); setSearchResults([]); setSearchNotFound(false); setSelectedPatient(null)
    setVisitEHR(''); setTotalVisitNo(''); setVisitNoStr('VIS—')
    setMedScheme(''); setPrivateVisit(false); setAccidentYes(false)
    setBedWard(''); setSelectedBed('')
    setValidationErrors([])
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    setForm({
      arrivalType:'', fundingType:'', authCode:'',
      visitDate: now.toISOString().slice(0,10), visitTime:`${hh}:${mm}`,
      clinician:'', visitType:'', followupVisitNo:'', servicePoint:'', referredBy:'',
      medProvider:'', medAidNumber:'', depCode:'',
      policeStation:'', arNumber:'', accLocation:'', accDate:'', accTime:'',
      patientState:'', vehicleReg:'', licenceNo:'', vehicleMake:'', driverDetails:'',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSuccessAction(type) {
    const msgs = {
      clinical: `Opening clinical notes for ${selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '—'} — feature coming soon.`,
      billing:  `Opening billing for visit ${visitNoStr} — feature coming soon.`,
    }
    setActionFeedback(msgs[type] || '')
  }

  const recentVisits = selectedPatient
    ? MOCK_VISITS
        .filter(visit => visit.ehr === selectedPatient.ehr)
        .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
        .slice(0, 3)
    : []

  /* ─────────────────────────────────────────────────────────────── */
  /* Render                                                          */
  /* ─────────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{PAGE_STYLES}</style>

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb" style={{ fontSize: '0.78rem' }}>
          <li className="breadcrumb-item"><Link to="/" className="text-primary">Dashboard</Link></li>
          <li className="breadcrumb-item"><a href="#" className="text-primary">Patients</a></li>
          <li className="breadcrumb-item active">Add New Episode</li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="section-header mb-4">
        <div>
          <h1 className="section-title" style={{ fontSize: '1.15rem' }}>
            <i className="bi bi-clipboard2-pulse-fill me-2 text-primary"></i>Add New Episode / Visit
          </h1>
          <p className="section-subtitle">Register a new clinical visit or episode for an existing patient.</p>
        </div>
        <Link to="/" className="btn btn-sm btn-outline-secondary">
          <i className="bi bi-arrow-left me-1"></i>Back
        </Link>
      </div>

      {/* ══════════════════════════════════════════════
          SUCCESS PANEL
      ══════════════════════════════════════════════ */}
      {submitted && (
        <div ref={successRef} className="ep-reveal">
          <div className="dash-card ep-card ac-success mb-4">
            <div className="dash-card-body text-center py-5">
              <div className="mx-auto mb-3" style={{ width:72, height:72, borderRadius:'50%', background:'var(--success-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className="bi bi-clipboard2-check-fill text-success" style={{ fontSize:'2.4rem' }}></i>
              </div>
              <h2 style={{ fontSize:'1.2rem', fontWeight:800, color:'var(--text-primary)' }}>
                ✅ Episode Submitted Successfully
              </h2>
              <p className="text-muted mt-1 mb-3" style={{ fontSize:'.85rem' }}>
                The visit has been recorded and assigned to the clinical queue.
              </p>
              <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'.7rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', fontWeight:600 }}>Patient EHR</div>
                  <div style={{ fontFamily:'monospace', fontSize:'1rem', fontWeight:800, color:'var(--primary)' }}>{selectedPatient?.ehr}</div>
                </div>
                <div style={{ width:1, background:'var(--border-color)' }}></div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'.7rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', fontWeight:600 }}>Visit No.</div>
                  <div style={{ fontFamily:'monospace', fontSize:'1rem', fontWeight:800, color:'var(--success)' }}>{visitNoStr}</div>
                </div>
                <div style={{ width:1, background:'var(--border-color)' }}></div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'.7rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', fontWeight:600 }}>Patient</div>
                  <div style={{ fontSize:'.92rem', fontWeight:700, color:'var(--text-primary)' }}>{selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : ''}</div>
                </div>
              </div>
              <div className="d-flex flex-wrap justify-content-center gap-3">
                <button type="button" className="btn btn-primary btn-sm px-4 py-2 fw-semibold" onClick={() => handleSuccessAction('clinical')}>
                  <i className="bi bi-activity me-2"></i>Open Clinical Notes
                </button>
                <button type="button" className="btn btn-outline-primary btn-sm px-4 py-2 fw-semibold" onClick={() => handleSuccessAction('billing')}>
                  <i className="bi bi-receipt me-2"></i>Create Bill
                </button>
                <Link to="/add-episode" className="btn btn-outline-secondary btn-sm px-4 py-2" onClick={() => setSubmitted(false)}>
                  <i className="bi bi-clipboard2-plus me-1"></i>Add Another Episode
                </Link>
              </div>
            </div>
          </div>
          {actionFeedback && (
            <div className="mb-4">
              <div className="dash-card" style={{ borderLeft:'4px solid var(--primary)' }}>
                <div className="dash-card-body py-3 d-flex align-items-center gap-2">
                  <i className="bi bi-info-circle-fill text-primary"></i>
                  <span style={{ fontSize:'.83rem' }}>{actionFeedback}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          EPISODE FORM
      ══════════════════════════════════════════════ */}
      {!submitted && (
        <form className="ep-form" noValidate autoComplete="off">

          {/* ══════════════════════════════════
              SECTION 1 — SEARCH PATIENT
          ══════════════════════════════════ */}
          <div className="dash-card ep-card mb-4">
            <div className="dash-card-header">
              <div className="d-flex align-items-center gap-2">
                <div className="ep-sec-icon icon-bg-primary"><i className="bi bi-search"></i></div>
                <div>
                  <div className="dash-card-title">Section 1 — Search Patient</div>
                  <div style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>Find patient by name, phone number, or EHR number</div>
                </div>
              </div>
            </div>
            <div className="dash-card-body">

              {/* Search input */}
              <div className="d-flex gap-2 mb-3">
                <div className="flex-grow-1" style={{ position:'relative' }}>
                  <i className="bi bi-search" style={{ position:'absolute', left:'.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontSize:'.82rem', pointerEvents:'none' }}></i>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    style={{ paddingLeft:'2.1rem', fontSize:'.83rem' }}
                    placeholder="Search patient by name, phone, or EHR number"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    autoComplete="off"
                  />
                </div>
                <button type="button" className="btn btn-primary btn-sm px-3 fw-semibold" onClick={runSearch}>
                  <i className="bi bi-search me-1"></i>Search
                </button>
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="mb-2">
                  <p style={{ fontSize:'.78rem', fontWeight:600, color:'var(--text-muted)', marginBottom:'.5rem' }}>
                    {searchResults.length} patient(s) found — select to continue:
                  </p>
                  {searchResults.map((p, i) => {
                    const fullName = `${p.firstName} ${p.lastName}`
                    const initials = `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase()
                    const age = calcAgeFromDob(p.dob)
                    return (
                      <div
                        className="ep-match"
                        key={p.ehr}
                        onClick={() => selectPatient(p)}
                        style={{ background: i === highlightIndex ? 'var(--primary-light)' : undefined, borderColor: i === highlightIndex ? 'var(--primary)' : undefined }}
                      >
                        <div className="ep-match-av">{initials}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div className="ep-match-name">{fullName}</div>
                          <div className="ep-match-meta">
                            <span className="me-3"><i className="bi bi-qr-code me-1"></i>{p.ehr}</span>
                            <span className="me-3"><i className="bi bi-telephone me-1"></i>{p.phone}</span>
                            <span className="me-2"><i className="bi bi-calendar3 me-1"></i>{age}</span>
                            <span><i className="bi bi-person me-1"></i>{p.gender}</span>
                          </div>
                        </div>
                        <span style={{ fontSize:'.72rem', color:'var(--primary)', fontWeight:600, flexShrink:0 }}>
                          Select <i className="bi bi-arrow-right"></i>
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Not found */}
              {searchNotFound && (
                <div className="alert alert-warning d-flex align-items-center gap-2 mb-0 py-2" style={{ fontSize:'.82rem' }}>
                  <i className="bi bi-exclamation-triangle-fill" style={{ flexShrink:0 }}></i>
                  <span><strong>Patient not found.</strong> Please register the patient first before adding an episode.</span>
                </div>
              )}

              {/* Selected patient card */}
              {selectedPatient && (
                <div className="ep-reveal">
                  <div className="ep-patient-card">
                    <div className="ep-patient-avatar">
                      {`${selectedPatient.firstName?.[0] || ''}${selectedPatient.lastName?.[0] || ''}`.toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="ep-patient-name">{`${selectedPatient.firstName} ${selectedPatient.lastName}`}</div>
                      <div className="ep-patient-meta">
                        <span><i className="bi bi-calendar3"></i>{selectedPatient.dob} ({calcAgeFromDob(selectedPatient.dob)})</span>
                        <span><i className="bi bi-person"></i>{selectedPatient.gender}</span>
                        <span><i className="bi bi-telephone"></i>{selectedPatient.phone}</span>
                      </div>
                    </div>
                    <div>
                      <div className="ep-patient-ehr">{selectedPatient.ehr}</div>
                      <div style={{ fontSize:'.68rem', color:'var(--text-muted)', textAlign:'center', marginTop:'.2rem' }}>EHR No.</div>
                    </div>
                    <button type="button" className="btn btn-sm btn-outline-secondary ms-2" onClick={clearPatient} style={{ fontSize:'.72rem', padding:'.2rem .5rem' }}>
                      <i className="bi bi-x"></i> Change Patient
                    </button>
                  </div>
                </div>
              )}

              {selectedPatient && recentVisits.length > 0 && (
                <div className="mt-3">
                  <div className="dash-card">
                    <div className="dash-card-header py-2">
                      <div className="dash-card-title">Recent Visit History</div>
                    </div>
                    <div className="dash-card-body py-2">
                      {recentVisits.map((visit, i) => (
                        <div
                          key={visit.visitNo}
                          className={`d-flex align-items-center py-2 ${i < recentVisits.length - 1 ? 'border-bottom' : ''}`}
                        >
                          <div style={{ flex: '1 1 33.33%', fontSize: '.8rem', fontWeight: 600 }}>{visit.visitNo}</div>
                          <div style={{ flex: '1 1 33.33%', fontSize: '.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>{visit.visitDate}</div>
                          <div style={{ flex: '1 1 33.33%', fontSize: '.78rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{visit.visitType}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ══════════════════════════════════
              SECTION 2 — VISIT REGISTRATION
          ══════════════════════════════════ */}
          <fieldset disabled={!selectedPatient} style={{ border: 0, margin: 0, padding: 0 }}>
          <div className="dash-card ep-card ac-success mb-4">
            <div className="dash-card-header">
              <div className="d-flex align-items-center gap-2">
                <div className="ep-sec-icon icon-bg-success"><i className="bi bi-clipboard2-check"></i></div>
                <div>
                  <div className="dash-card-title">Section 2 — Visit Registration</div>
                  <div style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>Arrival classification and funding information</div>
                </div>
              </div>
              <div className="visit-no-badge">
                <i className="bi bi-hash"></i>
                <span>{visitNoStr}</span>
              </div>
            </div>
            <div className="dash-card-body">
              <div className="row g-3">
                <div className="col-md-4 col-lg-3">
                  <label className="form-label">Patient EHR No. <span className="req">*</span></label>
                  <input type="text" className="form-control form-control-sm" readOnly value={visitEHR} placeholder="Select patient above" />
                  <div className="form-text">Auto-populated from patient search.</div>
                </div>
                <div className="col-md-4 col-lg-3">
                  <label className="form-label">Total Visit No.</label>
                  <input type="text" className="form-control form-control-sm" readOnly value={totalVisitNo} placeholder="Auto-assigned" />
                  <div className="form-text">System-assigned sequential number.</div>
                </div>
                <div className="col-md-4 col-lg-3">
                  <label className="form-label">Arrival Type <span className="req">*</span></label>
                  <select className="form-select form-select-sm" value={form.arrivalType} onChange={f('arrivalType')}>
                    <option value="">Select arrival type</option>
                    {['Ambulance','Walk-in','Transfer from Government facility','Transfer from Private facility','Transfer from Casualty'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="col-md-4 col-lg-3">
                  <label className="form-label">Funding Type <span className="req">*</span></label>
                  <select className="form-select form-select-sm" value={form.fundingType} onChange={f('fundingType')}>
                    <option value="">Select funding type</option>
                    {['MVA','BDF','Medical Aid','Private / Self-pay','Government','NGO / Donor'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="col-md-4 col-lg-3">
                  <label className="form-label">Authorization Code</label>
                  <input type="text" className="form-control form-control-sm" placeholder="e.g. AUTH-2024-00891" value={form.authCode} onChange={f('authCode')} />
                  <div className="form-text">Required for MVA and BDF claims.</div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════
              SECTION 3 — VISIT DETAILS
          ══════════════════════════════════ */}
          <div className="dash-card ep-card ac-warning mb-4">
            <div className="dash-card-header">
              <div className="d-flex align-items-center gap-2">
                <div className="ep-sec-icon icon-bg-warning"><i className="bi bi-calendar2-event"></i></div>
                <div>
                  <div className="dash-card-title">Section 3 — Visit Details</div>
                  <div style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>Clinical routing, timing, and service details</div>
                </div>
              </div>
            </div>
            <div className="dash-card-body">

              {/* Row A: Private visit + Medical Scheme toggle */}
              <div className="row g-3 mb-3 align-items-start">
                <div className="col-md-3 col-lg-2 d-flex align-items-center" style={{ paddingTop:'1.6rem' }}>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="private-visit"
                      checked={privateVisit} onChange={e => setPrivateVisit(e.target.checked)} />
                    <label className="form-check-label fw-semibold" htmlFor="private-visit" style={{ fontSize:'.8rem' }}>
                      Private Visit?
                    </label>
                  </div>
                </div>
                <div className="col-md-5 col-lg-4">
                  <label className="form-label d-block">Medical Scheme <span className="req">*</span></label>
                  <div className="radio-pill-group">
                    <div className="radio-pill">
                      <input type="radio" name="medical-scheme" id="scheme-yes" value="yes" checked={medScheme === 'yes'} onChange={() => setMedScheme('yes')} />
                      <label htmlFor="scheme-yes"><i className="bi bi-check-circle"></i> Yes</label>
                    </div>
                    <div className="radio-pill">
                      <input type="radio" name="medical-scheme" id="scheme-no" value="no" checked={medScheme === 'no'} onChange={() => setMedScheme('no')} />
                      <label htmlFor="scheme-no"><i className="bi bi-x-circle"></i> No</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical scheme details */}
              {medScheme === 'yes' && (
                <div className="mb-3 ep-reveal">
                  <div style={{ background:'var(--warning-light)', border:'1px solid rgba(253,126,20,.2)', borderRadius:'var(--radius-sm)', padding:'1rem' }}>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">Medical Provider <span className="req">*</span></label>
                        <select className="form-select form-select-sm" value={form.medProvider} onChange={f('medProvider')}>
                          <option value="">Select provider</option>
                          {['BOMAID','BPOMAS','BDF Medical Aid','PULA','WCA','MVA','Discovery Health','Medscheme','Other'].map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Med Aid Number <span className="req">*</span></label>
                        <input type="text" className="form-control form-control-sm" placeholder="e.g. BOM-2024-00123" value={form.medAidNumber} onChange={f('medAidNumber')} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Dependent Code</label>
                        <input type="text" className="form-control form-control-sm" placeholder="00 = principal, 01, 02…" value={form.depCode} onChange={f('depCode')} />
                        <div className="form-text">Leave blank if principal member.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="ep-divider"></div>

              {/* Row B: Date, Time, Clinician */}
              <div className="row g-3 mb-3">
                <div className="col-md-4 col-lg-2">
                  <label className="form-label">Date <span className="req">*</span></label>
                  <input type="date" className="form-control form-control-sm" value={form.visitDate} onChange={f('visitDate')} />
                </div>
                <div className="col-md-4 col-lg-2">
                  <label className="form-label">Time <span className="req">*</span></label>
                  <input type="time" className="form-control form-control-sm" value={form.visitTime} onChange={f('visitTime')} />
                </div>
                <div className="col-md-4 col-lg-4">
                  <label className="form-label">Clinician <span className="req">*</span></label>
                  <select className="form-select form-select-sm" value={form.clinician} onChange={f('clinician')}>
                    <option value="">Select clinician</option>
                    {[
                      'Dr. A. Sharma — Cardiology','Dr. M. Mehta — Gynaecology',
                      'Dr. P. Gupta — Orthopaedics','Dr. S. Rao — Neurology',
                      'Dr. R. Iyer — General Medicine','Dr. N. Verma — Oncology',
                      'Dr. T. Kgosi — Emergency Medicine','Dr. L. Dube — Paediatrics',
                      'Dr. B. Molefe — Radiology',
                    ].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Row C: Visit Type, Follow-up, Service Point, Referred By */}
              <div className="row g-3 mb-3">
                <div className="col-md-4 col-lg-3">
                  <label className="form-label">Visit Type <span className="req">*</span></label>
                  <select className="form-select form-select-sm" value={form.visitType} onChange={f('visitType')}>
                    <option value="">Select visit type</option>
                    {['Emergency Treatment','In Patient','Laboratory','Radiology','Routine Out Patient','Special Out Patient','Follow-up Visit','Medication Collection'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="col-md-4 col-lg-2">
                  <label className="form-label">Follow-up Visit No.</label>
                  <input type="text" className="form-control form-control-sm" placeholder="e.g. VIS-00041" value={form.followupVisitNo} onChange={f('followupVisitNo')} />
                  <div className="form-text">If this is a follow-up.</div>
                </div>
                <div className="col-md-4 col-lg-3">
                  <label className="form-label">Service Point <span className="req">*</span></label>
                  <select className="form-select form-select-sm" value={form.servicePoint} onChange={f('servicePoint')}>
                    <option value="">Select service point</option>
                    {['Pharmacy','General Admission','Emergency Admission','Laboratory','Radiology','Blood Bank','Other'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="col-md-4 col-lg-4">
                  <label className="form-label">Referred By</label>
                  <select className="form-select form-select-sm" value={form.referredBy} onChange={f('referredBy')}>
                    <option value="">Select referral source</option>
                    {['Clinic','Community Health Centre','Home Based Care','Hospital','Non-Government Organisation','PMTCT','Private Practitioner','Traditional Health Practitioner','VCT','GP','Other'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Row D: Bed Ward + Available Bed */}
              <div className="row g-3">
                <div className="col-md-4 col-lg-3">
                  <label className="form-label">Bed Ward</label>
                  <select className="form-select form-select-sm" value={bedWard} onChange={handleWardChange}>
                    <option value="">Select ward</option>
                    {Object.keys(BED_POOL).map(ward => (
                      <option key={ward} value={ward}>{ward}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 col-lg-3">
                  <label className="form-label">Available Bed</label>
                  <select className="form-select form-select-sm" value={selectedBed} onChange={e => setSelectedBed(e.target.value)} disabled={availableBeds.length === 0}>
                    <option value="">{availableBeds.length === 0 ? '— Select ward first —' : '— Select bed —'}</option>
                    {availableBeds.map(b => <option key={b} value={b}>{b} (Available)</option>)}
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* ══════════════════════════════════
              SECTION 4 — ACCIDENT DETAILS
          ══════════════════════════════════ */}
          <div className="dash-card ep-card ac-danger mb-4">
            <div className="dash-card-header">
              <div className="d-flex align-items-center gap-2">
                <div className="ep-sec-icon icon-bg-danger"><i className="bi bi-exclamation-triangle"></i></div>
                <div>
                  <div className="dash-card-title">Section 4 — Accident Details</div>
                  <div style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>Complete only if visit is accident/trauma related</div>
                </div>
              </div>
            </div>
            <div className="dash-card-body">

              {/* Accident toggle */}
              <div className="mb-3">
                <label className="form-label d-block">Accident Details? <span className="req">*</span></label>
                <div className="radio-pill-group">
                  <div className="radio-pill">
                    <input type="radio" name="accident-details" id="acc-yes" value="yes" checked={accidentYes === true}  onChange={() => setAccidentYes(true)} />
                    <label htmlFor="acc-yes"><i className="bi bi-exclamation-octagon"></i> Yes</label>
                  </div>
                  <div className="radio-pill">
                    <input type="radio" name="accident-details" id="acc-no"  value="no"  checked={accidentYes === false} onChange={() => setAccidentYes(false)} />
                    <label htmlFor="acc-no"><i className="bi bi-dash-circle"></i> No</label>
                  </div>
                </div>
              </div>

              {/* Accident fields */}
              {accidentYes && (
                <div className="ep-reveal">
                  <div className="ep-divider mt-1 mb-3"></div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Police Station <span className="req">*</span></label>
                      <input type="text" className="form-control form-control-sm" placeholder="e.g. Gaborone Central Police Station" value={form.policeStation} onChange={f('policeStation')} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">AR Number <span className="req">*</span></label>
                      <input type="text" className="form-control form-control-sm" placeholder="e.g. AR-2024-00512" value={form.arNumber} onChange={f('arNumber')} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Accident Location <span className="req">*</span></label>
                      <input type="text" className="form-control form-control-sm" placeholder="e.g. A1 Highway, km 14 North" value={form.accLocation} onChange={f('accLocation')} />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-3 col-lg-2">
                      <label className="form-label">Accident Date <span className="req">*</span></label>
                      <input type="date" className="form-control form-control-sm" value={form.accDate} onChange={f('accDate')} />
                    </div>
                    <div className="col-md-3 col-lg-2">
                      <label className="form-label">Accident Time</label>
                      <input type="time" className="form-control form-control-sm" value={form.accTime} onChange={f('accTime')} />
                    </div>
                    <div className="col-md-6 col-lg-4">
                      <label className="form-label">Patient State on Arrival <span className="req">*</span></label>
                      <div className="radio-pill-group" style={{ marginTop:'.35rem' }}>
                        <div className="radio-pill">
                          <input type="radio" name="patient-state" id="state-conscious"   value="conscious"   checked={form.patientState === 'conscious'}   onChange={f('patientState')} />
                          <label htmlFor="state-conscious"><i className="bi bi-eye"></i> Conscious</label>
                        </div>
                        <div className="radio-pill">
                          <input type="radio" name="patient-state" id="state-unconscious" value="unconscious" checked={form.patientState === 'unconscious'} onChange={f('patientState')} />
                          <label htmlFor="state-unconscious"><i className="bi bi-eye-slash"></i> Unconscious</label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Vehicle Registration No.</label>
                      <input type="text" className="form-control form-control-sm" placeholder="e.g. B 123 ABC" value={form.vehicleReg} onChange={f('vehicleReg')} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Driver Licence No.</label>
                      <input type="text" className="form-control form-control-sm" placeholder="e.g. DL-00456789" value={form.licenceNo} onChange={f('licenceNo')} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Vehicle Make / Model</label>
                      <input type="text" className="form-control form-control-sm" placeholder="e.g. Toyota Hilux 2019" value={form.vehicleMake} onChange={f('vehicleMake')} />
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Driver and Vehicle Details</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows={3}
                        placeholder="Describe driver identity, vehicle condition, witnesses, and any other relevant accident details…"
                        style={{ resize:'vertical' }}
                        value={form.driverDetails}
                        onChange={f('driverDetails')}
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          </fieldset>

          {/* Validation alert */}
          {validationErrors.length > 0 && (
            <div className="mb-3" ref={validationRef}>
              <div className="alert alert-warning d-flex align-items-start gap-2 mb-0" style={{ fontSize:'.82rem' }}>
                <i className="bi bi-exclamation-triangle-fill mt-1" style={{ flexShrink:0 }}></i>
                <div>
                  <strong>Please complete required fields before submitting.</strong>
                  <ul className="mb-0 mt-1 ps-3" style={{ fontSize:'.78rem' }}>
                    {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Action Footer */}
          <div className="ep-footer">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <button type="button" className="btn btn-primary btn-sm px-4 py-2 fw-semibold" onClick={handleSubmit}>
                <i className="bi bi-clipboard2-check-fill me-2"></i>Submit Episode
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm px-3 py-2" onClick={() => showToast('Visit No List — feature coming soon.', 'info')}>
                <i className="bi bi-list-ul me-1"></i>Visit No List
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm px-3 py-2" onClick={handleReset}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
              </button>
              <Link to="/" className="btn btn-outline-danger btn-sm px-3 py-2 ms-auto">
                <i className="bi bi-x me-1"></i>Cancel
              </Link>
            </div>
          </div>

        </form>
      )}
    </>
  )
}
