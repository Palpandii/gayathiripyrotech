import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { apiGet, UnauthorizedError } from '../adminApi.js'
import { useAdminAuth } from '../AdminAuthContext.jsx'
import { formatRupees } from '../utils/format.js'

const BAR_COLORS = [
    'var(--gold)', 'var(--ember)', 'var(--emerald)', 'var(--spark-violet)',
    'var(--spark-orange)', 'var(--spark-rose)', 'var(--spark-blue)', 'var(--spark-lime)',
]

function lastNDays(n) {
    const days = []
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push(d.toISOString().slice(0, 10))
    }
    return days
}

export default function ReportsTab() {
    const { logout } = useAdminAuth()
    const { orders } = useOutletContext()
    const [customerCount, setCustomerCount] = useState(null)

    useEffect(() => {
        (async () => {
            try {
                const list = await apiGet('/api/customers')
                setCustomerCount(list.length)
            } catch (err) {
                if (err instanceof UnauthorizedError) return logout()
            }
        })()
    }, [logout])

    const delivered = useMemo(
        () => orders.filter((o) => o.status !== 'CANCELLED'),
        [orders]
    )

    const totalSales = useMemo(
        () => delivered.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        [delivered]
    )

    const avgOrder = delivered.length ? totalSales / delivered.length : 0

    const topProducts = useMemo(() => {
        const byName = new Map()
        for (const o of delivered) {
            for (const item of o.items || []) {
                const qty = item.quantity || 0
                byName.set(item.productName, (byName.get(item.productName) || 0) + qty)
            }
        }
        return [...byName.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
    }, [delivered])

    const maxQty = topProducts.length ? topProducts[0][1] : 1

    const salesByDay = useMemo(() => {
        const days = lastNDays(14)
        const totals = Object.fromEntries(days.map((d) => [d, 0]))
        for (const o of delivered) {
            const day = (o.createdAt || '').slice(0, 10)
            if (day in totals) totals[day] += o.totalAmount || 0
        }
        return days.map((d) => ({ day: d, amount: totals[d] }))
    }, [delivered])

    const maxDayAmount = Math.max(1, ...salesByDay.map((d) => d.amount))

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>Reports</h2>
            </div>

            <div className="admin-kpi-grid">
                <div className="admin-kpi-card admin-kpi-gold">
                    <span className="admin-kpi-label">Total sales</span>
                    <span className="admin-kpi-value">{formatRupees(totalSales)}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-ember">
                    <span className="admin-kpi-label">Orders</span>
                    <span className="admin-kpi-value">{delivered.length}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-emerald">
                    <span className="admin-kpi-label">Avg order value</span>
                    <span className="admin-kpi-value">{formatRupees(avgOrder)}</span>
                </div>
                <div className="admin-kpi-card admin-kpi-violet">
                    <span className="admin-kpi-label">Customers</span>
                    <span className="admin-kpi-value">{customerCount ?? '—'}</span>
                </div>
            </div>

            <div className="admin-report-grid">
                <div className="admin-report-card">
                    <h3>Top-selling products</h3>
                    {topProducts.length === 0 ? (
                        <p className="admin-empty">No sales yet.</p>
                    ) : (
                        <div className="admin-hbar-chart">
                            {topProducts.map(([name, qty], i) => (
                                <div className="admin-hbar-row" key={name}>
                                    <span className="admin-hbar-label">{name}</span>
                                    <div className="admin-hbar-track">
                                        <div
                                            className="admin-hbar-fill"
                                            style={{
                                                width: `${(qty / maxQty) * 100}%`,
                                                background: BAR_COLORS[i % BAR_COLORS.length],
                                            }}
                                        />
                                    </div>
                                    <span className="admin-hbar-value">{qty}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="admin-report-card">
                    <h3>Sales — last 14 days</h3>
                    <div className="admin-vbar-chart">
                        {salesByDay.map(({ day, amount }) => (
                            <div className="admin-vbar-col" key={day} title={`${day}: ${formatRupees(amount)}`}>
                                <div
                                    className="admin-vbar-fill"
                                    style={{ height: `${(amount / maxDayAmount) * 100}%` }}
                                />
                                <span className="admin-vbar-label">{day.slice(8)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}