import { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost, apiPut, apiDelete, UnauthorizedError } from '../adminApi.js'
import { useAdminAuth } from '../AdminAuthContext.jsx'
import { formatRupees, formatDate } from '../utils/format.js'
import { todayISO } from '../utils/dates.js'

const METHODS = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER']
const REFERENCE_TYPES = ['ORDER', 'ESTIMATE', 'OTHER']

const METHOD_LABELS = {
    CASH: 'Cash',
    UPI: 'UPI',
    CARD: 'Card',
    BANK_TRANSFER: 'Bank transfer',
}

const emptyForm = () => ({
    customerName: '',
    customerPhone: '',
    referenceType: 'OTHER',
    referenceId: '',
    amount: '',
    method: METHODS[0],
    paymentDate: todayISO(),
    notes: '',
})

export default function PaymentsTab() {
    const { logout } = useAdminAuth()
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [methodFilter, setMethodFilter] = useState('')

    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState('')

    async function load({ silent = false } = {}) {
        try {
            if (!silent) setLoading(true)
            setPayments(await apiGet('/api/payments'))
        } catch (err) {
            if (err instanceof UnauthorizedError) return logout()
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const filtered = useMemo(() => payments.filter((p) => {
        if (methodFilter && p.method !== methodFilter) return false
        const q = search.trim().toLowerCase()
        if (!q) return true
        return p.customerName?.toLowerCase().includes(q) || p.customerPhone?.toLowerCase().includes(q)
    }), [payments, search, methodFilter])

    const totalReceived = useMemo(() => payments.reduce((s, p) => s + (p.amount || 0), 0), [payments])

    const monthKey = todayISO().slice(0, 7)
    const totalThisMonth = useMemo(
        () => payments.filter((p) => (p.paymentDate || '').slice(0, 7) === monthKey)
            .reduce((s, p) => s + (p.amount || 0), 0),
        [payments, monthKey]
    )

    const byMethod = useMemo(() => {
        const counts = {}
        for (const p of payments) counts[p.method] = (counts[p.method] || 0) + 1
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
        return top ? METHOD_LABELS[top[0]] || top[0] : '—'
    }, [payments])

    function openAdd() {
        setEditingId(null)
        setForm(emptyForm())
        setFormError('')
        setShowModal(true)
    }

    function openEdit(p) {
        setEditingId(p.id)
        setForm({
            customerName: p.customerName || '',
            customerPhone: p.customerPhone || '',
            referenceType: p.referenceType || 'OTHER',
            referenceId: p.referenceId ?? '',
            amount: p.amount ?? '',
            method: p.method || METHODS[0],
            paymentDate: p.paymentDate || todayISO(),
            notes: p.notes || '',
        })
        setFormError('')
        setShowModal(true)
    }

    async function handleSave(ev) {
        ev.preventDefault()
        if (!form.customerName.trim() || !form.amount) {
            setFormError('Customer name and amount are required.')
            return
        }
        setSaving(true)
        setFormError('')
        const payload = {
            ...form,
            amount: Number(form.amount),
            referenceId: form.referenceType === 'OTHER' || !form.referenceId ? null : Number(form.referenceId),
        }
        try {
            if (editingId) {
                await apiPut(`/api/payments/${editingId}`, payload)
            } else {
                await apiPost('/api/payments', payload)
            }
            setShowModal(false)
            load({ silent: true })
        } catch (err) {
            if (err instanceof UnauthorizedError) return logout()
            setFormError(err.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Delete this payment entry?')) return
        try {
            await apiDelete(`/api/payments/${id}`)
            setPayments((prev) => prev.filter((p) => p.id !== id))
        } catch (err) {
            if (err instanceof UnauthorizedError) return logout()
            setError(err.message)
        }
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>Payments</h2>
                <div className="admin-page-actions">
                    <input
                        type="search"
                        placeholder="Search customer or phone…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
                        <option value="">All methods</option>
                        {METHODS.map((m) => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
                    </select>
                    <button className="btn-primary" onClick={openAdd}>+ Record payment</button>
                </div>
            </div>

            <p className="admin-hint">Money received from customers — link it to an order or estimate, or log it as a standalone advance.</p>

            <div className="admin-kpi-grid">
                <div className="admin-kpi-card admin-kpi-gold">
                    <span className="admin-kpi-label">Total received</span>
                    <span className="admin-kpi-value">{formatRupees(totalReceived)}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-emerald">
                    <span className="admin-kpi-label">This month</span>
                    <span className="admin-kpi-value">{formatRupees(totalThisMonth)}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-violet">
                    <span className="admin-kpi-label">Most used method</span>
                    <span className="admin-kpi-value">{byMethod}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-rose">
                    <span className="admin-kpi-label">Entries</span>
                    <span className="admin-kpi-value">{payments.length}</span>
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
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Reference</th>
                                <th>Method</th>
                                <th>Amount</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p.id}>
                                    <td data-label="Date">{formatDate(p.paymentDate)}</td>
                                    <td data-label="Customer">{p.customerName}{p.customerPhone ? ` · ${p.customerPhone}` : ''}</td>
                                    <td data-label="Reference">
                                        {p.referenceType === 'OTHER' || !p.referenceId
                                            ? <span className="admin-hint" style={{ margin: 0 }}>—</span>
                                            : `${p.referenceType === 'ORDER' ? 'Order' : 'Estimate'} #${p.referenceId}`}
                                    </td>
                                    <td data-label="Method">
                                        <span className={`admin-status admin-method-${(p.method || '').toLowerCase()}`}>
                                            {METHOD_LABELS[p.method] || p.method}
                                        </span>
                                    </td>
                                    <td data-label="Amount">{formatRupees(p.amount)}</td>
                                    <td>
                                        <div className="admin-row-actions">
                                            <button className="btn-secondary" onClick={() => openEdit(p)}>Edit</button>
                                            <button className="btn-icon-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={6} className="admin-empty">No payments found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingId ? 'Edit payment' : 'Record payment'}</h3>
                        <form onSubmit={handleSave}>
                            <div className="admin-form-row">
                                <div>
                                    <label>Customer name</label>
                                    <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
                                </div>
                                <div>
                                    <label>Customer phone</label>
                                    <input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
                                </div>
                            </div>

                            <div className="admin-form-row">
                                <div>
                                    <label>Reference type</label>
                                    <select value={form.referenceType} onChange={(e) => setForm({ ...form, referenceType: e.target.value, referenceId: '' })}>
                                        {REFERENCE_TYPES.map((t) => <option key={t} value={t}>{t === 'OTHER' ? 'Not linked' : t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                                    </select>
                                </div>
                                {form.referenceType !== 'OTHER' && (
                                    <div>
                                        <label>{form.referenceType === 'ORDER' ? 'Order #' : 'Estimate #'}</label>
                                        <input type="number" min="1" value={form.referenceId} onChange={(e) => setForm({ ...form, referenceId: e.target.value })} />
                                    </div>
                                )}
                            </div>

                            <div className="admin-form-row">
                                <div>
                                    <label>Amount (₹)</label>
                                    <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                                </div>
                                <div>
                                    <label>Method</label>
                                    <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                                        {METHODS.map((m) => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label>Date</label>
                                    <input type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
                                </div>
                            </div>

                            <label>Notes (optional)</label>
                            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

                            {formError && <div className="admin-error">{formError}</div>}

                            <div className="admin-modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Saving…' : editingId ? 'Save changes' : 'Record payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}