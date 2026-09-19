import { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost, apiPut, apiDelete, UnauthorizedError } from '../adminApi.js'
import { useAdminAuth } from '../AdminAuthContext.jsx'

const ROLES = ['OWNER', 'MANAGER', 'STAFF', 'DELIVERY']
const STATUSES = ['ACTIVE', 'INACTIVE']

const ROLE_LABELS = {
    OWNER: 'Owner',
    MANAGER: 'Manager',
    STAFF: 'Staff',
    DELIVERY: 'Delivery',
}

function initials(name) {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
}

const emptyForm = () => ({
    name: '',
    phone: '',
    email: '',
    role: ROLES[2],
    status: 'ACTIVE',
    notes: '',
})

export default function UsersTab() {
    const { logout } = useAdminAuth()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('')

    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState('')

    async function load({ silent = false } = {}) {
        try {
            if (!silent) setLoading(true)
            setUsers(await apiGet('/api/admin-users'))
        } catch (err) {
            if (err instanceof UnauthorizedError) return logout()
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const filtered = useMemo(() => users.filter((u) => {
        if (roleFilter && u.role !== roleFilter) return false
        const q = search.trim().toLowerCase()
        if (!q) return true
        return u.name?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    }), [users, search, roleFilter])

    const activeCount = useMemo(() => users.filter((u) => u.status === 'ACTIVE').length, [users])
    const roleCount = useMemo(() => new Set(users.map((u) => u.role)).size, [users])

    function openAdd() {
        setEditingId(null)
        setForm(emptyForm())
        setFormError('')
        setShowModal(true)
    }

    function openEdit(u) {
        setEditingId(u.id)
        setForm({
            name: u.name || '',
            phone: u.phone || '',
            email: u.email || '',
            role: u.role || ROLES[2],
            status: u.status || 'ACTIVE',
            notes: u.notes || '',
        })
        setFormError('')
        setShowModal(true)
    }

    async function handleSave(ev) {
        ev.preventDefault()
        if (!form.name.trim() || !form.phone.trim()) {
            setFormError('Name and phone are required.')
            return
        }
        setSaving(true)
        setFormError('')
        try {
            if (editingId) {
                await apiPut(`/api/admin-users/${editingId}`, form)
            } else {
                await apiPost('/api/admin-users', form)
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
        if (!window.confirm('Remove this team member?')) return
        try {
            await apiDelete(`/api/admin-users/${id}`)
            setUsers((prev) => prev.filter((u) => u.id !== id))
        } catch (err) {
            if (err instanceof UnauthorizedError) return logout()
            setError(err.message)
        }
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>Users</h2>
                <div className="admin-page-actions">
                    <input
                        type="search"
                        placeholder="Search name, phone or email…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="">All roles</option>
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                    <button className="btn-primary" onClick={openAdd}>+ Add team member</button>
                </div>
            </div>

            <p className="admin-hint">Your team directory — who's on staff, their role and contact details.</p>

            <div className="admin-kpi-grid">
                <div className="admin-kpi-card admin-kpi-violet">
                    <span className="admin-kpi-label">Team members</span>
                    <span className="admin-kpi-value">{users.length}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-emerald">
                    <span className="admin-kpi-label">Active</span>
                    <span className="admin-kpi-value">{activeCount}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-gold">
                    <span className="admin-kpi-label">Roles in use</span>
                    <span className="admin-kpi-value">{roleCount}</span>
                </div>
            </div>

            {error && <div className="admin-error">{error}</div>}

            {loading ? (
                <p>Loading…</p>
            ) : (
                <div className="admin-user-grid">
                    {filtered.map((u) => (
                        <div key={u.id} className={`admin-user-card${u.status === 'INACTIVE' ? ' is-inactive' : ''}`}>
                            <div className={`admin-user-avatar admin-role-${(u.role || '').toLowerCase()}`}>{initials(u.name)}</div>
                            <div className="admin-user-info">
                                <div className="admin-user-name">{u.name}</div>
                                <div className="admin-user-meta">{u.phone}{u.email ? ` · ${u.email}` : ''}</div>
                                <div className="admin-user-tags">
                                    <span className={`admin-status admin-role-badge-${(u.role || '').toLowerCase()}`}>{ROLE_LABELS[u.role] || u.role}</span>
                                    {u.status === 'INACTIVE' && <span className="admin-status admin-status-cancelled">Inactive</span>}
                                </div>
                            </div>
                            <div className="admin-row-actions">
                                <button className="btn-secondary" onClick={() => openEdit(u)}>Edit</button>
                                <button className="btn-icon-danger" onClick={() => handleDelete(u.id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && <div className="admin-empty">No team members found.</div>}
                </div>
            )}

            {showModal && (
                <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingId ? 'Edit team member' : 'Add team member'}</h3>
                        <form onSubmit={handleSave}>
                            <label>Name</label>
                            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

                            <div className="admin-form-row">
                                <div>
                                    <label>Phone</label>
                                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label>Email (optional)</label>
                                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                </div>
                            </div>

                            <div className="admin-form-row">
                                <div>
                                    <label>Role</label>
                                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label>Status</label>
                                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                        {STATUSES.map((s) => <option key={s} value={s}>{s === 'ACTIVE' ? 'Active' : 'Inactive'}</option>)}
                                    </select>
                                </div>
                            </div>

                            <label>Notes (optional)</label>
                            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. shift timing, area covered…" />

                            {formError && <div className="admin-error">{formError}</div>}

                            <div className="admin-modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}