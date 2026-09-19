import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { apiSend, UnauthorizedError } from '../adminApi.js'
import { useAdminAuth } from '../AdminAuthContext.jsx'
import { formatRupees, formatDate } from '../utils/format.js'

const STATUSES = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function OrdersTab() {
    const { logout } = useAdminAuth()
    // Orders are loaded (and refreshed every 30s) by AdminLayout so the sidebar badge stays live.
    const { orders, setOrders, ordersLoading, ordersError, markOrdersSeen, lastSeenId } = useOutletContext()
    const [error, setError] = useState('')
    const [expandedId, setExpandedId] = useState(null)
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [sortOrder, setSortOrder] = useState('oldest')
    const [savingId, setSavingId] = useState(null)

    const handleUnauthorized = useCallback(() => logout(), [logout])

    // What was already seen when this page opened — anything newer gets a NEW tag.
    const seenAtOpen = useRef(lastSeenId)

    // Being on this page = the admin has seen the orders, so clear the sidebar badge.
    useEffect(() => { markOrdersSeen() }, [markOrdersSeen])

    // Serial number = position by date (oldest = 1), so numbers stay 1, 2, 3… and
    // don't change when the list is filtered or flipped to newest-first.
    const serialById = useMemo(() => {
        const asc = [...orders].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt) || a.id - b.id
        )
        const map = new Map()
        asc.forEach((o, i) => map.set(o.id, i + 1))
        return map
    }, [orders])

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

    const visible = useMemo(() => {
        const list = statusFilter === 'ALL' ? orders : orders.filter((o) => o.status === statusFilter)
        const sorted = [...list].sort((a, b) => serialById.get(a.id) - serialById.get(b.id))
        return sortOrder === 'newest' ? sorted.reverse() : sorted
    }, [orders, statusFilter, sortOrder, serialById])

    const isNew = (order) => order.status === 'PENDING' && order.id > seenAtOpen.current
    const shownError = error || ordersError

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>Orders</h2>
                <div className="admin-page-actions">
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                        <option value="oldest">Oldest first (1, 2, 3…)</option>
                        <option value="newest">Newest first</option>
                    </select>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="ALL">All statuses</option>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {shownError && <div className="admin-error">{shownError}</div>}

            {ordersLoading ? (
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
                        {visible.map((order) => (
                            <React.Fragment key={order.id}>
                                <tr className={isNew(order) ? 'order-row-new' : undefined}>
                                    <td>{serialById.get(order.id)}</td>
                                    <td>
                                        {order.customerName}
                                        {isNew(order) && <span className="new-order-tag">NEW</span>}
                                    </td>
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
                        {visible.length === 0 && (
                            <tr><td colSpan={7} className="admin-empty">No orders found.</td></tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    )
}