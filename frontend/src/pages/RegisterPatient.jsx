import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MOCK_PATIENTS, calcAgeFromDob, generateEHR } from '../utils/mockData.js'

/* Page-scoped styles — identical to the <style> block in register-patient.html */
const PAGE_STYLES = `
  .reg-steps{display:flex;align-items:center;overflow-x:auto;padding-bottom:.25rem;margin-bottom:1.5rem}
  .reg-step{display:flex;align-items:center;gap:.45rem;flex-shrink:0}
  .reg-step-bubble{width:26px;height:26px;border-radius:50%;border:2px solid var(--border-color);background:var(--bg-body);color:var(--text-muted);display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;transition:all .25s;flex-shrink:0}
  .reg-step-label{font-size:.7rem;color:var(--text-muted);font-weight:500;white-space:nowrap}
  .reg-step.active .reg-step-bubble{background:var(--primary);border-color:var(--primary);color:#fff}
  .reg-step.active .reg-step-label{color:var(--primary);font-weight:700}
  .reg-step.done .reg-step-bubble{background:var(--success);border-color:var(--success);color:#fff}
  .reg-step.done .reg-step-label{color:var(--success)}
  .reg-step-line{flex:1;min-width:16px;height:2px;background:var(--border-color);margin:0 .2rem;flex-shrink:0;transition:background .3s}
  .reg-card{border-top:3px solid var(--primary)}
  .reg-card.ac-warning{border-top-color:var(--warning)}
  .reg-card.ac-success{border-top-color:var(--success)}
  .reg-card.ac-purple{border-top-color:var(--purple)}
  .reg-sec-icon{width:32px;height:32px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0}
  .reg-form .form-label{font-size:.78rem;font-weight:600;color:var(--text-secondary);margin-bottom:.28rem}
  .reg-form .form-control,.reg-form .form-select{font-size:.83rem;padding:.4rem .7rem;border-color:var(--border-color);color:var(--text-primary)}
  .reg-form .form-control:focus,.reg-form .form-select:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(26,111,186,.12)}
  .reg-form .form-text{font-size:.7rem;color:var(--text-muted)}
  .reg-form .invalid-feedback{font-size:.7rem}
  .req{color:var(--danger)}
  .radio-pill-group{display:flex;gap:.5rem;flex-wrap:wrap}
  .radio-pill input[type="radio"]{display:none}
  .radio-pill label{display:inline-flex;align-items:center;gap:.4rem;padding:.32rem .85rem;border:1.5px solid var(--border-color);border-radius:50px;font-size:.78rem;font-weight:500;color:var(--text-secondary);cursor:pointer;transition:all .2s;background:#fff;white-space:nowrap}
  .radio-pill label:hover{border-color:var(--primary);color:var(--primary)}
  .radio-pill input[type="radio"]:checked+label{border-color:var(--primary);background:var(--primary-light);color:var(--primary);font-weight:700}
  .ehr-tag{display:inline-flex;align-items:center;gap:.35rem;padding:.2rem .65rem;background:var(--primary-light);color:var(--primary);border-radius:50px;font-size:.72rem;font-weight:700;font-family:monospace;letter-spacing:.04em;border:1px solid rgba(26,111,186,.2)}
  .success-ehr-badge{display:inline-flex;align-items:center;gap:.6rem;padding:.55rem 1.5rem;background:var(--primary-light);border:1.5px solid var(--primary);border-radius:var(--radius-md);font-family:monospace;font-size:1.2rem;font-weight:800;color:var(--primary);letter-spacing:.07em}
  .summary-chip{display:inline-flex;align-items:center;gap:.35rem;padding:.25rem .65rem;border-radius:50px;font-size:.72rem;font-weight:600;background:var(--bg-body);border:1px solid var(--border-color);color:var(--text-secondary)}
  .reg-footer{position:sticky;bottom:0;background:rgba(255,255,255,.96);backdrop-filter:blur(8px);border-top:1px solid var(--border-color);padding:.8rem 1.75rem;margin:0 -1.75rem;z-index:100}
  .reg-reveal{animation:regFade .3s ease}
  @keyframes regFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .patient-match{display:flex;align-items:center;gap:.8rem;padding:.65rem .9rem;border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--bg-body);cursor:pointer;transition:all .2s;margin-bottom:.45rem}
  .patient-match:hover{border-color:var(--primary);background:var(--primary-light)}
  .patient-match-av{width:36px;height:36px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.78rem;font-weight:700;flex-shrink:0}
  .patient-match-name{font-size:.83rem;font-weight:600;color:var(--text-primary)}
  .patient-match-meta{font-size:.72rem;color:var(--text-muted)}
`

/* EHR counter — module-level so it persists across re-renders in a session */
let ehrCounterRef = 22

