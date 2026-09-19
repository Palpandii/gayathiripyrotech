import { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost, apiPut, apiDelete, UnauthorizedError } from '../adminApi.js'
import { useAdminAuth } from '../AdminAuthContext.jsx'
import { formatRupees, formatDate } from '../utils/format.js'

const TAX_TYPES = ['GST', 'INCOME_TAX', 'PROFESSIONAL_TAX', 'OTHER']

const EMPTY_FORM = {
    taxType: TAX_TYPES[0],
    period: '',
    amount: '',
    dueDate: '',
    paidDate: '',
    referenceNumber: '',
    notes: '',
}

function isOverdue(record) {
    if (record.status === 'PAID' || !record.dueDate) return false
    const today = new Date().toISOString().slice(0, 10)
    return record.dueDate < today
}

function displayStatus(record) {
    if (record.status === 'PAID') return 'PAID'
    return isOverdue(record) ? 'OVERDUE' : 'PENDING'
}

export default function TaxesTab() {
    const { logout } = useAdminAuth()
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [typeFilter, setTypeFilter] = useState('')

    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState('')

    async function load() {
        try {
            setLoading(true)
            setRecords(await apiGet('/api/taxes'))
        } catch (err) {
            if (err instanceof UnauthorizedError) return logout()
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const filtered = useMemo(
        () => records.filter((r) => !typeFilter || r.taxType === typeFilter),
        [records, typeFilter]
    )

    const totalPaid = useMemo(
        () => records.filter((r) => r.status === 'PAID').reduce((s, r) => s + (r.amount || 0), 0),
        [records]
    )
    const totalPending = useMemo(
        () => records.filter((r) => r.status !== 'PAID').reduce((s, r) => s + (r.amount || 0), 0),
        [records]
    )
    const overdueCount = useMemo(() => records.filter(isOverdue).length, [records])
    const upcomingCount = useMemo(() => {
        const today = new Date()
        const in30 = new Date()
        in30.setDate(today.getDate() + 30)
        const todayStr = today.toISOString().slice(0, 10)
        const in30Str = in30.toISOString().slice(0, 10)
        return records.filter((r) => r.status !== 'PAID' && r.dueDate >= todayStr && r.dueDate <= in30Str).length
    }, [records])

    function openAdd() {
        setEditingId(null)
        setForm(EMPTY_FORM)
        setFormError('')
        setShowModal(true)
    }

    function openEdit(r) {
        setEditingId(r.id)
        setForm({
            taxType: r.taxType || TAX_TYPES[0],
            period: r.period || '',
            amount: r.amount ?? '',
            dueDate: r.dueDate || '',
            paidDate: r.paidDate || '',
            referenceNumber: r.referenceNumber || '',
            notes: r.notes || '',
        })
        setFormError('')
        setShowModal(true)
    }

    async function handleSave(ev) {
        ev.preventDefault()
        if (!form.period.trim() || !form.amount || !form.dueDate) {
            setFormError('Period, amount and due date are required.')
            return
        }
        setSaving(true)
        setFormError('')
        const payload = {
            ...form,
            amount: Number(form.amount),
            paidDate: form.paidDate || null,
        }
        try {
            if (editingId) {
                await apiPut(`/api/taxes/${editingId}`, payload)
            } else {
                await apiPost('/api/taxes', payload)
            }
            setShowModal(false)
            load()
        } catch (err) {
            if (err instanceof UnauthorizedError) return logout()
            setFormError(err.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Delete this tax record?')) return
        try {
            await apiDelete(`/api/taxes/${id}`)
            setRecords((prev) => prev.filter((r) => r.id !== id))
        } catch (err) {
            if (err instanceof UnauthorizedError) return logout()
            setError(err.message)
        }
    }

    async function markPaidToday(r) {
        try {
            const updated = await apiPut(`/api/taxes/${r.id}`, {
                ...r,
                paidDate: new Date().toISOString().slice(0, 10),
            })
            setRecords((prev) => prev.map((x) => (x.id === r.id ? updated : x)))
        } catch (err) {
            if (err instanceof UnauthorizedError) return logout()
            setError(err.message)
        }
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>Taxes</h2>
                <div className="admin-page-actions">
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                        <option value="">All types</option>
                        {TAX_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                    </select>
                    <button className="btn-primary" onClick={openAdd}>+ Add tax record</button>
                </div>
            </div>

            <p className="admin-hint">GST, income tax and other filings — a record turns <strong>OVERDUE</strong> on its own once the due date passes without a payment date.</p>

            <div className="admin-kpi-grid">
                <div className="admin-kpi-card admin-kpi-emerald">
                    <span className="admin-kpi-label">Paid</span>
                    <span className="admin-kpi-value">{formatRupees(totalPaid)}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-gold">
                    <span className="admin-kpi-label">Pending</span>
                    <span className="admin-kpi-value">{formatRupees(totalPending)}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-rose">
                    <span className="admin-kpi-label">Overdue</span>
                    <span className="admin-kpi-value">{overdueCount}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-violet">
                    <span className="admin-kpi-label">Due in 30 days</span>
                    <span className="admin-kpi-value">{upcomingCount}</span>
                </div>
            </div>

            {error && <div className="admin-error">{error}</div>}

            {loading ? (
                <p>Loading…</p>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table admin-table-cards">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Period</th>
                                <th>Amount</th>
                                <th>Due date</th>
                                <th>Status</th>
                                <th>Reference</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r) => {
                                const status = displayStatus(r)
                                return (
                                    <tr key={r.id}>
                                        <td data-label="Type">{r.taxType.replace('_', ' ')}</td>
                                        <td data-label="Period">{r.period}</td>
                                        <td data-label="Amount">{formatRupees(r.amount)}</td>
                                        <td data-label="Due date">{formatDate(r.dueDate)}</td>
                                        <td data-label="Status">
                                            <span className={`admin-status admin-status-${status.toLowerCase()}`}>{status}</span>
                                        </td>
                                        <td data-label="Reference">{r.referenceNumber || '—'}</td>
                                        <td>
                                            <div className="admin-row-actions">
                                                {status !== 'PAID' && (
                                                    <button className="btn-secondary" onClick={() => markPaidToday(r)}>Mark paid</button>
                                                )}
                                                <button className="btn-secondary" onClick={() => openEdit(r)}>Edit</button>
                                                <button className="btn-icon-danger" onClick={() => handleDelete(r.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} className="admin-empty">No tax records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingId ? 'Edit tax record' : 'Add tax record'}</h3>
                        <form onSubmit={handleSave}>
                            <div className="admin-form-row">
                                <div>
                                    <label>Tax type</label>
                                    <select value={form.taxType} onChange={(e) => setForm({ ...form, taxType: e.target.value })}>
                                        {TAX_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label>Period</label>
                                    <input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="e.g. Sep 2026" />
                                </div>
                            </div>

                            <div className="admin-form-row">
                                <div>
                                    <label>Amount (₹)</label>
                                    <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                                </div>
                                <div>
                                    <label>Due date</label>
                                    <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                                </div>
                            </div>

                            <label>Paid date (leave blank if unpaid)</label>
                            <input type="date" value={form.paidDate} onChange={(e) => setForm({ ...form, paidDate: e.target.value })} />

                            <label>Reference number (optional)</label>
                            <input value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} placeholder="Challan / ARN…" />

                            <label>Notes (optional)</label>
                            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

                            {formError && <div className="admin-error">{formError}</div>}

                            <div className="admin-modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}