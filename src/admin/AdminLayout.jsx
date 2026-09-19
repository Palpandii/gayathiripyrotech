import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAdminAuth } from './AdminAuthContext.jsx'
import { apiGet, UnauthorizedError } from './adminApi.js'

const TABS = [
    { to: '/admin/products', label: 'Products' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/estimates', label: 'Estimates' },
    { to: '/admin/categories', label: 'Categories' },
    { to: '/admin/banner', label: 'Banner' },

]

// New-order badge: an order counts as "new" while it is still PENDING and its id
// is higher than the last id the admin saw on the Orders page. Opening the
// Orders tab clears the badge (like opening a chat clears unread messages).
const SEEN_KEY = 'as_admin_orders_last_seen_id'
const POLL_MS = 30000

function readLastSeen() {
    try { return Number(localStorage.getItem(SEEN_KEY)) || 0 } catch { return 0 }
}

export default function AdminLayout() {
    const { logout } = useAdminAuth()
    const navigate = useNavigate()

    const [orders, setOrders] = useState([])
    const [ordersLoading, setOrdersLoading] = useState(true)
    const [ordersError, setOrdersError] = useState('')
    const [lastSeenId, setLastSeenId] = useState(readLastSeen)

    const reloadOrders = useCallback(async ({ silent = false } = {}) => {
        if (!silent) {
            setOrdersLoading(true)
            setOrdersError('')
        }
        try {
            const list = await apiGet('/api/orders')
            setOrders(list)
        } catch (err) {
            if (err instanceof UnauthorizedError) return logout()
            if (!silent) setOrdersError(err.message)
        } finally {
            if (!silent) setOrdersLoading(false)
        }
    }, [logout])

    // Load once, then check for new orders every 30s (and when the tab is opened again).
    useEffect(() => {
        reloadOrders()
        const timer = setInterval(() => {
            if (!document.hidden) reloadOrders({ silent: true })
        }, POLL_MS)
        const onVisible = () => { if (!document.hidden) reloadOrders({ silent: true }) }
        document.addEventListener('visibilitychange', onVisible)
        return () => {
            clearInterval(timer)
            document.removeEventListener('visibilitychange', onVisible)
        }
    }, [reloadOrders])

    const maxOrderId = useMemo(
        () => orders.reduce((max, o) => Math.max(max, o.id || 0), 0),
        [orders]
    )

    const newOrderCount = useMemo(
        () => orders.filter((o) => o.status === 'PENDING' && o.id > lastSeenId).length,
        [orders, lastSeenId]
    )

    const markOrdersSeen = useCallback(() => {
        if (maxOrderId > lastSeenId) {
            try { localStorage.setItem(SEEN_KEY, String(maxOrderId)) } catch { /* private mode */ }
            setLastSeenId(maxOrderId)
        }
    }, [maxOrderId, lastSeenId])

    // Browser tab title shows the count too, e.g. "(2) New orders".
    useEffect(() => {
        const original = document.title
        if (newOrderCount > 0) document.title = `(${newOrderCount}) New orders — Admin`
        return () => { document.title = original }
    }, [newOrderCount])

    function handleLogout() {
        logout()
        navigate('/admin/login', { replace: true })
    }

    function renderTab(tab) {
        const badge = tab.to === '/admin/orders' ? newOrderCount : 0
        return (
            <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
            >
                <span>{tab.label}</span>
                {badge > 0 && (
                    <span className="admin-nav-badge" aria-label={`${badge} new orders`}>
                        {badge > 99 ? '99+' : badge}
                    </span>
                )}
            </NavLink>
        )
    }

    return (
        <div className="admin-shell">
            <aside className="admin-sidebar">
                <div className="admin-brand">Gayathiri Pyrotech<span>Admin</span></div>
                <nav className="admin-desktop-nav">
                    {TABS.map(renderTab)}
                </nav>
                <button className="admin-logout" onClick={handleLogout}>Log out</button>
            </aside>

            <main className="admin-content">
                <Outlet context={{ orders, setOrders, ordersLoading, ordersError, reloadOrders, markOrdersSeen, lastSeenId }} />
            </main>

            <nav className="admin-bottom-nav">
                {TABS.map(renderTab)}
            </nav>
        </div>
    )
}