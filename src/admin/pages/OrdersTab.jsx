import React, { useEffect, useState, useCallback } from 'react'
import { apiGet, apiSend, UnauthorizedError } from '../adminApi.js'
import { useAdminAuth } from '../AdminAuthContext.jsx'
import { formatRupees, formatDate } from '../utils/format.js'

const STATUSES = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function OrdersTab() {
    const { logout } = useAdminAuth()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [expandedId, setExpandedId] = useState(null)
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [savingId, setSavingId] = useState(null)

    const handleUnauthorized = useCallback(() => logout(), [logout])

    async function loadOrders() {
        setLoading(true)
        setError('')
        try {
            const list = await apiGet('/api/orders')
            list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            setOrders(list)
        } catch (err) {
            if (err instanceof UnauthorizedError) return handleUnauthorized()
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadOrders() }, [])

    async function handleStatusChange(order, status) {
        setSavingId(order.id)
        setError('')
        try {
            const updated = await apiSend('PUT', `/api/orders/${order.id}/status`, { status })
            setOrders((list) => list.map((o) => (o.id === order.id ? updated : o)))
        } catch (err) {
            if (err instanceof UnauthorizedError) return handleUnauthorized()
            setError(err.message)
        } finally {
            setSavingId(null)
        }
    }

    const filtered = statusFilter === 'ALL' ? orders : orders.filter((o) => o.status === statusFilter)

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>Orders</h2>
                <div className="admin-page-actions">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="ALL">All statuses</option>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {error && <div className="admin-error">{error}</div>}

            {loading ? (
                <p>Loading…</p>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Customer</th>
                            <th>Phone</th>
                            <th>Placed</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((order) => (
                            <React.Fragment key={order.id}>
                                <tr>
                                    <td>{order.id}</td>
                                    <td>{order.customerName}</td>
                                    <td>{order.customerPhone}</td>
                                    <td>{formatDate(order.createdAt)}</td>
                                    <td>{formatRupees(order.totalAmount)}</td>
                                    <td>
                                        <select
                                            value={order.status}
                                            disabled={savingId === order.id}
                                            className={`status-select status-${order.status?.toLowerCase()}`}
                                            onChange={(e) => handleStatusChange(order, e.target.value)}
                                        >
                                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td>
                                        <button
                                            className="btn-secondary"
                                            onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                                        >
                                            {expandedId === order.id ? 'Hide items' : 'View items'}
                                        </button>
                                    </td>
                                </tr>
                                {expandedId === order.id && (
                                    <tr className="admin-expanded-row">
                                        <td colSpan={7}>
                                            <div className="order-detail">
                                                <p><strong>Address:</strong> {order.customerAddress || '—'}</p>
                                                <table className="admin-table nested">
                                                    <thead>
                                                        <tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr>
                                                    </thead>
                                                    <tbody>
                                                        {(order.items || []).map((item) => (
                                                            <tr key={item.id}>
                                                                <td>{item.productName}</td>
                                                                <td>{item.quantity}</td>
                                                                <td>{formatRupees(item.unitPrice)}</td>
                                                                <td>{formatRupees((item.quantity || 0) * (item.unitPrice || 0))}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={7} className="admin-empty">No orders found.</td></tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    )
}