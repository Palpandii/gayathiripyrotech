import { useEffect, useState } from 'react'
import { apiGet, UnauthorizedError } from '../adminApi.js'
import { useAdminAuth } from '../AdminAuthContext.jsx'
import { formatRupees, formatDate } from '../utils/format.js'

export default function CustomersTab() {
    const { logout } = useAdminAuth()
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')

    useEffect(() => {
        (async () => {
            try {
                setCustomers(await apiGet('/api/customers'))
            } catch (err) {
                if (err instanceof UnauthorizedError) return logout()
                setError(err.message)
            } finally {
                setLoading(false)
            }
        })()
    }, [logout])

    const filtered = customers.filter((c) => {
        const q = search.trim().toLowerCase()
        if (!q) return true
        return c.name?.toLowerCase().includes(q) || c.phone?.includes(q)
    })

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>Customers</h2>
                <div className="admin-page-actions">
                    <input
                        type="search"
                        placeholder="Search name or phone…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <p className="admin-hint">
                Built automatically from every order and estimate — no separate entry needed.
            </p>

            {error && <div className="admin-error">{error}</div>}

            {loading ? (
                <p>Loading…</p>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Address / City</th>
                            <th>Orders</th>
                            <th>Estimates</th>
                            <th>Total spent</th>
                            <th>Last activity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((c, i) => (
                            <tr key={c.phone || c.name || i}>
                                <td>{c.name || '—'}</td>
                                <td>{c.phone || '—'}</td>
                                <td>{c.address || '—'}</td>
                                <td>{c.orderCount}</td>
                                <td>{c.estimateCount}</td>
                                <td>{formatRupees(c.totalSpent)}</td>
                                <td>{formatDate(c.lastActivity)}</td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={7} className="admin-empty">No customers found.</td></tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    )
}