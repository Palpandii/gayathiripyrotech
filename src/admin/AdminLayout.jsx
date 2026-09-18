import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAdminAuth } from './AdminAuthContext.jsx'

const TABS = [
    { to: '/admin/products', label: 'Products' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/estimates', label: 'Estimates' },
    { to: '/admin/categories', label: 'Categories' },
    { to: '/admin/banner', label: 'Banner' },

]

export default function AdminLayout() {
    const { logout } = useAdminAuth()
    const navigate = useNavigate()

    function handleLogout() {
        logout()
        navigate('/admin/login', { replace: true })
    }

    return (
        <div className="admin-shell">
            <aside className="admin-sidebar">
                <div className="admin-brand">Gayathiri Pyrotech<span>Admin</span></div>
                <nav className="admin-desktop-nav">
                    {TABS.map((tab) => (
                        <NavLink
                            key={tab.to}
                            to={tab.to}
                            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
                        >
                            {tab.label}
                        </NavLink>
                    ))}
                </nav>
                <button className="admin-logout" onClick={handleLogout}>Log out</button>
            </aside>

            <main className="admin-content">
                <Outlet />
            </main>

            <nav className="admin-bottom-nav">
                {TABS.map((tab) => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}
                    >
                        {tab.label}
                    </NavLink>
                ))}
            </nav>
        </div>
    )
}