export default function RegisterPatient() {

  /* ── Step indicator state ── */
  // 'idle' | 'active' | 'done'  for each of 6 steps
  const [steps, setSteps] = useState(['active', 'idle', 'idle', 'idle', 'idle', 'idle'])

  /* ── Search state ── */
  const [searchQuery,     setSearchQuery]     = useState('')
  const [suggestions,     setSuggestions]     = useState([])
  const [highlightIndex,  setHighlightIndex]  = useState(-1)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientNotFound, setPatientNotFound] = useState(false)

  /* ── Section visibility ── */
  const [showMedAidQ,       setShowMedAidQ]       = useState(false)
  const [showMedAidDetails, setShowMedAidDetails] = useState(false)
  const [showPatientForm,   setShowPatientForm]   = useState(false)
  const [showFooter,        setShowFooter]        = useState(false)

  /* ── Medical aid ── */
  const [medAid, setMedAid] = useState('')  // 'yes' | 'no' | ''

  /* ── Nationality & conditional ID fields ── */
  const [nationality, setNationality] = useState('')  // 'botswana' | 'non-botswana' | 'non-documented'

  /* ── Auto-generated EHR ── */
  const [generatedEHR, setGeneratedEHR] = useState('')

  /* ── Age (computed from DOB) ── */
  const [age, setAge] = useState('')

  /* ── Clipboard copy icon ── */
  const [copyIcon, setCopyIcon] = useState('bi-clipboard')

  /* ── Validation errors ── */
  const [validationErrors, setValidationErrors] = useState([])

  /* ── Form values ── */
  const [form, setForm] = useState({
    category: '', title: '', firstName: '', lastName: '', dob: '',
    gender: '', religion: '', marital: '', citizenship: '', language: '', race: '',
    mobile: '', email: '', altNumber: '',
    omangId: '', passportNum: '', passportExpiry: '',
    aidProvider: '', aidPlan: '', aidMembership: '', aidDependant: '',
    address: '', suburb: '', city: '', areaCode: '',
    kinRelationship: '', kinTitle: '', kinFirstName: '', kinLastName: '',
    kinContact: '', kinEmail: '', kinNationality: '', kinOmang: '',
  })

  /* ── Success state ── */
  const [submitted, setSubmitted] = useState(false)
  const [actionFeedback, setActionFeedback] = useState('')

  /* ── Success summary chips ── */
  const [summaryChips, setSummaryChips] = useState([])

  /* Refs for scroll */
  const successRef    = useRef(null)
  const validationRef = useRef(null)

  /* ────────────────────────────────────────
     Helpers
  ──────────────────────────────────────── */
  function advanceStep(stepIndex) {
    setSteps(prev => prev.map((s, i) => {
      if (i === stepIndex)     return 'done'
      if (i === stepIndex + 1) return 'active'
      return s
    }))
  }

  function setStepActive(stepIndex) {
    setSteps(prev => prev.map((s, i) => i === stepIndex ? 'active' : s))
  }

  function stepClass(i) {
    return `reg-step ${steps[i]}`
  }

  function f(field) {
    return (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  function getPatientMatches(query) {
    const q = query.trim().toLowerCase()

    if (!q) return []

    return MOCK_PATIENTS.filter(p => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase()
      return (
        p.ehr.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        fullName.includes(q)
      )
    })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const matches = getPatientMatches(searchQuery)
      setSuggestions(matches)
      setHighlightIndex(matches.length > 0 ? 0 : -1)

      if (searchQuery.trim() && matches.length === 0) {
        setPatientNotFound(true)
        setSelectedPatient(null)
        setActionFeedback('')
        openNewPatientFlow()
        if (!generatedEHR) {
          setGeneratedEHR(generateEHR(ehrCounterRef++))
        }
        setShowPatientForm(true)
        setShowFooter(true)
      } else {
        setPatientNotFound(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, generatedEHR])

  /* ────────────────────────────────────────
     STEP 1 — Search
  ──────────────────────────────────────── */
  function runSearch() {
    const q = searchQuery.trim().toLowerCase()

    if (!q) {
      setSuggestions([])
      setHighlightIndex(-1)
      setPatientNotFound(false)
      return
    }

    const matches = getPatientMatches(q)
    setSuggestions(matches)
    setHighlightIndex(matches.length > 0 ? 0 : -1)
  }

  function openNewPatientFlow() {
    setPatientNotFound(true)
    advanceStep(0)
    setShowMedAidQ(true)
    setStepActive(1)
  }

  function selectSuggestedPatient(patient) {
    setSelectedPatient(patient)
    setSuggestions([])
    setHighlightIndex(-1)
    setPatientNotFound(false)
    setActionFeedback('')
    setShowMedAidQ(false)
    setShowMedAidDetails(false)
    setShowPatientForm(false)
    setShowFooter(false)
  }

  function handleSearchKeyDown(e) {
    if (suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        runSearch()
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex(prev => Math.min(prev + 1, suggestions.length - 1))
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex(prev => Math.max(prev - 1, 0))
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      const patient = suggestions[highlightIndex]
      if (patient) selectSuggestedPatient(patient)
    }
  }

  function confirmExistingPatient(ehr, name) {
    setActionFeedback(`Opening existing record for ${name} (${ehr}) — feature coming soon.`)
  }

  /* ────────────────────────────────────────
     STEP 2 — Medical Aid choice
  ──────────────────────────────────────── */
  function onMedAidChange(val) {
    setMedAid(val)
    setShowMedAidDetails(val === 'yes')
    advanceStep(1)

    if (!showPatientForm) {
      const ehr = generateEHR(ehrCounterRef++)
      setGeneratedEHR(ehr)
      setShowPatientForm(true)
      setShowFooter(true)
      setStepActive(2)
    }
  }

  /* ────────────────────────────────────────
     DOB → Age
  ──────────────────────────────────────── */
  function handleDobChange(e) {
    const val = e.target.value
    setForm(prev => ({ ...prev, dob: val }))
    setAge(calcAgeFromDob(val))
  }

  /* ────────────────────────────────────────
     Submit
  ──────────────────────────────────────── */
  function handleSubmit() {
    const errors = []
    const req = (val, label) => { if (!val.trim()) errors.push(label) }

    req(form.category,       'Patient Category')
    req(form.firstName,      'First Name')
    req(form.lastName,       'Last Name')
    req(form.dob,            'Date of Birth')
    req(form.gender,         'Gender')
    req(form.mobile,         'Mobile Number')
    req(form.address,        'Address')
    req(form.city,           'City')
    req(form.kinRelationship,'Guarantor Relationship')
    req(form.kinFirstName,   'Guarantor First Name')
    req(form.kinLastName,    'Guarantor Last Name')
    req(form.kinContact,     'Guarantor Contact Number')

    if (!nationality) {
      errors.push('Nationality selection')
    } else if (nationality === 'botswana') {
      req(form.omangId, 'Omang ID Number')
    } else if (nationality === 'non-botswana') {
      req(form.passportNum,    'Passport Number')
      req(form.passportExpiry, 'Passport Expiry Date')
    }

    if (errors.length > 0) {
      setValidationErrors(errors)
      setTimeout(() => validationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
      return
    }

    setValidationErrors([])

    const chips = [
      { icon: 'bi-person',           text: `${form.firstName} ${form.lastName}` },
      { icon: 'bi-gender-ambiguous', text: form.gender },
      { icon: 'bi-calendar3',        text: age ? `${age} years` : '' },
      { icon: 'bi-hospital',         text: form.category },
      { icon: 'bi-qr-code',          text: generatedEHR },
    ].filter(c => String(c.text).trim())

    setSummaryChips(chips)

    // Mark all steps complete for the success screen
    setSteps(['done','done','done','done','done','done'])
    setSubmitted(true)
    setTimeout(() => successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function handleReset() {
    setSearchQuery(''); setSuggestions([]); setHighlightIndex(-1); setSelectedPatient(null); setPatientNotFound(false)
    setShowMedAidQ(false); setShowMedAidDetails(false)
    setShowPatientForm(false); setShowFooter(false)
    setMedAid(''); setNationality('')
    setGeneratedEHR(''); setAge('')
    setSubmitted(false)
    setActionFeedback('')
    setSummaryChips([])
    setCopyIcon('bi-clipboard')
    setValidationErrors([])
    setForm({ category:'', title:'', firstName:'', lastName:'', dob:'',
      gender:'', religion:'', marital:'', citizenship:'', language:'', race:'',
      mobile:'', email:'', altNumber:'',
      omangId:'', passportNum:'', passportExpiry:'',
      aidProvider:'', aidPlan:'', aidMembership:'', aidDependant:'',
      address:'', suburb:'', city:'', areaCode:'',
      kinRelationship:'', kinTitle:'', kinFirstName:'', kinLastName:'',
      kinContact:'', kinEmail:'', kinNationality:'', kinOmang:'',
    })
    setSteps(['active','idle','idle','idle','idle','idle'])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function copyEHR() {
    navigator.clipboard.writeText(generatedEHR).then(() => {
      setCopyIcon('bi-clipboard-check')
      setTimeout(() => setCopyIcon('bi-clipboard'), 2000)
    })
  }

  function successAction(type) {
    const msgs = {
      profile:     `Opening patient profile for ${generatedEHR} — feature coming soon.`,
      appointment: `Opening appointment booking for ${generatedEHR} — feature coming soon.`,
    }
    setActionFeedback(msgs[type] || '')
  }

  /* ────────────────────────────────────────
     Render
  ──────────────────────────────────────── */
  return (
    <>
      <style>{PAGE_STYLES}</style>

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb" style={{ fontSize: '0.78rem' }}>
          <li className="breadcrumb-item"><Link to="/" className="text-primary">Dashboard</Link></li>
          <li className="breadcrumb-item"><a href="#" className="text-primary">Patients</a></li>
          <li className="breadcrumb-item active">Register Patient</li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="section-header mb-3">
        <div>
          <h1 className="section-title" style={{ fontSize: '1.15rem' }}>
            <i className="bi bi-person-plus-fill me-2 text-primary"></i>Register New Patient
          </h1>
          <p className="section-subtitle">Follow the workflow steps to create a verified patient record.</p>
        </div>
        <Link to="/" className="btn btn-sm btn-outline-secondary">
          <i className="bi bi-arrow-left me-1"></i>Back
        </Link>
      </div>

      {/* ── Step indicator ── */}
      <div className="reg-steps">
        {[
          'Search',
          'Medical Aid',
          'Patient Details',
          'Address',
          'Guarantor',
          'Complete',
        ].map((label, i) => (
          <span key={i} style={{ display: 'contents' }}>
            <div className={stepClass(i)}>
              <div className="reg-step-bubble">
                {i < 5 ? i + 1 : <i className="bi bi-check2" style={{ fontSize: '0.68rem' }}></i>}
              </div>
              <span className="reg-step-label">{label}</span>
            </div>
            {i < 5 && (
              <div
                className="reg-step-line"
                style={{ background: steps[i] === 'done' ? 'var(--success)' : undefined }}
              />
            )}
          </span>
        ))}
      </div>

      {/* ══════════════════════════════════
          SUCCESS PANEL
      ══════════════════════════════════ */}
      {submitted && (
        <div ref={successRef} className="reg-reveal">
          <div className="dash-card mb-4" style={{ borderTop: '3px solid var(--success)' }}>
            <div className="dash-card-body text-center py-5">
              <div className="mx-auto mb-3" style={{ width:76, height:76, borderRadius:'50%', background:'var(--success-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize:'2.6rem' }}></i>
              </div>
              <h2 style={{ fontSize:'1.2rem', fontWeight:800, color:'var(--text-primary)' }}>
                ✅ Patient Registered Successfully
              </h2>
              <p className="text-muted mt-1 mb-3" style={{ fontSize:'0.85rem' }}>
                The patient record is now active in MediCore HMS.
              </p>
              <div className="mb-1" style={{ fontSize:'0.73rem', color:'var(--text-muted)', letterSpacing:'.05em', textTransform:'uppercase', fontWeight:600 }}>
                Patient EHR Number
              </div>
              <div className="success-ehr-badge mb-4">
                <i className="bi bi-qr-code"></i>
                <span>{generatedEHR}</span>
                <button type="button" onClick={copyEHR} className="btn btn-sm p-0 ms-2" title="Copy EHR" style={{ color:'var(--primary)', fontSize:'0.9rem', lineHeight:1 }}>
                  <i className={`bi ${copyIcon}`}></i>
                </button>
              </div>
              <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
                {summaryChips.map((c, i) => (
                  <span key={i} className="summary-chip">
                    <i className={`bi ${c.icon}`}></i>{c.text}
                  </span>
                ))}
              </div>
              <div className="d-flex flex-wrap justify-content-center gap-3">
                <button type="button" className="btn btn-outline-primary btn-sm px-4 py-2 fw-semibold" onClick={() => successAction('profile')}>
                  <i className="bi bi-person-lines-fill me-2"></i>View Patient Profile
                </button>
                <button type="button" className="btn btn-primary btn-sm px-4 py-2 fw-semibold" onClick={() => successAction('appointment')}>
                  <i className="bi bi-calendar2-plus me-2"></i>Book Appointment
                </button>
                <button type="button" className="btn btn-outline-secondary btn-sm px-4 py-2" onClick={handleReset}>
                  <i className="bi bi-person-plus me-1"></i>Register Another Patient
                </button>
              </div>
            </div>
          </div>
          {actionFeedback && (
            <div className="mb-4">
              <div className="dash-card" style={{ borderLeft:'4px solid var(--primary)' }}>
                <div className="dash-card-body py-3 d-flex align-items-center gap-2">
                  <i className="bi bi-info-circle-fill text-primary"></i>
                  <span style={{ fontSize:'0.83rem' }}>{actionFeedback}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════
          FORM WRAPPER
      ══════════════════════════════════ */}
      {!submitted && (
        <form className="reg-form" noValidate autoComplete="off">

          {/* ── STEP 1: Search ── */}
          <div className="dash-card reg-card mb-4">
            <div className="dash-card-header">
              <div className="d-flex align-items-center gap-2">
                <div className="reg-sec-icon icon-bg-primary"><i className="bi bi-search"></i></div>
                <div>
                  <div className="dash-card-title">Step 1 — Search Existing Patient</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Prevent duplicate records before registering</div>
                </div>
              </div>
            </div>
            <div className="dash-card-body">
              <div className="d-flex gap-2">
                <div className="flex-grow-1" style={{ position:'relative' }}>
                  <i className="bi bi-search" style={{ position:'absolute', left:'.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontSize:'.82rem', pointerEvents:'none' }}></i>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    style={{ paddingLeft:'2.1rem', fontSize:'0.83rem' }}
                    placeholder="Search patient by name, phone, or EHR number"
                    autoComplete="off"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setSelectedPatient(null) }}
                    onKeyDown={handleSearchKeyDown}
                  />
                </div>
                <button type="button" className="btn btn-primary btn-sm px-3 fw-semibold" onClick={runSearch}>
                  <i className="bi bi-search me-1"></i>Search
                </button>
              </div>

              {/* Search results list */}
              {suggestions.length > 0 && (
                <div className="mt-3">
                  <p style={{ fontSize:'.78rem', fontWeight:600, color:'var(--text-muted)', marginBottom:'.5rem' }}>
                    {suggestions.length} existing record(s) found — is this the patient?
                  </p>
                  {suggestions.map((p, i) => {
                    const fullName = `${p.firstName} ${p.lastName}`
                    const initials = `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase()
                    return (
                      <div
                        className="patient-match"
                        key={p.ehr}
                        onClick={() => selectSuggestedPatient(p)}
                        style={{ background: i === highlightIndex ? 'var(--primary-light)' : undefined, borderColor: i === highlightIndex ? 'var(--primary)' : undefined }}
                      >
                        <div className="patient-match-av">{initials}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div className="patient-match-name">{fullName}</div>
                          <div className="patient-match-meta">
                            <span className="me-3"><i className="bi bi-qr-code me-1"></i>{p.ehr}</span>
                            <span className="me-3"><i className="bi bi-telephone me-1"></i>{p.phone}</span>
                            <span><i className="bi bi-calendar3 me-1"></i>{p.dob}</span>
                          </div>
                        </div>
                        <span style={{ fontSize:'.72rem', color:'var(--primary)', fontWeight:600 }}>Select <i className="bi bi-arrow-right"></i></span>
                      </div>
                    )
                  })}
                </div>
              )}

              {selectedPatient && (
                <div className="mt-3">
                  <div className="patient-match" style={{ cursor:'default' }}>
                    <div className="patient-match-av">
                      {`${selectedPatient.firstName?.[0] || ''}${selectedPatient.lastName?.[0] || ''}`.toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="patient-match-name">{`${selectedPatient.firstName} ${selectedPatient.lastName}`}</div>
                      <div className="patient-match-meta">
                        <span className="me-3"><i className="bi bi-qr-code me-1"></i>{selectedPatient.ehr}</span>
                        <span><i className="bi bi-telephone me-1"></i>{selectedPatient.phone}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => confirmExistingPatient(selectedPatient.ehr, `${selectedPatient.firstName} ${selectedPatient.lastName}`)}
                    >
                      <i className="bi bi-arrow-right me-1"></i>Open Record
                    </button>
                  </div>
                </div>
              )}

              {/* Not found alert */}
              {patientNotFound && (
                <div className="mt-3">
                  <div className="alert alert-warning d-flex align-items-start gap-2 mb-0 py-2" style={{ fontSize:'0.82rem' }}>
                    <i className="bi bi-exclamation-triangle-fill mt-1" style={{ flexShrink:0 }}></i>
                    <span><strong>Patient not found.</strong> Please complete the form below to register a new patient.</span>
                  </div>
                </div>
              )}

              {/* Action feedback (existing patient selected) */}
              {actionFeedback && !submitted && (
                <div className="mt-3">
                  <div className="dash-card" style={{ borderLeft:'4px solid var(--primary)' }}>
                    <div className="dash-card-body py-3 d-flex align-items-center gap-2">
                      <i className="bi bi-info-circle-fill text-primary"></i>
                      <span style={{ fontSize:'0.83rem' }}>{actionFeedback}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── STEP 2: Medical Aid question ── */}
          {showMedAidQ && (
            <div className="dash-card reg-card ac-warning mb-4 reg-reveal">
              <div className="dash-card-header">
                <div className="d-flex align-items-center gap-2">
                  <div className="reg-sec-icon icon-bg-warning"><i className="bi bi-shield-plus"></i></div>
                  <div>
                    <div className="dash-card-title">Step 2 — Medical Aid</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Does the patient have medical aid or insurance?</div>
                  </div>
                </div>
              </div>
              <div className="dash-card-body">
                <p className="fw-semibold mb-2" style={{ fontSize:'0.85rem' }}>Are you on Medical Aid?</p>
                <div className="radio-pill-group">
                  <div className="radio-pill">
                    <input type="radio" name="on-medical-aid" id="aid-yes" value="yes" checked={medAid === 'yes'} onChange={() => onMedAidChange('yes')} />
                    <label htmlFor="aid-yes"><i className="bi bi-check-circle"></i> Yes</label>
                  </div>
                  <div className="radio-pill">
                    <input type="radio" name="on-medical-aid" id="aid-no" value="no" checked={medAid === 'no'} onChange={() => onMedAidChange('no')} />
                    <label htmlFor="aid-no"><i className="bi bi-x-circle"></i> No</label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Medical Aid details (if yes) ── */}
          {showMedAidDetails && (
            <div className="dash-card reg-card ac-warning mb-4 reg-reveal">
              <div className="dash-card-header">
                <div className="d-flex align-items-center gap-2">
                  <div className="reg-sec-icon icon-bg-warning"><i className="bi bi-card-list"></i></div>
                  <div>
                    <div className="dash-card-title">Patient Medical Aid Details</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Scheme, plan, and membership information</div>
                  </div>
                </div>
              </div>
              <div className="dash-card-body">
                <div className="row g-3">
                  <div className="col-md-6 col-lg-3">
                    <label className="form-label">Medical Aid Provider <span className="req">*</span></label>
                    <select className="form-select form-select-sm" value={form.aidProvider} onChange={f('aidProvider')}>
                      <option value="">Select provider</option>
                      {['BOMAID','BPOMAS','BDF Medical Aid','PULA','WCA','MVA','Discovery Health','Medscheme','Other'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <label className="form-label">Plan <span className="req">*</span></label>
                    <select className="form-select form-select-sm" value={form.aidPlan} onChange={f('aidPlan')}>
                      <option value="">Select plan</option>
                      {['Basic','Standard','Comprehensive','Executive','Premium'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <label className="form-label">Membership Number <span className="req">*</span></label>
                    <input type="text" className="form-control form-control-sm" placeholder="e.g. BOM-2024-00123" value={form.aidMembership} onChange={f('aidMembership')} />
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <label className="form-label">Dependant Code</label>
                    <input type="text" className="form-control form-control-sm" placeholder="00 = principal, 01, 02…" value={form.aidDependant} onChange={f('aidDependant')} />
                    <div className="form-text">Leave blank if principal member.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEPS 4-6: Patient Details, Address, Guarantor ── */}
          {showPatientForm && (
            <>
              {/* ── Patient Details ── */}
              <div className="dash-card reg-card mb-4 reg-reveal">
                <div className="dash-card-header">
                  <div className="d-flex align-items-center gap-2">
                    <div className="reg-sec-icon icon-bg-primary"><i className="bi bi-person-badge"></i></div>
                    <div>
                      <div className="dash-card-title">Patient Details</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Demographics, identity, and contact</div>
                    </div>
                  </div>
                  <div className="ehr-tag">
                    <i className="bi bi-qr-code"></i>
                    <span>{generatedEHR || 'EHR—'}</span>
                  </div>
                </div>
                <div className="dash-card-body">
                  {/* Category + EHR readonly + Title */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-4 col-lg-3">
                      <label className="form-label">Patient Category <span className="req">*</span></label>
                      <select className="form-select form-select-sm" value={form.category} onChange={f('category')}>
                        <option value="">Select category</option>
                        {['Outpatient','Inpatient','Emergency','Day Case','Maternity','Paediatric'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4 col-lg-4">
                      <label className="form-label">Patient EHR Number</label>
                      <input type="text" className="form-control form-control-sm" readOnly value={generatedEHR}
                        style={{ background:'var(--bg-body)', fontFamily:'monospace', fontSize:'0.82rem', color:'var(--primary)', fontWeight:700 }} />
                      <div className="form-text">System-assigned. Read-only.</div>
                    </div>
                    <div className="col-md-4 col-lg-2">
                      <label className="form-label">Title</label>
                      <select className="form-select form-select-sm" value={form.title} onChange={f('title')}>
                        <option value="">—</option>
                        {['Mr','Mrs','Ms','Miss','Dr','Prof','Rev'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Names */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">First Name <span className="req">*</span></label>
                      <input type="text" className="form-control form-control-sm" placeholder="e.g. Keabetswe" value={form.firstName} onChange={f('firstName')} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Last Name <span className="req">*</span></label>
                      <input type="text" className="form-control form-control-sm" placeholder="e.g. Motswagole" value={form.lastName} onChange={f('lastName')} />
                    </div>
                  </div>
                  {/* Nationality pills */}
                  <div className="mb-3">
                    <label className="form-label d-block">Nationality <span className="req">*</span></label>
                    <div className="radio-pill-group">
                      {[
                        { value: 'botswana',        icon: 'bi-flag',        label: 'Botswana' },
                        { value: 'non-botswana',    icon: 'bi-globe',       label: 'Non Botswana' },
                        { value: 'non-documented',  icon: 'bi-person-dash', label: 'Non Documented' },
                      ].map(n => (
                        <div className="radio-pill" key={n.value}>
                          <input type="radio" name="nationality" id={`nat-${n.value}`} value={n.value}
                            checked={nationality === n.value}
                            onChange={() => setNationality(n.value)} />
                          <label htmlFor={`nat-${n.value}`}><i className={`bi ${n.icon}`}></i> {n.label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Conditional ID fields */}
                  <div className="row g-3 mb-3">
                    {nationality === 'botswana' && (
                      <div className="col-md-4 reg-reveal">
                        <label className="form-label">Omang ID Number <span className="req">*</span></label>
                        <input type="text" className="form-control form-control-sm" placeholder="e.g. 9001011234088" maxLength={13} value={form.omangId} onChange={f('omangId')} />
                        <div className="form-text">13-digit national identity number.</div>
                      </div>
                    )}
                    {nationality === 'non-botswana' && (
                      <>
                        <div className="col-md-4 reg-reveal">
                          <label className="form-label">Passport Number <span className="req">*</span></label>
                          <input type="text" className="form-control form-control-sm" placeholder="e.g. A12345678" value={form.passportNum} onChange={f('passportNum')} />
                        </div>
                        <div className="col-md-4 reg-reveal">
                          <label className="form-label">Passport Expiry Date <span className="req">*</span></label>
                          <input type="date" className="form-control form-control-sm" value={form.passportExpiry} onChange={f('passportExpiry')} />
                        </div>
                      </>
                    )}
                  </div>
                  {/* DOB + Age + Gender */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-4 col-lg-3">
                      <label className="form-label">Date of Birth <span className="req">*</span></label>
                      <input type="date" className="form-control form-control-sm" value={form.dob} onChange={handleDobChange} />
                    </div>
                    <div className="col-md-4 col-lg-2">
                      <label className="form-label">Age</label>
                      <input type="text" className="form-control form-control-sm" readOnly value={age} placeholder="Auto"
                        style={{ background:'var(--bg-body)', color:'var(--text-secondary)' }} />
                      <div className="form-text">Calculated from DOB.</div>
                    </div>
                    <div className="col-md-4 col-lg-3">
                      <label className="form-label">Gender <span className="req">*</span></label>
                      <select className="form-select form-select-sm" value={form.gender} onChange={f('gender')}>
                        <option value="">Select</option>
                        {['Male','Female','Other','Prefer not to say'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Demographics */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-4 col-lg-3">
                      <label className="form-label">Religion</label>
                      <select className="form-select form-select-sm" value={form.religion} onChange={f('religion')}>
                        <option value="">— Select —</option>
                        {['Christianity','Islam','Hinduism','Buddhism','Judaism','Traditional / African','No religion','Other','Prefer not to say'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4 col-lg-3">
                      <label className="form-label">Marital Status</label>
                      <select className="form-select form-select-sm" value={form.marital} onChange={f('marital')}>
                        <option value="">— Select —</option>
                        {['Single','Married','Divorced','Widowed','Separated','Customary Union'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4 col-lg-3">
                      <label className="form-label">Citizenship</label>
                      <input type="text" className="form-control form-control-sm" placeholder="e.g. Botswana" value={form.citizenship} onChange={f('citizenship')} />
                    </div>
                    <div className="col-md-4 col-lg-3">
                      <label className="form-label">Language</label>
                      <select className="form-select form-select-sm" value={form.language} onChange={f('language')}>
                        <option value="">— Select —</option>
                        {['Setswana','English','Afrikaans','Zulu','Xhosa','Shona','Ndebele','Other'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4 col-lg-3">
                      <label className="form-label">Race</label>
                      <select className="form-select form-select-sm" value={form.race} onChange={f('race')}>
                        <option value="">— Select —</option>
                        {['African','Coloured','Indian / Asian','White','Other','Prefer not to say'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Contact */}
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">Mobile Number <span className="req">*</span></label>
                      <input type="tel" className="form-control form-control-sm" placeholder="+267 72 123 456" value={form.mobile} onChange={f('mobile')} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Email Address</label>
                      <input type="email" className="form-control form-control-sm" placeholder="patient@example.com" value={form.email} onChange={f('email')} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Alternative Number</label>
                      <input type="tel" className="form-control form-control-sm" placeholder="+267 74 987 654" value={form.altNumber} onChange={f('altNumber')} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Patient Address ── */}
              <div className="dash-card reg-card ac-success mb-4 reg-reveal">
                <div className="dash-card-header">
                  <div className="d-flex align-items-center gap-2">
                    <div className="reg-sec-icon icon-bg-success"><i className="bi bi-geo-alt"></i></div>
                    <div>
                      <div className="dash-card-title">Patient Address</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Residential address details</div>
                    </div>
                  </div>
                </div>
                <div className="dash-card-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Address <span className="req">*</span></label>
                      <input type="text" className="form-control form-control-sm" placeholder="21 Nelson Mandela Drive" value={form.address} onChange={f('address')} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Suburb / Region</label>
                      <input type="text" className="form-control form-control-sm" placeholder="e.g. Gaborone West" value={form.suburb} onChange={f('suburb')} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">City <span className="req">*</span></label>
                      <input type="text" className="form-control form-control-sm" placeholder="e.g. Gaborone" value={form.city} onChange={f('city')} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Area Code</label>
                      <input type="text" className="form-control form-control-sm" placeholder="e.g. 0001" maxLength={10} value={form.areaCode} onChange={f('areaCode')} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Guarantor / Next of Kin ── */}
              <div className="dash-card reg-card ac-purple mb-4 reg-reveal">
                <div className="dash-card-header">
                  <div className="d-flex align-items-center gap-2">
                    <div className="reg-sec-icon icon-bg-purple"><i className="bi bi-people"></i></div>
                    <div>
                      <div className="dash-card-title">Guarantor / Next of Kin</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Emergency contact and financial guarantor</div>
                    </div>
                  </div>
                </div>
                <div className="dash-card-body">
                  <div className="row g-3">
                    <div className="col-md-4 col-lg-3">
                      <label className="form-label">Relationship <span className="req">*</span></label>
                      <select className="form-select form-select-sm" value={form.kinRelationship} onChange={f('kinRelationship')}>
                        <option value="">Select</option>
                        {['Spouse / Partner','Parent','Child','Sibling','Grandparent','Guardian','Friend','Employer','Self','Other'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="col-md-2 col-lg-2">
                      <label className="form-label">Title</label>
                      <select className="form-select form-select-sm" value={form.kinTitle} onChange={f('kinTitle')}>
                        <option value="">—</option>
                        {['Mr','Mrs','Ms','Miss','Dr'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3 col-lg-4">
                      <label className="form-label">First Name <span className="req">*</span></label>
                      <input type="text" className="form-control form-control-sm" placeholder="e.g. Mpho" value={form.kinFirstName} onChange={f('kinFirstName')} />
                    </div>
                    <div className="col-md-3 col-lg-3">
                      <label className="form-label">Last Name <span className="req">*</span></label>
                      <input type="text" className="form-control form-control-sm" placeholder="e.g. Seretse" value={form.kinLastName} onChange={f('kinLastName')} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Contact Number <span className="req">*</span></label>
                      <input type="tel" className="form-control form-control-sm" placeholder="+267 71 000 111" value={form.kinContact} onChange={f('kinContact')} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Email Address</label>
                      <input type="email" className="form-control form-control-sm" placeholder="guarantor@example.com" value={form.kinEmail} onChange={f('kinEmail')} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Nationality</label>
                      <input type="text" className="form-control form-control-sm" placeholder="e.g. Botswana" value={form.kinNationality} onChange={f('kinNationality')} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Omang / National ID</label>
                      <input type="text" className="form-control form-control-sm" placeholder="e.g. 9001011234088" maxLength={13} value={form.kinOmang} onChange={f('kinOmang')} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Validation alert ── */}
          {validationErrors.length > 0 && (
            <div className="mb-3" ref={validationRef}>
              <div className="alert alert-warning d-flex align-items-start gap-2 mb-0" style={{ fontSize:'0.82rem' }}>
                <i className="bi bi-exclamation-triangle-fill mt-1" style={{ flexShrink:0 }}></i>
                <div>
                  <strong>Please complete required fields before submitting.</strong>
                  <ul className="mb-0 mt-1 ps-3" style={{ fontSize:'0.78rem' }}>
                    {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ── Sticky footer ── */}
          {showFooter && (
            <div className="reg-footer">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <button type="button" className="btn btn-primary btn-sm px-4 py-2 fw-semibold" onClick={handleSubmit}>
                  <i className="bi bi-person-check-fill me-2"></i>Register Patient
                </button>
                <button type="button" className="btn btn-outline-secondary btn-sm px-3 py-2" onClick={handleReset}>
                  <i className="bi bi-arrow-counterclockwise me-1"></i>Reset Form
                </button>
                <Link to="/" className="btn btn-outline-danger btn-sm px-3 py-2 ms-auto">
                  <i className="bi bi-x me-1"></i>Cancel
                </Link>
              </div>
            </div>
          )}

        </form>
      )}
    </>
  )
}

