import { useEffect, useState, useCallback } from 'react'
import { apiGet, apiSend, apiDelete, apiUpload, UnauthorizedError } from '../adminApi.js'
import { useAdminAuth } from '../AdminAuthContext.jsx'

const BLANK_FORM = {
    id: null, nameEn: '', nameTa: '', image: '',
}

export default function CategoriesTab() {
    const { logout } = useAdminAuth()
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [form, setForm] = useState(null) // null = form closed
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [search, setSearch] = useState('')

    const handleUnauthorized = useCallback(() => logout(), [logout])

    async function loadAll() {
        setLoading(true)
        setError('')
        try {
            const list = await apiGet('/api/categories')
            setCategories(list)
        } catch (err) {
            if (err instanceof UnauthorizedError) return handleUnauthorized()
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadAll() }, [])

    function openNew() {
        setForm({ ...BLANK_FORM })
    }

    function openEdit(category) {
        setForm({ ...category })
    }

    function closeForm() {
        setForm(null)
    }

    async function handleImageChange(e) {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        setError('')
        try {
            const { url } = await apiUpload(file)
            setForm((f) => ({ ...f, image: url }))
        } catch (err) {
            if (err instanceof UnauthorizedError) return handleUnauthorized()
            setError('Image upload failed: ' + err.message)
        } finally {
            setUploading(false)
        }
    }

    async function handleSave(e) {
        e.preventDefault()
        setSaving(true)
        setError('')
        try {
            const payload = {
                nameEn: form.nameEn,
                nameTa: form.nameTa,
                image: form.image,
            }
            if (form.id) {
                await apiSend('PUT', `/api/categories/${form.id}`, payload)
            } else {
                await apiSend('POST', '/api/categories', payload)
            }
            closeForm()
            loadAll()
        } catch (err) {
            if (err instanceof UnauthorizedError) return handleUnauthorized()
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(category) {
        if (!confirm(`Delete "${category.nameEn}"? This can't be undone.`)) return
        try {
            await apiDelete(`/api/categories/${category.id}`)
            setCategories((list) => list.filter((c) => c.id !== category.id))
        } catch (err) {
            if (err instanceof UnauthorizedError) return handleUnauthorized()
            setError(err.message)
        }
    }

    const filtered = categories.filter((c) => {
        const q = search.trim().toLowerCase()
        if (!q) return true
        return c.nameEn?.toLowerCase().includes(q) || c.nameTa?.toLowerCase().includes(q)
    })

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>Categories</h2>
                <div className="admin-page-actions">
                    <input
                        type="search"
                        placeholder="Search categories…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className="btn-primary" onClick={openNew}>+ Add category</button>
                </div>
            </div>

            {error && <div className="admin-error">{error}</div>}

            {loading ? (
                <p>Loading…</p>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Name (EN)</th>
                            <th>Name (TA)</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((c) => (
                            <tr key={c.id}>
                                <td>
                                    {c.image
                                        ? <img src={c.image} alt={c.nameEn} className="admin-thumb" />
                                        : <div className="admin-thumb admin-thumb-empty" />}
                                </td>
                                <td>{c.nameEn}</td>
                                <td>{c.nameTa}</td>
                                <td className="admin-row-actions">
                                    <button className="btn-secondary" onClick={() => openEdit(c)}>Edit</button>
                                    <button className="btn-icon-danger" onClick={() => handleDelete(c)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={4} className="admin-empty">No categories found.</td></tr>
                        )}
                    </tbody>
                </table>
            )}

            {form && (
                <div className="admin-modal-backdrop" onClick={closeForm}>
                    <form className="admin-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
                        <h3>{form.id ? 'Edit category' : 'Add category'}</h3>

                        <label>Name (English)</label>
                        <input
                            type="text"
                            value={form.nameEn}
                            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                            required
                        />

                        <label>Name (Tamil)</label>
                        <input
                            type="text"
                            value={form.nameTa || ''}
                            onChange={(e) => setForm({ ...form, nameTa: e.target.value })}
                        />

                        <label>Category image</label>
                        <div className="admin-image-upload">
                            {form.image && <img src={form.image} alt="preview" className="admin-thumb-lg" />}
                            <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} />
                            {uploading && <span>Uploading…</span>}
                        </div>

                        <div className="admin-modal-actions">
                            <button type="button" className="btn-secondary" onClick={closeForm}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={saving || uploading}>
                                {saving ? 'Saving…' : 'Save category'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}