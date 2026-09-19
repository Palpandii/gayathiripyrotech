import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAdminAuth } from './AdminAuthContext.jsx'
import { apiGet, UnauthorizedError } from './adminApi.js'
import { Icons } from './AdminIcons.jsx'

const NAV_GROUPS = [
    {
        label: 'Overview',
        items: [
            { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
            { to: '/admin/reports', label: 'Reports', icon: 'reports' },
        ],
    },
    {
        label: 'Catalog',
        items: [
            { to: '/admin/products', label: 'Products', icon: 'products' },
            { to: '/admin/categories', label: 'Categories', icon: 'categories' },
            { to: '/admin/banner', label: 'Banner', icon: 'banner' },
        ],
    },
    {
        label: 'Sales',
        items: [
            { to: '/admin/orders', label: 'Orders', icon: 'orders' },
            { to: '/admin/estimates', label: 'Estimates', icon: 'estimates' },
            { to: '/admin/customers', label: 'Customers', icon: 'customers' },
            { to: '/admin/payments', label: 'Payments', icon: 'payments', soon: true },
        ],
    },
    {
        label: 'Finance',
        items: [
            { to: '/admin/expenses', label: 'Expenses', icon: 'expenses', soon: true },
            { to: '/admin/purchase', label: 'Purchase', icon: 'purchase', soon: true },
            { to: '/admin/taxes', label: 'Taxes', icon: 'taxes', soon: true },
        ],
    },
    {
        label: 'Admin',
        items: [
            { to: '/admin/users', label: 'Users', icon: 'users', soon: true },
        ],
    },
]

const TABS = NAV_GROUPS.flatMap((g) => g.items)

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
        const Icon = Icons[tab.icon]
        return (
            <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '') + (tab.soon ? ' is-soon' : '')}
            >
                <span className="admin-nav-icon">{Icon && <Icon />}</span>
                <span className="admin-nav-text">{tab.label}</span>
                {tab.soon && <span className="admin-nav-soon">Soon</span>}
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
                    {NAV_GROUPS.map((group) => (
                        <div className="admin-nav-group" key={group.label}>
                            <div className="admin-nav-group-label">{group.label}</div>
                            {group.items.map(renderTab)}
                        </div>
                    ))}
                </nav>
                <button className="admin-logout" onClick={handleLogout}>Log out</button>
            </aside>

            <main className="admin-content">
                <Outlet context={{ orders, setOrders, ordersLoading, ordersError, reloadOrders, markOrdersSeen, lastSeenId }} />
            </main>

            <nav className="admin-bottom-nav">
                <div className="admin-bottom-nav-scroll">
                    {TABS.map(renderTab)}
                </div>
            </nav>
        </div>
    )
}