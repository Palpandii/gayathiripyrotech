import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from './AdminAuthContext.jsx'
import { apiGet, UnauthorizedError } from './adminApi.js'
import { Icons } from './AdminIcons.jsx'

// Full planned sidebar, in the order the shop wants it. `soon: true` items
// route to a placeholder page — they're on the build list but not wired to
// real data yet, so the structure is visible today without faking data.
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
            { to: '/admin/expenses', label: 'Expenses', icon: 'expenses' },
            { to: '/admin/purchase', label: 'Purchase', icon: 'purchase' },
            { to: '/admin/taxes', label: 'Taxes', icon: 'taxes' },
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

// Phone layout: only the 4 things used every day live in the bottom dock;
// everything else is one tap away in the "More" sheet (grouped like the desktop sidebar).
const DOCK_PATHS = ['/admin/dashboard', '/admin/orders', '/admin/products', '/admin/reports']
const DOCK_TABS = DOCK_PATHS.map((to) => TABS.find((t) => t.to === to))

const svgProps = {
    width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round',
}
const MoreIcon = () => (
    <svg {...svgProps}><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
)
const LogoutIcon = () => (
    <svg {...svgProps}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
)
const CloseIcon = () => (
    <svg {...svgProps}><path d="M6 6l12 12M18 6 6 18" /></svg>
)

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
    const location = useLocation()

    const [orders, setOrders] = useState([])
    const [ordersLoading, setOrdersLoading] = useState(true)
    const [ordersError, setOrdersError] = useState('')
    const [lastSeenId, setLastSeenId] = useState(readLastSeen)
    const [menuOpen, setMenuOpen] = useState(false)

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

    // Close the phone menu whenever the page changes.
    useEffect(() => { setMenuOpen(false) }, [location.pathname])

    // While the menu sheet is open: Esc closes it and the page behind it doesn't scroll.
    useEffect(() => {
        if (!menuOpen) return undefined
        const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
        document.addEventListener('keydown', onKey)
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = previousOverflow
        }
    }, [menuOpen])

    const currentTab = useMemo(
        () => TABS.find((t) => location.pathname.startsWith(t.to)),
        [location.pathname]
    )
    // The current page isn't one of the 4 dock tabs -> "More" shows its name and lights up.
    const moreIsCurrent = Boolean(currentTab) && !DOCK_PATHS.includes(currentTab.to)

    const todayLabel = useMemo(
        () => new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
        []
    )

    function handleLogout() {
        setMenuOpen(false)
        logout()
        navigate('/admin/login', { replace: true })
    }

    function badgeFor(tab) {
        return tab.to === '/admin/orders' ? newOrderCount : 0
    }

    // ---- Desktop sidebar link ----
    function renderTab(tab) {
        const badge = badgeFor(tab)
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

    // ---- Phone: bottom dock item ----
    function renderDockTab(tab) {
        const badge = badgeFor(tab)
        const Icon = Icons[tab.icon]
        return (
            <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) => 'admin-dock-item' + (isActive ? ' is-current' : '')}
            >
                <span className="admin-dock-icon">
                    {Icon && <Icon />}
                    {badge > 0 && (
                        <span className="admin-dock-badge" aria-label={`${badge} new orders`}>
                            {badge > 99 ? '99+' : badge}
                        </span>
                    )}
                </span>
                <span className="admin-dock-label">{tab.label}</span>
            </NavLink>
        )
    }

    // ---- Phone: tile inside the More sheet ----
    function renderSheetTile(tab) {
        const badge = badgeFor(tab)
        const Icon = Icons[tab.icon]
        return (
            <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                    'admin-sheet-tile' + (isActive ? ' is-current' : '') + (tab.soon ? ' is-soon' : '')
                }
            >
                <span className="admin-sheet-tile-icon">
                    {Icon && <Icon />}
                    {badge > 0 && <span className="admin-dock-badge">{badge > 99 ? '99+' : badge}</span>}
                </span>
                <span className="admin-sheet-tile-label">{tab.label}</span>
                {tab.soon && <em className="admin-sheet-soon">Soon</em>}
            </NavLink>
        )
    }

    return (
        <div className="admin-shell">
            {/* Desktop / tablet sidebar (hidden on phones) */}
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

            {/* Phone top bar (hidden on desktop) */}
            <header className="admin-mobile-bar">
                <div className="admin-mobile-mark" aria-hidden="true">GP</div>
                <div className="admin-mobile-titles">
                    <span className="admin-mobile-name">Gayathiri Pyrotech</span>
                    <span className="admin-mobile-sub">Admin · {todayLabel}</span>
                </div>
                <button type="button" className="admin-mobile-logout" onClick={handleLogout} aria-label="Log out">
                    <LogoutIcon />
                </button>
            </header>

            <main className="admin-content">
                <Outlet context={{ orders, setOrders, ordersLoading, ordersError, reloadOrders, markOrdersSeen, lastSeenId }} />
            </main>

            {/* Phone bottom dock (hidden on desktop) */}
            <nav className="admin-dock" aria-label="Main navigation">
                {DOCK_TABS.map(renderDockTab)}
                <button
                    type="button"
                    className={'admin-dock-item' + (moreIsCurrent ? ' is-current' : '')}
                    onClick={() => setMenuOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={menuOpen}
                >
                    <span className="admin-dock-icon"><MoreIcon /></span>
                    <span className="admin-dock-label">{moreIsCurrent ? currentTab.label : 'More'}</span>
                </button>
            </nav>

            {/* Phone "More" sheet */}
            {menuOpen && (
                <>
                    <div className="admin-sheet-backdrop" onClick={() => setMenuOpen(false)} />
                    <div className="admin-sheet" role="dialog" aria-modal="true" aria-label="Menu">
                        <div className="admin-sheet-handle" />
                        <div className="admin-sheet-head">
                            <div>
                                <strong>Menu</strong>
                                <span>Everything in your shop, one tap away</span>
                            </div>
                            <button type="button" className="admin-sheet-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="admin-sheet-body">
                            {NAV_GROUPS.map((group) => (
                                <section className="admin-sheet-group" key={group.label}>
                                    <h4>{group.label}</h4>
                                    <div className="admin-sheet-grid">
                                        {group.items.map(renderSheetTile)}
                                    </div>
                                </section>
                            ))}
                        </div>

                        <button type="button" className="admin-sheet-logout" onClick={handleLogout}>
                            <LogoutIcon /> Log out
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}