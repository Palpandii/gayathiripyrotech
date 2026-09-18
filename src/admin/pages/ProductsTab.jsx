import { useEffect, useState, useCallback } from 'react'
import { apiGet, apiSend, apiDelete, apiUpload, UnauthorizedError } from '../adminApi.js'
import { useAdminAuth } from '../AdminAuthContext.jsx'
import { extractYoutubeId, formatRupees } from '../utils/format.js'

const BLANK_FORM = {
    id: null, category: '', nameEn: '', nameTa: '', qtyUnit: '',
    mrp: '', price: '', image: '', youtubeId: '',
}

export default function ProductsTab() {
    const { logout } = useAdminAuth()
    const [products, setProducts] = useState([])
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
            const [productList, categoryList] = await Promise.all([
                apiGet('/api/products'),
                apiGet('/api/categories'),
            ])
            setProducts(productList)
            setCategories(categoryList)
        } catch (err) {
            if (err instanceof UnauthorizedError) return handleUnauthorized()
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadAll() }, [])

    function openNew() {
        setForm({ ...BLANK_FORM, category: categories[0]?.id || '' })
    }

    function openEdit(product) {
        setForm({ ...product })
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
                category: form.category,
                nameEn: form.nameEn,
                nameTa: form.nameTa,
                qtyUnit: form.qtyUnit,
                mrp: form.mrp === '' ? null : Number(form.mrp),
                price: form.price === '' ? null : Number(form.price),
                image: form.image,
                youtubeId: extractYoutubeId(form.youtubeId),
            }
            if (form.id) {
                await apiSend('PUT', `/api/products/${form.id}`, payload)
            } else {
                await apiSend('POST', '/api/products', payload)
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

    async function handleDelete(product) {
        if (!confirm(`Delete "${product.nameEn}"? This can't be undone.`)) return
        try {
            await apiDelete(`/api/products/${product.id}`)
            setProducts((list) => list.filter((p) => p.id !== product.id))
        } catch (err) {
            if (err instanceof UnauthorizedError) return handleUnauthorized()
            setError(err.message)
        }
    }

    const filtered = products.filter((p) => {
        const q = search.trim().toLowerCase()
        if (!q) return true
        return p.nameEn?.toLowerCase().includes(q) || p.nameTa?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
    })

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>Products</h2>
                <div className="admin-page-actions">
                    <input
                        type="search"
                        placeholder="Search products…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className="btn-primary" onClick={openNew}>+ Add product</button>
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
                                <th></th>
                                <th>Name (EN)</th>
                                <th>Name (TA)</th>
                                <th>Category</th>
                                <th>Qty unit</th>
                                <th>MRP</th>
                                <th>Price</th>
                                <th>Video</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p.id}>
                                    <td data-label="Image">
                                        {p.image
                                            ? <img src={p.image} alt={p.nameEn} className="admin-thumb" />
                                            : <div className="admin-thumb admin-thumb-empty" />}
                                    </td>
                                    <td data-label="Name (EN)">{p.nameEn}</td>
                                    <td data-label="Name (TA)">{p.nameTa}</td>
                                    <td data-label="Category">{p.category}</td>
                                    <td data-label="Qty unit">{p.qtyUnit}</td>
                                    <td data-label="MRP">{formatRupees(p.mrp)}</td>
                                    <td data-label="Price">{formatRupees(p.price)}</td>
                                    <td data-label="Video">{p.youtubeId ? '▶ Yes' : '—'}</td>
                                    <td className="admin-row-actions" data-label="Actions">
                                        <button className="btn-secondary" onClick={() => openEdit(p)}>Edit</button>
                                        <button className="btn-icon-danger" onClick={() => handleDelete(p)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={9} className="admin-empty">No products found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {form && (
                <div className="admin-modal-backdrop" onClick={closeForm}>
                    <form className="admin-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
                        <h3>{form.id ? 'Edit product' : 'Add product'}</h3>

                        <label>Category</label>
                        <select
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            required
                        >
                            <option value="" disabled>Choose category</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.nameEn}</option>
                            ))}
                        </select>

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

                        <div className="admin-form-row">
                            <div>
                                <label>Qty unit</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 1 Pkt"
                                    value={form.qtyUnit || ''}
                                    onChange={(e) => setForm({ ...form, qtyUnit: e.target.value })}
                                />
                            </div>
                            <div>
                                <label>MRP (₹)</label>
                                <input
                                    type="number" min="0" step="0.01"
                                    value={form.mrp}
                                    onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                                />
                            </div>
                            <div>
                                <label>Price (₹)</label>
                                <input
                                    type="number" min="0" step="1"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <label>Product image</label>
                        <div className="admin-image-upload">
                            {form.image && <img src={form.image} alt="preview" className="admin-thumb-lg" />}
                            <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} />
                            {uploading && <span>Uploading…</span>}
                        </div>

                        <label>YouTube link (optional)</label>
                        <input
                            type="text"
                            placeholder="Paste full link or video ID"
                            value={form.youtubeId || ''}
                            onChange={(e) => setForm({ ...form, youtubeId: e.target.value })}
                        />

                        <div className="admin-modal-actions">
                            <button type="button" className="btn-secondary" onClick={closeForm}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={saving || uploading}>
                                {saving ? 'Saving…' : 'Save product'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}