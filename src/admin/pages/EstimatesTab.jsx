import { useEffect, useState, useCallback } from 'react'
import { apiGet, apiSend, apiDelete, apiDownloadPdf, UnauthorizedError } from '../adminApi.js'
import { useAdminAuth } from '../AdminAuthContext.jsx'
import { formatRupees, formatDate } from '../utils/format.js'
import LineItemsBuilder, { newRow } from '../components/LineItemsBuilder.jsx'

// Shown at the top of the printed estimate.
const SHOP_NAME = 'Gayathiri Pyrotech'
const SHOP_PHONE = '9787503426'

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

// Builds a printable page from the estimate row and opens the browser print dialog.
// Uses a hidden iframe so it isn't blocked like a popup window would be.
function printEstimate(est) {
    const items = est.items || []
    const rows = items.map((it, i) => {
        const qty = Number(it.quantity) || 0
        const price = Number(it.unitPrice) || 0
        return `<tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(it.productName)}</td>
            <td class="num">${qty}</td>
            <td class="num">${escapeHtml(formatRupees(price))}</td>
            <td class="num">${escapeHtml(formatRupees(qty * price))}</td>
        </tr>`
    }).join('')

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Estimate #${escapeHtml(est.id)}</title>
<style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 13px; margin: 0; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 10px; }
    .shop h1 { margin: 0 0 4px; font-size: 22px; }
    .shop p { margin: 0; font-size: 13px; }
    .meta { text-align: right; }
    .meta h2 { margin: 0 0 4px; font-size: 18px; }
    .meta p { margin: 0; }
    .cust { margin: 14px 0; }
    .cust p { margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #999; padding: 7px 8px; text-align: left; }
    th { background: #eee; }
    .num { text-align: right; white-space: nowrap; }
    .total { text-align: right; font-size: 15px; font-weight: bold; margin-top: 12px; }
    .note { margin-top: 28px; font-size: 11px; color: #555; }
</style>
</head>
<body>
    <div class="head">
        <div class="shop">
            <h1>${escapeHtml(SHOP_NAME)}</h1>
            <p>Phone: ${escapeHtml(SHOP_PHONE)}</p>
        </div>
        <div class="meta">
            <h2>ESTIMATE #${escapeHtml(est.id)}</h2>
            <p>${escapeHtml(formatDate(est.createdAt))}</p>
        </div>
    </div>

    <div class="cust">
        <p><strong>Customer:</strong> ${escapeHtml(est.customerName)}</p>
        ${est.customerPhone ? `<p><strong>Phone:</strong> ${escapeHtml(est.customerPhone)}</p>` : ''}
        ${est.customerCity ? `<p><strong>City / Village:</strong> ${escapeHtml(est.customerCity)}</p>` : ''}
    </div>

    <table>
        <thead>
            <tr><th>#</th><th>Item</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Line total</th></tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>

    <div class="total">Total: ${escapeHtml(formatRupees(est.totalAmount))}</div>
    <div class="note">This is an estimate, not a tax invoice.</div>
</body>
</html>`

    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
    document.body.appendChild(iframe)

    const cleanup = () => { if (iframe.parentNode) iframe.parentNode.removeChild(iframe) }

    const doc = iframe.contentWindow.document
    doc.open()
    doc.write(html)
    doc.close()

    iframe.contentWindow.onafterprint = cleanup
    setTimeout(() => {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
    }, 250)
    // Fallback so the iframe never lingers if onafterprint doesn't fire.
    setTimeout(cleanup, 60000)
}

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

    function handlePrint(estimate) {
        try {
            printEstimate(estimate)
        } catch (err) {
            setError(err.message || 'Could not open the print dialog.')
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
                                    <button className="btn-secondary" onClick={() => handlePrint(est)}>
                                        Print
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