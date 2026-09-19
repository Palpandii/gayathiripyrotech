import { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPut, apiDelete, UnauthorizedError } from '../adminApi.js'
import { useAdminAuth } from '../AdminAuthContext.jsx'
import { formatDate } from '../utils/format.js'

const STATUSES = ['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED']

const STATUS_LABELS = {
    NEW: 'New',
    CONTACTED: 'Contacted',
    CONVERTED: 'Converted',
    CLOSED: 'Closed',
}

export default function EstimateRequestsTab() {
    const { logout } = useAdminAuth()
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [search, setSearch] = useState('')
    const [busyId, setBusyId] = useState(null)

    async function load({ silent = false } = {}) {
        try {
            if (!silent) setLoading(true)
            setRequests(await apiGet('/api/estimate-requests'))
        } catch (err) {
            if (err instanceof UnauthorizedError) return logout()
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const filtered = useMemo(() => requests.filter((r) => {
        if (statusFilter && r.status !== statusFilter) return false
        const q = search.trim().toLowerCase()
        if (!q) return true
        return r.customerName?.toLowerCase().includes(q) || r.customerPhone?.toLowerCase().includes(q)
    }), [requests, search, statusFilter])

    const newCount = useMemo(() => requests.filter((r) => r.status === 'NEW').length, [requests])
    const convertedCount = useMemo(() => requests.filter((r) => r.status === 'CONVERTED').length, [requests])

    async function updateStatus(id, status) {
        setBusyId(id)
        try {
            await apiPut(`/api/estimate-requests/${id}/status`, { status })
            setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
        } catch (err) {
            if (err instanceof UnauthorizedError) return logout()
            setError(err.message)
        } finally {
            setBusyId(null)
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Delete this estimate request?')) return
        try {
            await apiDelete(`/api/estimate-requests/${id}`)
            setRequests((prev) => prev.filter((r) => r.id !== id))
        } catch (err) {
            if (err instanceof UnauthorizedError) return logout()
            setError(err.message)
        }
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>Online Estimates</h2>
                <div className="admin-page-actions">
                    <input
                        type="search"
                        placeholder="Search customer or phone…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All statuses</option>
                        {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                </div>
            </div>

            <p className="admin-hint">Quote requests submitted from the website's "Get a free estimate" form — work each lead, then create the formal estimate in the Estimates tab once you're ready.</p>

            <div className="admin-kpi-grid">
                <div className="admin-kpi-card admin-kpi-rose">
                    <span className="admin-kpi-label">New leads</span>
                    <span className="admin-kpi-value">{newCount}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-emerald">
                    <span className="admin-kpi-label">Converted</span>
                    <span className="admin-kpi-value">{convertedCount}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-violet">
                    <span className="admin-kpi-label">Total requests</span>
                    <span className="admin-kpi-value">{requests.length}</span>
                </div>
            </div>

            {error && <div className="admin-error">{error}</div>}

            {loading ? (
                <p>Loading…</p>
            ) : (
                <div className="admin-request-list">
                    {filtered.map((r) => (
                        <div key={r.id} className="admin-request-card">
                            <div className="admin-request-top">
                                <div>
                                    <div className="admin-request-name">{r.customerName}</div>
                                    <div className="admin-user-meta">
                                        {r.customerPhone}{r.customerCity ? ` · ${r.customerCity}` : ''} · submitted {formatDate(r.createdAt)}
                                    </div>
                                </div>
                                <span className={`admin-status admin-request-status-${(r.status || '').toLowerCase()}`}>
                                    {STATUS_LABELS[r.status] || r.status}
                                </span>
                            </div>

                            <div className="admin-request-body">
                                {r.eventType && <span className="admin-request-chip">{r.eventType}</span>}
                                {r.eventDate && <span className="admin-request-chip">Event: {formatDate(r.eventDate)}</span>}
                            </div>
                            {r.requirements && <p className="admin-request-notes">{r.requirements}</p>}

                            <div className="admin-request-actions">
                                <select
                                    value={r.status}
                                    disabled={busyId === r.id}
                                    onChange={(e) => updateStatus(r.id, e.target.value)}
                                >
                                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                                </select>
                                <button className="btn-icon-danger" onClick={() => handleDelete(r.id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && <div className="admin-empty">No estimate requests found.</div>}
                </div>
            )}
        </div>
    )
}