import { useEffect, useState, useCallback } from 'react'
import { apiGet, apiSend, apiDelete, apiDownloadPdf, UnauthorizedError } from '../adminApi.js'
import { useAdminAuth } from '../AdminAuthContext.jsx'
import { formatRupees, formatDate } from '../utils/format.js'
import LineItemsBuilder, { newRow } from '../components/LineItemsBuilder.jsx'

export default function EstimatesTab() {
    const { logout } = useAdminAuth()
    const [estimates, setEstimates] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [downloadingId, setDownloadingId] = useState(null)
    const [deletingId, setDeletingId] = useState(null)

    const [editingId, setEditingId] = useState(null)
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [customerCity, setCustomerCity] = useState('')
    const [items, setItems] = useState([newRow()])

    const handleUnauthorized = useCallback(() => logout(), [logout])

    async function loadAll() {
        setLoading(true)
        setError('')
        try {
            const [estimateList, productList] = await Promise.all([
                apiGet('/api/estimates'),
                apiGet('/api/products'),
            ])
            estimateList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            setEstimates(estimateList)
            setProducts(productList)
        } catch (err) {
            if (err instanceof UnauthorizedError) return handleUnauthorized()
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadAll() }, [])

    function resetForm() {
        setEditingId(null)
        setCustomerName('')
        setCustomerPhone('')
        setCustomerCity('')
        setItems([newRow()])
    }

    function startEdit(est) {
        setEditingId(est.id)
        setCustomerName(est.customerName || '')
        setCustomerPhone(est.customerPhone || '')
        setCustomerCity(est.customerCity || '')
        setItems(
            est.items && est.items.length > 0
                ? est.items.map((it) => ({
                    rowId: newRow().rowId,
                    productId: '',
                    productName: it.productName,
                    quantity: it.quantity,
                    unitPrice: it.unitPrice,
                }))
                : [newRow()]
        )
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function handleCreate(e) {
        e.preventDefault()
        setSaving(true)
        setError('')
        try {
            const payload = {
                customerName,
                customerPhone,
                customerCity,
                items: items.map((row) => ({
                    productName: row.productName,
                    quantity: Number(row.quantity) || 0,
                    unitPrice: Number(row.unitPrice) || 0,
                })),
            }
            if (editingId) {
                await apiSend('PUT', `/api/estimates/${editingId}`, payload)
            } else {
                await apiSend('POST', '/api/estimates', payload)
            }
            resetForm()
            loadAll()
        } catch (err) {
            if (err instanceof UnauthorizedError) return handleUnauthorized()
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleDownload(estimate) {
        setDownloadingId(estimate.id)
        try {
            await apiDownloadPdf(`/api/estimates/${estimate.id}/pdf`, `estimate-${estimate.id}.pdf`)
        } catch (err) {
            if (err instanceof UnauthorizedError) return handleUnauthorized()
            setError(err.message)
        } finally {
            setDownloadingId(null)
        }
    }

    async function handleDelete(estimate) {
        if (!confirm(`Delete estimate #${estimate.id} for ${estimate.customerName}? This can't be undone.`)) return
        setDeletingId(estimate.id)
        try {
            await apiDelete(`/api/estimates/${estimate.id}`)
            if (editingId === estimate.id) resetForm()
            loadAll()
        } catch (err) {
            if (err instanceof UnauthorizedError) return handleUnauthorized()
            setError(err.message)
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>Estimates</h2>
            </div>

            {error && <div className="admin-error">{error}</div>}

            <form className="admin-inline-form" onSubmit={handleCreate}>
                <h3>{editingId ? `Edit estimate #${editingId}` : 'New estimate'}</h3>
                <div className="admin-form-row">
                    <div>
                        <label>Customer name</label>
                        <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                    </div>
                    <div>
                        <label>Phone</label>
                        <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                    </div>
                    <div>
                        <label>City or Village</label>
                        <input type="text" value={customerCity} onChange={(e) => setCustomerCity(e.target.value)} />
                    </div>
                </div>

                <LineItemsBuilder items={items} onChange={setItems} products={products} />

                <div className="admin-modal-actions">
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : editingId ? 'Update estimate' : 'Create estimate'}
                    </button>
                    {editingId && (
                        <button type="button" className="btn-secondary" onClick={resetForm}>
                            Cancel edit
                        </button>
                    )}
                </div>
            </form>

            <h3 className="admin-section-title">Past estimates</h3>
            {loading ? (
                <p>Loading…</p>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>#</th><th>Customer</th><th>Phone</th><th>City</th><th>Date</th><th>Total</th><th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {estimates.map((est) => (
                            <tr key={est.id}>
                                <td>{est.id}</td>
                                <td>{est.customerName}</td>
                                <td>{est.customerPhone}</td>
                                <td>{est.customerCity}</td>
                                <td>{formatDate(est.createdAt)}</td>
                                <td>{formatRupees(est.totalAmount)}</td>
                                <td>
                                    <button className="btn-secondary" onClick={() => startEdit(est)}>
                                        Edit
                                    </button>{' '}
                                    <button
                                        className="btn-secondary"
                                        onClick={() => handleDownload(est)}
                                        disabled={downloadingId === est.id}
                                    >
                                        {downloadingId === est.id ? 'Preparing…' : 'Download PDF'}
                                    </button>{' '}
                                    <button
                                        className="btn-icon-danger"
                                        onClick={() => handleDelete(est)}
                                        disabled={deletingId === est.id}
                                    >
                                        {deletingId === est.id ? 'Deleting…' : 'Delete'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {estimates.length === 0 && (
                            <tr><td colSpan={7} className="admin-empty">No estimates yet.</td></tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    )
}