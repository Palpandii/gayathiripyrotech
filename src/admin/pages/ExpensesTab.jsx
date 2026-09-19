import { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost, apiPut, apiDelete, UnauthorizedError } from '../adminApi.js'
import { useAdminAuth } from '../AdminAuthContext.jsx'
import { formatRupees, formatDate } from '../utils/format.js'

const CATEGORIES = ['Rent', 'Salary', 'Electricity', 'Transport', 'Raw Material', 'Maintenance', 'Marketing', 'Misc']
const PAYMENT_MODES = ['CASH', 'UPI', 'BANK_TRANSFER', 'CARD']

const EMPTY_FORM = {
    category: CATEGORIES[0],
    title: '',
    paidTo: '',
    amount: '',
    expenseDate: new Date().toISOString().slice(0, 10),
    paymentMode: PAYMENT_MODES[0],
    notes: '',
}

function todayMonthKey() {
    return new Date().toISOString().slice(0, 7)
}

export default function ExpensesTab() {
    const { logout } = useAdminAuth()
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')

    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState('')

    async function load() {
        try {
            setLoading(true)
            setExpenses(await apiGet('/api/expenses'))
        } catch (err) {
            if (err instanceof UnauthorizedError) return logout()
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const filtered = useMemo(() => expenses.filter((e) => {
        if (categoryFilter && e.category !== categoryFilter) return false
        const q = search.trim().toLowerCase()
        if (!q) return true
        return e.title?.toLowerCase().includes(q) || e.paidTo?.toLowerCase().includes(q)
    }), [expenses, search, categoryFilter])

    const monthKey = todayMonthKey()
    const totalThisMonth = useMemo(
        () => expenses.filter((e) => (e.expenseDate || '').startsWith(monthKey))
            .reduce((s, e) => s + (e.amount || 0), 0),
        [expenses, monthKey]
    )
    const totalAllTime = useMemo(() => expenses.reduce((s, e) => s + (e.amount || 0), 0), [expenses])
    const topCategory = useMemo(() => {
        const byCat = new Map()
        for (const e of expenses) byCat.set(e.category, (byCat.get(e.category) || 0) + (e.amount || 0))
        let best = null
        for (const [cat, amt] of byCat) if (!best || amt > best[1]) best = [cat, amt]
        return best
    }, [expenses])

    function openAdd() {
        setEditingId(null)
        setForm(EMPTY_FORM)
        setFormError('')
        setShowModal(true)
    }

    function openEdit(e) {
        setEditingId(e.id)
        setForm({
            category: e.category || CATEGORIES[0],
            title: e.title || '',
            paidTo: e.paidTo || '',
            amount: e.amount ?? '',
            expenseDate: e.expenseDate || new Date().toISOString().slice(0, 10),
            paymentMode: e.paymentMode || PAYMENT_MODES[0],
            notes: e.notes || '',
        })
        setFormError('')
        setShowModal(true)
    }

    async function handleSave(ev) {
        ev.preventDefault()
        if (!form.title.trim() || !form.amount) {
            setFormError('Title and amount are required.')
            return
        }
        setSaving(true)
        setFormError('')
        const payload = { ...form, amount: Number(form.amount) }
        try {
            if (editingId) {
                await apiPut(`/api/expenses/${editingId}`, payload)
            } else {
                await apiPost('/api/expenses', payload)
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
        if (!window.confirm('Delete this expense entry?')) return
        try {
            await apiDelete(`/api/expenses/${id}`)
            setExpenses((prev) => prev.filter((e) => e.id !== id))
        } catch (err) {
            if (err instanceof UnauthorizedError) return logout()
            setError(err.message)
        }
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>Expenses</h2>
                <div className="admin-page-actions">
                    <input
                        type="search"
                        placeholder="Search title or paid to…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="">All categories</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button className="btn-primary" onClick={openAdd}>+ Add expense</button>
                </div>
            </div>

            <div className="admin-kpi-grid">
                <div className="admin-kpi-card admin-kpi-gold">
                    <span className="admin-kpi-label">This month</span>
                    <span className="admin-kpi-value">{formatRupees(totalThisMonth)}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-ember">
                    <span className="admin-kpi-label">All-time spend</span>
                    <span className="admin-kpi-value">{formatRupees(totalAllTime)}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-emerald">
                    <span className="admin-kpi-label">Top category</span>
                    <span className="admin-kpi-value" style={{ fontSize: '1.1rem' }}>
                        {topCategory ? topCategory[0] : '—'}
                    </span>
                </div>
                <div className="admin-kpi-card admin-kpi-violet">
                    <span className="admin-kpi-label">Entries</span>
                    <span className="admin-kpi-value">{expenses.length}</span>
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
                                <th>Title</th>
                                <th>Category</th>
                                <th>Paid to</th>
                                <th>Mode</th>
                                <th>Amount</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((e) => (
                                <tr key={e.id}>
                                    <td data-label="Date">{formatDate(e.expenseDate)}</td>
                                    <td data-label="Title">{e.title}</td>
                                    <td data-label="Category">{e.category}</td>
                                    <td data-label="Paid to">{e.paidTo || '—'}</td>
                                    <td data-label="Mode">{e.paymentMode}</td>
                                    <td data-label="Amount">{formatRupees(e.amount)}</td>
                                    <td>
                                        <div className="admin-row-actions">
                                            <button className="btn-secondary" onClick={() => openEdit(e)}>Edit</button>
                                            <button className="btn-icon-danger" onClick={() => handleDelete(e.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} className="admin-empty">No expenses found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingId ? 'Edit expense' : 'Add expense'}</h3>
                        <form onSubmit={handleSave}>
                            <label>Title</label>
                            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. September shop rent" />

                            <div className="admin-form-row">
                                <div>
                                    <label>Category</label>
                                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label>Amount (₹)</label>
                                    <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                                </div>
                            </div>

                            <div className="admin-form-row">
                                <div>
                                    <label>Paid to</label>
                                    <input value={form.paidTo} onChange={(e) => setForm({ ...form, paidTo: e.target.value })} placeholder="Landlord, staff name…" />
                                </div>
                                <div>
                                    <label>Date</label>
                                    <input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
                                </div>
                            </div>

                            <label>Payment mode</label>
                            <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}>
                                {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                            </select>

                            <label>Notes (optional)</label>
                            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

                            {formError && <div className="admin-error">{formError}</div>}

                            <div className="admin-modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}