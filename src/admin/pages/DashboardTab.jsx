import { useMemo } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { formatRupees, formatDate } from '../utils/format.js'

export default function DashboardTab() {
    const { orders, ordersLoading } = useOutletContext()

    const active = useMemo(() => orders.filter((o) => o.status !== 'CANCELLED'), [orders])
    const totalSales = useMemo(() => active.reduce((s, o) => s + (o.totalAmount || 0), 0), [active])
    const pending = useMemo(() => orders.filter((o) => o.status === 'PENDING').length, [orders])
    const recent = useMemo(
        () => [...orders].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 6),
        [orders]
    )

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>Dashboard</h2>
            </div>

            <div className="admin-kpi-grid">
                <div className="admin-kpi-card admin-kpi-gold">
                    <span className="admin-kpi-label">Total sales</span>
                    <span className="admin-kpi-value">{formatRupees(totalSales)}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-ember">
                    <span className="admin-kpi-label">Total orders</span>
                    <span className="admin-kpi-value">{orders.length}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-rose">
                    <span className="admin-kpi-label">Pending orders</span>
                    <span className="admin-kpi-value">{pending}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-violet">
                    <Link to="/admin/reports" className="admin-kpi-link">Full reports →</Link>
                </div>
            </div>

            <div className="admin-report-card">
                <h3>Recent orders</h3>
                {ordersLoading ? (
                    <p>Loading…</p>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr><th>#</th><th>Customer</th><th>Status</th><th>Amount</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                            {recent.map((o) => (
                                <tr key={o.id}>
                                    <td>{o.id}</td>
                                    <td>{o.customerName}</td>
                                    <td><span className={`admin-status admin-status-${(o.status || '').toLowerCase()}`}>{o.status}</span></td>
                                    <td>{formatRupees(o.totalAmount)}</td>
                                    <td>{formatDate(o.createdAt)}</td>
                                </tr>
                            ))}
                            {recent.length === 0 && (
                                <tr><td colSpan={5} className="admin-empty">No orders yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}