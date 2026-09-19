import { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost, apiPut, apiDelete, UnauthorizedError } from '../adminApi.js'
import { useAdminAuth } from '../AdminAuthContext.jsx'
import { formatRupees, formatDate } from '../utils/format.js'

const UNITS = ['KG', 'BOX', 'PCS', 'BUNDLE', 'LITRE']
const PAYMENT_STATUSES = ['UNPAID', 'PARTIAL', 'PAID']

const EMPTY_FORM = {
    supplierName: '',
    supplierPhone: '',
    itemName: '',
    quantity: '',
    unit: UNITS[0],
    unitPrice: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
    paymentStatus: 'UNPAID',
    amountPaid: '',
    notes: '',
}

export default function PurchaseTab() {
    const { logout } = useAdminAuth()
    const [purchases, setPurchases] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState('')

    async function load() {
        try {
            setLoading(true)
            setPurchases(await apiGet('/api/purchases'))
        } catch (err) {
            if (err instanceof UnauthorizedError) return logout()
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const filtered = useMemo(() => purchases.filter((p) => {
        if (statusFilter && p.paymentStatus !== statusFilter) return false
        const q = search.trim().toLowerCase()
        if (!q) return true
        return p.supplierName?.toLowerCase().includes(q) || p.itemName?.toLowerCase().includes(q)
    }), [purchases, search, statusFilter])

    const totalValue = useMemo(() => purchases.reduce((s, p) => s + (p.totalAmount || 0), 0), [purchases])
    const totalPending = useMemo(
        () => purchases.reduce((s, p) => s + Math.max(0, (p.totalAmount || 0) - (p.amountPaid || 0)), 0),
        [purchases]
    )
    const supplierCount = useMemo(
        () => new Set(purchases.map((p) => (p.supplierName || '').trim().toLowerCase()).filter(Boolean)).size,
        [purchases]
    )

    const previewTotal = (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0)

    function openAdd() {
        setEditingId(null)
        setForm(EMPTY_FORM)
        setFormError('')
        setShowModal(true)
    }

    function openEdit(p) {
        setEditingId(p.id)
        setForm({
            supplierName: p.supplierName || '',
            supplierPhone: p.supplierPhone || '',
            itemName: p.itemName || '',
            quantity: p.quantity ?? '',
            unit: p.unit || UNITS[0],
            unitPrice: p.unitPrice ?? '',
            purchaseDate: p.purchaseDate || new Date().toISOString().slice(0, 10),
            paymentStatus: p.paymentStatus || 'UNPAID',
            amountPaid: p.amountPaid ?? '',
            notes: p.notes || '',
        })
        setFormError('')
        setShowModal(true)
    }

    async function handleSave(ev) {
        ev.preventDefault()
        if (!form.supplierName.trim() || !form.itemName.trim() || !form.quantity || !form.unitPrice) {
            setFormError('Supplier, item, quantity and unit price are required.')
            return
        }
        setSaving(true)
        setFormError('')
        const payload = {
            ...form,
            quantity: Number(form.quantity),
            unitPrice: Number(form.unitPrice),
            amountPaid: form.amountPaid ? Number(form.amountPaid) : 0,
        }
        try {
            if (editingId) {
                await apiPut(`/api/purchases/${editingId}`, payload)
            } else {
                await apiPost('/api/purchases', payload)
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
        if (!window.confirm('Delete this purchase entry?')) return
        try {
            await apiDelete(`/api/purchases/${id}`)
            setPurchases((prev) => prev.filter((p) => p.id !== id))
        } catch (err) {
            if (err instanceof UnauthorizedError) return logout()
            setError(err.message)
        }
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>Purchase</h2>
                <div className="admin-page-actions">
                    <input
                        type="search"
                        placeholder="Search supplier or item…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All statuses</option>
                        {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button className="btn-primary" onClick={openAdd}>+ Add purchase</button>
                </div>
            </div>

            <p className="admin-hint">Raw material and stock bought from suppliers — totals are calculated automatically from quantity × unit price.</p>

            <div className="admin-kpi-grid">
                <div className="admin-kpi-card admin-kpi-gold">
                    <span className="admin-kpi-label">Total purchase value</span>
                    <span className="admin-kpi-value">{formatRupees(totalValue)}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-ember">
                    <span className="admin-kpi-label">Pending to suppliers</span>
                    <span className="admin-kpi-value">{formatRupees(totalPending)}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-emerald">
                    <span className="admin-kpi-label">Suppliers</span>
                    <span className="admin-kpi-value">{supplierCount}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-violet">
                    <span className="admin-kpi-label">Entries</span>
                    <span className="admin-kpi-value">{purchases.length}</span>
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
                                <th>Supplier</th>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Unit price</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p.id}>
                                    <td data-label="Date">{formatDate(p.purchaseDate)}</td>
                                    <td data-label="Supplier">{p.supplierName}{p.supplierPhone ? ` · ${p.supplierPhone}` : ''}</td>
                                    <td data-label="Item">{p.itemName}</td>
                                    <td data-label="Qty">{p.quantity} {p.unit}</td>
                                    <td data-label="Unit price">{formatRupees(p.unitPrice)}</td>
                                    <td data-label="Total">{formatRupees(p.totalAmount)}</td>
                                    <td data-label="Status">
                                        <span className={`admin-status admin-status-${(p.paymentStatus || '').toLowerCase()}`}>
                                            {p.paymentStatus}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="admin-row-actions">
                                            <button className="btn-secondary" onClick={() => openEdit(p)}>Edit</button>
                                            <button className="btn-icon-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={8} className="admin-empty">No purchase entries found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingId ? 'Edit purchase' : 'Add purchase'}</h3>
                        <form onSubmit={handleSave}>
                            <div className="admin-form-row">
                                <div>
                                    <label>Supplier name</label>
                                    <input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} />
                                </div>
                                <div>
                                    <label>Supplier phone</label>
                                    <input value={form.supplierPhone} onChange={(e) => setForm({ ...form, supplierPhone: e.target.value })} />
                                </div>
                            </div>

                            <label>Item name</label>
                            <input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} placeholder="e.g. Chemical powder, cardboard tubes…" />

                            <div className="admin-form-row">
                                <div>
                                    <label>Quantity</label>
                                    <input type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                                </div>
                                <div>
                                    <label>Unit</label>
                                    <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label>Unit price (₹)</label>
                                    <input type="number" min="0" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
                                </div>
                            </div>

                            <div className="line-items-footer">
                                <span>Total</span>
                                <span className="grand-total">{formatRupees(previewTotal)}</span>
                            </div>

                            <div className="admin-form-row">
                                <div>
                                    <label>Purchase date</label>
                                    <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
                                </div>
                                <div>
                                    <label>Payment status</label>
                                    <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                                        {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {form.paymentStatus !== 'UNPAID' && (
                                <>
                                    <label>Amount paid so far (₹)</label>
                                    <input type="number" min="0" step="0.01" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} />
                                </>
                            )}

                            <label>Notes (optional)</label>
                            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

                            {formError && <div className="admin-error">{formError}</div>}

                            <div className="admin-modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add purchase'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}